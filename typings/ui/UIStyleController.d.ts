import { ComponentConstructor } from "../core";
import { UIComponent } from "./UIComponent";
import { UIRenderableController } from "./UIRenderableController";
import { UIStyle } from "./UIStyle";
/** Renderable wrapper that controls the style of its single content component, by applying one of the given styles based on the current value of a property */
export declare class UIStyleController extends UIRenderableController {
    static preset(presets: UIStyleController.Presets, content?: ComponentConstructor & {
        new (): UIComponent;
    }): Function;
    /** Currently selected style (string index into `UIStyleController.styles` object) */
    state?: string;
    /** Available styles to be applied to the content component (plain object) */
    styles: {
        [name: string]: UIStyle;
    };
    /** Base style (taken from the content component right after it is assigned to the `content` property) */
    baseStyle?: UIStyle;
}
export declare namespace UIStyleController {
    /** UIStyleController presets type, for use with `Component.with` */
    interface Presets {
        /** Currently selected style (string index into `UIStyleController.styles` object, typically bound to a property on the composite component) */
        state?: string;
        /** Available styles to be applied to the content component (plain object) */
        styles: {
            [name: string]: UIStyle;
        };
    }
}
