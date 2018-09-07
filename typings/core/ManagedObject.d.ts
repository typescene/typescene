import { ManagedEvent } from "./ManagedEvent";
import { HIDDEN_CHILD_EVENT_HANDLER, HIDDEN_EVENT_HANDLER, HIDDEN_REFCOUNT_PROPERTY, HIDDEN_REF_PROPERTY, HIDDEN_STATE_PROPERTY } from "./util";
export declare enum ManagedState {
    DESTROYED = 0,
    CREATED = 1,
    ACTIVATING = 2,
    ACTIVE = 3,
    DEACTIVATING = 4,
    INACTIVE = 5,
    DESTROYING = 6
}
export declare type ManagedObjectConstructor<TObject> = (new (...args: any[]) => TObject) | (new (a: never, b: never, c: never, d: never, e: never, f: never) => TObject);
export declare class ManagedObject {
    static observe<T extends ManagedObject, C extends ManagedObjectConstructor<T>>(this: C, Observer: {
        new (instance: T): any;
    }): C;
    static handle<T extends ManagedObject>(this: ManagedObjectConstructor<T>, handler: (this: T, e: ManagedEvent) => void): void;
    static handle<T extends ManagedObject>(this: ManagedObjectConstructor<T>, handlers: {
        [eventName: string]: (this: T, e: ManagedEvent) => void;
    }): void;
    static addGlobalClassInitializer<T>(f: () => T | void): void | T;
    constructor();
    readonly managedId: number;
    readonly managedState: ManagedState;
    protected getReferenceCount(): number;
    protected getManagedReferrers(): ManagedObject[];
    protected getManagedParent(): ManagedObject | undefined;
    protected getManagedParent<TParent extends ManagedObject>(ParentClass: ManagedObjectConstructor<TParent>): TParent | undefined;
    emit<TEvent extends ManagedEvent = ManagedEvent, TConstructorArgs extends any[] = any[]>(e: TEvent | (new (...args: TConstructorArgs) => TEvent) | string, ...constructorArgs: TConstructorArgs): this;
    protected propagateChildEvents(f?: ((this: this, e: ManagedEvent, propertyName: string) => ManagedEvent | ManagedEvent[] | undefined | void)): this;
    protected propagateChildEvents(...types: Array<ManagedEvent | {
        new (...args: any[]): ManagedEvent;
    }>): this;
    protected activateManagedAsync(): Promise<any>;
    protected deactivateManagedAsync(): Promise<void>;
    protected destroyManagedAsync(): Promise<void>;
    protected onManagedStateActivatingAsync(): Promise<void>;
    protected onManagedStateActiveAsync(): Promise<void>;
    protected onManagedStateDeactivatingAsync(): Promise<void>;
    protected onManagedStateInactiveAsync(): Promise<void>;
    protected onManagedStateDestroyingAsync(): Promise<void>;
    private _transitionManagedState;
    static createManagedReferenceProperty<T extends ManagedObject>(object: T, propertyKey: keyof T, isChildReference?: boolean, isDependency?: boolean, preAssignHandler?: (this: T, target: ManagedObject) => void, eventHandler?: (this: T, event: ManagedEvent) => void): void;
    private readonly [HIDDEN_REF_PROPERTY];
    private [HIDDEN_REFCOUNT_PROPERTY];
    private [HIDDEN_STATE_PROPERTY];
    private [HIDDEN_EVENT_HANDLER]?;
    private [HIDDEN_CHILD_EVENT_HANDLER]?;
    private _emitting?;
    private _transition?;
}
