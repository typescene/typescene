import { Component, ComponentConstructor, ManagedList, ManagedObject } from "../core";
import { UIContainer } from "./containers/UIContainer";
import { UIComponentEvent, UIRenderable } from "./UIComponent";
import { UIRenderableController } from "./UIRenderableController";
export interface UIListItemAdapter<TObject extends ManagedObject = ManagedObject> {
    new (object: TObject): UIRenderable;
}
export declare class UIListController extends UIRenderableController {
    static preset(presets: UIListController.Presets, ListItemAdapter?: UIListItemAdapter, container?: ComponentConstructor & (new () => UIContainer)): Function;
    constructor(container?: UIContainer);
    enableArrowKeyFocus: boolean;
    items: ManagedList<ManagedObject>;
    firstIndex: number;
    maxItems?: number;
    lastFocusedIndex: number;
    getIndexOfComponent(component?: Component): number;
    restoreFocus(e?: UIComponentEvent): void;
}
export declare namespace UIListController {
    interface Presets {
        items?: Iterable<ManagedObject>;
        enableArrowKeyFocus?: boolean;
        firstIndex?: number;
        maxItems?: number;
    }
}
