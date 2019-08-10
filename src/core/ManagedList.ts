import { ManagedEvent, ManagedListChangeEvent, ManagedObjectAddedEvent, ManagedObjectRemovedEvent } from "./ManagedEvent";
import { ManagedObject, ManagedObjectConstructor } from "./ManagedObject";
import { shadowObservable } from "./observe";
import * as util from "./util";

// really simple shim for Symbol.iterator in older browsers, only good for ManagedList below
if (typeof Symbol !== "function") {
    if (typeof window === "object")
        (window as any).Symbol = { iterator: "Symbol.iterator_shim_" + Math.random() };
    else
        throw Error("Symbol not supported");
}

/** Represents a list of managed objects. The objects in the list are _ordered_ and _unique_, ensuring that there are no gaps or repeated list items. */
export class ManagedList<T extends ManagedObject = ManagedObject> extends ManagedObject {
    /** Creates a new list of objects */
    constructor(...objects: T[]) {
        super();
        this["^count"] = 0;
        Object.defineProperty(this, "_managedCount", {
            ...Object.getOwnPropertyDescriptor(this, "_managedCount"),
            enumerable: false
        });
        for (let t of objects) this.insert(t);
    }

    /** Propagate events from all objects in this list by emitting them on the list object itself, optionally restricted to given types of events or a filter function */
    propagateEvents(f?: ((this: this, e: ManagedEvent) => ManagedEvent | ManagedEvent[] | undefined | void)): this;
    /** Propagate events from all objects in this list by emitting them on the list object itself, optionally restricted to given types of events or a filter function */
    propagateEvents(...types: Array<ManagedEvent | { new(...args: any[]): ManagedEvent }>): this;
    propagateEvents() {
        this.propagateChildEvents.apply(this, arguments as any);
        Object.defineProperty(this, util.HIDDEN_NONCHILD_EVENT_HANDLER, {
            configurable: true,
            enumerable: false,
            value: this[util.HIDDEN_CHILD_EVENT_HANDLER]
        });
        return this;
    }

    /**
     * Ensure that objects in the list are all instances of given class (or a sub class), and restrict newly added objects in the list to instances of given class. Given class must be a sub class of `ManagedObject`.
     * @exception Throws an error if any object in the list is not an instance of given class, or of a sub class.
     */
    restrict<T extends ManagedObject>(classType: ManagedObjectConstructor<T>): ManagedList<T> {
        if (this.toArray().some(o => !(o instanceof classType))) {
            throw Error("[List] Existing object(s) are not of given type");
        }
        this._managedClassRestriction = classType;
        return this as any;
    }
    private _managedClassRestriction?: ManagedObjectConstructor<any>;

    /** The number of objects in this list */
    @shadowObservable("^count")
    get count() {
        // check .head first since it is deleted first when the list itself is destroyed
        return this[util.HIDDEN_REF_PROPERTY].head ? this["^count"] : 0;
    }
    private ["^count"] = 0;

    /**
     * Add one or more objects (or managed lists or maps) to the end of this list.
     * @exception Throws an error if an object is already included in the list. Throws an error if `restrict()` was applied and given object(s) are not of the correct type.
     */
    add(...targets: T[]) {
        for (let t of targets) this.insert(t);
        return this;
    }

    /**
     * Insert an object (or managed list or map) into this list.
     * @param target
     *  the object to be added to the list
     * @param before
     *  the object before which the target object should be inserted; if undefined, the object is appended to the end of the list
     * @exception Throws an error if the object is already included in the list, if the given object before which to insert is not found in the list, or if the list itself has been destroyed (see `ManagedObject.managedState`). Also throws an error if `restrict()` was applied and given object(s) are not of the correct type.
     */
    insert(target: T, before?: T) {
        if (!this[util.HIDDEN_STATE_PROPERTY]) throw Error("[List] Cannot add objects to a destroyed list");
        let refs = this[util.HIDDEN_REF_PROPERTY];

        // check given value first
        ManagedObject._validateReferenceAssignment(this, target, this._managedClassRestriction);
        if (target === undefined) throw ReferenceError();
        if (this.includes(target)) throw Error("[List] Cannot insert object that is already in this list");
        let beforeRef = before && refs[util.MANAGED_LIST_REF_PREFIX + before.managedId];
        if (before && (!beforeRef || beforeRef.b !== before)) {
            throw Error("[List] Object not found");
        }

        // create new reference and update target count
        let propId = util.MANAGED_LIST_REF_PREFIX + target.managedId;
        let ref = ManagedObject._createRefLink(this, target, propId, (_obj, _target, e) => {
            if (this[util.HIDDEN_NONCHILD_EVENT_HANDLER]) {
                this[util.HIDDEN_NONCHILD_EVENT_HANDLER]!(e, "");
            }
            else if (this[util.HIDDEN_CHILD_EVENT_HANDLER] &&
                ManagedObject._isManagedChildRefLink(ref)) {
                this[util.HIDDEN_CHILD_EVENT_HANDLER]!(e, "");
            }
        }, (target) => {
            // handle target moved/destroyed
            this["^count"]--;
            this.emit(ManagedObjectRemovedEvent, this, target);
        });

        // fix prev/next and head/tail references
        if (beforeRef) {
            if (refs.head === beforeRef) refs.head = ref;
            if (!!(ref.j = beforeRef.j)) ref.j!.k = ref;
            ref.k = beforeRef;
            beforeRef.j = ref;
        }
        else if (refs.tail) {
            // add after current tail
            refs.tail.k = ref;
            ref.j = refs.tail;
            ref.k = undefined;
            refs.tail = ref;
        }
        else {
            // add first reference
            refs.head = refs.tail = ref;
        }
        this["^count"]++;

        // set/move parent-child link if needed, and emit change event
        if (refs.parent && !this._isWeakRef) {
            ManagedObject._makeManagedChildRefLink(ref);
        }
        this.emit(ManagedObjectAddedEvent, this, target);
        return this;
    }

    /**
     * Remove given object from this list.
     * @note No error is thrown if the object was not included in the list at all.
     */
    remove(target: T) {
        if (!(target instanceof ManagedObject)) throw TypeError();
        let ref = (target instanceof ManagedObject) &&
            this[util.HIDDEN_REF_PROPERTY][util.MANAGED_LIST_REF_PREFIX + target.managedId];
        if (ref && ref.b === target) {
            if (ManagedObject._discardRefLink(ref)) {
                this["^count"]--;
                this.emit(ManagedObjectRemovedEvent, this, target);
            }
        }
        return this;
    }

    /**
     * Remove objects from given target _until_ (but not including) second argument, and optionally insert given objects in their place. Returns the objects that were removed.
     * @note If `stop` is undefined, all objects after and including `target` are removed. If `target` is undefined, the objects are added to the back of the list.
     * @exception Throws an error if an object is already included in the list. Throws an error if `restrict()` was applied and given object(s) are not of the correct type.
     */
    splice(target?: T, stop?: T, ...objects: T[]): T[];
    /**
     * Remove given object and following objects up to given number of objects, and optionally insert given objects in their place. Returns the objects that were removed.
     * @note If `removeCount` is undefined, all objects after and including `target` are removed. If `removeCount` is 0 or negative, no objects are removed at all, and given objects are inserted _before_ `target`. If `target` is undefined, the objects are added to the back of the list.
     * @exception Throws an error if an object is already included in the list. Throws an error if `restrict()` was applied and given object(s) are not of the correct type.
     */
    splice(target?: T, removeCount?: number, ...objects: T[]): T[];
    splice(target?: T, stop?: number | T, ...objects: T[]) {
        if (target !== undefined && !(target instanceof ManagedObject)) throw TypeError();
        let result: T[] = [];
        let removeCount: number | undefined;
        if (typeof stop === "number") removeCount = stop;
        while (target && target !== stop && !(removeCount!-- < 1)) {
            // remove target and move ahead to next object
            let ref = (target instanceof ManagedObject) &&
                this[util.HIDDEN_REF_PROPERTY][util.MANAGED_LIST_REF_PREFIX + target.managedId];
            let next = ref && ref.k && ref.k.b;
            if (ref && ref.b === target) {
                result.push(target);
                if (ManagedObject._discardRefLink(ref)) {
                    this["^count"]--;
                    this.emit(ManagedObjectRemovedEvent, this, target);
                }
            }
            target = next;
        }

        // insert given objects one by one before current target,
        // this is not the most performant but guarantees consistency
        for (let object of objects) {
            this.insert(object, target);
        }
        return result;
    }

    /**
     * Replace the objects in this list with the objects in given array or other list, using a series of calls to `remove()` and `insert()` and/or reordering objects that are already in the list.
     * @exception Throws an error if one of the objects cannot be inserted.
     */
    replace(objects: Iterable<T>) {
        // keep track of all operations before they are executed
        let refs = this[util.HIDDEN_REF_PROPERTY];
        let inserts: Array<() => void> = [];
        let addInsertBefore = (object: T, before?: T) =>
            inserts.unshift(() => this.insert(object, before));
        let removes: Array<() => void> = [];
        let addRemove = (object: T) => removes.push(() => this.remove(object));
        let moves: Array<() => void> = [];
        let moved: boolean | undefined;
        let addMoveBefore = (object: T, before?: T) => moves.unshift(() => {
            let ref = refs[util.MANAGED_LIST_REF_PREFIX + object.managedId];
            if (!ref) return;
            let beforeRef = before && refs[util.MANAGED_LIST_REF_PREFIX + before.managedId];
            if (ref === beforeRef || ref.k === beforeRef) return;
            moved = true;
            if (refs.head === ref) refs.head = ref.k;
            if (refs.tail === ref) refs.tail = ref.j;
            if (ref.j) ref.j.k = ref.k;
            if (ref.k) ref.k.j = ref.j;
            ref.k = beforeRef;
            if (!beforeRef) {
                ref.j = refs.tail;
                if (ref.j) ref.j.k = ref;
            }
            else {
                ref.j = beforeRef.j;
                if (beforeRef.j) beforeRef.j.k = ref;
                beforeRef.j = ref;
            }
            if (!ref.j) refs.head = ref;
            if (!ref.k) refs.tail = ref;
        });

        // go through the new list and figure out what needs to happen
        let seen: boolean[] = {} as any;
        let pendingAdds: ((nextIncluded?: T) => void)[] = [];
        for (let object of objects) {
            if (object === undefined) continue;
            if (object instanceof ManagedObject) seen[object.managedId] = true;
            if (this.includes(object)) {
                pendingAdds.unshift(addMoveBefore.bind(this, object));
                while (pendingAdds.length > 1) pendingAdds.pop()!(object);
            }
            else {
                pendingAdds.push(addInsertBefore.bind(this, object));
            }
        }
        while (pendingAdds.length) pendingAdds.pop()!(undefined);
        let removeRef = this[util.HIDDEN_REF_PROPERTY].head;
        while (removeRef) {
            if (!seen[removeRef.b.managedId]) addRemove(removeRef.b);
            removeRef = removeRef.k;
        }

        // process all changes one by one, keeping the list consistent
        for (let f of removes) f();
        for (let f of moves) f();
        if (moved) this.emit(ManagedListChangeEvent, undefined, this);
        for (let f of inserts) f();
        return this;
    }

    /** Remove all objects from this list */
    clear() {
        // use an array to remove all current objects: not very efficient
        // but safest way to keep the list consistent if an event handler
        // adds or removes another object
        let objects = this.toArray();
        for (let target of objects) this.remove(target);
        return this;
    }

    /** Returns true if given object is currently included in this list */
    includes(target: T) {
        let ref = (target instanceof ManagedObject) &&
            this[util.HIDDEN_REF_PROPERTY][util.MANAGED_LIST_REF_PREFIX + target.managedId];
        return !!ref && ref.b === target;
    }

    /** Returns the first object in the list, or undefined if the list is empty */
    first(): T | undefined {
        let ref = this[util.HIDDEN_REF_PROPERTY].head;
        return ref && ref.b;
    }

    /** Returns the last object in the list, or undefined if the list is empty */
    last(): T | undefined {
        let ref = this[util.HIDDEN_REF_PROPERTY].tail;
        return ref && ref.b;
    }

    /**
     * Returns the object at given position in the list (0 based)
     * @exception Throws an error if the index is not within the bounds of this list.
     * @note This operation is very inefficient on longer lists, do not recurse over all the objects in a list using this method; see `ManagedList.forEach` instead, or use a `for (let object of ...)` statement.
     */
    get(index: number) {
        if (this[util.HIDDEN_STATE_PROPERTY] && index >= 0) {
            let ref = this[util.HIDDEN_REF_PROPERTY].head;
            for (let i = index; ref && i > 0; i--) ref = ref.k;
            if (ref && ref.b) return ref.b as T;
        }
        throw RangeError("[List] Index out of bounds: " + index);
    }

    /**
     * Returns the object with given ID (see `ManagedObject.managedId`).
     * @exception Throws an error if the object is not included in this list.
     */
    find(managedId: number): T {
        let ref = this[util.HIDDEN_REF_PROPERTY][util.MANAGED_LIST_REF_PREFIX + managedId];
        if (!ref || ref.b.managedId !== managedId) {
            throw Error("[List] Object not found")
        }
        return ref.b;
    }

    /**
     * Returns an array with given number of objects, counting from the start of the list or from the position of given object.
     * Returns an empty array if an object is specified but not found in the list.
     * @param n
     *  the number of objects to include in the result
     * @param startingFrom
     *  the first object to be included in the result (optional)
     */
    take(n: number, startingFrom?: T) {
        return this._take(n, startingFrom);
    }

    /**
     * Returns an array with given number of objects taken _from the end_ of the list, or the same number of objects _up to and including_ given object.
     * Returns an empty array if an object is specified but not found in the list.
     * @param n
     *  the number of objects to include in the result
     * @param endingAt
     *  the last object to be included in the result (optional)
     */
    takeLast(n: number, endingAt?: T) {
        return this._take(n, endingAt, true);
    }

    /** Implementation of `take` and `takeLast` methods */
    private _take(n: number, target?: T, reverse?: boolean) {
        let result: Array<T> = [];
        let ref: util.RefLink | undefined;
        if (!this[util.HIDDEN_STATE_PROPERTY]) return result;
        if (target && this.includes(target)) {
            ref = this[util.HIDDEN_REF_PROPERTY][util.MANAGED_LIST_REF_PREFIX + target.managedId];
        }
        else {
            ref = this[util.HIDDEN_REF_PROPERTY][reverse ? "tail" : "head"];
        }
        while (ref && n-- > 0) {
            result[reverse ? "unshift" : "push"](ref.b as T);
            ref = reverse ? ref.j : ref.k;
        }
        return result;
    }

    /** Returns the index of given object in this list (0 based), or -1 if the component is not included in the list at all */
    indexOf(target: T) {
        if (!this[util.HIDDEN_STATE_PROPERTY]) return -1;
        let ref = this[util.HIDDEN_REF_PROPERTY].head;
        for (let i = 0; ref; i++, ref = ref.k) {
            if (ref.b === target) return i;
        }
        return -1;
    }

    /** Returns an array with all objects currently in this list */
    toArray() {
        if (!this[util.HIDDEN_STATE_PROPERTY]) return [];
        let result = new Array<T>(this.count);
        let i = 0;
        let ref = this[util.HIDDEN_REF_PROPERTY].head;
        while (ref) {
            result[i++] = ref.b as T;
            ref = ref.k;
        }
        return result;
    }

    /** Returns an array representation of this list (alias of `toArray` method) */
    toJSON(): any {
        return this.toArray();
    }

    /** Returns true if given callback function returns a truthy value for at least one of the objects in this list */
    some(callback: (target: T) => any) {
        for (let target of this) if (callback(target)) return true;
        return false;
    }

    /** Returns true if given callback function returns a truthy value for every object in this list (or if the list is empty) */
    every(callback: (target: T) => any) {
        for (let target of this) if (!callback(target)) return false;
        return true;
    }

    /**
     * Iterates over the objects in this list and invokes given callback for each object (alternative to for...of statement)
     * @param callback
     *  the function to be called, with a single object as the only argument
     * @note The behavior of this method is undefined if objects are inserted immediately after the current object, or if objects beyond the current object are removed by the callback function. Removing the _current_ object or any previous objects during the iteration is safe and will not disrupt the control flow.
     */
    forEach(callback: (target: T) => void) {
        for (let target of this) callback(target);
    }

    /**
     * Iterates over the objects in this list and invokes given callback for each object, then returns an array with all callback return values.
     * @param callback
     *  the function to be called, with a single object as the only argument
     * @note The behavior of this method is undefined if the list is changed by the callback function.
     */
    map<TResult>(callback: (target: T) => TResult): TResult[] {
        let result: TResult[] = [];
        for (let target of this) result.push(callback(target));
        return result;
    }

    /** Returns an array with the values of given property for all objects in the list. */
    pluck<K extends keyof T>(propertyName: K): Array<T[K]> {
        if (!this[util.HIDDEN_STATE_PROPERTY]) return [];
        let result = new Array(this.count);
        let i = 0;
        let ref = this[util.HIDDEN_REF_PROPERTY].head;
        while (ref) {
            result[i++] = (ref.b as T)[propertyName];
            ref = ref.k;
        }
        return result;
    }

    /**
     * Iterator symbol property to use managed list with 'for...of' statement
     * @note The behavior of the iterator is undefined if objects are inserted immediately after the current object, or if objects beyond the current object are removed. Removing the _current_ object or any previous objects during the iteration is safe and will not disrupt the control flow.
     */
    [Symbol.iterator](): Iterator<T> {
        let refs = this[util.HIDDEN_REF_PROPERTY];
        let nextRef = this[util.HIDDEN_REF_PROPERTY].head;
        let nextObject = nextRef ? nextRef.b : 0;
        return {
            next(): IteratorResult<T> {
                // find current object and check if done
                let value = nextObject as T;
                if (!value || refs[nextRef!.p] !== nextRef) {
                    return { done: true } as any;
                }

                // find next object in the list already
                nextRef = nextRef!.k;
                nextObject = nextRef ? nextRef.b : 0;

                // return next result
                return { value, done: false };
            }
        };
    }

    /** Stop newly referenced objects from becoming child objects even if this `ManagedList` instance itself is held through a child reference (by a parent object); this can be used to automatically dereference list items when the parent object is destroyed */
    weakRef() {
        this._isWeakRef = true;
        return this;
    }

    /** @internal Helper function that fixes existing objects in this list as managed children */
    [util.MAKE_REF_MANAGED_PARENT_FN]() {
        if (this._isWeakRef) return;
        let refs = this[util.HIDDEN_REF_PROPERTY];
        if (refs.head) {
            let refsToFix: util.RefLink[] = [];
            for (let childRef = refs.head; childRef; childRef = childRef.k!) {
                refsToFix.push(childRef);
            }
            for (let childRef of refsToFix) {
                if (refs[childRef.p] !== childRef) continue;
                ManagedObject._makeManagedChildRefLink(childRef);
            }
        }
    }

    /** @internal */
    private [util.HIDDEN_NONCHILD_EVENT_HANDLER]?: (e: ManagedEvent, name: string) => void;

    private _isWeakRef?: boolean;
}
