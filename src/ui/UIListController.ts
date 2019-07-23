import { Component, ComponentConstructor, ComponentEventHandler, managed, ManagedEvent, ManagedList, ManagedListChangeEvent, ManagedMap, ManagedObject } from "../core";
import { UICloseColumn } from "./containers/UIColumn";
import { UIContainer } from "./containers/UIContainer";
import { UIComponentEvent, UIRenderable } from "./UIComponent";
import { UIRenderableController } from "./UIRenderableController";
import { UIStyle } from "./UIStyle";

/** Type definition for a component constructor that accepts a single object argument, and constructs a renderable component */
export interface UIListItemAdapter<TObject extends ManagedObject = ManagedObject> {
    new (object: TObject): UIRenderable;
}

/** Default container used in the preset method */
const _defaultContainer = UICloseColumn.with({
    allowKeyboardFocus: true,
    style: UIStyle.create("UIListContainer", {
        dimensions: { grow: 0 },
        containerLayout: { distribution: "start" }
    })
});

/** Use a resolved promise to make updates async */
const RESOLVED = Promise.resolve();

/** Renderable wrapper that populates an encapsulated container with a given list of managed objects and a view adapter (component constructor) */
export class UIListController extends UIRenderableController {
    static preset(presets: UIListController.Presets,
        ListItemAdapter?: UIListItemAdapter | ((instance: UIListController) => UIListItemAdapter),
        container: ComponentConstructor & (new () => UIContainer) = _defaultContainer): Function {
        this.presetBindingsFrom(ListItemAdapter as any);
        this.observe(class {
            constructor(public controller: UIListController) { }
            readonly contentMap = new ManagedMap<UIRenderable>();
            onFocusIn(e: UIComponentEvent) {
                if (e.source !== this.controller.content) {
                    // store focus index
                    this.controller.lastFocusedIndex =
                        Math.max(0, this.controller.getIndexOfComponent(e.source));
                }
                else {
                    // focus appropriate item
                    this.controller.restoreFocus();
                }
            }
            onFirstIndexChangeAsync() { return this.doUpdateAsync() }
            onMaxItemsChangeAsync() { return this.doUpdateAsync() }
            onItemsChange(_v?: any, e?: ManagedEvent) {
                if (!e || (e instanceof ManagedListChangeEvent)) {
                    this.doUpdateAsync();
                }
            }
            _updateQueued = false;
            async doUpdateAsync() {
                if (this._updateQueued) return;
                this._updateQueued = true;
                await RESOLVED;
                this._updateQueued = false;

                // update the container's content, if possible
                let container = this.controller.content as UIContainer;
                let content = container && container.content;
                if (!content) return;
                let list = this.controller.items;
                let Adapter: UIListItemAdapter = ListItemAdapter as any;
                if (Adapter && !(Adapter.prototype instanceof ManagedObject)) {
                    Adapter = (Adapter as any)(this.controller);
                }
                if (!list || !Adapter) {
                    content.clear();
                    return;
                }

                // use entire list, or just a part of it
                let firstIndex = this.controller.firstIndex;
                if (!(firstIndex >= 0)) firstIndex = 0;
                let maxItems = this.controller.maxItems;
                let items = (firstIndex > 0 || maxItems! >= 0) ?
                    (list.count > 0 && firstIndex < list.count) ?
                        list.take(maxItems! >= 0 ? maxItems! : list.count,
                            list.get(this.controller.firstIndex)) : [] :
                    list;

                // keep track of existing view components for each object
                let map = this.contentMap;
                let components: UIRenderable[] = [];
                let created = map.toObject();
                for (let item of items) {
                    let component = created[item.managedId];
                    if (!component) {
                        component = new Adapter(item);
                        map.set(String(item.managedId), component);
                    }
                    else {
                        delete created[item.managedId];
                    }
                    components.push(component);
                }
                content.replace(components);

                // delete components that should no longer be in the list
                for (let oldKey in created) {
                    map.remove(created[oldKey]);
                }

                // emit an event specific to this UIListController
                this.controller.propagateComponentEvent("ListItemsChange");
            }
        })
        return super.preset(presets, container);
    }

    /** Create a new list controller for given container */
    constructor(container?: UIContainer) {
        super(container);
        this.propagateChildEvents(e => {
            if (e instanceof UIComponentEvent) {
                if (e.name === "ArrowUpKeyPress") {
                    if (this.focusPreviousItem()) return;
                    let parentList = this.getParentComponent(UIListController);
                    parentList && parentList.enableArrowKeyFocus && parentList.restoreFocus();
                }
                else if (e.name === "ArrowDownKeyPress") {
                    if (this.focusNextItem()) return;
                    let parentList = this.getParentComponent(UIListController);
                    if (parentList && parentList.enableArrowKeyFocus) return e;
                }
                else {
                    return e;
                }
            }
        });
    }

    /** Set to true to enable selection (focus movement) using up/down arrow keys */
    enableArrowKeyFocus = true;

    /** List of objects, each object is used to construct one content component */
    @managed
    items = new ManagedList();

    /** Index of first item to be shown in the list (for e.g. pagination, or sliding window positioning), defaults to 0 */
    firstIndex = 0;

    /** Maximum number of items to be shown in the list (for e.g. pagination, or sliding window positioning), defaults to `undefined` to show all items */
    maxItems?: number;

    /** Last focused index, if any */
    lastFocusedIndex = 0;

    /** Returns the list index of given component, or of the component that it is contained in; or returns -1 if given component is not found in the list */
    getIndexOfComponent(component?: Component) {
        let container = this.content as UIContainer;
        if (!container) return -1;
        while (component && component.getParentComponent() !== container) {
            component = component.getParentComponent();
        }
        if (component) return container.content.indexOf(component as any);
        return -1;
    }

    /** Request input focus for the last focused list component, or the first item, if possible */
    restoreFocus() {
        // pass on to last focused component (or first)
        let container = this.content as UIContainer;
        if (container && container.content.count > 0) {
            let index = Math.min(container.content.count - 1,
                Math.max(this.lastFocusedIndex, 0));
            let goFocus: any = container.content.get(index);
            if (typeof goFocus.requestFocus === "function") goFocus.requestFocus();
        }
    }

    /** Request input focus for the item before the currently focused item; returns true if such an item exists, false if the currently focused item is already the first item or there are no items in the list */
    focusPreviousItem() {
        if (this.lastFocusedIndex > 0) {
            this.lastFocusedIndex--;
            this.restoreFocus();
            return true;
        }
        return false;
    }

    /** Request input focus for the item after the currently focused item; returns true if such an item exists, false if the currently focused item is already the last item or if there are no items in the list */
    focusNextItem() {
        if (this.lastFocusedIndex < this.items.count - 1) {
            this.lastFocusedIndex++;
            this.restoreFocus();
            return true;
        }
        return false;
    }
}

export namespace UIListController {
    /** UIListController presets type, for use with `Component.with` */
    export interface Presets {
        /** List of items: initial values, or a list binding */
        items?: Iterable<ManagedObject>;
        /** Set to true to enable selection (focus movement) using up/down arrow keys, defaults to true */
        enableArrowKeyFocus?: boolean;
        /** Index of first item to be shown in the list (for e.g. pagination, or sliding window positioning), defaults to 0 */
        firstIndex?: number;
        /** Maximum number of items to be shown in the list (for e.g. pagination, or sliding window positioning), defaults to `undefined` to show all items */
        maxItems?: number;
        /** Event handler for any change in displayed list items, and list initialization */
        onListItemsChange: ComponentEventHandler<UIListController>;
    }
}
