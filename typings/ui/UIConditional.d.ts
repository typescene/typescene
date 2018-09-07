import { UIRenderableConstructor } from "./UIComponent";
import { UIRenderableController } from "./UIRenderableController";
import { UIRenderContext } from "./UIRenderContext";
export declare class UIConditional extends UIRenderableController {
    static preset(presets: UIConditional.Presets, content?: UIRenderableConstructor): Function;
    readonly ContentConstructor?: UIRenderableConstructor;
    state?: boolean;
    render(callback?: UIRenderContext.RenderCallback): void;
    private _renderCallback?;
}
export declare namespace UIConditional {
    interface Presets {
        state?: boolean;
    }
}
