import Async from "../../../Async";
import { Component } from "../Component";
import { ComponentFactory } from "../ComponentFactory";
import { ComponentRenderer } from "../ComponentRenderer";
import { ComponentSignal, ComponentSignalHandler } from "../ComponentSignal";
import { Block } from "./Block";

/** Represents a hierarchical list of blocks */
@ComponentFactory.appendChildComponents(ComponentFactory.CLevel.Block)
export class TreeList<BlockT extends TreeList.BlockItem> extends Block {
    /** Create a component factory for this class */
    static with: ComponentFactory.WithMethod<TreeList.Initializer<Block>>;
    /** Initialize this component with given properties; returns this */
    public initializeWith: ComponentFactory.InitializeWithMethod<TreeList.Initializer<BlockT>>;

    /** Create a tree list component with given items */
    constructor(items: Array<BlockT | undefined> = []) {
        super();
        this.items = items.slice();
    }

    /** Method that is called immediately after the renderer for this list is constructed; adds observers for item selection */
    protected beforeFirstRender(renderer: ComponentRenderer) {
        super.beforeFirstRender(renderer);

        // create an observable flattened array with all open items
        this._flattened = recurse(() => this.items).flattenAsync(true);
        function recurse(f: () => any): Async.ObservableArray<any> {
            return Async.observeArray(f).mapAsyncValues((b): any => {
                if (b instanceof Block) {
                    var sub = recurse(() => (<TreeList.BlockItem>b).treeListItems);
                    return Async.observe(() =>
                        (!(<TreeList.BlockItem>b).collapsed &&
                            (<TreeList.BlockItem>b).treeListItems) ?
                            [b, sub] :  // expand
                            b);
                }
                return undefined;
            });
        }

        // keep track of expanded and collapsed items
        var count = 0;
        const items: { [uid: string]: Component } = {};
        const expanded: { [uid: string]: number } = {};
        const visible: { [uid: string]: number } = {};
        var trackItems = Async.observe(() => {
            count++;
            this._flattened && this._flattened.forEach(b => {
                if (b) {
                    items[b.uid] = b;
                    var wasVisible = visible[b.uid];
                    visible[b.uid] = count;
                    if (!b.collapsed && b.treeListItems) {
                        // set marker to current count, or 0 if new
                        var wasExpanded = expanded[b.uid] > 0;
                        expanded[b.uid] = (wasExpanded || !wasVisible) ?
                            count : 0;
                    }
                }
            });
            return count;
        });
        renderer.watch(() => trackItems.value, c => {
            if (c !== count) return;  // overtaken

            // find newly expanded items and newly collapsed visible items
            for (var uid in visible) {
                if (visible[uid] < c) {
                    // no longer visible, forget about this item
                    delete items[uid];
                    delete visible[uid];
                    delete expanded[uid];
                }
                else if (expanded[uid] === 0) {
                    // newly expanded (while already visible)
                    expanded[uid] = c;
                    this.ItemExpanded({ item: items[uid] });
                }
                else if (expanded[uid] < c) {
                    // no longer expanded but still visible
                    this.ItemCollapsed({ item: items[uid] });
                    delete expanded[uid];
                }
            }
        });

        // emit SelectionChange if selection changes (based on list of child
        // components and their selection status)
        var lastItem: Component | undefined;
        renderer.watch(() => this.getLastSelectedChild(), item => {
            if (!item || item.selected) {
                if (item !== lastItem) {
                    lastItem = item;
                    this.SelectionChange({
                        item: <any>item,
                        key: item && (<BlockT>item).key
                    });
                }
            }
        });
    }

    /** Hierarchical list content (observed); items can use the `TreeList.BlockItem` interface to provide sub content, see e.g. `TreeListRow` */
    @ComponentFactory.applyComponentsArray(ComponentFactory.CLevel.Block)
    @Async.observable_not_null
    public items: Array<BlockT | undefined>;

    /** Select given item (block), and immediately deselect others if `.selectionMode` is `ItemClick` or `ItemFocus`; does _not_ check if the item is included in `.items` at all for performance reasons */
    public selectItem(item: BlockT | undefined) {
        // select given item
        if (item) item.selected = true;

        // check if need to deselect others (do not wait for async)
        if (this.selectionMode === Component.SelectionMode.ItemClick ||
            this.selectionMode === Component.SelectionMode.ItemFocus) {
            this._flattened && this._flattened.slice().forEach(b => {
                if (b && b !== item) b.selected = false;
            });
        }
    }

    /** Key (string value) of selected item, if any (observable); see `TreeList.BlockItem/key`; if set to a string value, all items in the hierarchy will be checked for a matching key, and selected or deselected; for selected items, parent items will be expanded automatically; input focus will be removed from deselected items as well, but selected items are not focused automatically */
    public get selectedKey() {
        // find selected item and return its key, if any
        var item = this.getLastSelectedChild();
        return item ? (<BlockT>item).key : undefined;
    }
    public set selectedKey(key: string | undefined) {
        // use an object to compare against instead of undefined,
        // so that none will match
        if (key === undefined) key = <any>{};

        // clear previous observable, do not keep looking for old key
        this._selectedKeySetter && this._selectedKeySetter.clear();

        // recurse over *all* items and select or deselect
        var hasUndefined = false;
        function recurse(list: Array<TreeList.BlockItem | undefined>) {
            var didSelect = false;
            list.forEach(block => {
                if (!block) {
                    hasUndefined = true;
                    return;
                }

                // deselect or select and focus/blur if possible
                var doSelect = (block.key === key);
                if (doSelect) didSelect = true;
                if (doSelect !== (block.selected || false)) {
                    Async.unobserved(() => {
                        block.selected = doSelect;
                        if (!doSelect &&
                            block.focusMode !== Component.FocusMode.None)
                            block.hasFocus = false;
                    });
                }
                if (block.treeListItems && block.treeListItems.length &&
                    recurse(block.treeListItems)) {
                    didSelect = true;

                    // expand parent items of matching items
                    Async.unobserved(() => { block.collapsed = false });
                }
            });
            return didSelect;
        }

        // keep watch on undefined items
        var watcher = this._selectedKeySetter = Async.observe(
            () => recurse(this.items))
            .subscribe(didSelect => {
                if (didSelect || !hasUndefined) {
                    // clear observable, do not keep looking
                    watcher.clear();
                }
                else if (!didSelect) {
                    // keep looking until another item has been selected
                    hasUndefined = false;
                    this.SelectionChange.connectOnce(() => {
                        watcher.clear();
                    });
                }
            });
    }

    /** Observable used by `selectedKey` setter to watch for changes to list items if key was not found yet; to be cleared when selection changes again */
    private _selectedKeySetter: Async.ObservableValue<any>;

    /** Append a tree list block to this list */
    public appendChild(block?: BlockT) {
        this.items.push(block);
        return this;
    }

    /** Returns an array of directly contained components (observable); i.e. a flattened list of all _visible_ tree list items */
    public getChildren(): Component[] {
        return this._flattened ? this._flattened.slice() : [];
    }

    /** Signal emitted when the list selection changes, while displayed on screen */
    public readonly SelectionChange = this.createComponentSignal(TreeList.SelectionSignal);

    /** Signal emitted when a tree list item is collapsed, while displayed on screen */
    public readonly ItemCollapsed = this.createComponentSignal(TreeList.FoldSignal);

    /** Signal emitted when a tree list item is expanded, while displayed on screen */
    public readonly ItemExpanded = this.createComponentSignal(TreeList.FoldSignal);

    /** Flattened observable array, derived from `.items` property */
    private _flattened?: Async.ObservableArray<BlockT>;
}

export namespace TreeList {
    /** Initializer for .with({ ... }) */
    export interface Initializer<BlockT extends Block> extends Block.Initializer {
        /** Property initializer: nested list of items */
        items?: ComponentFactory.SpecList;
        /** Signal initializer: method name or handler */
        SelectionChange?: string | TreeListSelectionHandler<BlockT>;
        /** Signal initializer: method name or handler */
        ItemCollapsed?: string | TreeListFoldHandler<BlockT>;
        /** Signal initializer: method name or handler */
        ItemExpanded?: string | TreeListFoldHandler<BlockT>;
    }

    /** Represents a `Block` component with optional properties that define the hierarchical structure used by `TreeList` */
    export interface BlockItem extends Block {
        /** Optional key (identifier string) of the item, used to populate `TreeList/selectedKey` */
        key?: string;

        /** Optional flag, set to true to collapse the hierarchy below this item; this property should be observable to update rendered components asynchronously */
        collapsed?: boolean;

        /** Optional (observable) array containing tree list items to be displayed below this item; this property should be observable to update rendered components asynchronously */
        treeListItems?: Array<TreeList.BlockItem | undefined>;
    }

    /** Data that is emitted after the item selection of a tree list component changes, or when a tree list item is collapsed/expanded */
    export interface ItemEvent<T extends TreeList.BlockItem> {
        /** The newly selected item */
        item?: T;
        /** The key (string value) of the newly selected item, if any */
        key?: string;
    }

    /** Signal that is emitted when a tree list selection event occurs */
    export class SelectionSignal<T extends TreeList.BlockItem>
        extends ComponentSignal<ItemEvent<T>> { }

    /** Signal that is emitted when a tree list item is collapsed or expanded */
    export class FoldSignal<T extends TreeList.BlockItem>
        extends ComponentSignal<ItemEvent<T>> { }
}

/** Constructor for a tree list selection event handler */
export class TreeListSelectionHandler<T extends TreeList.BlockItem>
    extends ComponentSignalHandler<TreeList.ItemEvent<T>> { }

/** Constructor for a tree list fold (collapse/expand) event handler */
export class TreeListFoldHandler<T extends TreeList.BlockItem>
    extends ComponentSignalHandler<TreeList.ItemEvent<T>> { }
