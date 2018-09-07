import { Component, ComponentConstructor } from "./Component";
export declare class ComponentList<T extends Component = Component> extends Component {
    static preset(presets: unknown, ...components: Array<ComponentConstructor & (new () => Component)>): Function;
    constructor(...components: T[]);
    add(...components: T[]): this;
    clear(): this;
    readonly count: number;
    find(id: number): T;
    first(): T | undefined;
    forEach(callback: (target: T) => void): void;
    includes(component: T): boolean;
    get(index: number): T;
    indexOf(target: T): number;
    insert(target: T, before?: T): this;
    last(): T | undefined;
    map<TResult>(callback: (target: T) => TResult): TResult[];
    pluck<K extends keyof T>(propertyName: K): T[K][];
    remove(component: T): this;
    replace(components: Iterable<T>): this;
    take(n: number, startingFrom?: T): T[];
    takeLast(n: number, endingAt?: T): T[];
    toArray(): T[];
    toJSON(): any;
    private _list;
}
