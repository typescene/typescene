import { ManagedEvent } from "./ManagedEvent";
import { ManagedObject, ManagedObjectConstructor } from "./ManagedObject";
import { MAKE_REF_MANAGED_PARENT_FN } from "./util";
/** Represents an unordered list that maps keys (strings) to managed objects */
export declare class ManagedMap<T extends ManagedObject = ManagedObject> extends ManagedObject {
    /** Creates an empty map */
    constructor();
    /** Propagate events from objects in this map by emitting them on the map object itself, optionally restricted to given types of events */
    propagateEvents(...types: Array<ManagedEvent | {
        new (...args: any[]): ManagedEvent;
    }>): this;
    /**
     * Ensure that objects in this map are all instances of given class (or a sub class), and restrict newly mapped objects to instances of given class. Given class must be a sub class of `ManagedObject`.
     * @exception Throws an error if any object is not an instance of given class, or of a sub class.
     */
    restrict<T extends ManagedObject>(classType: ManagedObjectConstructor<T>): ManagedMap<T>;
    private _managedClassRestriction?;
    /** Returns the current object mapped to given key, if any */
    get(key: string): T | undefined;
    /** Returns true if any object is currently mapped to given key */
    has(key: string): boolean;
    /**
     * Remove the mapping for given key.
     * @note Does not throw an error if given key was not mapped to any object at all.
     */
    unset(key: string): void;
    /**
     * Map given object (or managed list or map) to given key, removing the existing mapping between the same key and any other object, if any.
     * Objects may be mapped to multiple keys at the same time, unless the `ManagedMap` instance itself is a child object of a managed object or list (see `@managedChild` decorator).
     * @param key
     *  The key to be mapped to given object
     * @param target
     *  The managed object (or list, or map) to be mapped to given key
     * @exception Throws an error if the map itself has been destroyed (see `ManagedObject.managedState`).
     */
    set(key: string, target?: T): void | this;
    /** Remove given object from this map (same as calling `unset(...)` on all keys that refer to given object) */
    remove(target: T): this;
    /** Remove all objects from this map */
    clear(): this;
    /** Returns a list of all (unique) objects in this map */
    objects(): T[];
    /** Returns a list of all keys in this map */
    keys(): string[];
    /** Returns true if given object is currently contained in this map */
    includes(target: T): boolean;
    /** Returns an object with properties for all keys and objects in this map */
    toObject(): {
        [index: string]: T;
    };
    /** Returns an object representation of this map (alias of `toObject` method) */
    toJSON(): any;
    /** @internal Helper function that fixes existing objects in this list as managed children */
    [MAKE_REF_MANAGED_PARENT_FN](): void;
}
