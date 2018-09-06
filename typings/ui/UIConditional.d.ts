import { UIRenderableConstructor } from "./UIComponent";
import { UIRenderableController } from "./UIRenderableController";
import { UIRenderContext } from "./UIRenderContext";
/** Encapsulates content that is added/removed asynchronously based on the value of a (bound) property */
export declare class UIConditional extends UIRenderableController {
    static preset(presets: UIConditional.Presets, content?: UIRenderableConstructor): Function;
    /** Content component constructor (read only) */
    readonly ContentConstructor?: UIRenderableConstructor;
    /** Current condition state, content is rendered only if this evaluates to true */
    state?: boolean;
    /** Render the conditional component, if any. */
    render(callback?: UIRenderContext.RenderCallback): void;
    private _renderCallback?;
}
export declare namespace UIConditional {
    /** UIConditional presets type, for use with `Component.with` */
    interface Presets {
        /** Current condition state, content is rendered only if this evaluates to true */
        state?: boolean;
    }
}
