import { UIControl } from "./UIControl";
export declare class UISeparator extends UIControl {
    static preset(presets: UISeparator.Presets): Function;
    style: import("../UIStyle").UIStyle;
    thickness: string | number;
    margin: string | number;
    color: string;
    vertical?: boolean;
}
export declare namespace UISeparator {
    interface Presets extends UIControl.Presets {
        thickness: string | number;
        margin: string | number;
        color?: string;
        vertical?: boolean;
    }
}
