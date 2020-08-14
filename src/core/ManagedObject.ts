import { err, ERROR } from "../errors";
import {
  ManagedCoreEvent,
  ManagedEvent,
  ManagedParentChangeEvent,
  ManagedChangeEvent,
  CHANGE,
} from "./ManagedEvent";
import { ManagedReference } from "./ManagedReference";
import { observe } from "./observe";
import * as util from "./util";

/** Alias for Object.prototype.hasOwnProperty */
const _hOP = Object.prototype.hasOwnProperty;

/** Enumeration of possible states for a managed object */
export enum ManagedState {
  /** State for a managed object that has been destroyed */
  DESTROYED = 0,

  /** State for a managed object that has just been created */
  CREATED,

  /** State for a managed object that is activating asynchronously */
  ACTIVATING,

  /** State for a managed object that is currently active */
  ACTIVE,

  /** State for a managed object that is deactivating asynchronously */
  DEACTIVATING,

  /** State for a managed object that is currently inactive */
  INACTIVE,

  /** State for a managed object that is being destroyed asynchronously */
  DESTROYING,
}

/** Number of free RefLink instances to keep around */
const MAX_FREE_REFLINKS = 1000;

/** Stack of currently unused managed references, ready for reuse */
let _freeRefLinks: util.RefLink[] = [];
for (let i = 0; i < MAX_FREE_REFLINKS >> 2; i++) {
  _freeRefLinks[i] = {
    u: 0,
    a: undefined,
    b: undefined,
    p: "",
    j: undefined,
    k: undefined,
    f: undefined,
    g: undefined,
  };
}

/** Next UID to be assigned to a new managed object */
let _nextUID = 16;

/** Next UID to be assigned to a property or managed reference instance */
let _nextRefId = 16;

/** Maximum number of recursive event emissions allowed _per object_ */
const RECURSE_EMIT_LIMIT = 4;

/** Generic constructor type for ManagedObject classes */
export type ManagedObjectConstructor<TObject extends ManagedObject = ManagedObject> = new (
  ...args: never[]
) => TObject;

/** Base class for objects that have their own unique ID, life cycle including active/inactive and destroyed states, and managed references to other instances */
export class ManagedObject {
  /**
   * Add an observer to _all instances_ of this class and derived classes. The observer class is instantiated for each instance of this (observed) class, and its methods are automatically called when an event or property change occurs on the observed instance.
   * @note Observer classes may be nested inside of the observed class, which provides access to private and protected methods; see `@observe`
   */
  static addObserver<T extends ManagedObject>(
    this: ManagedObjectConstructor<T>,
    Observer: { new (instance: T): any }
  ) {
    observe(this, () => Observer);
    return this;
  }

  /** Attach an event handler function, to be invoked for all events that are emitted _on all instances_ of this class _and_ derived classes. Given function is invoked in the context (`this` variable) of the emitting object, with the emitted event as a single parameter. */
  static addEventHandler<T extends ManagedObject>(
    this: ManagedObjectConstructor<T>,
    handler: (this: T, e: ManagedEvent) => void
  ) {
    if ((this as any) === ManagedObject) {
      throw err(ERROR.Object_Base);
    }

    // get the previous prototype and handler on same prototype
    let prevProto: typeof this.prototype;
    let prevHandler: ((this: any, e: ManagedEvent) => void) | undefined;
    if (!_hOP.call(this.prototype, util.HIDDEN_EVENT_HANDLER)) {
      // add a handler to this prototype
      prevProto = Object.getPrototypeOf(this.prototype);
      Object.defineProperty(this.prototype, util.HIDDEN_EVENT_HANDLER, {
        enumerable: false,
        configurable: false,
        writable: true,
      });
    } else {
      // chain with existing handler
      prevHandler = this.prototype[util.HIDDEN_EVENT_HANDLER];
    }

    // add the event handler function
    this.prototype[util.HIDDEN_EVENT_HANDLER] = function (this: any, e: ManagedEvent) {
      prevProto && prevProto[util.HIDDEN_EVENT_HANDLER]
        ? prevProto[util.HIDDEN_EVENT_HANDLER]!.call(this, e)
        : prevHandler && prevHandler.call(this, e);
      try {
        handler.call(this, e);
      } catch (err) {
        util.exceptionHandler(err);
      }
    };
    return this;
  }

  /** @internal Method that can be overridden on the class _prototype_ to be invoked for every new instance */
  private ["_@@"]() {}

  /** @internal Override the method that is run for every new instance, calling the previous method first, if any */
  static _addInitializer(f: () => void) {
    let fp = _hOP.call(this.prototype, "_@@") && this.prototype["_@@"];
    if (fp) {
      this.prototype["_@@"] = function () {
        (fp as Function).call(this);
        f.call(this);
      };
    } else {
      let up = Object.getPrototypeOf(this.prototype);
      this.prototype["_@@"] = function () {
        let fpp = up["_@@"];
        fpp && fpp.call(this);
        f.call(this);
      };
    }
  }

  /** Creates a new managed object instance */
  constructor() {
    // override getter/setter properties to be non-enumerable
    this[util.HIDDEN_STATE_PROPERTY] = ManagedState.CREATED;
    Object.defineProperty(this, util.HIDDEN_STATE_PROPERTY, {
      ...Object.getOwnPropertyDescriptor(this, util.HIDDEN_STATE_PROPERTY),
      writable: true,
      enumerable: false,
    });
    this[util.HIDDEN_REFCOUNT_PROPERTY] = 0;
    Object.defineProperty(this, util.HIDDEN_REFCOUNT_PROPERTY, {
      ...Object.getOwnPropertyDescriptor(this, util.HIDDEN_REFCOUNT_PROPERTY),
      enumerable: false,
    });

    // intialize reflinks property to be non-enumerable as well
    Object.defineProperty(this, util.HIDDEN_REF_PROPERTY, {
      value: [],
      writable: false,
      configurable: false,
      enumerable: false,
    });

    // run callbacks, if any
    this["_@@"]();
  }

  /** Unique ID of this managed object (read only) */
  readonly managedId = _nextUID++;

  /**
   * The current lifecycle state of this managed object.
   * @note This property is read-only. To change the state of a managed object (i.e. to move its lifecycle between active/inactive and destroyed states), use the `activateManagedAsync`, `deactivateManagedAsync`, and `destroyManagedAsync` methods. If any additional logic is required when moving between states, override the `onManagedStateActivatingAsync`, `onManagedStateActiveAsync`, `onManagedStateDeactivatingAsync`, `onManagedStateInactiveAsync` and/or `onManagedStateDestroyingAsync` methods in any class that derives from `ManagedObject`.
   * @note This property _cannot_ be observed directly. Observer classes (see `addObserver`) should use methods such as `onActive` to observe lifecycle state.
   */
  get managedState() {
    return this[util.HIDDEN_STATE_PROPERTY];
  }

  /**
   * Returns the current number of managed references that point to this object
   * @note Observers (see `addObserver`) may use an `onReferenceCountChangeAsync` method to observe this value asynchronously.
   */
  protected getReferenceCount() {
    return this[util.HIDDEN_REFCOUNT_PROPERTY];
  }

  /** Returns an array of unique managed objects that contain managed references to this object (see `@managed`, `@managedChild`, and `@managedDependency` decorators) */
  protected getManagedReferrers() {
    let seen: boolean[] = Object.create(null);
    let result: ManagedObject[] = [];
    this[util.HIDDEN_REF_PROPERTY].forEach(reflink => {
      let object: ManagedObject = reflink.a;
      if (object.managedState && !seen[object.managedId]) {
        result.push(object);
      }
    });
    return result;
  }

  /**
   * Returns the managed object that contains a _managed child reference_ that points to this instance, if any (see `@managedChild`).
   * If a class argument is specified, parent references are recursed until a parent of given type is found.
   * The object itself is never returned, even if it contains a managed child reference that points to itself.
   * @note The reference to the managed parent (but not its events) can be observed (see `addObserver`) using an `onManagedParentChange` or `onManagedParentChangeAsync` method on the observer.
   */
  protected getManagedParent<TParent extends ManagedObject = ManagedObject>(
    ParentClass?: ManagedObjectConstructor<TParent>
  ): TParent | undefined {
    let ref = this[util.HIDDEN_REF_PROPERTY].parent;
    let parent: ManagedObject | undefined = ref && ref.a;

    // if class reference given, check parents' references
    if (ParentClass && parent && !(parent instanceof <any>ParentClass)) {
      let parentRef = parent[util.HIDDEN_REF_PROPERTY].parent;
      parent = parentRef && parentRef.a;

      // check again (unrolled)
      if (parent && !(parent instanceof <any>ParentClass)) {
        parentRef = parent[util.HIDDEN_REF_PROPERTY].parent;
        parent = parentRef && parentRef.a;

        // continue in a loop, but keep track of objects already seen
        let seen: boolean[] | undefined;
        while (parent && !(parent instanceof <any>ParentClass)) {
          (seen || (seen = Object.create(null)))[parent.managedId] = true;
          parentRef = parent[util.HIDDEN_REF_PROPERTY].parent;
          parent = parentRef && parentRef.a;
          if (parent && seen![parent.managedId]) break;
        }
      }
    }
    return parent && parent !== this ? (parent as TParent) : undefined;
  }

  /**
   * Emit an event. If an event constructor is given, a new instance is created using given constructor arguments (rest parameters). If an event name (string) is given, a new plain event is created with given name.
   * Use the `ManagedEvent.freeze` method to freeze event instances before emitting.
   * See `ManagedObject.addEventHandler` and `ManagedObject.addObserver` (static methods to be used on subclasses of `ManagedObject`) for ways to handle events.
   * @note There is a limit to the number of events that can be emitted recursively; avoid calling this method on the same object from _within_ an event handler.
   * @exception Throws an error if the current state is 'destroyed'. Destroyed managed objects cannot emit events.
   */
  emit<TEvent extends ManagedEvent = ManagedEvent, TConstructorArgs extends any[] = any[]>(
    e: TEvent | (new (...args: TConstructorArgs) => TEvent) | string,
    ...constructorArgs: TConstructorArgs
  ) {
    if (!this[util.HIDDEN_STATE_PROPERTY] && e !== ManagedCoreEvent.DESTROYED) {
      throw err(ERROR.Object_Destroyed);
    }
    if (typeof e === "string") e = new ManagedEvent(e).freeze() as any;
    if (typeof e === "function") e = new e(...constructorArgs).freeze();
    if (!(e instanceof ManagedEvent)) {
      throw err(ERROR.Object_NotEvent);
    }
    if (this._emitting === undefined) {
      Object.defineProperty(this, "_emitting", {
        enumerable: false,
        writable: true,
        value: 0,
      });
    } else if (this._emitting! > RECURSE_EMIT_LIMIT) {
      throw err(ERROR.Object_Recursion);
    }
    let emitError: any;
    try {
      this._emitting = this._emitting! + 1;
      if (this[util.HIDDEN_EVENT_HANDLER]) {
        this[util.HIDDEN_EVENT_HANDLER]!(e);
      }
      this[util.HIDDEN_REF_PROPERTY].forEach(v => {
        if (v && v.a && v.f) v.f.call(undefined, e, v.a, this);
      });
    } catch (err) {
      emitError = err;
    }
    this._emitting!--;
    if (emitError) util.exceptionHandler(emitError);
    return this;
  }

  /** Emit a change event (see `ManagedChangeEvent`), to signal that the internal state of the emitting object has changed. The `name` parameter is optional; if left out, the `CHANGE` event (instance) is emitted directly. */
  emitChange(name?: string) {
    if (name === undefined) this.emit(CHANGE);
    else this.emit(ManagedChangeEvent, name);
  }

  /**
   * Propagate events from managed child objects that are _referenced_ as properties of this object (see `@managedChild` decorator) by emitting the same events on this object itself.
   * If a function is specified, the function can be used to transform one event to one or more others, or stop propagation if the function returns undefined. The function is called with the event itself as its first argument, and the name of the property that references the emitting object as its second argument.
   * Core event such as `ManagedCoreEvent.ACTIVE` cannot be propagated in this way.
   * Events are no longer propagated after the object enters the 'destroyed' state.
   * @note Calling this method a second time _replaces_ the current propagation rule/function.
   */
  protected propagateChildEvents(
    f?: (
      this: this,
      e: ManagedEvent,
      propertyName: string
    ) => ManagedEvent | ManagedEvent[] | undefined | void
  ): this;
  /**
   * Propagate events from managed child objects that are _referenced_ as properties of this object (see `@managedChild` decorator) by emitting the same events on this object itself. Only propagated events that extend given event types are propagated.
   * Core event such as `ManagedCoreEvent.ACTIVE` will not be propagated in this way.
   * Events are no longer propagated after the object enters the 'destroyed' state.
   * @note Calling this method a second time _replaces_ the current propagation rule/function.
   */
  protected propagateChildEvents(
    ...types: Array<ManagedEvent | { new (...args: any[]): ManagedEvent }>
  ): this;
  protected propagateChildEvents(...types: any[]) {
    let firstIsFunction =
      types[0] &&
      typeof types[0] === "function" &&
      !(types[0].prototype instanceof ManagedEvent) &&
      types[0] !== ManagedEvent;
    let f:
      | ((this: this, e: ManagedEvent, name: string) => any)
      | undefined = firstIsFunction ? types[0] : undefined;
    let emitting: ManagedEvent | undefined;
    Object.defineProperty(this, util.HIDDEN_CHILD_EVENT_HANDLER, {
      configurable: true,
      enumerable: false,
      value: function (e: ManagedEvent, name: string) {
        if (emitting === e || !this[util.HIDDEN_STATE_PROPERTY]) return;

        // limit by type, or run handler function
        if (!f) {
          if (
            types.length &&
            !types.some((t: any) => e === t || (typeof t === "function" && e instanceof t))
          )
            return;
          if (!ManagedCoreEvent.isCoreEvent(e)) {
            this.emit((emitting = e));
            emitting = undefined;
          }
        } else {
          let eventOrEvents = f.call(this, e, name);
          if (Array.isArray(eventOrEvents)) {
            eventOrEvents.forEach(propagated => {
              if (!ManagedCoreEvent.isCoreEvent(propagated)) {
                this.emit((emitting = propagated));
              }
            });
          } else if (eventOrEvents) {
            this.emit((emitting = eventOrEvents));
          }
          emitting = undefined;
        }
      },
    });
    return this;
  }

  /** Activate this object (i.e. change state to `ManagedState.ACTIVATING` and then to `ManagedState.ACTIVATED`); the `onManagedStateActivatingAsync` and `onManagedStateActiveAsync` methods are called in this process */
  protected async activateManagedAsync() {
    return this._transitionManagedState(
      ManagedState.ACTIVE,
      async () => {
        this[util.HIDDEN_STATE_PROPERTY] = ManagedState.ACTIVATING;
        await this.onManagedStateActivatingAsync();
      },
      ManagedCoreEvent.ACTIVE,
      this.onManagedStateActiveAsync
    );
  }

  /** Deactivate this object, if it is currently active (i.e. change state to `ManagedState.DEACTIVATING` and then to `ManagedState.DEACTIVATED`); the `onManagedStateDeactivatingAsync` and `onManagedStateInactiveAsync` methods are called in this process */
  protected async deactivateManagedAsync() {
    await this._transitionManagedState(
      ManagedState.INACTIVE,
      async () => {
        this[util.HIDDEN_STATE_PROPERTY] = ManagedState.DEACTIVATING;
        await this.onManagedStateDeactivatingAsync();
      },
      ManagedCoreEvent.INACTIVE,
      this.onManagedStateInactiveAsync
    );
  }

  /**
   * Destroy this managed object (i.e. change state to `ManagedState.DESTROYING` and then to `ManagedState.DESTROYED`, clear all managed references from and to this object, and destroy all managed children); the `onManagedStateDestroyingAsync` method is called in the process
   * @note Managed child objects are automatically destroyed when [1] their parent's reference (decorated with `@managedChild`) is cleared or otherwise changed, or [2] the child object is removed from a managed list or map that is itself a managed child, or [3] when the parent object itself is destroyed.
   * @note Managed objects are also automatically destroyed when one or more of their own properties decorated with `@managedDependency` are cleared or changed, or the dependency object itself is destroyed.
   */
  protected async destroyManagedAsync() {
    let n = 3;
    let state: ManagedState;
    while (
      (state = this[util.HIDDEN_STATE_PROPERTY]) === ManagedState.ACTIVE ||
      state === ManagedState.ACTIVATING ||
      state === ManagedState.DEACTIVATING
    ) {
      if (n-- <= 0) throw err(ERROR.Object_CannotDeactivate);
      await this.deactivateManagedAsync();
    }
    if (!state) return;
    await this._transitionManagedState(
      ManagedState.DESTROYED,
      async () => {
        this[util.HIDDEN_STATE_PROPERTY] = ManagedState.DESTROYING;
        await this.onManagedStateDestroyingAsync();

        // remove all references, keep RefLink instances for reuse
        let refs = this[util.HIDDEN_REF_PROPERTY];
        delete refs.parent;
        delete refs.head;
        delete refs.tail;

        let g: Array<(self: this) => void> = [];
        for (let p in refs) {
          if (refs[p]) {
            if (refs[p]!.g) g.push(refs[p]!.g!);
            ManagedObject._discardRefLink(refs[p]);
          }
        }

        // set status early and call destruction handlers
        this[util.HIDDEN_STATE_PROPERTY] = ManagedState.DESTROYED;
        g.forEach(fn => fn(this));
      },
      ManagedCoreEvent.DESTROYED
    );
  }

  /** Callback invoked when changing state to 'active', can be overridden to perform any actions before activating */
  protected async onManagedStateActivatingAsync() {}

  /** Callback invoked immediately after state has changed to 'active' and before any other state transitions, can be overridden */
  protected async onManagedStateActiveAsync() {}

  /** Callback invoked when changing state to 'inactive', can be overridden to perform any actions before deactivating */
  protected async onManagedStateDeactivatingAsync() {}

  /** Callback invoked immediately after state has changed to 'inactive' and before any other state transitions, can be overridden */
  protected async onManagedStateInactiveAsync() {}

  /** Callback invoked when changing state to 'destroyed', can be overridden to perform any actions first */
  protected async onManagedStateDestroyingAsync() {}

  /** Implementation for all state transition methods: handle state transitions asynchronously with a way to chain next transitions */
  private _transitionManagedState(
    newState: ManagedState,
    callback: () => undefined | Promise<any>,
    event: ManagedEvent,
    callbackAfter?: () => undefined | Promise<any>
  ) {
    if (!_hOP.call(this, "_transition")) {
      Object.defineProperty(this, "_transition", {
        configurable: false,
        writable: true,
        enumerable: false,
      });
    }

    /** Helper function to go ahead with the actual transition */
    let doTransitionAsync = async (t: ManagedStateTransition) => {
      let oldState = this[util.HIDDEN_STATE_PROPERTY];
      if (newState === oldState) return;
      if (!oldState) throw err(ERROR.Object_Destroyed);
      let changedState: boolean | undefined;
      this._transition = t;
      try {
        await callback.call(this);
        this[util.HIDDEN_STATE_PROPERTY] = newState;
        changedState = true;
        this.emit(event);
        callbackAfter && callbackAfter.call(this);
      } finally {
        // change back to state from before calling callback if needed
        if (!changedState) this[util.HIDDEN_STATE_PROPERTY] = oldState;
        this._transition = t.pending || undefined;
      }
    };

    /** Helper function to make a transition object, representing the transition and making it cancellable in case a new transition gets scheduled in place of this one */
    let makeTransition = (prev: Promise<any>) => {
      let rejectResult: (err: any) => void;
      let rejected: boolean | undefined;

      // return an object that represents the transition which can be cancelled
      let result: ManagedStateTransition = {
        state: newState,
        p: new Promise((resolve, reject) => {
          // wait for previous promise, then make this current
          rejectResult = reject;
          let go = () => {
            if (rejected) return;
            resolve(doTransitionAsync(result));
          };
          prev.then(go, go);
        }),
        reject() {
          rejected = true;
          rejectResult(err(ERROR.Object_StateCancelled));
        },
      };
      return result;
    };

    // check if there is an ongoing transition already
    if (this._transition) {
      // check if there is already a next pending transition
      if (this._transition.pending) {
        // check if *same* transition is already pending
        if (this._transition.pending.state === newState) {
          return this._transition.pending.p;
        }

        // cancel existing pending transaction
        this._transition.pending.reject();
        this._transition.pending = undefined;
      }

      // check if *same* transition is already ongoing
      if (this._transition.state === newState) {
        return this._transition.p;
      }

      // schedule transition after the ongoing one
      return (this._transition.pending = makeTransition(this._transition.p)).p;
    } else {
      // schedule transition right away (but still NOT sync!)
      return (this._transition = makeTransition(Promise.resolve())).p;
    }
  }

  /** @internal Create a new reference link object (or take one from the cache) and set given values, to indicate that the source object references given target */
  protected static _createRefLink<T extends ManagedObject>(
    source: T,
    target: ManagedObject,
    propId: string,
    handleEvent?: (e: ManagedEvent, obj: T, ref: ManagedObject) => void,
    handleDestroy?: (obj: T) => void
  ) {
    let ref: util.RefLink;
    let targetRefs = target[util.HIDDEN_REF_PROPERTY];
    if (_freeRefLinks.length) {
      // reuse existing instance
      ref = _freeRefLinks.pop()!;
      ref.a = source;
      ref.b = target;
      ref.p = propId;
      ref.f = handleEvent;
      ref.g = handleDestroy;
      ref.u = targetRefs.length;
      ref.j = ref.k = undefined;
    } else {
      // create new object
      ref = {
        u: targetRefs.length,
        a: source,
        b: target,
        p: propId,
        f: handleEvent,
        g: handleDestroy,
        j: undefined,
        k: undefined,
      };
    }
    targetRefs.push(ref);
    target[util.HIDDEN_REFCOUNT_PROPERTY]++;
    source[util.HIDDEN_REF_PROPERTY][propId] = ref;
    return ref;
  }

  /** @internal Unlink given managed reference link object; returns true if unlinked, false if argument was not a RefLink instance */
  protected static _discardRefLink(ref?: util.RefLink) {
    if (!ref || !(ref.u >= 0) || !ref.a || !ref.b) return false;
    let sourceRefs = ref.a && ref.a[util.HIDDEN_REF_PROPERTY];
    if (sourceRefs && sourceRefs[ref.p] === ref) {
      if (ref.p[0] === util.MANAGED_LIST_REF_PREFIX) {
        // fix prev/next and head/tail refs in ManagedList, if applicable
        if (sourceRefs.head === ref) sourceRefs.head = ref.k;
        if (sourceRefs.tail === ref) sourceRefs.tail = ref.j;
        if (ref.j && ref.j.k === ref) ref.j.k = ref.k;
        if (ref.k && ref.k.j === ref) ref.k.j = ref.j;
        delete sourceRefs[ref.p];
      } else {
        // remove source property value
        sourceRefs[ref.p] = undefined;
      }
    }
    let targetRefs = ref.b && ref.b[util.HIDDEN_REF_PROPERTY];
    if (targetRefs && targetRefs[ref.u] === ref) {
      // remove back reference and update reference count
      ref.b[util.HIDDEN_REFCOUNT_PROPERTY]--;
      if (ref.u >= 0 && ref.u === targetRefs.length - 1) {
        let i = targetRefs.length - 2;
        while (i >= 0 && targetRefs[i] === undefined) i--;
        targetRefs.length = i + 1;
      } else {
        delete targetRefs[ref.u];
      }

      // if this was a parent-child link, destroy the child object
      if (targetRefs.parent === ref && ref.b !== ref.a) {
        targetRefs.parent = undefined;
        (ref.b as ManagedObject).destroyManagedAsync().catch(util.exceptionHandler);
      }
    }
    if (_freeRefLinks.length < MAX_FREE_REFLINKS) _freeRefLinks.push(ref);
    return true;
  }

  /** @internal Make given reference link object the (new) parent-child link for the referenced object */
  protected static _makeManagedChildRefLink(ref: util.RefLink, propertyName?: string) {
    let target: ManagedObject = ref.b;
    let targetRefs = target[util.HIDDEN_REF_PROPERTY];
    if (targetRefs[ref.u] === ref) {
      let oldParent = targetRefs.parent;
      if (!(oldParent && oldParent.a === ref.a)) {
        // set new parent reference
        targetRefs.parent = ref;
        if (!oldParent) {
          // make sure all contained objects are child objects
          // (for lists and maps)
          target[util.MAKE_REF_MANAGED_PARENT_FN]();
        } else {
          // inform old parent that child has moved
          this._discardRefLink(oldParent);
          oldParent.g && oldParent.g(this);
        }
        if (target[util.HIDDEN_STATE_PROPERTY]) {
          target.emit(ManagedParentChangeEvent, ref.a, propertyName);
        }
      }
    }
  }

  /** @internal Returns true if given managed reference object is a parent-child link */
  protected static _isManagedChildRefLink(ref: util.RefLink) {
    let target: ManagedObject = ref.b;
    let targetRefs = target[util.HIDDEN_REF_PROPERTY];
    return targetRefs.parent === ref;
  }

  /** @internal Validate in preparation for a reference assignment: source object should not be destroyed, and target reference should be either undefined or a managed object (optionally of given type) that is not destroyed, and possibly an instance of given class, if any */
  protected static _validateReferenceAssignment(
    source: ManagedObject,
    target?: ManagedObject,
    ClassRestriction: ManagedObjectConstructor<any> = ManagedObject
  ) {
    if (target !== undefined) {
      if (!source[util.HIDDEN_STATE_PROPERTY]) {
        throw err(ERROR.Object_RefDestroyed);
      }
      if (!(target instanceof ClassRestriction)) {
        throw err(ERROR.Object_InvalidRef);
      }
      if (!target[util.HIDDEN_STATE_PROPERTY]) {
        throw err(ERROR.Object_RefDestroyed);
      }
    }
  }

  /**
   * @internal Amend given property (on object or prototype) to turn it into a managed reference property.
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
   * @param eventHandler
   *  an optional handler that is called when an event occurs on the currently referenced object
   * @param readonlyRef
   *  optionally, a read-only managed reference object; when provided, the property will not be writable, and reading it results in the _target_ of the reference object
   * @returns the newly applied property descriptor
   */
  static createManagedReferenceProperty<T extends ManagedObject>(
    object: T,
    propertyKey: keyof T,
    isChildReference?: boolean,
    isDependency?: boolean,
    preAssignHandler?: (this: T, target: ManagedObject) => void,
    eventHandler?: (this: T, event: ManagedEvent) => void,
    readonlyRef?: ManagedReference
  ) {
    if (!(object instanceof ManagedObject)) {
      throw err(ERROR.Object_PropNotManaged);
    }
    if (Object.getOwnPropertyDescriptor(object, propertyKey)) {
      throw err(ERROR.Object_PropGetSet);
    }

    // (re)define property on prototype
    let propId = util.PROPERTY_ID_PREFIX + _nextRefId++;
    return util.defineChainableProperty(
      object,
      propertyKey,
      false,
      (obj, name, next) => {
        return (target: ManagedObject, event, topHandler) => {
          if (event) {
            if (readonlyRef) {
              // use reference target instead of reference itself
              if (target !== readonlyRef) return;
              target = readonlyRef.get()!;
            }
            next && next(target, event, topHandler);
            if (target && eventHandler) eventHandler.call(obj, event);
            return;
          }
          if (readonlyRef && target !== readonlyRef) {
            // do not assign to read only reference (but used by getter initially)
            throw err(ERROR.Object_NotWritable);
          }
          ManagedObject._validateReferenceAssignment(obj, target);
          let cur = obj[util.HIDDEN_REF_PROPERTY][propId];
          if (cur && target && cur.b === target && !readonlyRef) return;
          if (isDependency && !target) {
            throw err(ERROR.Object_InvalidDep, name);
          }
          if (target && preAssignHandler) preAssignHandler.call(obj, target);

          // unlink existing reference, if any (also destroys child if needed)
          ManagedObject._discardRefLink(cur);

          // create new reference and update target count
          if (target) {
            let ref = ManagedObject._createRefLink(
              obj,
              target,
              propId,
              (e, obj, target) => {
                // propagate event to other handler(s)
                topHandler(target, e, topHandler);
                if (isChildReference && obj[util.HIDDEN_CHILD_EVENT_HANDLER]) {
                  obj[util.HIDDEN_CHILD_EVENT_HANDLER]!(e, propertyKey as string);
                }
              },
              () => {
                // handle target moved/destroyed
                if (!target.managedState && isDependency) {
                  // destroy dependent referrer immediately
                  delete (obj as any)[name];
                  obj.destroyManagedAsync().catch(util.exceptionHandler);
                } else {
                  // try to set property to undefined
                  try {
                    (obj as any)[name] = undefined;
                  } catch {} // do not care about exceptions
                }
              }
            );
            if (isChildReference) {
              // set (new) parent-child link on the target object
              ManagedObject._makeManagedChildRefLink(ref, propertyKey as string);
            }
          }
          if (readonlyRef) target = readonlyRef.get()!;
          next && next(target, event, topHandler);
        };
      },
      function (this: any) {
        let ref = this[util.HIDDEN_REF_PROPERTY][propId];

        // dereference read-only reference, if any
        if (readonlyRef) {
          if (!ref) {
            // assign reference once ONLY
            // (set bogus link first to avoid recursion)
            ManagedObject._createRefLink(this, readonlyRef, propId);
            this[propertyKey] = readonlyRef;
          }
          return readonlyRef.get();
        }

        // normal getter: return referenced object
        return ref && ref.b;
      }
    );
  }

  /** @internal To be overridden, to turn existing references into child objects (i.e. for lists and maps) */
  protected [util.MAKE_REF_MANAGED_PARENT_FN]() {}

  /** @internal Reference link object map */
  private readonly [util.HIDDEN_REF_PROPERTY]!: util.RefLinkMap;
  /** @internal Reference count */
  private [util.HIDDEN_REFCOUNT_PROPERTY]!: number;
  /** @internal Current state value */
  private [util.HIDDEN_STATE_PROPERTY]!: ManagedState;
  /** @internal Chained event handler(s) */
  private [util.HIDDEN_EVENT_HANDLER]: (e: ManagedEvent) => void;
  /** @internal Chained event handler(s) */
  private [util.HIDDEN_CHILD_EVENT_HANDLER]: (e: ManagedEvent, name: string) => void;

  /** True if currently emitting an event */
  private _emitting?: number;

  /** The current transition being handled, if any */
  private _transition?: ManagedStateTransition;
}

/** Represents an ongoing state transition, and the next transition after it */
interface ManagedStateTransition {
  /** A promise for the transition */
  p: Promise<any>;

  /** The intended state after this transition */
  state: ManagedState;

  /** Function to reject this state if it has not yet been completed */
  reject(): void;

  /** Next pending state transition (can be only one after the current transition); if this gets replaced, the `reject` function is called on the previous pending transition to cancel it */
  pending?: ManagedStateTransition;
}
