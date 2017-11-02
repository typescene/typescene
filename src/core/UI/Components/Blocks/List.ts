import Async from "../../../Async";
import { Component } from "../Component";
import { ComponentFactory, UIValueOrAsync } from "../ComponentFactory";
import { ComponentRenderer } from "../ComponentRenderer";
import { ComponentSignal, ComponentSignalHandler } from "../ComponentSignal";
import { Block } from "./Block";
import { Divider } from "./Divider";

/** Represents a list of blocks */
@ComponentFactory.appendChildComponents(ComponentFactory.CLevel.Block)
export class List<BlockT extends Block> extends Block {
    /** Create a component factory for this class */
    static with: ComponentFactory.WithMethod<List.Initializer<Block>>;
    /** Initialize this component with given properties; returns this */
    public initializeWith: ComponentFactory.InitializeWithMethod<List.Initializer<BlockT>>;

    /** Create a list component with given items */
    constructor(items: Array<BlockT | undefined> = []) {
        super();
        this.items = items.slice();
    }

    /** Method that is called immediately after the renderer for this list is constructed; adds observers for item selection */
    protected beforeFirstRender(renderer: ComponentRenderer) {
        super.beforeFirstRender(renderer);

        // emit SelectionChange if selection changes (based on list of child
        // components and their selection status)
        var lastIndex = -1, lastItem: Component | undefined;
        renderer.watch(() => {
            var item = this.getLastSelectedChild();
            var index = item ? this.items.indexOf(<any>item) : -1;
            if (index < 0) item = undefined;
            return { index, item };
        }, change => {
            if (lastIndex !== change.index || lastItem !== change.item) {
                this.SelectionChange(change);
                lastIndex = change.index;
                lastItem = change.item;
            }

            // update selected index asynchronously
            this.selectedIndex = change.index;
        });

        // watch selectedIndex, update selection asynchronously if needed
        // (e.g. if selectedIndex is set to an observable using a binding)
        renderer.watch(() => this.selectedIndex, i => {
            if (i !== this.selectedIndex) return;  // avoid race/loop
            var item = (i >= 0 && i < this.items.length) ?
                this.items[i] : undefined;
            if (item) item.selected = true;
            else this.deselectAll();
        });
    }

    /** List content (observed) */
    @ComponentFactory.applyComponentsArray(ComponentFactory.CLevel.Block)
    @Async.observable_not_null
    public items: Array<BlockT | undefined>;

    /** Current (last) selected item index (base 0), or -1 if no item is selected (observed) */
    @ComponentFactory.applyAsync
    @Async.observable
    public get selectedIndex(): number {
        // return last selected index (manually, async from beforeFirstRender,
        // or return the observable value given to setter below)
        return this.selectedIndex;
    }
    public set selectedIndex(i) {
        var value: number;
        if ((<any>i instanceof Async.ObservableValue)) {
            this._observableSelectedIndex = <any>i;
            this.selectedIndex = i;
            value = (<any>i).value;
            if (value === undefined) return;
        }
        else {
            // update underlying value or set observable value
            if (this._observableSelectedIndex) {
                if (this._observableSelectedIndex.writable)
                    this._observableSelectedIndex.value = i;
            }
            else {
                // no observable bound, just set own value
                this.selectedIndex = i;
            }
            value = i;
        }

        // use -1 for any other invalid value
        if (value < 0 || value >= this.items.length || !this.items[value])
            value = -1;

        // select given item synchronously
        this.selectItem(value >= 0 ? this.items[value] : undefined);
    }
    private _observableSelectedIndex?: Async.ObservableValue<number>;

    /** Set to an initializer spec for the Divider component to insert a divider between each element (observed) */
    @Async.observable
    public divider: Divider.Initializer;

    /** Set to a string value to have getFormValues add an ObservableArray with form values of list items */
    @Async.observable
    public name: string;

    /** Deselect all items currently in this list */
    public deselectAll() {
        this.items.forEach(c => { if (c) c.selected = false });
    }

    /** Select given item (block), and immediately deselect others if `.selectionMode` is `ItemClick` or `ItemFocus`; does _not_ check if the item is included in `.items` at all for performance reasons */
    public selectItem(item: BlockT | undefined) {
        // select given item
        if (item) item.selected = true;

        // check if need to deselect others (do not wait for async)
        if (this.selectionMode === Component.SelectionMode.ItemClick ||
            this.selectionMode === Component.SelectionMode.ItemFocus) {
            for (var j = this.items.length - 1; j >= 0; j--)
                if (this.items[j] && this.items[j] !== item)
                    this.items[j]!.selected = false;
        }
    }

    /** Append a block to this list */
    public appendChild(block?: BlockT) {
        this.items.push(block);
        return this;
    }

    /** Returns an array of directly contained components (observable) */
    public getChildren(): Component[] {
        var result: Component[] = [];
        var dividers: { [uid: string]: Divider } = {};
        this.items.forEach(item => {
            if (!item) return;

            // add a divider if needed (not before first item)
            if (this.divider && result.length) {
                var divider = dividers[item.uid] =
                    this._dividers[item.uid] ||
                    Async.unobserved(() => ComponentFactory.initializeWith
                        .call(new Divider(), this.divider));
                result.push(divider);
            }

            // add the item itself
            result.push(item);
        });
        this._dividers = dividers;
        return result;
    }

    /** Returns an object containing all current values of input elements (observable) */
    public getFormValues(result: any = {}) {
        if (this.name)
            result[this.name] = (<Async.ObservableArray<BlockT>>this.items)
                .mapAsyncValues(item => Async.observe(() => item.getFormValues()));
        else
            super.getFormValues(result);
        return result;
    }

    /** Set all input values by element name */
    public setFormValues(values: any) {
        if (this.name) {
            values && values[this.name] && this.items.forEach((item, i) => {
                item && item.setFormValues(values[this.name][i]);
            });
        }
        else
            super.setFormValues(values);
    }

    /** Signal emitted when the list selection changes, while displayed on screen */
    public readonly SelectionChange = this.createComponentSignal(List.SelectionSignal);

    private _dividers: { [uid: string]: Divider } = {};
}

export namespace List {
    /** Initializer for .with({ ... }) */
    export interface Initializer<BlockT extends Block> extends Block.Initializer {
        /** Property initializer: list of items */
        items?: ComponentFactory.SpecList;
        /** Divider initializer spec */
        divider?: Divider.Initializer;
        /** Property initializer: (last) selected item index */
        selectedIndex?: UIValueOrAsync<number>;
        /** Property initializer: form values list name */
        name?: string;
        /** Signal initializer: method name or handler */
        SelectionChange?: string | ListSelectionHandler<BlockT>;
    }

    /** Data that is emitted after the item selection of a list component changes */
    export interface ItemEvent<T extends Block> {
        /** The target item index */
        index: number;
        /** The target item */
        item?: T;
    }

    /** Signal that is emitted when a list selection event occurs */
    export class SelectionSignal<T extends Block>
        extends ComponentSignal<ItemEvent<T>> { }
}

/** Constructor for a list selection event handler */
export class ListSelectionHandler<T extends Block>
    extends ComponentSignalHandler<List.ItemEvent<T>> { }
