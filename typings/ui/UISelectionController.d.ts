import { UIComponent, UIRenderable } from "./UIComponent";
import { UIRenderableController } from "./UIRenderableController";
/** Renderable wrapper that controls selection state across components, by emitting `Deselect` events for previously selected components upon `Select` events on newly selected components */
export declare class UISelectionController extends UIRenderableController {
    /** Create a new selection controller with given content */
    constructor(content?: UIRenderable);
    /** Currently selected component, if any */
    selected?: UIComponent;
}
