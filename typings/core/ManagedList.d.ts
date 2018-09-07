import { ManagedEvent } from "./ManagedEvent";
import { ManagedObject, ManagedObjectConstructor } from "./ManagedObject";
export declare class ManagedList<T extends ManagedObject = ManagedObject> extends ManagedObject {
    constructor(...objects: T[]);
    propagateEvents(...types: Array<ManagedEvent | {
        new (...args: any[]): ManagedEvent;
    }>): this;
    restrict<T extends ManagedObject>(classType: ManagedObjectConstructor<T>): ManagedList<T>;
    private _managedClassRestriction?;
    readonly count: number;
    private _managedCount;
    add(...targets: T[]): this;
    insert(target: T, before?: T): this;
    remove(target: T): this;
    replace(objects: Iterable<T>): this;
    clear(): this;
    includes(target: T): boolean;
    first(): T | undefined;
    last(): T | undefined;
    get(index: number): T;
    find(managedId: number): T;
    take(n: number, startingFrom?: T): T[];
    takeLast(n: number, endingAt?: T): T[];
    private _take;
    indexOf(target: T): number;
    toArray(): T[];
    toJSON(): any;
    forEach(callback: (target: T) => void): void;
    map<TResult>(callback: (target: T) => TResult): TResult[];
    pluck<K extends keyof T>(propertyName: K): Array<T[K]>;
    [Symbol.iterator](): Iterator<T>;
}
