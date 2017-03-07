import * as Async from "@typescene/async";
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
export interface ComponentFactory<T extends Component> {
    /** Component class that this factory was created from */
    target: { new (): T };

    /** Unique factory identifier */
    uid: string;

    /** Contruct the component with all properties contained in this factory */
    new (): T;

    /** Initializes more properties using given values; returns this */
    with(initializer: any): this;

    /** Creates an instance (same as using constructor, but can be chained) */
    create(): T;

    /** Apply the properties from this factory to the given (existing) component; returns the component itself */
    applyTo(component: T): T;
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

    /** Choices for the level at which components in (array) properties are expected to be; used by factory to expand/wrap initializer property values before storing them in a property decorated with `applyComponentsArray` or `applyComponentRef` */
    export enum CLevel {
        Container, Block, ControlElement, TableRow, TableHeader
    }

    /** _Property decorator_ for a property where values from an initializer spec should be applied as an (observable) array of components of given type (e.g. `Block`, `ControlElement`, `TableRow`); the factory will then expand/wrap regular and observable arrays of objects, factories, classes, or components into the correct type [decorator] */
    export function applyComponentsArray(type: ComponentFactory.CLevel) {
        return function (target: any, key: string) {
            // store given type in flag property
            target["@ComponentFactory.apply[]:" + key] = type;
        }
    }

    /** _Property decorator_ for a property where values from an initializer spec should be applied as a reference to a component of given type (e.g. `Block`, `ControlElement`); the factory will then expand/wrap objects, factories, classes, and components into the correct type [decorator] */
    export function applyComponentRef(type: ComponentFactory.CLevel) {
        return function (target: any, key: string) {
            // store given type in flag property
            target["@ComponentFactory.apply:" + key] = type;
        }
    }

    /** _Property decorator_ for a property for which values from an initializer spec should be applied asynchronously (using an `Async.defer(...)` call), instead of being set directly [decorator] */
    export function applyAsync(target: any, key: string) {
        // set a flag property
        target["@ComponentFactory.async:" + key] = true;
    }

    /** _Method decorator_ for the method that should be called to apply the value of an initializer spec property with the given property name; the method should always accept values as well as instances of `Async.ObservableValue` [decorator] */
    export function setterFor(initializerPropertyName: string): MethodDecorator {
        return function (target: any, key: string) {
            // store method reference in flag property
            target["@ComponentFactory.setter:" + initializerPropertyName] =
                target[key];
        }
    }
}

/** _Property decorator_ for the static `initializer` property of a `Component` class, containing a `ComponentFactory` that will be used to initialize every instance before rendering; the factory must be of a compatible type, i.e. result of the static `.with*(...)` method of a parent component class [decorator] */
export function initializer<ComponentT extends Component>(
    target: { new(...args): ComponentT }, key: "initializer",
    descriptor?: TypedPropertyDescriptor<ComponentFactory<ComponentT>>): any {
    if (!(<any>target[key]).isComponentFactory ||
        !(target.prototype instanceof target[key].target))
        throw new TypeError("Invalid component factory initializer: " +
            (target[key] && target[key].target && target[key].target["name"]) +
            " for " + target["name"]);

    // inject an initializer function that applies given factory properties
    var factory: ComponentFactory<any> = target[key];
    var chain = Async.inject(target, {
        initialize: function (this: ComponentT): any {
            // call old chained function, then apply factory properties
            if (chain.initialize.call(this)) {
                factory.applyTo(this);
                return true;
            }
        }
    });
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// INTERNAL IMPLEMENTATION

/** @internal Component factory class (private members) */
export interface _ComponentFactory<T extends Component> extends ComponentFactory<T> {
    /** Override this method to extend instance initialization; returns component */
    _init(component: T, factoryBase?: Component): T;

    /** Property values specification */
    _spec: any;

    /** Always true, for duck typing ComponentFactory classes */
    isComponentFactory: true;
}

/** @internal Helper function to create a component factory for given target Component class using given factory spec */
export function makeFactory<T extends Component, InitializerT>(
    this: { new (): { initializeWith(initializer: InitializerT): T } },
    values: InitializerT) {
    // create result class (function)
    var ComponentFactory: _ComponentFactory<T> = <any>(function () {
        return ComponentFactory.create();
    });

    // set static properties and add static methods
    ComponentFactory.isComponentFactory = true;
    ComponentFactory.uid = "F" + _nextUID++;
    ComponentFactory.target = <any>this;
    ComponentFactory._spec = values;
    ComponentFactory._init = function (this: _ComponentFactory<any>,
        component: T, base?: Component): T {
        return _init(this._spec, component, base);
    };
    ComponentFactory.applyTo = function (this: _ComponentFactory<any>,
        component: T) {
        return this._init(component);
    };
    ComponentFactory.create = function (this: _ComponentFactory<any>) {
        return this._init(new (<any>this.target)());
    };
    ComponentFactory.with = function (this: _ComponentFactory<any>, values: any) {
        // override .init to invoke _init again with new values
        var init = this._init;
        this._init = (c, base) => _init(values, init.call(this, c, base), base);
        return this;
    };

    return <ComponentFactory<T>>ComponentFactory;
}

/** Base component initializer used by all factories; returns the component argument */
function _init<T extends Component>(spec: any, component: T,
    base: Component = component) {
    if (spec.id) base[spec.id] = component;
    for (let key in spec) {
        if ((component[key] instanceof Function) &&
            (component[key].prototype instanceof Async.Signal)) {
            // connect signal directly, or use string to find base method
            var t = typeof spec[key];
            if (t === "function" || t === "string") {
                (<Async.Signal.Emittable<any, any>>component[key])
                    .connect(spec[key], base);
            }
        }
        else if (component[key] instanceof Style) {
            // use style as override
            component[key] = (<Style>component[key]).override(
                (spec instanceof Async.ObservableObject) ?
                    Async.observe(() => _getAsyncValue(key, spec[key], base)) :
                    _getAsyncValue(key, spec[key], base));
        }
        else {
            let _set = (value: any, sync?: boolean) => {
                // check if decorated with applyAsync:
                if (!sync && component["@ComponentFactory.async:" + key])
                    return Async.defer(() => _set(value, true));

                // convert arrays and references, if decorated with apply*
                var type = component["@ComponentFactory.apply[]:" + key];
                if (type >= 0) {
                    value = _transformFactoryArray(key, value, type, base,
                        component instanceof TableRow);
                }
                type = component["@ComponentFactory.apply:" + key];
                if (type >= 0) {
                    value = _transformObservableInitializer(
                        key, value, type, base);
                }

                // check for a setter method
                if (component["@ComponentFactory.setter:" + key]) {
                    // invoke setter with (observable) value
                    component["@ComponentFactory.setter:" + key](value);
                }
                else {
                    // assign (observable) value to component property
                    component[key] = value;
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
    targetLevel: ComponentFactory.CLevel, base: Component, asTableCol?: boolean): any {
    // get value from property, resolve promises/bindings as observable values
    var value = _getAsyncValue(key, src, base);

    // recurse for observable values (and promises, bindings...)
    if (value instanceof Async.ObservableValue)
        return value.map(value => _transformFactorySpec(key, value,
            targetLevel, base, asTableCol));

    // use factories to instantiate nested elements
    if (src && (<_ComponentFactory<any>>src).isComponentFactory)
        src = (<_ComponentFactory<any>>src)._init(
            new (<any>src).target, base);

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
        if (src instanceof Container)
            return new ContainerControl(src);
        if (src instanceof Block && !asTableCol)
            return new BlockControl(src);
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
            src = new ContainerControl(<any>src);
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
    targetClass: ComponentFactory.CLevel, base: Component,
    asTableCol?: boolean): any[] {
    if (src instanceof ArrayBinding) {
        // use bound array directly for better performance
        src = src.observeArrayOn(base, key);
    }
    else if (src instanceof Binding) {
        // recurse for bindings
        return <any>src.observeOn(base, key).map(value =>
            _transformFactoryArray(key, value,
                targetClass, base, asTableCol));
    }
    else if (src instanceof Async.ObservableValue) {
        // recurse for observable values
        return <any>src.map(value => _transformFactoryArray(key, value,
                targetClass, base, asTableCol));
    }
    else if (typeof src === "object" &&
        typeof (<PromiseLike<any>>src).then === "function") {
        // recurse for promises of (observable) arrays
        var obv = Async.ObservableValue.fromPromise(
            (<PromiseLike<any>>src).then(value =>
                _transformFactoryArray(key, value,
                    targetClass, base, asTableCol)));

        // use an empty array (rather than undefined) initially,
        // if promise was not already fulfilled
        if (!obv.getLastValue()) obv.value = [];
        return <any>obv;
    }

    if (src instanceof Async.ObservableArray) {
        // map observable array asynchronously
        return src.mapAsync((v, i) => _transformFactorySpec(
            key + "." + i, v, targetClass, base, asTableCol));
    }
    else if (src instanceof Array) {
        // create an observable array but map only once
        var result = new Async.ObservableArray();
        result.length = src.length;
        src.forEach((v, i) => {
            result[i] = _transformFactorySpec(key + "." + i,
                v, targetClass, base, asTableCol);
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
