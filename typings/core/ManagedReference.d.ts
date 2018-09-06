import { ManagedEvent } from "./ManagedEvent";
import { ManagedObject, ManagedObjectConstructor } from "./ManagedObject";
import { MAKE_REF_MANAGED_PARENT_FN } from "./util";
/** Independent reference to a managed object, list, map, or other managed reference */
export declare class ManagedReference<T extends ManagedObject = ManagedObject> extends ManagedObject {
    /** Create a new managed reference that refers to given object */
    constructor(target?: T);
    /** Propagate events from referenced objects by emitting them on the reference instance itself, optionally restricted to given types of events */
    propagateEvents(f?: ((this: this, e: ManagedEvent) => ManagedEvent | ManagedEvent[] | undefined | void)): this;
    /** Propagate events from referenced objects by emitting them on the reference instance itself, optionally restricted to given types of events */
    propagateEvents(...types: Array<ManagedEvent | {
        new (...args: any[]): ManagedEvent;
    }>): this;
    /**
     * Ensure that referenced object is an instance of given class (or a sub class), and restrict new references to instances of given class. Given class must be a sub class of `ManagedObject`.
     * @exception Throws an error if referenced object is not an instance of given class, or of a sub class.
     */
    restrict<T extends ManagedObject>(classType: ManagedObjectConstructor<T>): ManagedReference<T>;
    private _managedClassRestriction?;
    /** Returns the referenced object, or undefined */
    get(): T | undefined;
    /** The referenced object, or undefined */
    target: T | undefined;
    /**
     * Remove the current reference, if any.
     * @exception Throws an error if the reference itself has been destroyed (see `ManagedObject.managedState`).
     */
    clear(): this | undefined;
    /**
     * Set the current reference to given object, or managed list, map, or another reference. Equivalent to setting the `target` property on this instance.
     * @exception Throws an error if the reference itself has been destroyed (see `ManagedObject.managedState`).
     */
    set(target?: T): this | undefined;
    /** @internal Helper function that fixes an existing referenced object as a child */
    [MAKE_REF_MANAGED_PARENT_FN](): void;
    /** Returns the referenced object itself, or undefined (alias of `get()` method) */
    toJSON(): {
        "$ref": number | undefined;
    };
}
/**
 * Managed object property decorator: amend decorated property to turn it into a managed reference to any other managed object (or managed list, map, or reference instance). This allows observers to handle events emitted by the referenced object (see `@observe` decorator).
 *
 * The decorated property immediately becomes undefined when the referenced object is destroyed (see `ManagedObject.managedState`).
 *
 * @decorator
 */
export declare function managed<T extends ManagedObject>(target: T, propertyKey: any): void;
/**
 * Managed object property decorator: amend decorated property to turn it into a managed reference to any other managed object (or managed list, map, or reference instance). This allows observers to handle events emitted by the referenced object (see `@observe` decorator).
 *
 * This asserts a reverse dependency between the referrer and the referenced object.
 * - The reference _must_ point to an instance of `ManagedObject`, and cannot be set to `undefined`.
 * - When the referenced object is destroyed, the referrer is also destroyed.
 * - An object can contain multiple simultaneous dependencies, and there is no limit on the number of dependents of any referenced object.
 *
 * @decorator
 */
export declare function managedDependency<T extends ManagedObject>(target: T, propertyKey: any): void;
/**
 * Managed object property decorator: amend decorated property to turn it into a managed child reference.
 *
 * This asserts a parent-child dependency between the referrer and the referenced object(s), recursively extending to objects in referenced managed lists, maps, and reference instances:
 * - When the parent is destroyed, all children are also destroyed.
 * - When the decorated property is set to another object, the previously referenced object is destroyed.
 * - When the referenced object is assigned to another managed child reference (or list, map, or reference instance that is a child object), the decorated property is set to undefined.
 * - The child object may refer to its parent using the `ManagedObject.getManagedParent` method, and observers can observe the managed parent reference using an `onManagedParentChange[Async]` method.
 *
 * @decorator
 */
export declare function managedChild<T extends ManagedObject>(target: T, propertyKey: any): void;
