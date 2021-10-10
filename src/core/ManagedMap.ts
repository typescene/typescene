import { err, ERROR } from "../errors";
import {
  ManagedEvent,
  ManagedObjectAddedEvent,
  ManagedObjectRemovedEvent,
} from "./ManagedEvent";
import { ManagedObject, ManagedObjectConstructor } from "./ManagedObject";
import { HIDDEN } from "./util";
import * as util from "./util";

/** Represents an _unordered_ list of managed objects that are indexed using unique key strings */
export class ManagedMap<T extends ManagedObject = ManagedObject> extends ManagedObject {
  /** Create an empty map */
  constructor() {
    super();
  }

  /**
   * Propagate events from all objects in this map by emitting the same events on the map object itself.
   * If a function is specified, the function can be used to transform one event to one or more others, or stop propagation if the function returns undefined. The function is called with the event itself as its only argument.
   * @note Calling this method a second time _replaces_ the current propagation rule/function.
   */
  propagateEvents(
    f?: (this: this, e: ManagedEvent) => ManagedEvent | ManagedEvent[] | undefined | void
  ): this;
  /**
   * Propagate events from all objects in this map by emitting the same events on the map object itself.
   * If one or more event classes are specified, only events that extend given event types are propagated.
   * @note Calling this method a second time _replaces_ the current propagation rule/function.
   */
  propagateEvents(
    ...types: Array<ManagedEvent | { new (...args: any[]): ManagedEvent }>
  ): this;
  propagateEvents(...types: any[]) {
    util.propagateEvents(this, false, ...types);
    return this;
  }

  /**
   * Ensure that objects in this map are all instances of given class (or a sub class), and restrict newly mapped objects to instances of given class. Given class must be a sub class of `ManagedObject`.
   * @exception Throws an error if any object is not an instance of given class, or of a sub class.
   */
  restrict<T extends ManagedObject>(classType: ManagedObjectConstructor<T>): ManagedMap<T> {
    if (this.objects().some(o => !(o instanceof classType))) {
      throw err(ERROR.Map_Type);
    }
    this._managedClassRestriction = classType;
    return this as any;
  }
  private _managedClassRestriction?: ManagedObjectConstructor<any>;

  /** Returns the current object mapped to given key, if any */
  get(key: string): T | undefined {
    if (!this[HIDDEN.STATE_PROPERTY]) return undefined;
    let ref = this[HIDDEN.REF_PROPERTY][HIDDEN.MANAGED_MAP_REF_PREFIX + String(key)];
    return ref && ref.b;
  }

  /** Returns true if any object is currently mapped to given key */
  has(key: string) {
    if (!this[HIDDEN.STATE_PROPERTY]) return false;
    return !!this[HIDDEN.REF_PROPERTY][HIDDEN.MANAGED_MAP_REF_PREFIX + String(key)];
  }

  /**
   * Remove the mapping for given key.
   * @note Does not throw an error if given key was not mapped to any object at all.
   */
  unset(key: string) {
    // unlink existing reference, if any
    let cur = this[HIDDEN.REF_PROPERTY][HIDDEN.MANAGED_MAP_REF_PREFIX + String(key)];
    let target = cur && cur.b;
    if (cur && ManagedObject._discardRefLink(cur)) {
      if (this.managedState) {
        this.emit(ManagedObjectRemovedEvent, this, target, key);
      }
    }
    return this;
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
    if (!this[HIDDEN.STATE_PROPERTY]) {
      throw err(ERROR.Map_Destroyed);
    }
    let refs = this[HIDDEN.REF_PROPERTY];
    key = String(key);

    // check given value first
    ManagedObject._validateReferenceAssignment(this, target, this._managedClassRestriction);
    if (!target) return this.unset(key);

    // unlink existing reference, if any
    let propId = HIDDEN.MANAGED_MAP_REF_PREFIX + key;
    let cur = refs[propId];
    if (cur) {
      if (target && cur.b === target) return this;
      ManagedObject._discardRefLink(cur);
    }

    // create new reference and update target count
    let ref = ManagedObject._createRefLink(
      this,
      target,
      propId,
      e => {
        if (this[HIDDEN.NONCHILD_EVENT_HANDLER]) {
          this[HIDDEN.NONCHILD_EVENT_HANDLER]!(e, "");
        } else if (
          this[HIDDEN.CHILD_EVENT_HANDLER] &&
          ManagedObject._isManagedChildRefLink(ref)
        ) {
          this[HIDDEN.CHILD_EVENT_HANDLER]!(e, "");
        }
      },
      target => {
        // handle target moved/destroyed
        if (this.managedState) {
          this.emit(ManagedObjectRemovedEvent, this, target, key);
        }
      }
    );

    // set/move parent-child link if needed, and emit change event
    if (refs.parent && !this._isWeakRef) {
      ManagedObject._makeManagedChildRefLink(ref);
    }
    this.emit(ManagedObjectAddedEvent, this, target, key);
    return this;
  }

  /** Remove given object from this map (same as calling `unset(...)` on all keys that refer to given object) */
  remove(target: T) {
    let refs = this[HIDDEN.REF_PROPERTY];
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
    if (removed && this.managedState) {
      this.emit(ManagedObjectRemovedEvent, this, target, key);
    }
    return this;
  }

  /** Remove all objects from this map */
  clear() {
    let refs = this[HIDDEN.REF_PROPERTY];
    let removed: boolean | undefined;
    for (let propId in refs) {
      if (propId[0] === HIDDEN.MANAGED_MAP_REF_PREFIX) {
        let ref = refs[propId];
        if (ManagedObject._discardRefLink(ref)) {
          removed = true;
        }
      }
    }
    if (removed) this.emitChange();
    return this;
  }

  /** Returns a list of all (unique) objects in this map */
  objects() {
    let result: T[] = [];
    if (!this[HIDDEN.STATE_PROPERTY]) return result;
    let seen: boolean[] = Object.create(null);
    let refs = this[HIDDEN.REF_PROPERTY];
    for (let propId in refs) {
      if (propId[0] === HIDDEN.MANAGED_MAP_REF_PREFIX) {
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
    let refs = this[HIDDEN.REF_PROPERTY];
    if (!refs) return result;
    for (let propId in refs) {
      if (propId[0] === HIDDEN.MANAGED_MAP_REF_PREFIX && refs[propId]) {
        result.push(propId.slice(1));
      }
    }
    return result;
  }

  /**
   * Iterates over the keys in this list and invokes given callback for each key and object.
   * @param callback
   *  the function to be called, with a key and a single object as the only argument
   * @note The behavior of this method is undefined if objects are inserted by the callback function.
   */
  forEach(callback: (key: string, target: T) => void) {
    let refs = this[HIDDEN.REF_PROPERTY];
    if (!refs) return;
    for (let propId in refs) {
      if (propId[0] === HIDDEN.MANAGED_MAP_REF_PREFIX && refs[propId]) {
        let key = propId.slice(1);
        let target: T = refs[propId] && refs[propId]!.b;
        if (target) callback(key, target);
      }
    }
  }

  /** Returns true if given object is currently contained in this map */
  includes(target: T) {
    // check if map is included as reference source on target
    // (not the other way around)
    if (target instanceof ManagedObject) {
      return target[HIDDEN.REF_PROPERTY].some(
        ref => ref.a === this && ref.p[0] === HIDDEN.MANAGED_MAP_REF_PREFIX
      );
    }
    return false;
  }

  /** Returns an object with properties for all keys and objects in this map */
  toObject() {
    let result: { [index: string]: T } = Object.create(null);
    if (!this[HIDDEN.STATE_PROPERTY]) return result;
    let refs = this[HIDDEN.REF_PROPERTY];
    for (let propId in refs) {
      if (propId[0] === HIDDEN.MANAGED_MAP_REF_PREFIX && refs[propId]) {
        result[propId.slice(1)] = refs[propId]!.b;
      }
    }
    return result;
  }

  /** Returns an object representation of this map (alias of `toObject` method) */
  toJSON(): any {
    return this.toObject();
  }

  /** Stop newly referenced objects from becoming child objects _even if_ this `ManagedMap` instance itself is held through a child reference (by a parent object); this can be used to automatically dereference objects when the parent object is destroyed */
  weakRef() {
    this._isWeakRef = true;
    return this;
  }

  /** @internal Helper function that fixes existing objects in this list as managed children */
  [HIDDEN.MAKE_REF_MANAGED_PARENT_FN]() {
    if (this._isWeakRef) return;
    let refs = this[HIDDEN.REF_PROPERTY];
    for (let propId in refs) {
      if (refs[propId] && refs[propId]!.a === this) {
        ManagedObject._makeManagedChildRefLink(refs[propId]!);
      }
    }
  }

  /** @internal */
  private [HIDDEN.NONCHILD_EVENT_HANDLER]: (e: ManagedEvent, name: string) => void;

  private _isWeakRef?: boolean;
}
