import { Binding } from "../../core";
import { UIComponentEventHandler } from "../UIComponent";
import { UIControl } from "./UIControl";
export declare class UIImage extends UIControl {
    static withUrl(url: string | Binding): typeof UIImage;
    static preset(presets: UIImage.Presets): Function;
    constructor(url?: string);
    style: import("../UIStyle").UIStyle;
    shrinkwrap: boolean;
    isFocusable(): boolean;
    isKeyboardFocusable(): boolean;
    allowFocus?: boolean;
    allowKeyboardFocus?: boolean;
    url?: string;
}
export declare namespace UIImage {
    interface Presets extends UIControl.Presets {
        url?: string;
        allowFocus?: boolean;
        allowKeyboardFocus?: boolean;
        onLoadError?: UIComponentEventHandler;
    }
}
