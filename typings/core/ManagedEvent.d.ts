import { ManagedList } from "./ManagedList";
import { ManagedMap } from "./ManagedMap";
import { ManagedObject } from "./ManagedObject";
export declare class ManagedEvent {
    constructor(name?: string);
    readonly name: string;
    freeze(): Readonly<this>;
}
export declare class ManagedCoreEvent extends ManagedEvent {
    static readonly ACTIVE: Readonly<ManagedCoreEvent>;
    static readonly INACTIVE: Readonly<ManagedCoreEvent>;
    static readonly DESTROYED: Readonly<ManagedCoreEvent>;
    static isCoreEvent(event: ManagedEvent): event is ManagedCoreEvent;
    private readonly _coreEventMarker;
}
export declare class ManagedParentChangeEvent extends ManagedCoreEvent {
    constructor(parent: ManagedObject);
    readonly parent: ManagedObject;
}
export declare class ManagedChangeEvent extends ManagedEvent {
    static readonly CHANGE: Readonly<ManagedChangeEvent>;
    constructor(name?: string);
}
export declare class ManagedObjectAddedEvent extends ManagedChangeEvent {
    constructor(source: ManagedList | ManagedMap, object: ManagedObject, key?: string);
    readonly source: ManagedList | ManagedMap;
    readonly key?: string;
    readonly object: ManagedObject;
}
export declare class ManagedObjectRemovedEvent extends ManagedChangeEvent {
    constructor(source: ManagedList | ManagedMap, object: ManagedObject, key?: string);
    readonly source: ManagedList | ManagedMap;
    readonly key?: string;
    readonly object: ManagedObject;
}
