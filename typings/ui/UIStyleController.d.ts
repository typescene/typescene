import { ComponentConstructor } from "../core";
import { UIComponent } from "./UIComponent";
import { UIRenderableController } from "./UIRenderableController";
import { UIStyle } from "./UIStyle";
export declare class UIStyleController extends UIRenderableController {
    static preset(presets: UIStyleController.Presets, content?: ComponentConstructor & {
        new (): UIComponent;
    }): Function;
    state?: string;
    styles: {
        [name: string]: UIStyle;
    };
    baseStyle?: UIStyle;
}
export declare namespace UIStyleController {
    interface Presets {
        state?: string;
        styles: {
            [name: string]: UIStyle;
        };
    }
}
