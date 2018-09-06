import { Component, ComponentConstructor, ManagedList, ManagedObject } from "../core";
import { UIContainer } from "./containers/UIContainer";
import { UIComponentEvent, UIRenderable } from "./UIComponent";
import { UIRenderableController } from "./UIRenderableController";
/** Type definition for a component constructor that accepts a single object argument, and constructs a renderable component */
export interface UIListItemAdapter<TObject extends ManagedObject = ManagedObject> {
    new (object: TObject): UIRenderable;
}
/** Renderable wrapper that populates an encapsulated container with a given list of managed objects and a view adapter (component constructor) */
export declare class UIListController extends UIRenderableController {
    static preset(presets: UIListController.Presets, ListItemAdapter?: UIListItemAdapter, container?: ComponentConstructor & (new () => UIContainer)): Function;
    /** Create a new list controller for given container */
    constructor(container?: UIContainer);
    /** Set to true to enable selection (focus movement) using up/down arrow keys */
    enableArrowKeyFocus: boolean;
    /** List of objects, each object is used to construct one content component */
    items: ManagedList<ManagedObject>;
    /** Index of first item to be shown in the list (for e.g. pagination, or sliding window positioning), defaults to 0 */
    firstIndex: number;
    /** Maximum number of items to be shown in the list (for e.g. pagination, or sliding window positioning), defaults to `undefined` to show all items */
    maxItems?: number;
    /** Last focused index, if any */
    lastFocusedIndex: number;
    /** Returns the list index of given component, or of the component that it is contained in; or returns -1 if given component is not found in the list */
    getIndexOfComponent(component?: Component): number;
    /** Request input focus for the last focused list component, or the first item, if possible */
    restoreFocus(e?: UIComponentEvent): void;
}
export declare namespace UIListController {
    /** UIListController presets type, for use with `Component.with` */
    interface Presets {
        /** List of items: initial values, or a list binding */
        items?: Iterable<ManagedObject>;
        /** Set to true to enable selection (focus movement) using up/down arrow keys, defaults to true */
        enableArrowKeyFocus?: boolean;
        /** Index of first item to be shown in the list (for e.g. pagination, or sliding window positioning), defaults to 0 */
        firstIndex?: number;
        /** Maximum number of items to be shown in the list (for e.g. pagination, or sliding window positioning), defaults to `undefined` to show all items */
        maxItems?: number;
    }
}
