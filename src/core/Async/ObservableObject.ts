import { Signal } from "./Signal";
import { ObservableValue, assertUnobserved, unobserved } from "./Observable";

const OBSERVABLE_HIDDEN_PROP_PREFIX = "*observable:";
const HAS_GETTER_PROP = "*observable-getter";

/** Represents an object with (some) observable members; may be extended into a derived class, or use `makeObjectObservable` function to mix into any object [requires ES5+ target] */
export class ObservableObject {
    /** Create an object with (some) observable members */
    constructor() {
        assertUnobserved();
        _addSignalGetter(this);
    }

    /** Returns true if property with given name is observable */
    public hasObservableProperty(name: string | number) {
        return isObservableProperty(this, name);
    }

    /** Add an observable property with given name and value; any existing (observable) properties with this name are removed first */
    public addObservableProperty(name: string | number, value: any) {
        makePropertyObservable(this, name);
        (<any>this)[name] = value;
    }

    /** Signal that is emitted when any property changes (but does not subscribe to any properties, i.e. only changes to properties already subscribed to, and properties with plain values [not getters] will trigger this signal) */
    public readonly PropertyChange: Signal.Emittable<string>;

    /** @internal True only after PropertyChange signal has been created */
    public _hasPropertyChangeSignal?: boolean;
}

/** Returns a new `ObservableObject` with properties copied from given object; `ObservableValue` instances are referenced directly (including getter and setter), Array properties are turned into `ObservableArray` instances, and plain Object instances into `ObservableObject` instances; also seals the new instance if the object parameter was sealed, and freezes it if the object parameter was frozen*/
export function makeObjectObservable<T extends object>(obj: T): T & ObservableObject {
    var result: any = new ObservableObject();
    if (obj instanceof Object) {
        // define non-configurable properties with getters and setters
        var specIsObservable = (obj instanceof ObservableObject);
        var desc: PropertyDescriptor;
        for (var member in obj) {
            if ((specIsObservable ?
                (<ObservableObject><any>obj).hasObservableProperty(member) :
                Object.prototype.hasOwnProperty.call(obj, member)) &&
                (desc = Object.getOwnPropertyDescriptor(obj, member))) {
                _defineObservableProperty(result, member,
                    desc.value, desc.get, desc.set);
            }
        }

        // mixin method and signal
        Object.defineProperty(result, "hasObservableProperty", {
            configurable: false,
            writable: false,
            enumerable: false,
            value: ObservableObject.prototype.hasObservableProperty
        });
        _addSignalGetter(result);

        // copy object status
        if (Object.isFrozen(obj)) {
            // go through all properties to initialize hidden observable first
            for (var member in obj) result[member];
            Object.freeze(result);
        }
        else if (Object.isSealed(obj)) {
            // go through all properties to initialize hidden observable first
            for (var member in obj) result[member];
            Object.seal(result);
        }
    }
    return result;
}

/** Make the property with given name observable; use given observable value instance, if any, otherwise use a new observable value instance that holds the current property value and/or uses the current property getter and setter [requires ES5+ target] */
export function makePropertyObservable(obj: object, member: string | number,
    instance?: ObservableValue<any>) {
    var propertyName = String(member);
    if (instance instanceof ObservableValue) {
        // use given instance
        _defineObservableProperty(obj, propertyName, instance);
    }
    else {
        // use property descriptor, or otherwise just the value
        var desc = Object.getOwnPropertyDescriptor(obj, propertyName);
        _defineObservableProperty(obj, propertyName,
            desc ? desc.value : (<any>obj)[propertyName],
            desc && desc.get, desc && desc.set);
    }
}

/** Delete the property with given name and clear its observable value */
export function deleteObservableProperty(obj: object, member: string | number) {
    var hiddenMember = _getHiddenName(member);
    var observable = <ObservableValue<any>>(<any>obj)[hiddenMember];
    if (observable && observable.subscribed && observable.writable)
        observable.value = undefined;
    delete (<any>obj)[member];
    delete (<any>obj)[hiddenMember];
}

/** Returns true if property with given name is defined and is observable */
export function isObservableProperty(obj: object, member: string | number) {
    var hiddenMember = _getHiddenName(member);
    if (Object.prototype.hasOwnProperty.call(obj, hiddenMember))
        return true;
    var ppDescriptor = _getProtoPropDesc(obj, member);
    if (ppDescriptor && ppDescriptor.get && (<any>ppDescriptor).get[HAS_GETTER_PROP])
        return true;
    return false;
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

/** Helper function to add a getter for the `ObservableObject.PropertyChange` signal to any object */
function _addSignalGetter(obj: object) {
    if (!Object.prototype.hasOwnProperty.call(obj, "PropertyChange")) {
        var S: any;
        Object.defineProperty(obj, "PropertyChange", {
            configurable: false,
            enumerable: false,
            get: function (this: ObservableObject) {
                if (!S) {
                    S = Signal.create();
                    S.target = <any>obj;
                    this._hasPropertyChangeSignal = true;
                }
                return S;
            }
        });
    }
}

/** Helper function to get a prototype's property descriptor */
function _getProtoPropDesc(obj: object, member: string | number): PropertyDescriptor | undefined {
    var proto = Object.getPrototypeOf(obj);
    return proto ?
        Object.getOwnPropertyDescriptor(proto, String(member)) ||
        _getProtoPropDesc(proto, member) :
        undefined;
}

/** Helper function to add a getter and setter for a single property */
function _defineObservableProperty(obj: any, member: string, initial?: any,
    getter?: () => any, setter?: (value: any) => void) {
    var hiddenMember = _getHiddenName(member);

    // clear existing observable value, if any, or define hidden property
    if (Object.prototype.hasOwnProperty.call(obj, hiddenMember))
        deleteObservableProperty(obj, member);
    else {
        Object.defineProperty(obj, hiddenMember, {
            configurable: true,
            enumerable: false,
            value: false,
            writable: true
        });
    }

    // define observable property itself
    var descriptor = { enumerable: true, configurable: true };
    _makeObservablePropertyDef(descriptor, member, getter, setter);
    Object.defineProperty(obj, member, descriptor);

    // store observable value instance, if referenced directly
    if (initial instanceof ObservableValue)
        obj[hiddenMember] = initial;
    else if (initial !== undefined)
        obj[member] = initial;
}

/** Helper function to get a property definition for an observable property */
function _makeObservablePropertyDef(descriptor: PropertyDescriptor,
    member: string, getter?: () => any, setter?: (value: any) => void,
    getFilter?: (value: any) => any, setFilter?: (value: any) => any,
    shallow?: boolean) {
    var hiddenMember = _getHiddenName(member);

    // helper function that returns ObservableValue for a member
    function getObservableValue (obj: any) {
        if (obj[hiddenMember]) return obj[hiddenMember];

        // create new observable value
        return obj[hiddenMember] = unobserved(() => {
            var o = new ObservableValue();
            if (shallow) o.shallow = true;
            if (getter) o.getter(getter.bind(obj));
            if (setter) o.setter(setter.bind(obj));

            // emit PropertyChange for Observable object properties
            o.invokeOnChange(() => {
                if (obj._hasPropertyChangeSignal)
                    obj.PropertyChange(member);
            });

            return o;
        });
    }

    // save getter with flag
    descriptor.get = getFilter ?
        function (this: ObservableObject) {
            return getFilter(getObservableValue(this).value)
        } :
        function (this: ObservableObject) {
            return getObservableValue(this).value
        };
    (<any>descriptor.get)[HAS_GETTER_PROP] = true;

    // save setter
    descriptor.set = setFilter ?
        function (this: ObservableObject, v: any) {
            return getObservableValue(this).value = setFilter(v)
        } :
        function (this: ObservableObject, v: any) {
            return getObservableValue(this).value = v
        };
}

function _getHiddenName(name: string | number) {
    return OBSERVABLE_HIDDEN_PROP_PREFIX + name;
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

/** _Method/accessor decorator_, wraps a method or getter (but not setter) in an `unobserved` call, so that any observable values read by this method (or functions invoked synchronously from within this method) are not marked as dependencies of any currently evaluating observable values [requires ES5+ target] [decorator] */
export function unobservable(target: Object, key: string,
    descriptor?: PropertyDescriptor): any {
    if (descriptor) {
        if (descriptor.get) {
            // wrap getter to invoke it as unobserved (no arguments)
            let f = descriptor.get;
            descriptor.get = function (this: any) {
                return unobserved.call(this, f);
            };
            return descriptor;
        }
        else if (typeof descriptor.value === "function") {
            // wrap function to monkey patch it as unobserved
            let f = descriptor.value;
            descriptor.value = function (this: any) {
                var a = arguments;
                return unobserved(() => f.apply(this, a));
            };
            return descriptor;
        }
    }
    throw new TypeError();
}

/** _Read-only-accessor decorator_, wraps a getter (without setter) in an `unobserved` call, so that any observable values read by the accessor (or functions invoked synchronously from within the accessor) are not marked as dependencies of any currently evaluating observable values; defines a read-only property using the result of the accessor call, after the first time it was invoked for each instance [requires ES5+ target] [decorator] */
export function unobservable_memoize_get(target: Object, key: string,
    descriptor?: PropertyDescriptor): any {
    if (descriptor && descriptor.get) {
        // property cannot contain a setter (must be read-only)
        if (descriptor.set) throw new TypeError;

        // wrap getter to invoke it as unobserved (no arguments)
        var f = descriptor.get;
        descriptor.get = function (this: any) {
            var value = unobserved.call(this, f);

            // redefine the property on this instance
            Object.defineProperty(this, key, {
                enumerable: true,
                writable: false,
                configurable: true,
                value
            });
            return value;
        };
        return descriptor;
    }
    throw new TypeError();
}

/** _Property/accessor decorator_, makes a property observable on every instance [requires ES5+ target] [decorator] */
export function observable(target: Object, key: string,
    descriptor?: PropertyDescriptor): any;

/** @internal */
export function observable(target: Object, key: string,
    descriptor?: PropertyDescriptor,
    getFilter?: (value: any) => any, setFilter?: (value: any) => any,
    shallow?: boolean): any;

export function observable(target: Object, key: string,
    descriptor?: PropertyDescriptor,
    getFilter?: (value: any) => any, setFilter?: (value: any) => any,
    shallow?: boolean): any {
    if (!descriptor) descriptor = { enumerable: true };
    _makeObservablePropertyDef(descriptor, key,
        descriptor.get, descriptor.set, getFilter, setFilter, shallow);
    return descriptor;
}

/** _Property/accessor decorator_, makes a property observable on every instance and converts values to strings when read (empty string for null/undefined/NaN) [requires ES5+ target] [decorator] */
export function observable_string(target: Object, key: string, descriptor?: PropertyDescriptor): any {
    return observable(target, key, descriptor, (value: any) => {
        return (value || value === 0 || value === false) ? String(value) : "";
    });
}

/** _Property/accessor decorator_, makes a property observable on every instance and converts values to numbers using Number(...) when read [requires ES5+ target] [decorator] */
export function observable_number(target: Object, key: string, descriptor?: PropertyDescriptor): any {
    return observable(target, key, descriptor, value => Number(value));
}

/** _Property/accessor decorator_, makes a property observable on every instance, as a shallow observable value (i.e. does not read values from observable values assigned to this property; and does not convert arrays to observable arrays nor objects to observable objects) [requires ES5+ target] [decorator] */
export function observable_shallow(target: Object, key: string, descriptor?: PropertyDescriptor): any {
    return observable(target, key, descriptor, undefined, undefined, true);
}

/** _Property/accessor decorator_, makes a property observable on every instance and enforces that values are not undefined or null when read (throws TypeError) and that undefined/null values cannot be set (also throws TypeError) [requires ES5+ target] [decorator] */
export function observable_not_null(target: Object, key: string, descriptor?: PropertyDescriptor): any {
    return observable(target, key, descriptor, value => {
        if (value === undefined || value === null)
            throw new TypeError(key + " is " + value);
        return value;
    }, value => {
        if (value === undefined || value === null)
            throw new TypeError(key + " cannot be " + value);
        return value;
    });
}

/** @internal Alias for backwards compatibility */
export function observable_nonNull() {
    return observable_not_null.call(undefined, arguments);
}

/** _Property/accessor decorator_, makes a property observable on every instance and enforces that values are not undefined or null when read (throws TypeError) and that only instances of Object can be set, which are sealed automatically [requires ES5+ target] [decorator] */
export function observable_seal(target: Object, key: string, descriptor?: PropertyDescriptor): any {
    return observable(target, key, descriptor, value => {
        if (value === undefined || value === null)
            throw new TypeError(key + " is " + value);
        return value;
    }, value => {
        if (!(value instanceof Object))
            throw new Error(key + " must be an Object, not " + value);
        return Object.isSealed(value) ? value : Object.seal(value);
    });
}

/** _Property/accessor decorator_, makes a property observable on every instance and enforces that values are not undefined or null when read (throws TypeError) and that only instances of Object can be set, which are frozen automatically [requires ES5+ target] [decorator] */
export function observable_freeze(target: Object, key: string, descriptor?: PropertyDescriptor): any {
    return observable(target, key, descriptor, value => {
        if (value === undefined || value === null)
            throw new TypeError(key + " is " + value);
        return value;
    }, value => {
        if (!(value instanceof Object))
            throw new Error(key + " must be an Object, not " + value);
        return Object.isFrozen(value) ? value : Object.freeze(value);
    });
}
