import { ManagedList } from "./ManagedList";
import { ManagedMap } from "./ManagedMap";
import { ManagedObject } from "./ManagedObject";

/**
 * Event that can be emitted on a managed object, list/map, or reference, to be received by any object that references it.
 * @note Event instances may be frozen and reused for better performance. See `ManagedEvent.freeze`
 */
export class ManagedEvent {
    constructor(name = "") { this.name = name }

    /** Identifier for the type of this event */
    readonly name: string;

    /** Freeze this object so that its properties cannot be modified, and the event can be reused for better performance. */
    freeze() {
        if (Object.freeze) Object.freeze(this);
        return this as Readonly<this>;
    }
}

/** Core event that is not propagated by default (see `ManagedObject.propagateChildEvents`) */
export class ManagedCoreEvent extends ManagedEvent {
    /** Event that is emitted for all managed objects after activation */
    static readonly ACTIVE = new ManagedCoreEvent("Active").freeze();

    /** Event that is emitted for all managed objects after deactivation */
    static readonly INACTIVE = new ManagedCoreEvent("Inactive").freeze();

    /** Event that is emitted for all managed objects after they are destroyed
     * @note Handlers on objects that referenced the destroyed object will be unable to access the destroyed object through its own managed property, since the reference is immediately set to undefined */
    static readonly DESTROYED = new ManagedCoreEvent("Destroyed").freeze();

    /** Returns true if given event is a core event */
    static isCoreEvent(event: ManagedEvent): event is ManagedCoreEvent {
        return !!(event as ManagedCoreEvent)._coreEventMarker;
    }

    /** Core event flag */
    private readonly _coreEventMarker = true;
}

/** Event that is emitted when a managed object is assigned to a managed child reference (see `@managedChild` decorator) */
export class ManagedParentChangeEvent extends ManagedCoreEvent {
    constructor(parent: ManagedObject) {
        super("ManagedParentChange");
        this.parent = parent;
    }

    /** The new parent object */
    readonly parent: ManagedObject;
}

/** Event that is emitted when a change occurs to a managed object, list/map, or reference */
export class ManagedChangeEvent extends ManagedEvent {
    /** Frozen base change event that can be used instead of creating a new base instance. */
    static readonly CHANGE = new ManagedChangeEvent().freeze();

    constructor(name = "Change") {
        super(name);
    }
}

/** Event that is emitted when an item is added to a `ManagedList` or `ManagedMap` */
export class ManagedObjectAddedEvent extends ManagedChangeEvent {
    constructor(source: ManagedList | ManagedMap, object: ManagedObject, key?: string) {
        super("ManagedObjectAdded");
        this.source = source;
        this.object = object;
        this.key = key;
    }

    /** The list or map that the object was added to */
    readonly source: ManagedList | ManagedMap;

    /** The key that was added, only for events emitted by `ManagedMap` */
    readonly key?: string;

    /** The object that was added */
    readonly object: ManagedObject;
}

/** Event that is emitted when an item is removed from a `ManagedList` */
export class ManagedObjectRemovedEvent extends ManagedChangeEvent {
    constructor(source: ManagedList | ManagedMap, object: ManagedObject, key?: string) {
        super("ManagedObjectRemoved");
        this.source = source;
        this.object = object;
        this.key = key;
    }

    /** The list or map that the object was removed from */
    readonly source: ManagedList | ManagedMap;

    /** The key that was removed, only for events emitted by `ManagedMap` */
    readonly key?: string;

    /** The object that was removed */
    readonly object: ManagedObject;
}
