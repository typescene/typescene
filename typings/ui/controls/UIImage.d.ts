import { Binding } from "../../core";
import { UIComponentEventHandler } from "../UIComponent";
import { UIControl } from "./UIControl";
/** Represents a UI component that displays a referenced image */
export declare class UIImage extends UIControl {
    /** Creates a preset image class with given URL, if any */
    static withUrl(url: string | Binding): typeof UIImage;
    static preset(presets: UIImage.Presets): Function;
    /** Create a new label with given URL */
    constructor(url?: string);
    style: import("../UIStyle").UIStyle;
    shrinkwrap: boolean;
    isFocusable(): boolean;
    isKeyboardFocusable(): boolean;
    /** True if this image may receive direct input focus using the mouse, touch, or using `UIComponent.requestFocus` (cannot be changed after rendering this component), defaults to false */
    allowFocus?: boolean;
    /** True if this image may receive input focus using the keyboard and all other methods (cannot be changed after rendering this component), defaults to false */
    allowKeyboardFocus?: boolean;
    /** Image resource URL */
    url?: string;
}
export declare namespace UIImage {
    /** UIImage presets type, for use with `Component.with` */
    interface Presets extends UIControl.Presets {
        /** Image resource URL */
        url?: string;
        /** Set to true to allow this image to receive input focus using mouse, touch, or `UIComponent.requestFocus` */
        allowFocus?: boolean;
        /** Set to true to allow this image to receive input focus using the keyboard as well as other methods; implies `allowFocus` */
        allowKeyboardFocus?: boolean;
        /** Event handler that is invoked when an error occurs while loading the image resource */
        onLoadError?: UIComponentEventHandler;
    }
}
