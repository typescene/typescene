import { err, ERROR } from "../errors";
import { ManagedCoreEvent, ManagedEvent } from "./ManagedEvent";
import type { ManagedObject } from "./ManagedObject";

/** @internal Hidden property names, used by managed objects & friends */
export const enum HIDDEN {
  /** @internal Method on prototype of ManagedObject for initializer chain */
  PROTO_INSTANCE_INIT = "^-new",

  /** @internal Arbitrary name of the hidden property containing a managed object's references */
  REF_PROPERTY = "^-out",

  /** @internal Arbitrary name of the hidden property containing the number of inward references */
  REFCOUNT_PROPERTY = "^-in",

  /** @internal Arbitrary name of the hidden property containing a managed object's state */
  STATE_PROPERTY = "^$",

  /** @internal Arbitrary name of the hidden method that handles events on the same object */
  EVENT_HANDLER = "^-ev",

  /** @internal Arbitrary name of the hidden method that handles and forwards events from referenced child objects */
  CHILD_EVENT_HANDLER = "^-ec",

  /** @internal Arbitrary name of the hidden method that handles and forwards events from referenced non-child objects (in lists and reference objects ONLY) */
  NONCHILD_EVENT_HANDLER = "^-en",

  /** @internal Arbitrary name of property on property getter to contain shadow property name */
  GETTER_SHADOW_PROP = "-shadow",

  /** @internal Arbitrary name of flag on property getter to indicate that synchronous observer handlers should not be allowed */
  GETTER_SHADOW_FORCE_ASYNC = "-async",

  /** @internal Arbitrary name of the setter function method to get a property handler/getter pair */
  SETTER_CHAIN = "^-ch",

  /** @internal Arbitrary prefix character for common property IDs */
  PROPERTY_ID_PREFIX = "P",

  /** @internal Arbitrary prefix character for property ID of managed list elements */
  MANAGED_LIST_REF_PREFIX = "@",

  /** @internal Arbitrary prefix character for property ID of managed map elements */
  MANAGED_MAP_REF_PREFIX = "%",

  /** @internal Arbitrary name of the method on managed list and managed reference instances to fix all referenced objects as children of the list */
  MAKE_REF_MANAGED_PARENT_FN = "_makeRefManagedParent",

  /** @internal Prefix for binding IDs, which double as names of hidden methods for updaters on component prototypes */
  BINDING_ID_PREFIX = "^^bind:",

  /** @internal Arbitrary name of a hidden property for bindings on the Component prototype */
  BINDINGS_PROPERTY = "^+bnd",

  /** @internal Arbitrary name of a hidden property for bound-inherit components on the Component prototype */
  BIND_INHERIT_PROPERTY = "^+bndI",

  /** @internal Arbitrary name of a hidden property for bound components on the Component prototype */
  COMPOSTN_PROPERTY = "^+bndC",

  /** @internal Arbitrary name of a hidden property that references the base Component observer */
  COMPONENT_OBSERVER_PROPERTY = "^+bndO",
}

/** @internal Reusable object that represents a single reference */
export interface RefLink {
  /** Reference UID */
  u: number;

  /** The reference source */
  a: any;

  /** The referenced target */
  b: any;

  /** The managed property ID that contains this reference */
  p: string;

  /** The previous RefLink in a linked list, IF `p` starts with `MANAGED_LIST_REF_PREFIX` */
  j?: RefLink;

  /** The next RefLink in a linked list, IF `p` starts with `MANAGED_LIST_REF_PREFIX` */
  k?: RefLink;

  /** Event callback (for source property) */
  f?: (e: any, obj: any, ref: any) => void;

  /** Destruction callback (called immediately before target is destroyed, ignoring any exceptions) */
  g?: (obj: any) => void;
}

/**
 * @internal Map of RefLink instances for references and back-references
 * @note `parent`, `head`, and `tail` are _duplicate_ references to RefLink instances which are also included in the same map with their own property ID
 */
export type RefLinkMap = RefLink[] & {
  /** Outward references, by property ID */
  [propId: string]: RefLink | undefined;

  /** Parent RefLink, if any */
  parent?: RefLink;

  /** Head of a managed list, if applicable */
  head?: RefLink;

  /** Tail of a managed list, if applicable */
  tail?: RefLink;
};

/** @internal Definition of a handler used by `defineChainableProperty` */
export type ChainedPropertyHandler = (
  this: void,
  v: any,
  e: any,
  h: ChainedPropertyHandler
) => void;

/** @internal Definition of a handler factory used by `defineChainableProperty`; the factory function is given an instance of the managed object, the final property name, and the next handler (i.e. the result of a factory that was defined *before* the current one) */
export type ChainedPropertyHandlerFactory<T> = (
  this: void,
  obj: T,
  name: keyof T,
  next?: ChainedPropertyHandler
) => ChainedPropertyHandler;

/**
 * @internal Helper function to define a chainable define-on-write property on a class prototype, with given change/event handler and optional instance getter.
 * @param targetPrototype
 *  the class prototype
 * @param propertyKey
 *  the name of the property to be amended
 * @param isAsyncHandler
 *  true if the handler will call further handlers asynchronously (to avoid setter side effects)
 * @param makeHandler
 *  function that is called when a first value is set on an instance, to create a handler that is invoked for every new value, with arguments for the instance itself (object), current value, event (undefined), and final handler function (to be used as event handler on managed references)
 * @param getter
 *  an optional instance getter function that will replace the original getter
 */
export function defineChainableProperty<T>(
  targetPrototype: any,
  propertyKey: keyof T,
  isAsyncHandler: boolean,
  makeHandler: ChainedPropertyHandlerFactory<T>,
  getter?: (this: T) => any
) {
  let origProperty = propertyKey;
  let origShadowed = false;
  let origGetter = getter;
  let ownDescriptor: PropertyDescriptor | undefined;

  // find nearest non-undefined property descriptor
  const findDescriptor = (
    key: keyof T,
    forceParent?: boolean,
    shadowed?: boolean
  ): PropertyDescriptor | undefined => {
    ownDescriptor = Object.getOwnPropertyDescriptor(targetPrototype, key);
    let result = ownDescriptor;
    let p = targetPrototype;
    while (true) {
      if (!result || forceParent) {
        p = Object.getPrototypeOf(p);
        if (!p) return;
        result = p && Object.getOwnPropertyDescriptor(p, key);
      }
      if (result) {
        // check getter before returning
        let g = result.get;
        if (g) {
          // check getter for flags
          if (!isAsyncHandler && (g as any)[HIDDEN.GETTER_SHADOW_FORCE_ASYNC]) {
            throw err(ERROR.Util_NoSync);
          } else if ((g as any)[HIDDEN.GETTER_SHADOW_PROP]) {
            // property has a settable shadow property
            propertyKey = (g as any)[HIDDEN.GETTER_SHADOW_PROP];
            origShadowed = true;
            return findDescriptor(propertyKey, forceParent, true);
          } else if (
            !shadowed &&
            !getter &&
            !(result.set && (result.set as any)[HIDDEN.SETTER_CHAIN])
          ) {
            // found non-chained getter method, do not override this one later
            getter = g;
          }
        }
        return result;
      }
    }
  };

  // chain getter/handler using existing prototype setter if possible
  // (i.e. existing handler for exact same class)
  findDescriptor(propertyKey);
  if (
    ownDescriptor &&
    ownDescriptor.set &&
    (ownDescriptor.set as any)[HIDDEN.SETTER_CHAIN]
  ) {
    let chained = (ownDescriptor.set as any)[HIDDEN.SETTER_CHAIN];
    if (getter) {
      // override getter if given (but don't override setter)
      Object.defineProperty(targetPrototype, propertyKey, {
        ...ownDescriptor,
        get: getter,
      });
    }
    (ownDescriptor.set as any)[HIDDEN.SETTER_CHAIN] = () => {
      let prev = chained();
      return {
        getter: getter || prev.getter,
        setter: prev.setter,
        makeHandler(obj: T, name: keyof T, next?: ChainedPropertyHandler) {
          return makeHandler(obj, name, prev && prev.makeHandler(obj, name, next));
        },
      };
    };
    return;
  }

  // otherwise create a new prototype setter
  let protoSetter = function (this: any, v: any) {
    // use chained function to make setter
    let prev = (protoSetter as any)[HIDDEN.SETTER_CHAIN]();
    let handler = prev.makeHandler(this, propertyKey);
    let value: any;
    let instanceSetter = function (this: T, v: any) {
      prev.setter && prev.setter.call(this, v);
      handler((value = v), undefined, handler);
    };

    // define getter based on various prototype getters
    let instanceGetter = prev.getter;
    if (!instanceGetter) {
      if (origShadowed) {
        let getting: boolean | undefined;
        instanceGetter = function (this: T) {
          if (getting) return value;
          getting = true;
          try {
            return this[origProperty];
          } finally {
            getting = false;
          }
        };
      } else {
        instanceGetter = getter || (() => value);
      }
    }

    // define instance property
    Object.defineProperty(this, propertyKey, {
      configurable: true,
      enumerable: ownDescriptor ? ownDescriptor.enumerable : true,
      get: instanceGetter,
      set: instanceSetter,
    });

    // use new setter to set initial value, if any
    if (v !== undefined) instanceSetter.call(this, v);
  };

  // add chaining function to setter for use by later prototypes
  (protoSetter as any)[HIDDEN.SETTER_CHAIN] = () => {
    let descriptor = findDescriptor(origProperty, true);
    let prev =
      descriptor &&
      descriptor.set &&
      (descriptor.set as any)[HIDDEN.SETTER_CHAIN] &&
      (descriptor.set as any)[HIDDEN.SETTER_CHAIN]();
    if (prev && prev.getter && origGetter) {
      throw err(ERROR.Util_AlreadyManaged, propertyKey);
    }
    return {
      getter: getter || (prev && prev.getter),
      setter: prev ? prev.setter : descriptor && descriptor.set,
      makeHandler(obj: T, name: keyof T, next?: ChainedPropertyHandler) {
        return makeHandler(obj, name, prev && prev.makeHandler(obj, name, next));
      },
    };
  };

  // set or override prototype property
  let protoGetter = getter || (() => ownDescriptor && ownDescriptor.value);
  Object.defineProperty(targetPrototype, propertyKey, {
    configurable: true,
    enumerable: ownDescriptor ? ownDescriptor.enumerable : true,
    get: protoGetter,
    set: protoSetter,
  });
}

/**
 * Propagate events on given object, from referenced managed (child) objects.
 * If a function is specified, the function can be used to transform one event to one or more others, or stop propagation if the function returns undefined. The function is called with the event itself as its first argument, and the name of the property that references the emitting object as its second argument.
 * Core event such as `ManagedCoreEvent.ACTIVE` cannot be propagated in this way, and events are no longer propagated after the object enters the 'destroyed' state. Calling this method a second time _replaces_ the current propagation rule/function.
 * @note This function is used by the _deprecated_ method `ManagedObject.propagateChildEvents()`, but also still by `propagateEvents()` methods on `ManagedList`, `ManagedMap`, and `ManagedReference` which will not be deprecated.
 */
export function propagateEvents(obj: ManagedObject, childOnly?: boolean, ...types: any[]) {
  let firstIsFunction =
    types[0] &&
    typeof types[0] === "function" &&
    !(types[0].prototype instanceof ManagedEvent) &&
    types[0] !== ManagedEvent;
  let f:
    | ((this: typeof obj, e: ManagedEvent, name: string) => any)
    | undefined = firstIsFunction ? types[0] : undefined;
  let emitting: ManagedEvent | undefined;
  const handler = f
    ? function (this: typeof obj, e: ManagedEvent, name: string) {
        if (emitting === e || !this[HIDDEN.STATE_PROPERTY]) return;
        let eventOrEvents = f!.call(this, e, name);
        if (eventOrEvents) {
          if (Array.isArray(eventOrEvents)) {
            eventOrEvents.forEach(propagated => {
              if (!ManagedCoreEvent.isCoreEvent(propagated)) {
                this.emit((emitting = propagated));
              }
            });
          } else if (!ManagedCoreEvent.isCoreEvent(eventOrEvents)) {
            this.emit((emitting = eventOrEvents));
          }
          emitting = undefined;
        }
      }
    : function (this: typeof obj, e: ManagedEvent) {
        if (emitting === e || !this[HIDDEN.STATE_PROPERTY]) return;
        if (
          types.length &&
          !types.some((t: any) => e === t || (typeof t === "function" && e instanceof t))
        )
          return;
        if (!ManagedCoreEvent.isCoreEvent(e)) {
          this.emit((emitting = e));
          emitting = undefined;
        }
      };

  // set handler function as hidden property/ies:
  Object.defineProperty(obj, HIDDEN.CHILD_EVENT_HANDLER, {
    configurable: true,
    enumerable: false,
    value: handler,
  });
  if (!childOnly) {
    Object.defineProperty(obj, HIDDEN.NONCHILD_EVENT_HANDLER, {
      configurable: true,
      enumerable: false,
      value: handler,
    });
  }
}

/** @internal Reference to `UnhandledErrorEmitter.emitError` (to break circular dependency) */
export let exceptionHandler: (err: any) => void = () => {};
export function setExceptionHandler(handler: (err: any) => void) {
  exceptionHandler = handler;
}
