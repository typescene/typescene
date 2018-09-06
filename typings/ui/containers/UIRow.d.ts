import { UIRenderableConstructor } from "../UIComponent";
import { UIStyle } from "../UIStyle";
import { UIContainer } from "./UIContainer";
/** Represents a UI component that contains other components, in a horizontal arrangement */
export declare class UIRow extends UIContainer {
    static preset(presets: UIRow.Presets, ...rest: Array<UIRenderableConstructor | undefined>): Function;
    style: UIStyle;
    /** Returns true if spacing between components should be non-zero (used by renderer) */
    hasComponentSpacing(): boolean;
    /** Space between components along horizontal axis (in dp or string with unit, defaults to 8) */
    spacing?: string | number;
    /** Row height (in dp or string with unit, overrides value set in `UIComponent.dimensions`, if any) */
    height?: string | number;
}
/** Shortcut for `UIRow` constructor preset with styles to align all components to the right (or left for right-to-left cultures) */
export declare let UIOppositeRow: typeof UIRow;
/** Shortcut for `UIRow` constructor preset with styles to align all components in the center */
export declare let UICenterRow: typeof UIRow;
/** Shortcut for `UIRow` constructor with spacing preset to zero */
export declare let UICloseRow: typeof UIRow;
export declare namespace UIRow {
    /** UIRow presets type, for use with `Component.with` */
    interface Presets extends UIContainer.Presets {
        /** Space between components along horizontal axis (in dp or string with unit, defaults to 16) */
        spacing?: string | number;
        /** Row height (in dp or string with unit, overrides value set in `UIComponent.dimensions`, if any) */
        height?: string | number;
    }
}
