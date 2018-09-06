import { Component, ComponentConstructor } from "./Component";
/** A component that encapsulates a list of child components */
export declare class ComponentList<T extends Component = Component> extends Component {
    static preset(presets: unknown, ...components: Array<ComponentConstructor & (new () => Component)>): Function;
    /** Create a new component with given child components */
    constructor(...components: T[]);
    /** Add one or more child components to the list */
    add(...components: T[]): this;
    /** Clear the list */
    clear(): this;
    /** The number of components currently in the list */
    readonly count: number;
    /** Returns the component with given ID (see `ManagedObject.managedId`). */
    find(id: number): T;
    /** Returns the first component in the list */
    first(): T | undefined;
    /** Iterates over the components in this list (see `ManagedList.forEach`). */
    forEach(callback: (target: T) => void): void;
    /** Returns true if given component is currently included in this list */
    includes(component: T): boolean;
    /** Returns the object at given position in the list (see `ManagedList.get`) */
    get(index: number): T;
    /** Returns the index of given object in this list (see `ManagedList.indexOf`) */
    indexOf(target: T): number;
    /** Insert a component in this list (see `ManagedList.insert`). */
    insert(target: T, before?: T): this;
    /** Returns the last component in the list */
    last(): T | undefined;
    /** Iterates over the objects in this list and returns an array with results. See `ManagedList.map`. */
    map<TResult>(callback: (target: T) => TResult): TResult[];
    /** Returns an array with the values of given property for all components in the list. */
    pluck<K extends keyof T>(propertyName: K): T[K][];
    /** Remove given component from the list. Does not throw an error if the component was not included in the list. */
    remove(component: T): this;
    /** Replace the components in the list with given components. See `ManagedList.replace`. */
    replace(components: Iterable<T>): this;
    /** Returns an array with given number of components taken from the list. See `ManagedList.take`. */
    take(n: number, startingFrom?: T): T[];
    /** Returns an array with given number of components taken from the list. See `ManagedList.takeLast`. */
    takeLast(n: number, endingAt?: T): T[];
    /** Returns an array with all components currently in this list */
    toArray(): T[];
    /** Returns an array representation of this list (alias of `toArray` method) */
    toJSON(): any;
    /** The encapsulated list itself */
    private _list;
}
