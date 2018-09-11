import { ManagedChangeEvent, ManagedEvent, ManagedObjectAddedEvent, ManagedObjectRemovedEvent } from "./ManagedEvent";
import { ManagedObject, ManagedObjectConstructor } from "./ManagedObject";
import * as util from "./util";

/** Represents an unordered list that maps keys (strings) to managed objects */
export class ManagedMap<T extends ManagedObject = ManagedObject> extends ManagedObject {
    /** Creates an empty map */
    constructor() {
        super();
    }

    /** Propagate events from objects in this map by emitting them on the map object itself, optionally restricted to given types of events */
    propagateEvents(...types: Array<ManagedEvent | { new(...args: any[]): ManagedEvent }>) {
        return this.propagateChildEvents(...types);
    }

    /**
     * Ensure that objects in this map are all instances of given class (or a sub class), and restrict newly mapped objects to instances of given class. Given class must be a sub class of `ManagedObject`.
     * @exception Throws an error if any object is not an instance of given class, or of a sub class.
     */
    restrict<T extends ManagedObject>(classType: ManagedObjectConstructor<T>): ManagedMap<T> {
        if (this.objects().some(o => !(o instanceof classType))) {
            throw Error("[Map] Existing object(s) are not of given type");
        }
        this._managedClassRestriction = classType;
        return this as any;
    }
    private _managedClassRestriction?: ManagedObjectConstructor<any>;

    /** Returns the current object mapped to given key, if any */
    get(key: string): T | undefined {
        if (!this[util.HIDDEN_STATE_PROPERTY]) return undefined;
        let ref = this[util.HIDDEN_REF_PROPERTY][util.MANAGED_MAP_REF_PREFIX + String(key)];
        return ref && ref.b;
    }

    /** Returns true if any object is currently mapped to given key */
    has(key: string) {
        if (!this[util.HIDDEN_STATE_PROPERTY]) return false;
        return !!this[util.HIDDEN_REF_PROPERTY][util.MANAGED_MAP_REF_PREFIX + String(key)];
    }

    /**
     * Remove the mapping for given key.
     * @note Does not throw an error if given key was not mapped to any object at all.
     */
    unset(key: string) {
        // unlink existing reference, if any
        let cur = this[util.HIDDEN_REF_PROPERTY][util.MANAGED_MAP_REF_PREFIX + String(key)];
        let target = cur && cur.b;
        if (cur && ManagedObject._discardRefLink(cur)) {
            this.emit(ManagedObjectRemovedEvent, this, target, key);
        }
    }

    /**
     * Map given object (or managed list or map) to given key, removing the existing mapping between the same key and any other object, if any.
     * Objects may be mapped to multiple keys at the same time, unless the `ManagedMap` instance itself is a child object of a managed object or list (see `@managedChild` decorator).
     * @param key
     *  The key to be mapped to given object
     * @param target
     *  The managed object (or list, or map) to be mapped to given key
     * @exception Throws an error if the map itself has been destroyed (see `ManagedObject.managedState`).
     */
    set(key: string, target?: T) {
        if (!this[util.HIDDEN_STATE_PROPERTY]) throw Error("[Map] Cannot add objects to a destroyed map");
        let refs = this[util.HIDDEN_REF_PROPERTY];
        key = String(key);

        // check given value first
        ManagedObject._validateReferenceAssignment(this, target, this._managedClassRestriction);
        if (!target) return this.unset(key);
        
        // unlink existing reference, if any
        let propId = util.MANAGED_MAP_REF_PREFIX + key;
        let cur = refs[propId];
        if (cur) {
            if (target && cur.b === target) return;
            ManagedObject._discardRefLink(cur);
        }

        // create new reference and update target count
        let ref = ManagedObject._createRefLink(this, target, propId, (_obj, _target, e) => {
            if (this[util.HIDDEN_CHILD_EVENT_HANDLER] &&
                ManagedObject._isManagedChildRefLink(ref)) {
                // propagate the event if needed
                this[util.HIDDEN_CHILD_EVENT_HANDLER]!(e, "");
            }
        }, (target) => {
            // handle target moved/destroyed
            this.emit(ManagedObjectRemovedEvent, this, target, key);
        });

        // set/move parent-child link if needed, and emit change event
        if (refs.parent) ManagedObject._makeManagedChildRefLink(ref);
        this.emit(ManagedObjectAddedEvent, this, target, key);
        return this;
    }

    /** Remove given object from this map (same as calling `unset(...)` on all keys that refer to given object) */
    remove(target: T) {
        let refs = this[util.HIDDEN_REF_PROPERTY];
        let removed: boolean | undefined;
        let key: string | undefined;
        for (let propId in refs) {
            if (refs[propId] && refs[propId]!.b === target) {
                if (ManagedObject._discardRefLink(refs[propId]!)) {
                    key = propId.slice(1);
                    removed = true;
                }
            }
        }
        if (removed) this.emit(ManagedObjectRemovedEvent, this, target, key);
        return this;
    }

    /** Remove all objects from this map */
    clear() {
        let refs = this[util.HIDDEN_REF_PROPERTY];
        let removed: boolean | undefined;
        for (let propId in refs) {
            if (propId[0] === util.MANAGED_MAP_REF_PREFIX) {
                let ref = refs[propId];
                if (ManagedObject._discardRefLink(ref)) {
                    removed = true;
                }
            }
        }
        if (removed) this.emit(ManagedChangeEvent.CHANGE);
        return this;
    }

    /** Returns a list of all (unique) objects in this map */
    objects() {
        let result: T[] = [];
        if (!this[util.HIDDEN_STATE_PROPERTY]) return result;
        let seen: boolean[] = {} as any;
        let refs = this[util.HIDDEN_REF_PROPERTY];
        for (let propId in refs) {
            if (propId[0] === util.MANAGED_MAP_REF_PREFIX) {
                let target: T = refs[propId] && refs[propId]!.b;
                if (target && !seen[target.managedId]) {
                    seen[target.managedId] = true;
                    result.push(target);
                }
            }
        }
        return result;
    }

    /** Returns a list of all keys in this map */
    keys() {
        let result: string[] = [];
        let refs = this[util.HIDDEN_REF_PROPERTY];
        if (!refs) return result;
        for (let propId in refs) {
            if (propId[0] === util.MANAGED_MAP_REF_PREFIX && refs[propId]) {
                result.push(propId.slice(1));
            }
        }
        return result;
    }

    /** Returns true if given object is currently contained in this map */
    includes(target: T) {
        // check if map is included as reference source on target
        // (not the other way around)
        if (target instanceof ManagedObject) {
            return target[util.HIDDEN_REF_PROPERTY].some(ref =>
                ref.a === this && ref.p[0] === util.MANAGED_MAP_REF_PREFIX);
        }
        return false;
    }

    /** Returns an object with properties for all keys and objects in this map */
    toObject() {
        let result: { [index: string]: T } = {};
        if (!this[util.HIDDEN_STATE_PROPERTY]) return result;
        let refs = this[util.HIDDEN_REF_PROPERTY];
        for (let propId in refs) {
            if (propId[0] === util.MANAGED_MAP_REF_PREFIX && refs[propId]) {
                result[propId.slice(1)] = refs[propId]!.b;
            }
        }
        return result;
    }

    /** Returns an object representation of this map (alias of `toObject` method) */
    toJSON(): any {
        return this.toObject();
    }

    /** @internal Helper function that fixes existing objects in this list as managed children */
    [util.MAKE_REF_MANAGED_PARENT_FN]() {
        let refs = this[util.HIDDEN_REF_PROPERTY];
        for (let propId in refs) {
            if (refs[propId] && refs[propId]!.a === this) {
                ManagedObject._makeManagedChildRefLink(refs[propId]!);
            }
        }
    }
}
