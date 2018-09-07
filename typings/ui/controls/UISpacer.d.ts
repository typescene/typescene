import { UIControl } from "./UIControl";
export declare class UISpacer extends UIControl {
    static withHeight(minHeight: string | number, shrinkwrap?: boolean): typeof UISpacer;
    static withWidth(minWidth: string | number, shrinkwrap?: boolean): typeof UISpacer;
    constructor(width?: string | number, height?: string | number);
    style: import("../UIStyle").UIStyle;
    shrinkwrap: boolean;
}
