import { ManagedEvent } from "./ManagedEvent";
import { HIDDEN_CHILD_EVENT_HANDLER, HIDDEN_EVENT_HANDLER, HIDDEN_REFCOUNT_PROPERTY, HIDDEN_REF_PROPERTY, HIDDEN_STATE_PROPERTY, MAKE_REF_MANAGED_PARENT_FN, RefLink } from "./util";
/** Enumeration of possible states for a managed object */
export declare enum ManagedState {
    /** State for a managed object that has been destroyed */
    DESTROYED = 0,
    /** State for a managed object that has just been created */
    CREATED = 1,
    /** State for a managed object that is activating asynchronously */
    ACTIVATING = 2,
    /** State for a managed object that is currently active */
    ACTIVE = 3,
    /** State for a managed object that is deactivating asynchronously */
    DEACTIVATING = 4,
    /** State for a managed object that is currently inactive */
    INACTIVE = 5,
    /** State for a managed object that is being destroyed asynchronously */
    DESTROYING = 6
}
/** Generic constructor type for ManagedObject, matching both parameterless constructors and those with one or more required parameters */
export declare type ManagedObjectConstructor<TObject> = (new (...args: any[]) => TObject) | (new (a: never, b: never, c: never, d: never, e: never, f: never) => TObject);
/** Base class for objects that have their own unique ID, life cycle including active/inactive and destroyed states, and managed references to other instances */
export declare class ManagedObject {
    /** Alias of `@observe`. Add given class as an observer of _all instances_ of a derived class. See also `ManagedObject.handle` for a simpler method to handle events. */
    static observe<T extends ManagedObject, C extends ManagedObjectConstructor<T>>(this: C, Observer: {
        new (instance: T): any;
    }): C;
    /** Attach a fixed event handler for _all instances_ of a derived class. */
    static handle<T extends ManagedObject>(this: ManagedObjectConstructor<T>, handler: (this: T, e: ManagedEvent) => void): void;
    /** Attach event handlers for _all instances_ of a derived class. The event name (`ManagedEvent.name` property) is used to find an event handler in given object. See also `ManagedObject.observe` for a more advanced way to observe events as well as property changes. */
    static handle<T extends ManagedObject>(this: ManagedObjectConstructor<T>, handlers: {
        [eventName: string]: (this: T, e: ManagedEvent) => void;
    }): void;
    /** @internal Set to the class itself when global preset method has run */
    static CLASS_INIT: typeof ManagedObject;
    /** Add a callback that is invoked by the constructor of this class, the first time an instance is created. The callback always runs only once. If an instance of this class has already been constructed, the callback is invoked immediately and its return value is returned. */
    static addGlobalClassInitializer<T>(f: () => T | void): void | T;
    /** @internal Method that is overridden by `addGlobalClassInitializer` */
    _class_init(): void;
    /** Creates a new managed object instance */
    constructor();
    /** Unique ID of this managed object (read only) */
    readonly managedId: number;
    /**
     * The current lifecycle state of this managed object.
     * @note This property is read-only. To change the state of a managed object (i.e. to move its lifecycle between active/inactive and destroyed states), use the `activateManagedAsync`, `deactivateManagedAsync`, and `destroyManagedAsync` methods. If any additional logic is required when moving between states, override the `onManagedStateActivatingAsync`, `onManagedStateActiveAsync`, `onManagedStateDeactivatingAsync`, `onManagedStateInactiveAsync` and/or `onManagedStateDestroyingAsync` methods in any class that derives from `ManagedObject`.
     * @note This property _cannot_ be observed directly. Observer classes (see `@observe` decorator) should use methods such as `onActive` to observe lifecycle state.
     */
    readonly managedState: ManagedState;
    /**
     * Returns the current number of managed references that point to this object
     * @note Observer classes (see `@observe` decorator) may use the `onReferenceCountChangeAsync` method to observe this value asynchronously.
     */
    protected getReferenceCount(): number;
    /** Returns an array of unique managed objects that contain managed references to this object (see `@managed`, `@managedChild`, `@managedDependency`, and `@compose` decorators) */
    protected getManagedReferrers(): ManagedObject[];
    /**
     * Returns the managed object that contains a _managed child reference_ that points to this instance (see `@managedChild` and `@compose` decorators).
     * The object itself is never returned, even if it contains a managed child reference that points to itself.
     * @note The reference to the managed parent (but not its events) can be observed by an observer class (see `@observe` decorator) using an `onManagedParentChange` or `onManagedParentChangeAsync` method.
     */
    protected getManagedParent(): ManagedObject | undefined;
    /**
     * Returns the managed object that contains a _managed child reference_ that points to this instance (see `@managedChild` decorator). If a class argument is specified, parent references are recursed until a parent of given type is found.
     * The object itself is never returned, even if it contains a managed child reference that points to itself (or if parents recursively reference the object or each other).
     */
    protected getManagedParent<TParent extends ManagedObject>(ParentClass: ManagedObjectConstructor<TParent>): TParent | undefined;
    /**
     * Emit an event. If an event constructor is given, a new instance is created using given constructor arguments (rest parameters). If an event name (string) is given, a new default event instance is created with given name. This method may be overridden in derived classes to use a different default event class.
     * Use the `ManagedEvent.freeze` method to freeze event instances before emitting.
     * See `ManagedObject.handle` (static method) and the `@observe` decorator for ways to handle events.
     * @note There is a limit to the number of events that can be emitted recursively; avoid calling this method on the same object from _within_ an event handler.
     */
    emit<TEvent extends ManagedEvent = ManagedEvent, TConstructorArgs extends any[] = any[]>(e: TEvent | (new (...args: TConstructorArgs) => TEvent) | string, ...constructorArgs: TConstructorArgs): this;
    /**
     * Propagate events from managed child objects that are _referenced_ as properties of this object (see `@managedChild` decorator) by emitting events on this object itself.
     * If a function is specified, the function is used to transform one event to one or more others, possibly including the same event, or stop propagation if the function returns undefined. The function will receive the event itself as its first argument, and the _name of the property_ that references the emitting object as its second argument.
     * The core Active, Inactive, Destroyed, and ManagedParentChange events cannot be propagated.
     * @note Calling this method a second time _replaces_ any existing propagation rule entirely.
     */
    protected propagateChildEvents(f?: ((this: this, e: ManagedEvent, propertyName: string) => ManagedEvent | ManagedEvent[] | undefined | void)): this;
    /**
     * Propagate events from managed child objects that are _referenced_ as properties of this object (see `@managedChild` decorator) by emitting events on this object itself. Only propagated events that extend given event types are propagated.
     * The core Active, Inactive, Destroyed, and ManagedParentChange events cannot be propagated.
     * @note Calling this method a second time _replaces_ any existing propagation rule entirely.
     */
    protected propagateChildEvents(...types: Array<ManagedEvent | {
        new (...args: any[]): ManagedEvent;
    }>): this;
    /** Activate this managed object (i.e. change state to `ACTIVATING` and then to `ACTIVATED`) */
    protected activateManagedAsync(): Promise<any>;
    /** Deactivate this managed object, if it is currently active (i.e. change state to `DEACTIVATING` and then to `DEACTIVATED`) */
    protected deactivateManagedAsync(): Promise<void>;
    /** Destroy this managed object (i.e. change state to `DESTROYING` and then to `DESTROYED`, clear all managed references from and to this object, and destroy all managed children) */
    protected destroyManagedAsync(): Promise<void>;
    /** Callback invoked when changing state to 'active', to be overridden */
    protected onManagedStateActivatingAsync(): Promise<void>;
    /** Callback invoked immediately after state has changed to 'active' and before any other state transitions, to be overridden */
    protected onManagedStateActiveAsync(): Promise<void>;
    /** Callback invoked when changing state to 'inactive', to be overridden */
    protected onManagedStateDeactivatingAsync(): Promise<void>;
    /** Callback invoked immediately after state has changed to 'inactive' and before any other state transitions, to be overridden */
    protected onManagedStateInactiveAsync(): Promise<void>;
    /** Callback invoked when changing state to 'destroyed', to be overridden */
    protected onManagedStateDestroyingAsync(): Promise<void>;
    /** Handle state transitions asynchronously with a way to chain next transitions */
    private _transitionManagedState;
    /** @internal Create or take an existing managed reference and set given values */
    protected static _createRefLink<T extends ManagedObject>(source: T, target: ManagedObject, propId: string, handleEvent?: (obj: T, ref: ManagedObject, e: ManagedEvent) => void, handleDestroy?: (obj: T) => void): RefLink;
    /** @internal Unlink given managed reference; returns true if unlinked, false if argument was not a RefLink instance */
    protected static _discardRefLink(ref?: RefLink): boolean;
    /** @internal Make given RefLink the (new) parent-child link for the referenced object */
    protected static _makeManagedChildRefLink(ref: RefLink): void;
    /** @internal Returns true if given RefLink is a parent-child link */
    protected static _isManagedChildRefLink(ref: RefLink): boolean;
    /** @internal Validate that source object is not destroyed, and target reference is either undefined or a managed object (optionally of given type) that is not destroyed */
    protected static _validateReferenceAssignment(source: ManagedObject, target?: ManagedObject, ClassRestriction?: ManagedObjectConstructor<any>): void;
    /**
     * Amend given property (on object or prototype) to turn it into a managed reference property.
     * @param object
     *  the instance or prototype object in which to amend given property
     * @param propertyKey
     *  the property to be amended
     * @param isChildReference
     *  true if this reference should be a managed parent-child reference; automatically asserts a parent-child dependency between the referencing object and referenced object(s), recursively extending to objects in referenced managed lists, maps, and reference instances
     * @param isDependency
     *  true if the containing object should be destroyed when a referenced object is destroyed
     * @param preAssignHandler
     *  an optional handler that is invoked before a new reference is actually assigned, can be used to validate the target
     * @returns the newly applied property descriptor
     */
    static createManagedReferenceProperty<T extends ManagedObject>(object: T, propertyKey: keyof T, isChildReference?: boolean, isDependency?: boolean, preAssignHandler?: (this: T, target: ManagedObject) => void, eventHandler?: (this: T, event: ManagedEvent) => void): void;
    /** @internal To be overridden, to turn existing references into child objects */
    protected [MAKE_REF_MANAGED_PARENT_FN](): void;
    private readonly [HIDDEN_REF_PROPERTY];
    private [HIDDEN_REFCOUNT_PROPERTY];
    private [HIDDEN_STATE_PROPERTY];
    private [HIDDEN_EVENT_HANDLER]?;
    private [HIDDEN_CHILD_EVENT_HANDLER]?;
    private _emitting?;
    private _transition?;
}
