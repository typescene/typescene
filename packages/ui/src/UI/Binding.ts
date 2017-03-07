import * as Async from "@typescene/async";
import { Component } from "./";

/** Represents a property binding, used with component factories to proxy values taken from the base component instance onto properties of its sub components */
export class Binding<ResultT> {
    /** Create a new binding based on the given property name/path (referring to the base component, on which .with or .initializeWith was called; resulting values can also be instances of ObservableValue or Promise), and optionally a transformation function, invoked each time the observed value changes (outside of any observable context, like `map` on `ObservableValue`, i.e. no further dependencies are recorded); if no path is specified, the name of the initializer property that contains this binding is used, if any */
    constructor(sourcePath?: string,
        getTransform?: (value: any, baseComponent: Component) => (ResultT | Async.ObservableValue<ResultT> | PromiseLike<ResultT>)) {
        if (typeof sourcePath === "string") {
            sourcePath = String(sourcePath || "");
            if (this._neg = sourcePath[0] === "!")
                sourcePath = sourcePath.slice(1);
            this._p = sourcePath.split(".");
        }
        this._fget = getTransform;
    }

    /** Make an ObservableValue that is bound to the value on given component (used by factory initializer to apply binding) */
    public observeOn(component: Component, name?: string): Async.ObservableValue<ResultT> {
        var parts = this._p, neg = this._neg, fget = this._fget;
        if (!parts) parts = [name || ""];
        var getter = neg ?
            ((f) => () => !f())(makePathFinder(parts, component)) :
            makePathFinder(parts, component);
        return fget ?
            Async.observe(getter).map(v => unpromise(fget!(v, component))) :
            Async.observe(() => unpromise(getter()));
    }

    /** @internal path segments */
    protected _p: string[];

    /** @internal negation */
    protected _neg: boolean;

    /** @internal getter transformer */
    private _fget?: (value: any, base: Component) => any;
}

/** Represents a two-way binding (`Binding` that also includes a setter on the proxy property) */
export class TwoWayBinding<ResultT> extends Binding<ResultT> {
    /** Create a new two-way binding based on the given property name/path (see `new Binding`), and optionally a transformation function, invoked each time a new value is being set (outside of any observable context); if no path is specified, the name of the initializer property that contains this binding is used, if any */
    constructor(sourcePath?: string,
        getTransform?: (value: any, baseComponent: Component) => (ResultT | Async.ObservableValue<ResultT> | PromiseLike<ResultT>),
        setTransform?: (value: any, baseComponent: Component) => any) {
        super(sourcePath, getTransform);
        this._fset = setTransform;

        if (sourcePath && sourcePath.slice(-2) === "()")
            throw new Error("Invalid binding: cannot assign to a method");
    }

    /** Make an ObservableValue that is bound to the value on given component (used by factory initializer to apply binding) */
    public observeOn(component: Component, name?: string): Async.ObservableValue<ResultT> {
        var result = super.observeOn(component, name);

        var parts = this._p, neg = this._neg, fset = this._fset;
        if (!parts) parts = [name || ""];
        var baseFinder = makePathFinder(parts.slice(0, -1), component);
        var target = parts[parts.length - 1];
        result.setter((value: any) => {
            var obj = baseFinder();
            if (obj) {
                if (fset) value = fset(neg ? !value : value, component);
                else if (neg) value = !value;
                obj[target] = value;
            }
        });
        return result;
    }

    /** @internal setter transformer */
    private _fset?: (value: any, base: Component) => any;
}

/** Represents an array property binding, used with component factories to proxy arrays taken from the base component instance onto array properties of its sub components */
export class ArrayBinding<ItemT> extends Binding<ItemT[]> {
    /** Create a new binding based on the given property name/path, getter transformation function (see `Binding` constructor), and array element transformation function, to be passed to `mapAsync` or `mapAsyncValues` (if `uniqueValues` argument is true) */
    constructor(sourcePath?: string,
        getTransform?: (array: any, baseComponent: Component) => any,
        itemTransform?: (value: any, baseComponent: Component) => ItemT,
        uniqueValues?: boolean);

    /** Create a new binding based on the given property name/path, getter transformation function (see `Binding` constructor), and array element transformation function, to be passed to `mapAsync` or `mapAsyncValues` (if `uniqueValues` argument is true); if `flatten` argument is true, the element transformation function may return an array of results as well, to be flattened into the final result (with undefined/null values removed) */
    constructor(sourcePath?: string,
        getTransform?: (array: any, baseComponent: Component) => any,
        itemTransform?: (value: any, baseComponent: Component) => (ItemT | ItemT[]),
        uniqueValues?: boolean, flatten?: boolean);

    constructor(sourcePath?: string,
        getTransform?: (array: any, baseComponent: Component) => any,
        itemTransform?: (value: any, baseComponent: Component) => ItemT,
        uniqueValues?: boolean, flatten?: boolean) {
        super(sourcePath, getTransform);
        this._eltset = itemTransform;
        this._flatten = flatten;
        this._mapValues = uniqueValues;
    }

    /** Make an ObservableValue that is bound to the value on given component (used by factory initializer to apply binding); wraps an observable array in an observable value; for better performance, use `.observeArrayOn(...)` directly (used by component factory initializer) */
    public observeOn(component: Component, name?: string): Async.ObservableValue<ItemT[]> {
        return Async.ObservableValue.fromValue(
            this.observeArrayOn(component, name));
    }

    /** Make an ObservableArray that is bound to the value on given component (used by factory initializer to apply binding) */
    public observeArrayOn(component: Component, name?: string): Async.ObservableArray<ItemT> {
        var result = Async.ObservableArray.fromObservableValue(
            super.observeOn(component, name));
        if (this._eltset) {
            // additional transformation of values: use mapAsync[Values]
            let setter = this._eltset;
            result = this._mapValues ?
                result.mapAsyncValues(v => setter(v, component)) :
                result.mapAsync(v => setter(v, component));
        }
        if (this._flatten) {
            // additional flattening required (transformation may return array)
            result = result.flattenAsync(true);
        }
        return result;
    }

    /** @internal array element transformer */
    private _eltset?: (value: any, base: Component) => any;

    /** @internal flag, true if using mapAsyncValues */
    private _mapValues?: boolean;

    /** @internal flag, true if need to flatten result */
    private _flatten?: boolean;
}

/** Create a new `Binding` for a property on the base component with the same name as the component initializer property
 * @see bind2
 */
export function bind(): Binding<any>;
/** Create a new `Binding` for given property name/path on the base component; for use in a component initializer */
export function bind(sourcePath: string): Binding<any>;
/** Create a new `Binding` for given property name/path on the base component, and transformation function; for use in a component initializer */
export function bind<T>(sourcePath: string, getTransform: (value: any) => T): Binding<T>;
export function bind(sourcePath?: string, getTransform?: (value: any) => any) {
    return new Binding(sourcePath, getTransform);
}

/** Create a new `TwoWayBinding` for a property on the base component with the same name as the component initializer property */
export function bind2(): TwoWayBinding<any>;
/** Create a new `TwoWayBinding` for given property name/path on the base component; for use in a component initializer */
export function bind2(sourcePath: string): TwoWayBinding<any>;
/** Create a new `TwoWayBinding` for given property name/path on the base component, and transformation function(s); for use in a component initializer */
export function bind2<T>(sourcePath: string, getTransform: (value: any) => T,
    setTransform?: (value: any) => any): Binding<T>;
export function bind2(sourcePath?: string, getTransform?: (value: any) => any,
    setTransform?: (value: any) => any) {
    return new TwoWayBinding(sourcePath, getTransform, setTransform);
}

/** Create a new `ArrayBinding` for given property name/path on the base component, which should contain an array; the binding resolves to an observable array of instances of given `Component` class (with a constructor that takes one or two arguments: the original array element value, and optionally the base component reference); for use in a component initializer; uses `mapAsync` on the observable array by default: deleting a value in the middle of the array will trigger reinstantiation of all components after it; to use `mapAsyncValues` for better results with arrays of objects, set the `uniqueValues` argument to true; to create components asynchronously in batches, set the `batchSize` argument to a number */
export function bindComponents<ComponentT extends Component>(sourcePath: string,
    componentClass: { new (value: any, baseComponent: Component): ComponentT },
    uniqueValues?: boolean, batchSize = 0) {
    var f = (value, baseComponent) => new componentClass(value, baseComponent);
    return new ArrayBinding(sourcePath, undefined,
        _getBatchTransformer(f, batchSize), uniqueValues);
}

/** @internal Helper function to generate a getter/transformation function that either returns a result right away or returns a promise that is resolved asynchronously based on given batch size */
export function _getBatchTransformer(f: (...args: any[]) => Component,
    batchSize?: number): (...args: any[]) => Component {
    // create components straight away if no batch size specified
    if (!batchSize) return f;

    // use a promise to create components in batches
    var p: PromiseLike<any> | undefined;
    var n = 0;
    return function () {
        var args = Array.prototype.slice.call(arguments);
        let resolve = () => f.apply(undefined, args);
        if (n++ === batchSize) {
            // another batch processed, delay further
            p = p ? p.then(() => Async.sleep(0)) : Async.sleep(0);
            n = 1;
        }
        return p ? p.then(resolve) : resolve();
    }
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// HELPER FUNCTIONS

/** Helper function to unpack promises transparently */
function unpromise(v) {
    return (v && typeof v === "object" && typeof v.then === "function") ?
        Async.unobserved(() => Async.ObservableValue.fromPromise(v)) : v;
}

/** Helper function to make a getter for the given path segment "...()" on the result of a chained getter function */
function makeFuncGetter(getter: () => any, s: string) {
    s = s.slice(0, -2);
    return function () {
        var base = getter();
        return (base && (typeof base[s] === "function")) ?
            base[s]() : undefined;
    }
}

/** Helper function to make a getter for a component by ID "$(...)" on the result of a chained getter function */
function makeIDGetter(getter: () => any, s: string) {
    s = s.slice(2, -1);
    return function () {
        var c: Component = getter();
        return c && c.getComponentById(s);
    }
}

/** Helper function to create a function that returns the value of a property with given path segments on the given base component */
function makePathFinder(parts: string[], component: Component) {
    var f = () => <any>component;
    return parts.reduce((f, s) => {
        // identity:
        if (s === "$" || s === "$()")
            return f;
        // get component by ID
        if (s[0] === "$" && s[1] === "(" && s.slice(-1) === ")")
            return makeIDGetter(f, s);
        // getter call:
        if (s.slice(-2) === "()")
            return makeFuncGetter(f, s);
        // property getter:
        return () => (f() || {})[s];
    }, f);
}
