import { ManagedObject } from "../core";
import { UIComponent, UIRenderable } from "./UIComponent";
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
export declare abstract class UIRenderContext extends ManagedObject {
    emitRenderChange(): void;
    abstract clear(): void;
    abstract getRenderCallback(): UIRenderContext.RenderCallback<UIRenderContext.Output<never, never>>;
}
export declare namespace UIRenderContext {
    interface RenderCallback<TOutput extends Output = Output<UIRenderable, any>> {
        (output?: TOutput, afterRender?: (out?: Output) => void): RenderCallback<TOutput>;
    }
    class Output<TComponent extends UIRenderable = UIRenderable, TElement = any> {
        constructor(source: TComponent, element: TElement, placement?: UIRenderPlacement, reference?: UIComponent);
        source: TComponent;
        element: TElement;
        placement?: UIRenderPlacement;
        placementRef?: UIComponent;
        modalShadeOpacity?: number;
        modalShadeClickToClose?: boolean;
    }
}
