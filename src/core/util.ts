
/** @internal Arbitrary name of the hidden property containing a managed object's references */
export const HIDDEN_REF_PROPERTY = "^ref";

/** @internal Arbitrary name of the hidden property containing the number of inward references */
export const HIDDEN_REFCOUNT_PROPERTY = "^ref_in";

/** @internal Arbitrary name of the hidden property containing a managed object's state */
export const HIDDEN_STATE_PROPERTY = "^state";

/** @internal Arbitrary name of the hidden method that handles events on the same object */
export const HIDDEN_EVENT_HANDLER = "^handler";

/** @internal Arbitrary name of the hidden method that handles and forwards events from referenced objects */
export const HIDDEN_CHILD_EVENT_HANDLER = "^refhandler";

/** @internal Arbitrary name of property on property getter to contain shadow property name */
export const GETTER_SHADOW_PROP = "^shadow";

/** @internal Arbitrary name of flag on property getter to indicate that synchronous observer handlers should not be allowed */
export const GETTER_SHADOW_FORCE_ASYNC = "^async";

/** @internal Arbitrary name of the setter function method to get a property handler/getter pair */
export const SETTER_CHAIN = "^chain";

/** @internal Arbitrary prefix character for common property IDs */
export const PROPERTY_ID_PREFIX = "P";

/** @internal Arbitrary prefix character for property ID of managed list elements */
export const MANAGED_LIST_REF_PREFIX = "@";

/** @internal Arbitrary prefix character for property ID of managed map elements */
export const MANAGED_MAP_REF_PREFIX = "%";

/** @internal Arbitrary name of the method on managed list and managed reference instances to fix all referenced objects as children of the list */
export const MAKE_REF_MANAGED_PARENT_FN = "_makeRefManagedParent";

/** @internal Prefix for binding IDs, which double as names of hidden methods for updaters on component prototypes */
export const BINDING_ID_PREFIX = "^bound:";

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
    f?: (obj: any, ref: any, e: any) => void

    /** Destruction callback (called immediately before target is destroyed) */
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
export type ChainedPropertyHandler = (this: void, v: any, e: any, h: ChainedPropertyHandler) => void;

/** @internal Definition of a handler factory used by `defineChainableProperty`; the factory function is given an instance of the managed object, the final property name, and the next handler (i.e. the result of a factory that was defined *before* the current one) */
export type ChainedPropertyHandlerFactory<T> = (this: void, obj: T, name: keyof T, next?: ChainedPropertyHandler) => ChainedPropertyHandler;

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
    targetPrototype: any, propertyKey: keyof T, isAsyncHandler: boolean,
    makeHandler: ChainedPropertyHandlerFactory<T>, getter?: (this: T) => any) {
    let origProperty = propertyKey;
    let ownDescriptor: PropertyDescriptor | undefined;

    // find nearest non-undefined property descriptor
    let descriptor: PropertyDescriptor | undefined;
    let oldGetter: (() => any) | undefined;
    let findDescriptor = (forceParent?: boolean) => {
        ownDescriptor = Object.getOwnPropertyDescriptor(targetPrototype, origProperty);
        descriptor = ownDescriptor;
        propertyKey = origProperty;
        let p = targetPrototype;
        do {
            if (!descriptor || forceParent) {
                p = Object.getPrototypeOf(p);
                if (!p) break;
                descriptor = p && Object.getOwnPropertyDescriptor(p, propertyKey);
            }
            oldGetter = descriptor && descriptor.get;

            // check if async handler is allowed for this property
            if (!isAsyncHandler && oldGetter && (oldGetter as any)[GETTER_SHADOW_FORCE_ASYNC]) {
                throw Error("[Object] Synchronous observers are not allowed for property " + propertyKey);
            }

            // check if property has a settable shadow property
            if (oldGetter && (oldGetter as any)[GETTER_SHADOW_PROP]) {
                propertyKey = (oldGetter as any)[GETTER_SHADOW_PROP];
                descriptor = p && Object.getOwnPropertyDescriptor(p, propertyKey);
            }
        }
        while (!descriptor)
    }
    findDescriptor();
    if (propertyKey !== origProperty) {
        ownDescriptor = Object.getOwnPropertyDescriptor(targetPrototype, propertyKey);
    }

    // chain getter/handler using existing prototype setter if possible
    // (i.e. existing handler for exact same class)
    if (ownDescriptor && ownDescriptor.set && (ownDescriptor.set as any)[SETTER_CHAIN]) {
        let chained = (ownDescriptor.set as any)[SETTER_CHAIN];
        (ownDescriptor.set as any)[SETTER_CHAIN] = () => {
            let prev = chained();
            return {
                getter: getter || prev.getter,
                setter: prev.setter,
                makeHandler(obj: T, name: keyof T, next?: ChainedPropertyHandler) {
                    return makeHandler(obj, name, prev && prev.makeHandler(obj, name, next))
                }
            };
        };
        return;
    }

    // otherwise create a new prototype setter
    let protoSetter = function (this: any, v: any) {
        // use chained function to make setter
        let chain = (protoSetter as any)[SETTER_CHAIN]();
        let handler = chain.makeHandler(this, propertyKey);
        let value: any;
        let instanceSetter = function (this: T, v: any) {
            chain.setter && chain.setter.call(this, v);
            handler((value = v), undefined, handler);
        }

        // define getter based on various prototype getters
        let instanceGetter = chain.getter || oldGetter || (() => value);
        if (!chain.getter && (propertyKey !== origProperty)) {
            let getting: boolean | undefined;
            instanceGetter = function (this: T) {
                if (getting) return value;
                getting = true;
                try { return this[origProperty] }
                finally { getting = false }
            }
        }

        // define instance property
        Object.defineProperty(this, propertyKey, {
            configurable: true,
            enumerable: ownDescriptor ? ownDescriptor.enumerable : true,
            get: instanceGetter, set: instanceSetter
        });

        // use new setter to set initial value, if any
        if (v !== undefined) instanceSetter.call(this, v);
    };

    // add chaining function to setter for use by later prototypes
    (protoSetter as any)[SETTER_CHAIN] = () => {
        findDescriptor(true);
        let prev = descriptor && descriptor.set &&
            (descriptor.set as any)[SETTER_CHAIN] &&
            (descriptor.set as any)[SETTER_CHAIN]();
        if (prev && prev.getter && getter) {
            throw Error("[Object] Property is already managed in a base class: " + propertyKey);
        }
        return {
            getter: getter || prev && prev.getter,
            setter: prev ? prev.setter : (descriptor && descriptor.set),
            makeHandler(obj: T, name: keyof T, next?: ChainedPropertyHandler) {
                return makeHandler(obj, name, prev && prev.makeHandler(obj, name, next))
            }
        };
    };

    // set or override prototype property
    let protoGetter = (ownDescriptor && ownDescriptor.get) ||
        (propertyKey === origProperty) && oldGetter ||
        (() => (ownDescriptor && ownDescriptor.value));
    Object.defineProperty(targetPrototype, propertyKey, {
        configurable: true,
        enumerable: ownDescriptor ? ownDescriptor.enumerable : true,
        get: protoGetter, set: protoSetter
    });
}

/** @internal Reference to `UnhandledErrorEmitter.emitError` (to break circular dependency) */
export let exceptionHandler: (err: any) => void = () => {};
export function setExceptionHandler(handler: (err: any) => void) {
    exceptionHandler = handler;
}
