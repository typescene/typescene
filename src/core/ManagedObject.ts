import { ManagedCoreEvent, ManagedEvent, ManagedParentChangeEvent } from "./ManagedEvent";
import { ManagedReference } from "./ManagedReference";
import { observe } from "./observe";
import * as util from "./util";

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
  _freeRefLinks[i] = {} as any;
}

/** Next UID to be assigned to a new managed object */
let _nextUID = 16;

/** Next UID to be assigned to a property or managed reference instance */
let _nextRefId = 16;

/** Maximum number of recursive event emissions allowed _per object_ */
const RECURSE_EMIT_LIMIT = 4;

/** Generic constructor type for ManagedObject, matching both parameterless constructors and those with one or more required parameters */
export type ManagedObjectConstructor<TObject extends ManagedObject = ManagedObject> =
  | (new (...args: any[]) => TObject)
  | (new (a: never, b: never, c: never, d: never, e: never, f: never) => TObject);

/** Base class for objects that have their own unique ID, life cycle including active/inactive and destroyed states, and managed references to other instances */
export class ManagedObject {
  /** Add an observer to _all instances_ of this class and derived classes. Alias for the `observe` function/decorator. */
  static observe<T extends ManagedObject>(
    this: ManagedObjectConstructor<T>,
    Observer: { new (instance: T): any }
  ) {
    observe(this, Observer as any);
    return this;
  }

  /** Attach an event handler to be invoked for all events that are emitted on _all instances_ of a class. */
  static handle<T extends ManagedObject>(
    this: ManagedObjectConstructor<T>,
    handler: (this: T, e: ManagedEvent) => void
  ): void;
  /**
   * Attach event handlers for _all instances_ of a derived class. The event name (`ManagedEvent.name` property) is used to find an event handler in given object.
   *
   * @note See also `ManagedObject.observe` for a more advanced way to observe events as well as property changes.
   */
  static handle<T extends ManagedObject>(
    this: ManagedObjectConstructor<T>,
    handlers: { [eventName: string]: (this: T, e: ManagedEvent) => void }
  ): void;
  static handle<T extends ManagedObject>(this: ManagedObjectConstructor<T>, h: any) {
    if ((this as any) === ManagedObject) {
      throw Error("[Object] Cannot add event handler to base class");
    }

    // get the previous prototype and handler on same prototype
    let prevProto: typeof this.prototype;
    let prevHandler: ((this: any, e: ManagedEvent) => void) | undefined;
    if (!Object.prototype.hasOwnProperty.call(this.prototype, util.HIDDEN_EVENT_HANDLER)) {
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
    this.prototype[util.HIDDEN_EVENT_HANDLER] = function(this: any, e: ManagedEvent) {
      prevProto && prevProto[util.HIDDEN_EVENT_HANDLER]
        ? prevProto[util.HIDDEN_EVENT_HANDLER]!.call(this, e)
        : prevHandler && prevHandler.call(this, e);
      try {
        if (typeof h === "function") h.call(this, e);
        else if (h[e.name]) h[e.name].call(this, e);
      } catch (err) {
        util.exceptionHandler(err);
      }
    };
    return this;
  }

  /** @internal Set to the class itself when global preset method has run */
  static CLASS_INIT = ManagedObject;

  /** @internal Add a callback that is invoked by the constructor of this class, the first time an instance is created. The callback always runs only once. If an instance of this class has already been constructed, the callback is invoked immediately and its return value is returned. */
  static addGlobalClassInitializer<T>(f: () => T | void) {
    if (this.CLASS_INIT === this) {
      // already initialized, run function right away
      return f();
    }

    // find previous callback on same prototype
    let prevF: typeof f;
    if (Object.prototype.hasOwnProperty.call(this.prototype, "_class_init")) {
      prevF = this.prototype._class_init;
    }

    // set function on own prototype, which removes itself when called
    this.prototype._class_init = () => {
      if (prevF) return prevF(), f();
      delete this.prototype._class_init;
      this.prototype._class_init(); // see-through
      this.CLASS_INIT = this;
      f();
    };
  }

  /** @internal Method that is overridden by `addGlobalClassInitializer` */
  _class_init() {}

  /** Creates a new managed object instance */
  constructor() {
    let self = this.constructor as typeof ManagedObject;
    if (self.CLASS_INIT !== self) this._class_init();

    Object.defineProperty(this, util.HIDDEN_REF_PROPERTY, {
      value: [],
      writable: false,
      configurable: false,
      enumerable: false,
    });
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
  }

  /** Unique ID of this managed object (read only) */
  readonly managedId = _nextUID++;

  /**
   * The current lifecycle state of this managed object.
   * @note This property is read-only. To change the state of a managed object (i.e. to move its lifecycle between active/inactive and destroyed states), use the `activateManagedAsync`, `deactivateManagedAsync`, and `destroyManagedAsync` methods. If any additional logic is required when moving between states, override the `onManagedStateActivatingAsync`, `onManagedStateActiveAsync`, `onManagedStateDeactivatingAsync`, `onManagedStateInactiveAsync` and/or `onManagedStateDestroyingAsync` methods in any class that derives from `ManagedObject`.
   * @note This property _cannot_ be observed directly. Observer classes (see `observe()`) should use methods such as `onActive` to observe lifecycle state.
   */
  get managedState() {
    return this[util.HIDDEN_STATE_PROPERTY];
  }

  /**
   * Returns the current number of managed references that point to this object
   * @note Observers (see `observe()`) may use an `onReferenceCountChangeAsync` method to observe this value asynchronously.
   */
  protected getReferenceCount() {
    return this[util.HIDDEN_REFCOUNT_PROPERTY];
  }

  /** Returns an array of unique managed objects that contain managed references to this object (see `@managed`, `@managedChild`, `@managedDependency`, and `@compose` decorators) */
  protected getManagedReferrers() {
    let seen: boolean[] = {} as any;
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
   * Returns the managed object that contains a _managed child reference_ that points to this instance (see `@managedChild` and `@compose` decorators).
   * The object itself is never returned, even if it contains a managed child reference that points to itself.
   * @note The reference to the managed parent (but not its events) can be observed (see `observe()`) using an `onManagedParentChange` or `onManagedParentChangeAsync` method on the observer.
   */
  protected getManagedParent(): ManagedObject | undefined;
  /**
   * Returns the managed object that contains a _managed child reference_ that points to this instance (see `@managedChild` decorator). If a class argument is specified, parent references are recursed until a parent of given type is found.
   * The object itself is never returned, even if it contains a managed child reference that points to itself (or if parents recursively reference the object or each other).
   */
  protected getManagedParent<TParent extends ManagedObject>(
    ParentClass: ManagedObjectConstructor<TParent>
  ): TParent | undefined;
  protected getManagedParent(ParentClass?: ManagedObjectConstructor<any>) {
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
          (seen || (seen = {} as any))[parent.managedId] = true;
          parentRef = parent[util.HIDDEN_REF_PROPERTY].parent;
          parent = parentRef && parentRef.a;
          if (parent && seen![parent.managedId]) break;
        }
      }
    }
    return parent && parent !== this ? parent : undefined;
  }

  /**
   * Emit an event. If an event constructor is given, a new instance is created using given constructor arguments (rest parameters). If an event name (string) is given, a new default event instance is created with given name. This method may be overridden in derived classes to use a different default event class.
   * Use the `ManagedEvent.freeze` method to freeze event instances before emitting.
   * See `ManagedObject.handle` and `ManagedObject.observe` (static methods to be used on subclasses of `ManagedObject`) for ways to handle events.
   * @note There is a limit to the number of events that can be emitted recursively; avoid calling this method on the same object from _within_ an event handler.
   */
  emit<TEvent extends ManagedEvent = ManagedEvent, TConstructorArgs extends any[] = any[]>(
    e: TEvent | (new (...args: TConstructorArgs) => TEvent) | string,
    ...constructorArgs: TConstructorArgs
  ) {
    if (typeof e === "string") e = new ManagedEvent(e).freeze() as any;
    if (typeof e === "function") e = new e(...constructorArgs).freeze();
    if (!(e instanceof ManagedEvent)) {
      throw TypeError("[Object] Argument is not a managed event");
    }
    if (this._emitting === undefined) {
      Object.defineProperty(this, "_emitting", {
        enumerable: false,
        writable: true,
        value: 0,
      });
    } else if (this._emitting! > RECURSE_EMIT_LIMIT) {
      throw Error("[Object] Event recursion limit reached");
    }
    let emitError: any;
    try {
      this._emitting = this._emitting! + 1;
      if (this[util.HIDDEN_EVENT_HANDLER]) {
        this[util.HIDDEN_EVENT_HANDLER]!(e);
      }
      this[util.HIDDEN_REF_PROPERTY].forEach(v => {
        let source: ManagedObject | undefined = v && v.a;
        let f = source && v.f;
        if (f) f(source, this, e);
      });
    } catch (err) {
      emitError = err;
    }
    this._emitting!--;
    if (emitError) util.exceptionHandler(emitError);
    return this;
  }

  /**
   * Propagate events from managed child objects that are _referenced_ as properties of this object (see `@managedChild` decorator) by emitting events on this object itself.
   * If a function is specified, the function is used to transform one event to one or more others, possibly including the same event, or stop propagation if the function returns undefined. The function will receive the event itself as its first argument, and the _name of the property_ that references the emitting object as its second argument.
   * The core Active, Inactive, Destroyed, and ManagedParentChange events cannot be propagated.
   * @note Calling this method a second time _replaces_ any existing propagation rule entirely.
   */
  protected propagateChildEvents(
    f?: (
      this: this,
      e: ManagedEvent,
      propertyName: string
    ) => ManagedEvent | ManagedEvent[] | undefined | void
  ): this;
  /**
   * Propagate events from managed child objects that are _referenced_ as properties of this object (see `@managedChild` decorator) by emitting events on this object itself. Only propagated events that extend given event types are propagated.
   * The core Active, Inactive, Destroyed, and ManagedParentChange events cannot be propagated.
   * @note Calling this method a second time _replaces_ any existing propagation rule entirely.
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
      value: (e: ManagedEvent, name: string) => {
        if (emitting === e) return;

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

  /** Activate this managed object (i.e. change state to `ACTIVATING` and then to `ACTIVATED`) */
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

  /** Deactivate this managed object, if it is currently active (i.e. change state to `DEACTIVATING` and then to `DEACTIVATED`) */
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
   * Destroy this managed object (i.e. change state to `DESTROYING` and then to `DESTROYED`, clear all managed references from and to this object, and destroy all managed children)
   * @note Managed child objects are automatically destroyed when their parent's reference (decorated with `@managedChild`) is cleared or changed, or the child object is removed from a managed list or map that is itself a managed child, OR when the parent object itself is destroyed. Managed objects are also automatically destroyed when one or more of their own properties (those decorated with `@managedDependency`) are cleared or changed, or the dependency object itself is destroyed.
   */
  protected async destroyManagedAsync() {
    let n = 3;
    let state: ManagedState;
    while (
      (state = this[util.HIDDEN_STATE_PROPERTY]) === ManagedState.ACTIVE ||
      state === ManagedState.ACTIVATING ||
      state === ManagedState.DEACTIVATING
    ) {
      if (n-- <= 0) throw Error("[Object] Cannot deactivate managed object");
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

  /** Callback invoked when changing state to 'active', to be overridden */
  protected async onManagedStateActivatingAsync() {}

  /** Callback invoked immediately after state has changed to 'active' and before any other state transitions, to be overridden */
  protected async onManagedStateActiveAsync() {}

  /** Callback invoked when changing state to 'inactive', to be overridden */
  protected async onManagedStateDeactivatingAsync() {}

  /** Callback invoked immediately after state has changed to 'inactive' and before any other state transitions, to be overridden */
  protected async onManagedStateInactiveAsync() {}

  /** Callback invoked when changing state to 'destroyed', to be overridden */
  protected async onManagedStateDestroyingAsync() {}

  /** Handle state transitions asynchronously with a way to chain next transitions */
  private _transitionManagedState(
    newState: ManagedState,
    callback: () => undefined | Promise<any>,
    event: ManagedEvent,
    callbackAfter?: () => undefined | Promise<any>
  ) {
    if (!Object.prototype.hasOwnProperty.call(this, "_transition")) {
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
      if (!oldState) throw Error("[Object] Managed object is already destroyed");
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
          rejectResult(Error("[Object] State transition cancelled"));
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

  /** @internal Create or take an existing managed reference and set given values */
  protected static _createRefLink<T extends ManagedObject>(
    source: T,
    target: ManagedObject,
    propId: string,
    handleEvent?: (obj: T, ref: ManagedObject, e: ManagedEvent) => void,
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

  /** @internal Unlink given managed reference; returns true if unlinked, false if argument was not a RefLink instance */
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

  /** @internal Make given RefLink the (new) parent-child link for the referenced object */
  protected static _makeManagedChildRefLink(ref: util.RefLink) {
    let target: ManagedObject = ref.b;
    let targetRefs = target[util.HIDDEN_REF_PROPERTY];
    if (targetRefs[ref.u] === ref) {
      let oldParent = targetRefs.parent;
      if (!(oldParent && oldParent.a === ref.a)) {
        // set new parent reference
        targetRefs.parent = ref;
        if (!oldParent) {
          // make sure all contained objects are child objects
          target[util.MAKE_REF_MANAGED_PARENT_FN]();
        } else {
          // inform old parent that child has moved
          this._discardRefLink(oldParent);
          oldParent.g && oldParent.g(this);
        }
        target.emit(ManagedParentChangeEvent, ref.a);
      }
    }
  }

  /** @internal Returns true if given RefLink is a parent-child link */
  protected static _isManagedChildRefLink(ref: util.RefLink) {
    let target: ManagedObject = ref.b;
    let targetRefs = target[util.HIDDEN_REF_PROPERTY];
    return targetRefs.parent === ref;
  }

  /** @internal Validate that source object is not destroyed, and target reference is either undefined or a managed object (optionally of given type) that is not destroyed */
  protected static _validateReferenceAssignment(
    source: ManagedObject,
    target?: ManagedObject,
    ClassRestriction: ManagedObjectConstructor<any> = ManagedObject
  ) {
    if (target !== undefined) {
      if (!source[util.HIDDEN_STATE_PROPERTY]) {
        throw Error(
          "[Object] Cannot set reference on managed object that is already destroyed"
        );
      }
      if (!(target instanceof ClassRestriction)) {
        throw Error("[Object] Invalid object reference");
      }
      if (!target[util.HIDDEN_STATE_PROPERTY]) {
        throw Error("[Object] Referenced object has been destroyed");
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
      throw Error(
        "[Object] Can only create managed properties on instances of ManagedObject"
      );
    }
    if (Object.getOwnPropertyDescriptor(object, propertyKey)) {
      throw Error(
        "[Object] Cannot turn properties with getters and/or setters into managed references"
      );
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
              target = readonlyRef.target!;
            }
            next && next(target, event, topHandler);
            if (target && eventHandler) eventHandler.call(obj, event);
            return;
          }
          if (readonlyRef && target !== readonlyRef) {
            // do not assign to read only reference (but used by getter initially)
            throw Error("[Object] Property is not writable");
          }
          ManagedObject._validateReferenceAssignment(obj, target);
          let cur = obj[util.HIDDEN_REF_PROPERTY][propId];
          if (cur && target && cur.b === target && !readonlyRef) return;
          if (isDependency && !target) {
            throw Error("[Object] Dependency must point to a managed object: " + name);
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
              (obj, target, e) => {
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
              ManagedObject._makeManagedChildRefLink(ref);
            }
          }
          if (readonlyRef) target = readonlyRef.target!;
          next && next(target, event, topHandler);
        };
      },
      function(this: any) {
        let ref = this[util.HIDDEN_REF_PROPERTY][propId];

        // dereference read-only reference, if any
        if (readonlyRef) {
          if (!ref) {
            // assign reference once ONLY
            // (set bogus link first to avoid recursion)
            ManagedObject._createRefLink(this, readonlyRef, propId);
            this[propertyKey] = readonlyRef;
          }
          return readonlyRef.target;
        }

        // normal getter: return referenced object
        return ref && ref.b;
      }
    );
  }

  /** @internal Value-of conversion method */
  valueOf() {
    return (this as any).value;
  }

  /** @internal To be overridden, to turn existing references into child objects */
  protected [util.MAKE_REF_MANAGED_PARENT_FN]() {}

  /** @internal */
  private readonly [util.HIDDEN_REF_PROPERTY]!: util.RefLinkMap;
  /** @internal */
  private [util.HIDDEN_REFCOUNT_PROPERTY]!: number;
  /** @internal */
  private [util.HIDDEN_STATE_PROPERTY]!: ManagedState;
  /** @internal */
  private [util.HIDDEN_EVENT_HANDLER]: (e: ManagedEvent) => void;
  /** @internal */
  private [util.HIDDEN_CHILD_EVENT_HANDLER]: (e: ManagedEvent, name: string) => void;

  private _emitting?: number;
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
