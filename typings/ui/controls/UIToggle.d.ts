import { ManagedRecord } from "../../core";
import { UIControl } from "./UIControl";
export declare class UIToggle extends UIControl {
    static preset(presets: UIToggle.Presets): Function;
    static withName(name: string, label?: string): typeof UIToggle;
    style: import("../UIStyle").UIStyle;
    shrinkwrap: boolean;
    isFocusable(): boolean;
    isKeyboardFocusable(): boolean;
    formContext?: ManagedRecord;
    label?: string;
    highlightColor?: string;
    state?: boolean;
    name?: string;
}
export declare namespace UIToggle {
    interface Presets extends UIControl.Presets {
        label?: string;
        highlightColor?: string;
        state?: boolean;
        name?: string;
    }
}
