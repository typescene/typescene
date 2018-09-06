import { ComponentConstructor } from "../core";
import { UIComponent, UIComponentEventHandler, UIRenderable, UIRenderableConstructor } from "./UIComponent";
import { UIRenderableController } from "./UIRenderableController";
import { UIRenderPlacement } from "./UIRenderContext";
/** Renderable wrapper for a single component that can be used to display another component as a modal view. The modal component is created immediately after the `ShowModal` event is emitted, and removed when the `CloseModal` event is emitted. */
export declare class UIModalController extends UIRenderableController {
    static preset(presets: UIModalController.Presets, content?: ComponentConstructor & (new () => UIComponent), modal?: UIRenderableConstructor): Function;
    /** The current modal component to be displayed, as a managed child reference, or undefined if the modal component is currently not displayed */
    modal?: UIRenderable;
    /** Modal view placement, defaults to Dialog */
    placement: UIRenderPlacement;
    /** Modal backdrop opacity (0-1), defaults to 0 */
    modalShadeOpacity: number;
    /** True if clicking outside the modal component should close it, defaults to true */
    modalShadeClickToClose: boolean;
}
export declare namespace UIModalController {
    /** UIModalController presets type, for use with `Component.with` */
    interface Presets {
        /** Modal component constructor (can also be passed as an additional argument to `Component.with`) */
        modal?: UIRenderableConstructor;
        /** Modal view placement, defaults to Dialog */
        placement?: UIRenderPlacement;
        /** Modal backdrop opacity (0-1), defaults to 0 */
        modalShadeOpacity?: number;
        /** True if clicking outside the modal component should close it, defaults to true */
        modalShadeClickToClose?: boolean;
        /** Event handler that is invoked when the modal component is made visible */
        onShowModal: UIComponentEventHandler<UIModalController>;
        /** Event handler that is invoked when the modal component is removed */
        onCloseModal: UIComponentEventHandler<UIModalController>;
    }
}
