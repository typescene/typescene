import { ManagedEvent } from "./ManagedEvent";
import { ManagedObject, ManagedObjectConstructor } from "./ManagedObject";
export declare class ManagedMap<T extends ManagedObject = ManagedObject> extends ManagedObject {
    constructor();
    propagateEvents(...types: Array<ManagedEvent | {
        new (...args: any[]): ManagedEvent;
    }>): this;
    restrict<T extends ManagedObject>(classType: ManagedObjectConstructor<T>): ManagedMap<T>;
    private _managedClassRestriction?;
    get(key: string): T | undefined;
    has(key: string): boolean;
    unset(key: string): void;
    set(key: string, target?: T): void | this;
    remove(target: T): this;
    clear(): this;
    objects(): T[];
    keys(): string[];
    includes(target: T): boolean;
    toObject(): {
        [index: string]: T;
    };
    toJSON(): any;
}
