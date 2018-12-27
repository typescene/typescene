import { ManagedChangeEvent, ManagedEvent, ManagedParentChangeEvent } from "./ManagedEvent";
import { ManagedObject, ManagedObjectConstructor, ManagedState } from "./ManagedObject";
import * as util from "./util";

/** Next unique ID for an observable class */
let _nextUID = 1000;

/** Arbitrary name of property on observer function to contain name of observed property */
const FN_OBS_NAME_PROP = "^o:prop";

/** Arbitrary name of property on observer function to contain rate limit in ms */
const FN_RATE_LIMIT_PROP = "^o:rate";

/** Arbitrary name of property on observer class to contain observer UID, as well as prefix for name of (hidden) property on observer observed objects to contain instance references */
const OBS_UID_PROP = "^o:uid";

/** Resolved promise used by async handlers below */
const RESOLVED = Promise.resolve();

/**
 * Implementation of `ManagedObject.observe`.
 * @exception Throws an error if the target class does not derive from `ManagedObject`.
 */
export function observe<T extends ManagedObject>(
    Target: ManagedObjectConstructor<T>, Observer: { new(instance: T): any }) {
    if (!Target || !Observer) debugger;
    let proto = Target.prototype;
    if (!(proto instanceof ManagedObject)) {
        throw Error("[Object] Observed target is not a managed object class");
    }
    (Target as any as typeof ManagedObject).addGlobalClassInitializer(() => {
        let addHandler = (filter: (e: ManagedEvent) => boolean, f: (e: ManagedEvent) => void, isAsync?: boolean) => {
            _addManagedEventHandler(Observer, Target as any, filter, f, isAsync);
        };
        let addManagedParentChangeHandler = (f: (v: any, e: ManagedEvent, name: string) => void, isAsync?: boolean) => {
            let g: any = function (this: any, e: any) {
                f.call(this, e.parent, e, "managedParent");
            }
            g[FN_RATE_LIMIT_PROP] = (f as any)[FN_RATE_LIMIT_PROP];
            addHandler(e => (e instanceof ManagedParentChangeEvent), g, isAsync);
        };
        for (let name of Object.getOwnPropertyNames(Observer.prototype)) {
            if (!Object.prototype.hasOwnProperty.call(Observer.prototype, name)) continue;
            let f = (Observer.prototype as any)[name];
            if (typeof f === "function") {
                if (Array.isArray(f[FN_OBS_NAME_PROP])) {
                    // define an observable property using hinted property name
                    let isAsync = name.slice(-5) === "Async";
                    for (let p of f[FN_OBS_NAME_PROP]) {
                        // special case managed parent ref
                        if (p === ".managedParent") {
                            addManagedParentChangeHandler(f, isAsync);
                            continue;
                        }
                        if (p === "!managedParent") {
                            throw Error("[Object] Cannot observe events on parent reference");
                        }
                        // special case reference count (should start at 0)
                        if (p === ".referenceCount") {
                            _defineObservable(Observer, proto, util.HIDDEN_REFCOUNT_PROPERTY,
                                f, false, isAsync, 0);
                        }
                        else {
                            // add observable for this property
                            let isEventHandler = (p[0] === "!");
                            _defineObservable(Observer, proto, p.slice(1), f, isEventHandler, isAsync);
                        }
                    }
                }
                else if (name[0] === "o" && name[1] === "n") {
                    // define a handler based on the full method name
                    let sliceName = (n: number): string => {
                        let result = name[2].toLowerCase() + name.slice(3, -n);
                        if (result[0] === "_") result = result.slice(1);
                        return result;
                    };
                    switch (name) {
                        // handle events specially for specific method names
                        case "onChangeAsync":
                            addHandler(e => (e instanceof ManagedChangeEvent), f, true); break;
                        case "onChange":
                            addHandler(e => (e instanceof ManagedChangeEvent), f); break;
                        case "onEventAsync":
                            addHandler(() => true, f, true); break;
                        case "onEvent":
                            addHandler(() => true, f); break;
                        case "onManagedParentChangeAsync":
                            addManagedParentChangeHandler(f, true); break;
                        case "onManagedParentChange":
                            addManagedParentChangeHandler(f); break;
                        case "onReferenceCountChangeAsync":
                            _defineObservable(Observer, proto,
                                util.HIDDEN_REFCOUNT_PROPERTY, f, false, true, 0);
                            break;
                        case "onReferenceCountChange":
                            _defineObservable(Observer, proto,
                                util.HIDDEN_REFCOUNT_PROPERTY, f, false, false, 0);
                            break;

                        // for other names, check for "*Change", otherwise handle event by name
                        default:
                            if (name.slice(-6) === "Change") {
                                _defineObservable(Observer, proto, sliceName(6), f);
                            }
                            else if (name.slice(-11) === "ChangeAsync") {
                                _defineObservable(Observer, proto, sliceName(11), f, false, true);
                            }
                            else {
                                // handle events
                                let eventName = name.slice(2);
                                if (name.slice(-5) === "Async") {
                                    eventName = eventName.slice(0, -5);
                                    addHandler(e => e.name === eventName, f, true);
                                }
                                else {
                                    addHandler(e => e.name === eventName, f, false);
                                }
                            }
                    }
                }
            }
        }
    });
}

/**
 * Observed property decorator: use given property as the shadow (writable) property for decorated property.
 * The decorated property itself (which _must_ have a property getter) will not be observed, and given property is observed instead. However, the 'current value' passed to observer methods will still be the value that is obtained through the getter of the decorated property.
 * @param shadowPropertyName
 *  the name of the shadow property that should be observed instead
 * @param forceAsync
 *  if true, forces observers to observe this property asynchronously _only_, to prevent the occurance of side effects when setting the value of the shadow property; any attempt to observe the decorated property using a synchronous observer method (without `...Async`) results in an error
 * @exception Throws an error if the decorated property does not have its own getter.
 * @decorator
 */
export function shadowObservable(shadowPropertyName: string, forceAsync?: boolean): PropertyDecorator {
    return function (targetPrototype, propertyKey) {
        let descriptor = Object.getOwnPropertyDescriptor(targetPrototype, propertyKey as any);
        if (!descriptor || !descriptor.get) {
            throw Error("[Object] @shadowObservable(...) can only be applied to properties with their own getter method");
        }
        (descriptor.get as any)[util.GETTER_SHADOW_PROP] = shadowPropertyName;
        (descriptor.get as any)[util.GETTER_SHADOW_FORCE_ASYNC] = !!forceAsync;
    };
}

/**
 * Observer method decorator: amend decorated method to turn it into a handler for changes to given property/ies.
 * @note This decorator is intended for use on methods that are part of an observer class, see `ManagedObject.observe`.
 * @decorator
 */
export function onPropertyChange(...observedProperties: string[]): MethodDecorator {
    return function (targetPrototype, propertyKey) {
        let f = (targetPrototype as any)[propertyKey];
        if (typeof f !== "function") throw TypeError();
        if (!f[FN_OBS_NAME_PROP]) {
            f[FN_OBS_NAME_PROP] = [];
        }
        let fObserved: string[] = f[FN_OBS_NAME_PROP];
        for (let observedProperty of observedProperties) {
            if (!fObserved.some(s => s === "." + observedProperty))
                fObserved.push("." + observedProperty);
        }
    };
}

/**
 * Observer method decorator: amend decorated method to turn it into a handler for events on managed objects that are referred to by given managed reference property/ies (decorated with `@managed`, `@managedChild`, `@managedDependency`, or `@compose`).
 * @note This decorator is intended for use on methods that are part of an observer class, see `ManagedObject.observe`.
 * @decorator
 */
export function onPropertyEvent(...observedProperties: string[]): MethodDecorator {
    return function (targetPrototype, propertyKey) {
        let f = (targetPrototype as any)[propertyKey];
        if (typeof f !== "function") throw TypeError();
        if (!f[FN_OBS_NAME_PROP]) {
            f[FN_OBS_NAME_PROP] = [];
        }
        let fObserved: string[] = f[FN_OBS_NAME_PROP];
        for (let observedProperty of observedProperties) {
            if (!fObserved.some(s => s === "!" + observedProperty))
                fObserved.push("!" + observedProperty);
        }
    };
}

/**
 * Observer method decorator: limit the decorated asynchronous observer method to be invoked only at a maximum frequency, determined by the given number of milliseconds.
 * @note This decorator is intended for use on methods that are part of an observer class, see `ManagedObject.observe`.
 * @decorator
 */
export function rateLimit(n: number): MethodDecorator {
    return function (targetPrototype, propertyKey) {
        if (typeof (targetPrototype as any)[propertyKey] !== "function" ||
            typeof propertyKey !== "string" || propertyKey.slice(-5) !== "Async") {
            throw Error("[Object] @rateLimit(...) can only be applied to async Observer methods");
        }
        (targetPrototype as any)[propertyKey][FN_RATE_LIMIT_PROP] = n;
    };
}

/** Helper function to add a hidden event handler on a managed object class prototype */
function _addManagedEventHandler(observerClass: any, target: typeof ManagedObject,
    eventFilter: (event: ManagedEvent) => boolean, handler: (event: ManagedEvent) => void,
    isAsync?: boolean) {
    if (!isAsync) {
        target.handle(function (e) {
            if (eventFilter(e)) {
                let observer = _getObserverInstance(this, observerClass);
                try { handler.call(observer, e) }
                catch (err) { util.exceptionHandler(err) }
            }
        });
    }
    else {
        let limit: number | undefined = (handler as any)[FN_RATE_LIMIT_PROP];
        let queued: boolean | undefined;
        let nextEvent: ManagedEvent | undefined;
        let lastT: number | undefined;
        target.handle(async function (e) {
            if (eventFilter(e)) {
                try {
                    if (limit! >= 0) {
                        // handle rate limiting by waiting a variable amount of time
                        nextEvent = e;
                        if (queued) return;
                        queued = true;
                        let now = Date.now(), hold = lastT! + limit! - now;
                        if (hold > 0) await new Promise(r => { setTimeout(r, hold) });
                        lastT = now;
                        queued = false;
                        e = nextEvent;
                    }
                    else {
                        // make this handler async by waiting for a promise first
                        await RESOLVED;
                    }
                    nextEvent = undefined;
                    let observer = _getObserverInstance(this, observerClass);
                    await handler.call(observer, e);
                }
                catch (err) {
                    util.exceptionHandler(err);
                }
            }
        });
    }
}

/** Helper function to add an observer method for given class, observed target, and property */
function _defineObservable(observerClass: { new(instance: any): any },
    targetPrototype: any, observedProperty: string,
    handler: (v: any, e: any, name: string) => void, isEventHandler?: boolean, isAsync?: boolean,
    initialValue?: any) {
    if (!isAsync) {
        // call observer method(s) immediately
        util.defineChainableProperty(targetPrototype, observedProperty, false,
            (obj, name, next) => {
                let lastValue = initialValue;
                let shadowed = (name !== observedProperty);
                let observer = _getObserverInstance(obj, observerClass);
                return (value, event, topHandler) => {
                    next && next(value, event, topHandler);
                    if (shadowed) value = obj[observedProperty];
                    if (isEventHandler ? event && (value instanceof ManagedObject) :
                        (event ? (event instanceof ManagedChangeEvent) : (lastValue !== value))) {
                        handler.call(observer, (lastValue = value), event, observedProperty);
                    }
                };
            });
    }
    else {
        // use promises to schedule next method invocation
        let limit: number | undefined = (handler as any)[FN_RATE_LIMIT_PROP];
        util.defineChainableProperty(targetPrototype, observedProperty, true,
            (obj, name, next) => {
                let lastValue = initialValue;
                let shadowed = (name !== observedProperty);
                let queued: boolean | undefined;
                let nextValue: any, nextEvent: ManagedEvent;
                let lastT: number | undefined;
                let c = 0;
                let observer = _getObserverInstance(obj, observerClass);
                return async (value, event, topHandler) => {
                    next && next(value, event, topHandler);
                    if (shadowed) value = obj[observedProperty];
                    let changed = event ? (event instanceof ManagedChangeEvent) : (lastValue !== value);
                    if (!changed && !isEventHandler) return;
                    lastValue = value;
                    try {
                        if (limit! >= 0) {
                            // handle rate limiting by waiting a variable amount of time
                            nextValue = value, nextEvent = event;
                            if (queued) return;
                            let current = ++c;
                            queued = true;
                            let now = Date.now(), hold = lastT! + limit! - now;
                            await new Promise(r => { setTimeout(r, Math.max(hold, 0)) });
                            if (c !== current) return;
                            lastT = now;
                            queued = false;
                            value = nextValue, event = nextEvent;
                        }
                        else {
                            // make this handler async by waiting for a promise first
                            if (queued) return;
                            queued = true;
                            await RESOLVED;
                            queued = false;
                        }
                        if (isEventHandler ? event && (value instanceof ManagedObject) : changed) {
                            await handler.call(observer, lastValue, event, observedProperty);
                        }
                    }
                    catch (err) {
                        util.exceptionHandler(err);
                    }
                };
            });
    }
}

/** Helper function to find or create the observer instance for given observer UID */
function _getObserverInstance(obj: any, observerClass: { new(instance: any): any }) {
    let uid = (observerClass as any)[OBS_UID_PROP] ||
        ((observerClass as any)[OBS_UID_PROP] = _nextUID++);
    let observer = obj[OBS_UID_PROP + uid];
    if (!observer) {
        Object.defineProperty(obj, OBS_UID_PROP + uid, {
            enumerable: false,
            configurable: false,
            writable: true,
            value: true  // detect recursion below
        });
        observer = obj[OBS_UID_PROP + uid] = new observerClass(obj);
        if (obj[util.HIDDEN_STATE_PROPERTY] === ManagedState.ACTIVE) {
            observer.onActive && observer.onActive();
        }
    }
    else if (observer === true) {
        throw Error("[Object] Recursion in observer constructor detected");
    }
    return observer;
}
