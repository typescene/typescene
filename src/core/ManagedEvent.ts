import { ManagedList } from "./ManagedList";
import { ManagedMap } from "./ManagedMap";
import { ManagedObject } from "./ManagedObject";

/**
 * Event that can be emitted on a managed object, component, list/map, or reference, and can be handled by observers or by objects that reference the emitting object.
 */
export class ManagedEvent {
  /**
   * Create a new event with given name
   * @note Event instances may be frozen and reused for better performance. See `ManagedEvent.freeze`
   */
  constructor(name = "") {
    this.name = name;
  }

  /** Identifier for the type of this event */
  readonly name: string;

  /** Freeze this object so that its properties cannot be modified, and the event can be _reused_ to improve performance */
  freeze() {
    if (Object.freeze) Object.freeze(this);
    return this as Readonly<this>;
  }
}

/** Core event that is _not propagated_ by default (see `ManagedObject.propagateChildEvents`) */
export class ManagedCoreEvent extends ManagedEvent {
  /** Returns true if given event is a core event */
  static isCoreEvent(event: ManagedEvent): event is ManagedCoreEvent {
    return !!(event as ManagedCoreEvent)._coreEventMarker;
  }

  /** Core event flag, used for duck typing by static method `isCoreEvent` */
  private readonly _coreEventMarker = true;
}

export namespace ManagedCoreEvent {
  /** Event that is emitted for all managed objects after activation */
  export const ACTIVE = new ManagedCoreEvent("Active").freeze();

  /** Event that is emitted for all managed objects after deactivation */
  export const INACTIVE = new ManagedCoreEvent("Inactive").freeze();

  /** Event that is emitted for all managed objects after they are destroyed
   * @note Handlers on objects that referenced the destroyed object will be unable to access the destroyed object through their own managed properties, since the value would already be set to `undefined` */
  export const DESTROYED = new ManagedCoreEvent("Destroyed").freeze();
}

/** Event that is emitted when a reference to a managed object is assigned to a managed child reference property (i.e. a property decorated with the `@managedChild` decorator); the child object emits this event, with `parent` set to the _new_ parent object, and `propertyName` set to the property name (only if the child object is _directly_ assigned to a property of the parent object) */
export class ManagedParentChangeEvent extends ManagedCoreEvent {
  constructor(parent: ManagedObject, propertyName?: string) {
    super("ManagedParentChange");
    this.parent = parent;
    this.propertyName = propertyName;
  }

  /** The new parent object */
  readonly parent: ManagedObject;

  /** The name of the property that now references the child object (if any) */
  readonly propertyName?: string;
}

/** Event that is emitted when a change occurs to a managed object, list/map, or reference; this triggers the same observer method(s) as changing the actual value of a (managed) reference property */
export class ManagedChangeEvent extends ManagedEvent {
  constructor(name = "Change") {
    super(name);
  }
}

/** Event that is emitted by `ManagedObject.emitChange()` without parameters; this is an instance of the `ManagedChangeEvent` class that can be widely reused and emitted on all managed objects, to signal that the internal state of the object has changed */
export const CHANGE = new ManagedChangeEvent().freeze();

/** Base type for events that are emitted when changes occur to a `ManagedList` or `ManagedMap` */
export class ManagedListChangeEvent extends ManagedChangeEvent {
  constructor(name = "ManagedListChange", source: ManagedList | ManagedMap) {
    super(name);
    this.source = source;
  }

  /** The list or map that was changed */
  readonly source: ManagedList | ManagedMap;
}

/** Event that is emitted when an item is added to a `ManagedList` or `ManagedMap`. The object contains a reference to the object that has been added to the list or map. */
export class ManagedObjectAddedEvent extends ManagedListChangeEvent {
  constructor(source: ManagedList | ManagedMap, object: ManagedObject, key?: string) {
    super("ManagedObjectAdded", source);
    this.object = object;
    this.key = key;
  }

  /** The key that was added, only for events emitted by `ManagedMap` */
  readonly key?: string;

  /** The object that was added */
  readonly object: ManagedObject;
}

/** Event that is emitted when an item is removed from a `ManagedList`. The event object contains a reference to the object that has been removed from the list or map. */
export class ManagedObjectRemovedEvent extends ManagedListChangeEvent {
  constructor(source: ManagedList | ManagedMap, object: ManagedObject, key?: string) {
    super("ManagedObjectRemoved", source);
    this.object = object;
    this.key = key;
  }

  /** The key that was removed, only for events emitted by `ManagedMap` */
  readonly key?: string;

  /** The object that was removed */
  readonly object: ManagedObject;
}
