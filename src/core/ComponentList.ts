import { Component, ComponentConstructor } from "./Component";
import { ManagedList } from "./ManagedList";
import { managedChild } from "./ManagedReference";

/** A component that encapsulates a list of child components */
export class ComponentList<T extends Component = Component> extends Component {
    static preset(presets: unknown,
        ...components: Array<ComponentConstructor & (new () => Component)>): Function {
        super.preset(presets as any, ...components);
        return function (this: ComponentList) {
            this.add(...components.map(C => new C()));
        }
    }

    /** Create a new component with given child components */
    constructor(...components: T[]) {
        super();
        this._list = new ManagedList<T>();
        this._list.restrict(Component);
        if (components.length) {
            this._list.add(...components);
        }
        this.propagateChildEvents();
    }

    /** Add one or more child components to the list */
    add(...components: T[]) {
        this._list.add(...components);
        return this;
    }

    /** Clear the list */
    clear() {
        this._list.clear();
        return this;
    }

    /** The number of components currently in the list */
    get count() { return this._list.count }

    /** Returns the component with given ID (see `ManagedObject.managedId`). */
    find(id: number) { return this._list.find(id) }

    /** Returns the first component in the list */
    first() { return this._list.first() }

    /** Iterates over the components in this list (see `ManagedList.forEach`). */
    forEach(callback: (target: T) => void) { this._list.forEach(callback) }
    
    /** Returns true if given component is currently included in this list */
    includes(component: T) { return this._list.includes(component) }

    /** Returns the object at given position in the list (see `ManagedList.get`) */
    get(index: number) { return this._list.get(index) }

    /** Returns the index of given object in this list (see `ManagedList.indexOf`) */
    indexOf(target: T) { return this._list.indexOf(target) }

    /** Insert a component in this list (see `ManagedList.insert`). */
    insert(target: T, before?: T) {
        this._list.insert(target, before);
        return this;
    }

    /** Returns the last component in the list */
    last() { return this._list.last() }

    /** Iterates over the objects in this list and returns an array with results. See `ManagedList.map`. */
    map<TResult>(callback: (target: T) => TResult) {
        return this._list.map(callback);
    }

    /** Returns an array with the values of given property for all components in the list. */
    pluck<K extends keyof T>(propertyName: K) {
        return this._list.pluck(propertyName);
    }

    /** Remove given component from the list. Does not throw an error if the component was not included in the list. */
    remove(component: T) {
        this._list.remove(component);
        return this;
    }

    /** Replace the components in the list with given components. See `ManagedList.replace`. */
    replace(components: Iterable<T>) {
        this._list.replace(components);
        return this;
    }

    /** Returns an array with given number of components taken from the list. See `ManagedList.take`. */
    take(n: number, startingFrom?: T) {
        return this._list.take(n, startingFrom);
    }

    /** Returns an array with given number of components taken from the list. See `ManagedList.takeLast`. */
    takeLast(n: number, endingAt?: T) {
        return this._list.takeLast(n, endingAt);
    }

    /** Returns an array with all components currently in this list */
    toArray() { return this._list.toArray() }

    /** Returns an array representation of this list (alias of `toArray` method) */
    toJSON() { return this._list.toJSON() }

    /** The encapsulated list itself */
    @managedChild
    private _list!: ManagedList<T>;
}
