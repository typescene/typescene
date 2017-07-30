import Async from "../../Async";
import { ArrayBinding, Binding } from "../Binding";
import { Style } from "../Style";
import { Component } from "./Component";
import { TextLabelFactory } from "./TextLabelFactory";
import { Block, BlockControl, Container, ContainerBlock, ContainerControl, ControlElement, ControlStack, Label, Row, TableHeader, TableRow } from "./";

/** Next factory UID */
var _nextUID = 1;

/** Type definition used by component initializers, that wraps a type as well as the same type within an observable value, promise, or binding */
export type UIValueOrAsync<T> = T | Async.ObservableValue<T> | PromiseLike<T> | Binding<any>;

/** Component factory class: constructor creates and initializes a Component */
export interface ComponentFactory<T extends Component> extends Function {
    /** Component class that this factory was created from */
    readonly FactoryComponent: { new (): T };

    /** Unique factory identifier */
    readonly componentFactoryId: string;

    /** Flag used for duck typing classes created as component factories */
    readonly isComponentFactory: true;

    /** Flag that can be set to indicate that components created directly from this factory should _not_ be wrapped in other types of components before being appended as fragment child nodes (on classes that are decorated with `appendChildComponents` with argument `acceptFragments`) */
    isFragmentFactory?: true;

    /** Flag that is unset when this component factory is used from within another component factory (i.e. when created components are not base components); if true, the `Component#initialize` method is called by the constructor, otherwise by the containing component factory */
    isBaseComponent?: boolean;

    /** Override initializer properties that are currently encapsulated in this component factory, if any */
    override(values: any): void;

    /** Contruct the component with all properties contained in this factory */
    new (): T;
}

export namespace ComponentFactory {
    /** A factory initializer element (e.g. control element) */
    export type SpecElt =
        UIValueOrAsync<ComponentFactory<Component> | TextLabelFactory | Component | typeof Component | undefined>;

    /** A factory initializer element (e.g. control element) or table content */
    export type SpecEltTCol =
        UIValueOrAsync<ComponentFactory<Component> | TextLabelFactory | Component | typeof Component | string | number | undefined>;

    /** A list of factory initializer elements (e.g. row) */
    export type SpecList = UIValueOrAsync<Array<SpecElt>>;

    /** A list of factory initializer elements (e.g. row) or table content */
    export type SpecListTCol = UIValueOrAsync<Array<SpecEltTCol>>;

    /** A list of factory initializer elements, or a single element */
    export type SpecEltOrList = UIValueOrAsync<SpecElt | Array<SpecElt>>;

    /** A list of factory initializer elements, or a single element; or table content */
    export type SpecEltOrListTCol = UIValueOrAsync<SpecEltTCol | Array<SpecEltTCol>>;

    /** A list of (lists of) factory initializer elements */
    export type SpecList2 = UIValueOrAsync<Array<SpecEltOrList>>;

    /** A list of (lists of) factory initializer elements or table content */
    export type SpecList2TCol = UIValueOrAsync<Array<SpecEltOrListTCol>>;

    /** Choices for the level at which components in (array) properties are expected to be; used by factory to expand/wrap initializer property values before appending as child nodes on a component decorated with `appendChildComponents`, or storing them in a property decorated with `applyComponentsArray` or `applyComponentRef` */
    export enum CLevel {
        Container, Block, ControlElement, TableRow, TableHeader
    }

    /** _Class decorator_ for a component class that expects child components (through `appendChild` method) of given type; the factory will then expand/wrap regular and observable objects, factories, classes, or components into the correct type; if `acceptFragments` is set, then components constructed from factories with the `isFragmentFactory` are passed in as-is; used on root component classes, should not need to be used in application code [decorator] */
    export function appendChildComponents(type: ComponentFactory.CLevel, acceptFragments?: boolean) {
        return function (target: typeof Component) {
            // store given type in flag property
            (<any>target)["@ComponentFactory.childType"] = type;
            if (acceptFragments) {
                // set flag to also accept fragment components as-is
                (<any>target)["@ComponentFactory.acceptFragments"] = true;
            }
        }
    }

    /** _Property decorator_ for a property where values from an initializer spec should be applied as an (observable) array of components of given type (e.g. `Block`, `ControlElement`, `TableRow`); the factory will then expand/wrap regular and observable arrays of objects, factories, classes, or components into the correct type [decorator] */
    export function applyComponentsArray(type: ComponentFactory.CLevel) {
        return function (target: Component, key: string) {
            // store given type in flag property
            (<any>target)["@ComponentFactory.apply[]:" + key] = type;
        }
    }

    /** _Property decorator_ for a property where values from an initializer spec should be applied as a reference to a component of given type (e.g. `Block`, `ControlElement`); the factory will then expand/wrap objects, factories, classes, and components into the correct type [decorator] */
    export function applyComponentRef(type: ComponentFactory.CLevel) {
        return function (target: Component, key: string) {
            // store given type in flag property
            (<any>target)["@ComponentFactory.apply:" + key] = type;
        }
    }

    /** _Property decorator_ for a property for which values from an initializer spec should be applied asynchronously (using an `Async.defer(...)` call), instead of being set directly [decorator] */
    export function applyAsync(target: Component, key: string) {
        // set a flag property
        (<any>target)["@ComponentFactory.async:" + key] = true;
    }

    /** _Method decorator_ for the method that should be called to apply the value of an initializer spec property with the given property name; the method should always accept values as well as instances of `Async.ObservableValue` [decorator] */
    export function setterFor(initializerPropertyName: string): MethodDecorator {
        return function (target: Component, key: string) {
            // store method reference in flag property
            (<any>target)["@ComponentFactory.setter:" + initializerPropertyName] =
                (<any>target)[key];
        }
    }

    /** @internal Initialize given component with properties from given spec, and for given base component, if any; returns the component argument */
    export function initializeWith<T extends Component>(spec: any, component: T,
        base: Component = component) {
        if (spec.id) (<any>base)[spec.id] = component;
        for (let key in spec) {
            let value: any = component[<keyof Component>key];
            if ((value instanceof Function) && (value.prototype instanceof Async.Signal)) {
                // connect signal directly, or use string to find base method
                var t = typeof spec[key];
                if (t === "function" || t === "string") {
                    (<Async.Signal.Emittable<any>>value).connect(spec[key], base);
                }
            }
            else if (value instanceof Style) {
                // use style as override
                (<any>component)[key] = value.override(
                    (spec instanceof Async.ObservableObject) ?
                        Async.observe(() => _getAsyncValue(key, (<any>spec)[key], base)) :
                        _getAsyncValue(key, spec[key], base));
            }
            else {
                let _set = (value: any, sync?: boolean): void => {
                    // check if decorated with applyAsync:
                    if (!sync && (<any>component)["@ComponentFactory.async:" + key])
                        return Async.defer(() => _set(value, true));

                    // convert arrays and references, if decorated with apply*
                    var type = (<any>component)["@ComponentFactory.apply[]:" + key];
                    if (type >= 0) {
                        value = _transformFactoryArray(key, value, type, base,
                            component instanceof TableRow);
                    }
                    type = (<any>component)["@ComponentFactory.apply:" + key];
                    if (type >= 0) {
                        value = _transformObservableInitializer(
                            key, value, type, base);
                    }

                    // check for a setter method
                    if ((<any>component)["@ComponentFactory.setter:" + key]) {
                        // invoke setter with (observable) value
                        (<any>component)["@ComponentFactory.setter:" + key](value);
                    }
                    else {
                        // assign (observable) value to component property
                        (<any>component)[key] = value;
                    }
                }

                // take or observe value (or binding, or promise)
                var isObservable = (spec instanceof Async.ObservableObject) &&
                    component.hasObservableProperty(key);
                _set(isObservable ?
                    Async.observe(() => _getAsyncValue(key, spec[key], base)) :
                    _getAsyncValue(key, spec[key], base));
            }
        }
        return component;
    };
}


// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// INTERNAL IMPLEMENTATION

/** @internal Helper function to create a component factory for given target Component class using given factory spec */
export function makeFactory<T extends Component, InitializerT>(
    this: { new (...args: any[]): Component }, ...values: any[]): ComponentFactory<T> {
    var FactoryComponent = this;
    class InitializedComponent extends FactoryComponent {
        static readonly FactoryComponent = FactoryComponent;
        static readonly componentFactoryId = "F" + _nextUID++;
        static readonly isComponentFactory = true;
        static isBaseComponent = true;
        static override(overrideValues: any) {
            values.push(overrideValues);
        }
        constructor(...args: any[]) {
            super(...args);

            // initialize properties, only if in highest-level constructor
            // (i.e. not overridden by another component factory, or part of
            // another component factory UNLESS extended into another class)
            var C = (<typeof InitializedComponent>this.constructor);
            if (C.isBaseComponent && C.FactoryComponent === FactoryComponent) {
                // this is the base component, at the highest level
                this.initialize();
            }
            else if (!Object.prototype.hasOwnProperty.call(
                C.prototype, "_factoryComponent")) {
                // this component class is extended into an application class
                this.initialize();
            }
        }
        initialize(base: Component = this) {
            if (super.initialize(base)) {
                for (var spec of values) {
                    if (spec && spec.constructor === Object) {
                        // initialize with given properties
                        this.initializeWith(spec, base);
                    }
                    else if (typeof spec === "function" &&
                        !(spec.prototype instanceof Component)) {
                        // run given function
                        spec(this, base);
                    }
                    else {
                        // transform and append given child component
                        var level = (<any>FactoryComponent)["@ComponentFactory.childType"];
                        var frag = (<any>FactoryComponent)["@ComponentFactory.acceptFragments"];
                        this.appendChild(_transformFactorySpec("child",
                            spec, level, base, false, frag));
                    }
                }
                return true;
            }
            return false;
        }
    }

    // add a property in the prototype to identify this exact class as a factory
    Object.defineProperty(InitializedComponent.prototype, "_factoryComponent", {
        enumerable: false,
        value: FactoryComponent
    });
    return <any>InitializedComponent;
}

/** Helper function to resolve Promise or Binding, or just get value */
function _getAsyncValue(key: string, value: any, base: Component) {
    if (value instanceof ArrayBinding) {
        // apply array binding on base component
        return value.observeArrayOn(base, key);
    }
    else if (value instanceof Binding) {
        // apply binding on base component
        return value.observeOn(base, key);
    }
    else if (value && typeof value === "object" &&
        typeof value.then === "function") {
        // convert promise to observable value
        return Async.ObservableValue.fromPromise(value);
    }
    return value;
}

/** Helper function to transform a single component factory spec to a UI component, or an observable value (if given source is PromiseLike); either the object and property name must be specified, or the property name and value (if recursed) */
function _transformFactorySpec(key: string, src: ComponentFactory.SpecEltOrList,
    targetLevel: ComponentFactory.CLevel, base: Component, asTableCol?: boolean,
    acceptFragments?: boolean): any {
    // get value from property, resolve promises/bindings as observable values
    var value = _getAsyncValue(key, src, base);

    // recurse for observable values (and promises, bindings...)
    if (value instanceof Async.ObservableValue)
        return value.map(value => _transformFactorySpec(key, value,
            targetLevel, base, asTableCol));

    // use factories to instantiate nested elements
    if (src && (<ComponentFactory<any>>src).isComponentFactory) {
        var F = <ComponentFactory<any>>src;
        F.isBaseComponent = false;
        src = new F();
        (<Component>src!).initialize(base);

        // return component without checking/wrapping if it is an accepted fragment
        if (acceptFragments) {
            for (var ref = F; ref; ref = <any>ref.FactoryComponent)
                if (ref.isFragmentFactory) return src;
        }
    }

    // create valid Component
    if (typeof src == "string" || typeof src == "number") {
        if (!asTableCol) src = new Label(String(src));
    }
    else if (src instanceof Array) {
        // create stack or (table) row containing given components
        if (targetLevel === ComponentFactory.CLevel.TableRow)
            src = new TableRow(
                _transformFactoryArray(key, <any>src,
                    ComponentFactory.CLevel.ControlElement, base, true));
        else if (targetLevel === ComponentFactory.CLevel.TableHeader)
            src = new TableHeader(
                _transformFactoryArray(key, <any>src,
                    ComponentFactory.CLevel.ControlElement, base, true));
        else if (targetLevel === ComponentFactory.CLevel.ControlElement)
            src = new ControlStack(_transformFactoryArray(key, <any>src,
                ComponentFactory.CLevel.ControlElement, base))
        else
            src = new Row(_transformFactoryArray(key, <any>src,
                ComponentFactory.CLevel.ControlElement, base));
    }
    else if ((src instanceof Function) &&
        (src.prototype instanceof Component)) {
        // instantiate given component class
        src = new (<any>src)();
    }
    else if (src instanceof TextLabelFactory) {
        // return (observable) component, or create Row or Container
        src = src.getComponent(base, key);
        if (targetLevel !== ComponentFactory.CLevel.ControlElement) {
            src = new Row([<any>src]);
            if (targetLevel !== ComponentFactory.CLevel.Block)
                src = new Container([<any>src]);
        }
        return src;
    }

    // wrap if needed
    if (targetLevel === ComponentFactory.CLevel.ControlElement) {
        // wrap to class down to ControlElement
        if (src instanceof Container) {
            let control = new ContainerControl(src);
            if (src.width !== "auto") control.shrinkwrap = true;
            return control;
        }
        if (src instanceof Block && !asTableCol) {
            let control = new BlockControl(src);
            if (src.width !== "auto") control.shrinkwrap = true;
            return control;
        }
        return src;
    }
    else if (targetLevel === ComponentFactory.CLevel.Block) {
        // wrap into Row, or class down to Row
        if (src instanceof ControlElement)
            return new Row([src]);
        if (src instanceof Container)
            return new ContainerBlock(src);
        return src;
    }
    else if (targetLevel === ComponentFactory.CLevel.TableRow ||
        targetLevel === ComponentFactory.CLevel.TableHeader) {
        // wrap into table row
        if ((src instanceof TableRow) || (src instanceof TableHeader))
            return src;
        if (src instanceof Container)
            src = new ContainerControl<Container>(src);
        if (src !== undefined)
            return new TableRow([<any>src]);
        return src;
    }
    else {
        // wrap into (Row, and then) container
        if (src instanceof ControlElement)
            src = new Row([<any>src]);
        if (src instanceof Block) {
            let block: Block = <any>src;
            src = new Container([block]);
            src.height = <any>Async.observe(() => block.height);
            src.width = <any>Async.observe(() => {
                var w = block.width;
                return (w !== "auto") ? w : "";
            });
        }
        return src;
    }
}

/** Helper function to transform an (observable) array of component factory specs */
function _transformFactoryArray(key: string, src: UIValueOrAsync<any[]>,
    targetLevel: ComponentFactory.CLevel, base: Component,
    asTableCol?: boolean): any[] {
    if (src instanceof ArrayBinding) {
        // use bound array directly for better performance
        src = src.observeArrayOn(base, key);
    }
    else if (src instanceof Binding) {
        // recurse for bindings
        return <any>src.observeOn(base, key).map(value =>
            _transformFactoryArray(key, value,
                targetLevel, base, asTableCol));
    }
    else if (src instanceof Async.ObservableValue) {
        // recurse for observable values
        return <any>src.map(value => _transformFactoryArray(key, value,
                targetLevel, base, asTableCol));
    }
    else if (typeof src === "object" &&
        typeof (<PromiseLike<any>>src).then === "function") {
        // recurse for promises of (observable) arrays
        var obv = Async.ObservableValue.fromPromise(
            (<PromiseLike<any>>src).then(value =>
                _transformFactoryArray(key, value,
                    targetLevel, base, asTableCol)));

        // use an empty array (rather than undefined) initially,
        // if promise was not already fulfilled
        if (!obv.getLastValue()) obv.value = [];
        return <any>obv;
    }

    if (src instanceof Async.ObservableArray) {
        // map observable array asynchronously and lazily
        return src.mapAsync((v, i) => _transformFactorySpec(
            key + "." + i, v, targetLevel, base, asTableCol),
            undefined, true);
    }
    else if (src instanceof Array) {
        // create an observable array but map only once
        var result = new Async.ObservableArray();
        result.length = src.length;
        src.forEach((v, i) => {
            result[i] = _transformFactorySpec(key + "." + i,
                v, targetLevel, base, asTableCol);
        });
        return result;
    }
    else {
        // nothing to map, return an empty array
        return new Async.ObservableArray();
    }
}

/** Helper function to transform a component factory spec value */
function _transformObservableInitializer(key: string, value: any,
    targetLevel: ComponentFactory.CLevel, base: Component): any {
    if (value instanceof Async.ObservableValue) {
        // recurse for observable values
        return <any>value.map(v => _transformObservableInitializer(
            key, v, targetLevel, base));
    }

    // otherwise transform spec now
    return _transformFactorySpec(key, value, targetLevel, base);
}
