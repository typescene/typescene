import { UIControl } from "./UIControl";
/** Control that has no content, but expands in both directions when needed */
export declare class UISpacer extends UIControl {
    /** Creates a preset spacer class with given height (in dp or string with unit), shrinkwrapped by default */
    static withHeight(minHeight: string | number, shrinkwrap?: boolean): typeof UISpacer;
    /** Creates a preset spacer class with given width (in dp or string with unit), shrinkwrapped by default */
    static withWidth(minWidth: string | number, shrinkwrap?: boolean): typeof UISpacer;
    /** Create a new spacer with given width and height */
    constructor(width?: string | number, height?: string | number);
    style: import("../UIStyle").UIStyle;
    shrinkwrap: boolean;
}
