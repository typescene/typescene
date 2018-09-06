import { ManagedEvent } from "./ManagedEvent";
import { ManagedObject, ManagedObjectConstructor } from "./ManagedObject";
import { MAKE_REF_MANAGED_PARENT_FN } from "./util";
/** Represents an ordered list of (unique) managed objects */
export declare class ManagedList<T extends ManagedObject = ManagedObject> extends ManagedObject {
    /** Creates a new list of objects */
    constructor(...objects: T[]);
    /** Propagate events from objects in this list by emitting them on the list object itself, optionally restricted to given types of events */
    propagateEvents(...types: Array<ManagedEvent | {
        new (...args: any[]): ManagedEvent;
    }>): this;
    /**
     * Ensure that objects in the list are all instances of given class (or a sub class), and restrict newly added objects in the list to instances of given class. Given class must be a sub class of `ManagedObject`.
     * @exception Throws an error if any object in the list is not an instance of given class, or of a sub class.
     */
    restrict<T extends ManagedObject>(classType: ManagedObjectConstructor<T>): ManagedList<T>;
    private _managedClassRestriction?;
    /** The number of objects in this list */
    readonly count: number;
    private _managedCount;
    /**
     * Add one or more objects (or managed lists or maps) to the end of this list.
     * @exception Throws an error if an object is already included in the list. Throws an error if `restrict()` was applied and given object(s) are not of the correct type.
     */
    add(...targets: T[]): this;
    /**
     * Insert an object (or managed list or map) in this list.
     * @param target
     *  the object to be added to the list
     * @param before
     *  the object before which the target object should be inserted; if undefined, the object is appended to the end of the list
     * @exception Throws an error if the object is already included in the list, if the given object before which to insert is not found in the list, or if the list itself has been destroyed (see `ManagedObject.managedState`). Also throws an error if `restrict()` was applied and given object(s) are not of the correct type.
     */
    insert(target: T, before?: T): this;
    /**
     * Remove given object from this list.
     * @note No error is thrown if the object was not included in the list at all.
     */
    remove(target: T): this;
    /**
     * Replace the objects in this list with the objects in given array or other list, using a series of calls to `remove()` and `insert()` and/or reordering objects that are already in the list.
     * @exception Throws an error if one of the objects cannot be inserted.
     */
    replace(objects: Iterable<T>): this;
    /** Remove all objects from this list */
    clear(): this;
    /** Returns true if given object is currently included in this list */
    includes(target: T): boolean;
    /** Returns the first object in the list, or undefined if the list is empty */
    first(): T | undefined;
    /** Returns the last object in the list, or undefined if the list is empty */
    last(): T | undefined;
    /**
     * Returns the object at given position in the list (0 based)
     * @exception Throws an error if the index is not within the bounds of this list.
     * @note This operation is very inefficient on longer lists, do not recurse over all the objects in a list using this method; see `ManagedList.forEach` instead, or use a `for (let object of ...)` statement.
     */
    get(index: number): T;
    /**
     * Returns the object with given ID (see `ManagedObject.managedId`).
     * @exception Throws an error if the object is not included in this list.
     */
    find(managedId: number): T;
    /**
     * Returns an array with given number of objects, counting from the start of the list or from the position of given object.
     * Returns an empty array if an object is specified but not found in the list.
     * @param n
     *  the number of objects to include in the result
     * @param startingFrom
     *  the first object to be included in the result (optional)
     */
    take(n: number, startingFrom?: T): T[];
    /**
     * Returns an array with given number of objects taken _from the end_ of the list, or the same number of objects _up to and including_ given object.
     * Returns an empty array if an object is specified but not found in the list.
     * @param n
     *  the number of objects to include in the result
     * @param endingAt
     *  the last object to be included in the result (optional)
     */
    takeLast(n: number, endingAt?: T): T[];
    /** Implementation of `take` and `takeLast` methods */
    private _take;
    /** Returns the index of given object in this list (0 based), or -1 if the component is not included in the list at all */
    indexOf(target: T): number;
    /** Returns an array with all objects currently in this list */
    toArray(): T[];
    /** Returns an array representation of this list (alias of `toArray` method) */
    toJSON(): any;
    /**
     * Iterates over the objects in this list and invokes given callback for each object (alternative to for...of statement)
     * @param callback
     *  the function to be called, with a single object as the only argument
     * @note The behavior of this method is undefined if objects are inserted immediately after the current object, or if objects beyond the current object are removed by the callback function. Removing the _current_ object or any previous objects during the iteration is safe and will not disrupt the control flow.
     */
    forEach(callback: (target: T) => void): void;
    /**
     * Iterates over the objects in this list and invokes given callback for each object, then returns an array with all callback return values.
     * @param callback
     *  the function to be called, with a single object as the only argument
     * @note The behavior of this method is undefined if the list is changed by the callback function.
     */
    map<TResult>(callback: (target: T) => TResult): TResult[];
    /** Returns an array with the values of given property for all objects in the list. */
    pluck<K extends keyof T>(propertyName: K): Array<T[K]>;
    /**
     * Iterator symbol property to use managed list with 'for...of' statement
     * @note The behavior of the iterator is undefined if objects are inserted immediately after the current object, or if objects beyond the current object are removed. Removing the _current_ object or any previous objects during the iteration is safe and will not disrupt the control flow.
     */
    [Symbol.iterator](): Iterator<T>;
    /** @internal Helper function that fixes existing objects in this list as managed children */
    [MAKE_REF_MANAGED_PARENT_FN](): void;
}
