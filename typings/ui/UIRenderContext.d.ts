import { ManagedObject } from "../core";
import { UIComponent, UIRenderable } from "./UIComponent";
/** @internal Render context binding, can be reused to avoid creating new bindings */
export declare let renderContextBinding: import("../core/Binding").Binding;
/** Global view placement modes */
export declare enum UIRenderPlacement {
    PAGE = 1,
    DIALOG = 2,
    DRAWER = 3,
    DROPDOWN = 4,
    DROPDOWN_COVER = 5,
    POPOVER = 6,
    POPOVER_ABOVE = 7,
    POPOVER_LEFT = 8,
    POPOVER_RIGHT = 9
}
/** Base application render context, to be extended with platform specific render implementation. */
export declare abstract class UIRenderContext extends ManagedObject {
    /** Emit a change event for this context, e.g. when the viewport orientation changes. This will trigger all views to re-render if needed. */
    emitRenderChange(): void;
    /** Remove all rendered output from the screen */
    abstract clear(): void;
    /** Returns a callback that can be used to render an output element to the screen asynchronously. */
    abstract getRenderCallback(): UIRenderContext.RenderCallback<UIRenderContext.Output<never, never>>;
}
export declare namespace UIRenderContext {
    /** Callback function that accepts rendered output and returns a next callback. */
    interface RenderCallback<TOutput extends Output = Output<UIRenderable, any>> {
        /**
         * One-time callback function that accepts rendered output and a callback function. This callback format is used by the `RenderContext` application renderer as well as renderers of UI components that contain other components.
         * @param output
         *  The rendered output. If this is undefined, the output is removed.
         * @param afterRender
         *  An optional callback that is invoked asynchronously after the element is placed on screen.
         * @returns A new callback function that should be used for the next update.
         */
        (output?: TOutput, afterRender?: (out?: Output) => void): RenderCallback<TOutput>;
    }
    /** Encapsulates a rendered output element, to be placed on screen by a platform specific `RenderContext` instance. */
    class Output<TComponent extends UIRenderable = UIRenderable, TElement = any> {
        constructor(source: TComponent, element: TElement, placement?: UIRenderPlacement, reference?: UIComponent);
        /** The rendered component */
        source: TComponent;
        /** The rendered element, as a platform-dependent object or handle */
        element: TElement;
        /** Placement mode, used by `RenderContext` for root output elements */
        placement?: UIRenderPlacement;
        /** Placement reference for dropdowns and popovers */
        placementRef?: UIComponent;
        /** Modal shade opacity behind content (0-1) */
        modalShadeOpacity?: number;
        /** True if clicking on the modal shade area should emit `CloseModal` on the modal view component */
        modalShadeClickToClose?: boolean;
    }
}
