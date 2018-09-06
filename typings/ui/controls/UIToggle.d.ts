import { ManagedRecord } from "../../core";
import { UIControl } from "./UIControl";
/** Represents a toggle component with an optional text label */
export declare class UIToggle extends UIControl {
    static preset(presets: UIToggle.Presets): Function;
    /** Creates a preset toggle class with given name and label, if any */
    static withName(name: string, label?: string): typeof UIToggle;
    style: import("../UIStyle").UIStyle;
    shrinkwrap: boolean;
    isFocusable(): boolean;
    isKeyboardFocusable(): boolean;
    /** Form state context, propagated from the parent composite object */
    formContext?: ManagedRecord;
    /** Label text, if any */
    label?: string;
    /** Highlight (background) color, if any */
    highlightColor?: string;
    /** Current toggle state, true for 'on' state, false for 'off' */
    state?: boolean;
    /** Form context property name */
    name?: string;
}
export declare namespace UIToggle {
    /** UIToggle presets type, for use with `Component.with` */
    interface Presets extends UIControl.Presets {
        /** Label text, if any */
        label?: string;
        /** Highlight (background) color, if any */
        highlightColor?: string;
        /** Toggle state */
        state?: boolean;
        /** Form state property */
        name?: string;
    }
}
