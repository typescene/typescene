import { ManagedEvent } from "./ManagedEvent";
import { ManagedObject, ManagedObjectConstructor } from "./ManagedObject";
export declare class ManagedReference<T extends ManagedObject = ManagedObject> extends ManagedObject {
    constructor(target?: T);
    propagateEvents(f?: ((this: this, e: ManagedEvent) => ManagedEvent | ManagedEvent[] | undefined | void)): this;
    propagateEvents(...types: Array<ManagedEvent | {
        new (...args: any[]): ManagedEvent;
    }>): this;
    restrict<T extends ManagedObject>(classType: ManagedObjectConstructor<T>): ManagedReference<T>;
    private _managedClassRestriction?;
    get(): T | undefined;
    target: T | undefined;
    clear(): this | undefined;
    set(target?: T): this | undefined;
    toJSON(): {
        "$ref": number | undefined;
    };
}
export declare function managed<T extends ManagedObject>(target: T, propertyKey: any): void;
export declare function managedDependency<T extends ManagedObject>(target: T, propertyKey: any): void;
export declare function managedChild<T extends ManagedObject>(target: T, propertyKey: any): void;
