import { err, ERROR } from "../errors";
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
 * Add the decorated observer to _all instances_ of the target class and derived classes. A new observer (instance of given observer class) is created for each target instance, and observed properties are amended with dynamic setters to trigger observer methods.
 * @note See `ManagedObject.addEventHandler` for another way to handle events emitted directly by instances of a managed object class.
 * @decorator
 */
export function observe<C extends ManagedObjectConstructor>(
  Target: C,
  propertyName: string | (() => Function | undefined)
) {
  // register a callback to be invoked for every instance of the target class,
  // but add the observer handlers only once
  let firstCall = true;
  ((Target as any) as typeof ManagedObject)._addInitializer(function (this: ManagedObject) {
    let Observer =
      typeof propertyName === "function" ? propertyName() : (Target as any)[propertyName];
    if (Observer) {
      if (firstCall) _addObserverHandlers(Target, Observer);
      firstCall = false;
      _getObserverInstance(this, Observer);
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
export function shadowObservable(
  shadowPropertyName: string,
  forceAsync?: boolean
): PropertyDecorator {
  return function (targetPrototype, propertyKey) {
    let descriptor = Object.getOwnPropertyDescriptor(targetPrototype, propertyKey as any);
    if (!descriptor || !descriptor.get) {
      throw err(ERROR.Observe_ShadowGetter);
    }
    (descriptor.get as any)[util.GETTER_SHADOW_PROP] = shadowPropertyName;
    (descriptor.get as any)[util.GETTER_SHADOW_FORCE_ASYNC] = !!forceAsync;
  };
}

/**
 * Observer method decorator: amend decorated method to turn it into a handler for changes to given property/ies.
 * @note This decorator is intended for use on methods that are part of an observer class, see `ManagedObject.addObserver`.
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
 * Observer method decorator: amend decorated method to turn it into a handler for events on managed objects that are referred to by given managed reference property/ies (decorated with `@managed`, `@managedChild`, or `@managedDependency`).
 * @note This decorator is intended for use on methods that are part of an observer class, see `ManagedObject.addObserver()`.
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
 * @note This decorator is intended for use on methods that are part of an observer class, see `ManagedObject.addObserver()`.
 * @decorator
 */
export function rateLimit(n: number): MethodDecorator {
  return function (targetPrototype, propertyKey) {
    if (
      typeof (targetPrototype as any)[propertyKey] !== "function" ||
      typeof propertyKey !== "string" ||
      propertyKey.slice(-5) !== "Async"
    ) {
      throw err(ERROR.Observe_RateLimitNonAsync);
    }
    (targetPrototype as any)[propertyKey][FN_RATE_LIMIT_PROP] = n;
  };
}

/** Helper function to add handlers from an observer class to a target class */
function _addObserverHandlers(Target: Function, Observer: { new (_instance: any): any }) {
  /** helper function to add an event handler for the current observer */
  const addHandler = (
    filter: ((e: ManagedEvent) => boolean) | undefined,
    f: (e: ManagedEvent) => void | Promise<void>,
    isAsync?: boolean
  ) => {
    _addManagedEventHandler(Observer, Target as any, filter, f, isAsync);
  };

  /** helper function to add a handler for onManagedParentChange[Async] */
  const addManagedParentChangeHandler = (
    f: (v: any, e: ManagedEvent, name: string) => void | Promise<void>,
    isAsync?: boolean
  ) => {
    let g: any = function (this: any, e: any) {
      f.call(this, e.parent, e, "managedParent");
    };
    g[FN_RATE_LIMIT_PROP] = (f as any)[FN_RATE_LIMIT_PROP];
    addHandler(e => e instanceof ManagedParentChangeEvent, g, isAsync);
  };

  // go through all properties on the prototype
  let targetProto = Target.prototype;
  for (let name of Object.getOwnPropertyNames(Observer.prototype)) {
    if (!Object.prototype.hasOwnProperty.call(Observer.prototype, name)) continue;
    let f = (Observer.prototype as any)[name];
    if (typeof f === "function") {
      if (Array.isArray(f[FN_OBS_NAME_PROP])) {
        // define an observable property using hinted property name
        let isAsync = name.slice(-5) === "Async";
        for (let p of f[FN_OBS_NAME_PROP]) {
          if (p === ".referenceCount") {
            // special case reference count
            _defineObservable(
              Observer,
              targetProto,
              util.HIDDEN_REFCOUNT_PROPERTY,
              f,
              false,
              isAsync,
              0
            );
          } else if (p === ".managedParent") {
            // special case managed parent ref
            addManagedParentChangeHandler(f, isAsync);
          } else if (p === "!managedParent") {
            // (cannot observe events on parent ref)
            throw err(ERROR.Observe_ObserveParent);
          } else {
            // add observable for this property
            let isEventHandler = p[0] === "!";
            _defineObservable(
              Observer,
              targetProto,
              p.slice(1),
              f,
              isEventHandler,
              isAsync
            );
          }
        }
      } else if (name[0] === "o" && name[1] === "n") {
        // define a handler based on the full method name
        switch (name) {
          case "onChangeAsync":
            addHandler(
              e => e.name === "Change" || e instanceof ManagedChangeEvent,
              f,
              true
            );
            break;
          case "onChange":
            addHandler(e => e.name === "Change" || e instanceof ManagedChangeEvent, f);
            break;
          case "onEventAsync":
            addHandler(undefined, f, true);
            break;
          case "onEvent":
            addHandler(undefined, f);
            break;
          case "onManagedParentChangeAsync":
            addManagedParentChangeHandler(f, true);
            break;
          case "onManagedParentChange":
            addManagedParentChangeHandler(f);
            break;
          case "onReferenceCountChangeAsync":
            _defineObservable(
              Observer,
              targetProto,
              util.HIDDEN_REFCOUNT_PROPERTY,
              f,
              false,
              true,
              0
            );
            break;
          case "onReferenceCountChange":
            _defineObservable(
              Observer,
              targetProto,
              util.HIDDEN_REFCOUNT_PROPERTY,
              f,
              false,
              false,
              0
            );
            break;

          // for other names, check for "*Change", otherwise handle event by name
          default:
            if (name.slice(-6) === "Change") {
              name = (name[2] !== "_" ? name[2].toLowerCase() : "") + name.slice(3, -6);
              _defineObservable(Observer, targetProto, name, f);
            } else if (name.slice(-11) === "ChangeAsync") {
              name = (name[2] !== "_" ? name[2].toLowerCase() : "") + name.slice(3, -11);
              _defineObservable(Observer, targetProto, name, f, false, true);
            } else if (name.slice(-5) === "Async") {
              name = name.slice(2, -5);
              addHandler(e => e.name === name, f, true);
            } else {
              name = name.slice(2);
              addHandler(e => e.name === name, f, false);
            }
        }
      }
    }
  }
}

/** Helper function to add a hidden event handler on a managed object class prototype */
function _addManagedEventHandler(
  Observer: any,
  target: typeof ManagedObject,
  eventFilter: ((event: ManagedEvent) => boolean) | undefined,
  handler: (event: ManagedEvent) => void | Promise<void>,
  isAsync?: boolean
) {
  if (!isAsync) {
    target.addEventHandler(function (e) {
      if (!eventFilter || eventFilter(e)) {
        let observer = _getObserverInstance(this, Observer);
        try {
          handler.call(observer, e);
        } catch (err) {
          util.exceptionHandler(err);
        }
      }
    });
  } else {
    let limit: number | undefined = (handler as any)[FN_RATE_LIMIT_PROP];
    let queued: boolean | undefined;
    let nextEvent: ManagedEvent | undefined;
    let lastT: number | undefined;
    target.addEventHandler(async function (e) {
      if (!eventFilter || eventFilter(e)) {
        try {
          if (limit! >= 0) {
            // handle rate limiting by waiting a variable amount of time
            nextEvent = e;
            if (queued) return;
            queued = true;
            let now = Date.now();
            let hold = lastT! + limit! - now;
            if (hold > 0) {
              await new Promise(r => {
                setTimeout(r, hold);
              });
            } else {
              await RESOLVED;
            }
            lastT = Date.now();
            queued = false;
            e = nextEvent;
          } else {
            // make this handler async by waiting for a promise first
            await RESOLVED;
          }
          nextEvent = undefined;
          let observer = _getObserverInstance(this, Observer);
          if (e) await handler.call(observer, e);
        } catch (err) {
          util.exceptionHandler(err);
        }
      }
    });
  }
}

/** Helper function to add an observer method for given class, observed target, and property */
function _defineObservable(
  Observer: { new (instance: any): any },
  targetPrototype: any,
  observedProperty: string,
  handler: (v: any, e: any, name: string) => void | Promise<void>,
  isEventHandler?: boolean,
  isAsync?: boolean,
  initialValue?: any
) {
  if (!isAsync) {
    // call observer method(s) immediately
    util.defineChainableProperty(
      targetPrototype,
      observedProperty,
      false,
      (obj, name, next) => {
        let lastValue = initialValue;
        let shadowed = name !== observedProperty;
        let observer = _getObserverInstance(obj, Observer);
        return (value, event, topHandler) => {
          next && next(value, event, topHandler);
          if (shadowed) value = obj[observedProperty];
          let changed = event ? event instanceof ManagedChangeEvent : lastValue !== value;
          if (isEventHandler ? !(event && value instanceof ManagedObject) : !changed) {
            return;
          }
          lastValue = value;
          try {
            handler.call(observer, value, event, observedProperty);
          } catch (err) {
            util.exceptionHandler(err);
          }
        };
      }
    );
  } else {
    // use promises to schedule next method invocation
    let limit: number | undefined = (handler as any)[FN_RATE_LIMIT_PROP];
    util.defineChainableProperty(
      targetPrototype,
      observedProperty,
      true,
      (obj, name, next) => {
        let lastValue = initialValue;
        let shadowed = name !== observedProperty;
        let queued: boolean | undefined;
        let nextEvent: ManagedEvent | undefined;
        let lastT: number | undefined;
        let c = 0;
        let observer = _getObserverInstance(obj, Observer);
        return async (value, event, topHandler) => {
          next && next(value, event, topHandler);
          if (shadowed) value = obj[observedProperty];
          let changed = event ? event instanceof ManagedChangeEvent : lastValue !== value;
          if (isEventHandler ? !event || !(value instanceof ManagedObject) : !changed) {
            return;
          }
          try {
            lastValue = value;
            if (limit! >= 0) {
              // handle rate limiting by waiting a variable amount of time
              nextEvent = event;
              if (queued) return;
              let current = ++c;
              queued = true;
              let now = Date.now();
              let hold = lastT! + limit! - now;
              if (hold > 0) {
                await new Promise(r => {
                  setTimeout(r, hold);
                });
              } else {
                await RESOLVED;
              }
              if (c !== current) return;
              lastT = Date.now();
              queued = false;
              event = nextEvent;
            } else {
              // make this handler async by waiting for a promise first
              if (queued) return;
              queued = (event && event.name) || true;
              await RESOLVED;
              queued = false;
            }
            nextEvent = undefined;
            await handler.call(observer, lastValue, event, observedProperty);
          } catch (err) {
            util.exceptionHandler(err);
          }
        };
      }
    );
  }
}

/** Helper function to find or create the observer instance for given observer UID */
function _getObserverInstance(obj: any, Observer: { new (instance: any): any }) {
  let uid =
    (Observer as any)[OBS_UID_PROP] || ((Observer as any)[OBS_UID_PROP] = _nextUID++);
  let observer = obj[OBS_UID_PROP + uid];
  if (!observer) {
    Object.defineProperty(obj, OBS_UID_PROP + uid, {
      enumerable: false,
      configurable: false,
      writable: true,
      value: true, // detect recursion below
    });
    observer = obj[OBS_UID_PROP + uid] = new Observer(obj);
    if (obj[util.HIDDEN_STATE_PROPERTY] === ManagedState.ACTIVE) {
      observer.onActive && observer.onActive();
    }
  } else if (observer === true) {
    throw err(ERROR.Observe_ObserverRecursion);
  }
  return observer;
}
