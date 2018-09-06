/** @internal Arbitrary name of the hidden property containing a managed object's references */
export declare const HIDDEN_REF_PROPERTY = "^ref";
/** @internal Arbitrary name of the hidden property containing the number of inward references */
export declare const HIDDEN_REFCOUNT_PROPERTY = "^ref_in";
/** @internal Arbitrary name of the hidden property containing a managed object's state */
export declare const HIDDEN_STATE_PROPERTY = "^state";
/** @internal Arbitrary name of the hidden method that handles events on the same object */
export declare const HIDDEN_EVENT_HANDLER = "^handler";
/** @internal Arbitrary name of the hidden method that handles and forwards events from referenced objects */
export declare const HIDDEN_CHILD_EVENT_HANDLER = "^refhandler";
/** @internal Arbitrary name of property on property getter to contain shadow property name */
export declare const GETTER_SHADOW_PROP = "^shadow";
/** @internal Arbitrary name of flag on property getter to indicate that synchronous observer handlers should not be allowed */
export declare const GETTER_SHADOW_FORCE_ASYNC = "^async";
/** @internal Arbitrary name of the setter function method to get a property handler/getter pair */
export declare const SETTER_CHAIN = "^chain";
/** @internal Arbitrary prefix character for common property IDs */
export declare const PROPERTY_ID_PREFIX = "P";
/** @internal Arbitrary prefix character for property ID of managed list elements */
export declare const MANAGED_LIST_REF_PREFIX = "@";
/** @internal Arbitrary prefix character for property ID of managed map elements */
export declare const MANAGED_MAP_REF_PREFIX = "%";
/** @internal Arbitrary name of the method on managed list and managed reference instances to fix all referenced objects as children of the list */
export declare const MAKE_REF_MANAGED_PARENT_FN = "_makeRefManagedParent";
/** @internal Prefix for binding IDs, which double as names of hidden methods for updaters on component prototypes */
export declare const BINDING_ID_PREFIX = "^bound:";
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
    f?: (obj: any, ref: any, e: any) => void;
    /** Destruction callback (called immediately before target is destroyed) */
    g?: (obj: any) => void;
}
/**
 * @internal Map of RefLink instances for references and back-references
 * @note `parent`, `head`, and `tail` are _duplicate_ references to RefLink instances which are also included in the same map with their own property ID
 */
export declare type RefLinkMap = RefLink[] & {
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
export declare type ChainedPropertyHandler = (this: void, v: any, e: any, h: ChainedPropertyHandler) => void;
/** @internal Definition of a handler factory used by `defineChainableProperty`; the factory function is given an instance of the managed object, the final property name, and the next handler (i.e. the result of a factory that was defined *before* the current one) */
export declare type ChainedPropertyHandlerFactory<T> = (this: void, obj: T, name: keyof T, next?: ChainedPropertyHandler) => ChainedPropertyHandler;
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
export declare function defineChainableProperty<T>(targetPrototype: any, propertyKey: keyof T, isAsyncHandler: boolean, makeHandler: ChainedPropertyHandlerFactory<T>, getter?: (this: T) => any): void;
/** @internal Reference to `UnhandledErrorEmitter.emitError` (to break circular dependency) */
export declare let exceptionHandler: (err: any) => void;
export declare function setExceptionHandler(handler: (err: any) => void): void;
