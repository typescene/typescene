import { UIControl } from "./UIControl";
/** Control that shows a horizontal or vertical separator */
export declare class UISeparator extends UIControl {
    static preset(presets: UISeparator.Presets): Function;
    style: import("../UIStyle").UIStyle;
    /** Separator line thickness (in dp, or string with unit) */
    thickness: string | number;
    /** Margin in the direction perpendicular to the separator (in dp, or string with unit), defaults to 0 */
    margin: string | number;
    /** Separator line color (see `UITheme.replaceColor`), defaults to `@separator` */
    color: string;
    /** True if separator should be vertical instead of horizontal */
    vertical?: boolean;
}
export declare namespace UISeparator {
    /** UIDivider presets type, for use with `Component.with` */
    interface Presets extends UIControl.Presets {
        /** Separator line thickness (in dp, or string with unit) */
        thickness: string | number;
        /** Margin in the direction perpendicular to the separator (in dp, or string with unit), defaults to 0 */
        margin: string | number;
        /** Separator line color (see `UITheme.replaceColor`), defaults to `@separator` */
        color?: string;
        /** True if separator should be vertical instead of horizontal */
        vertical?: boolean;
    }
}
