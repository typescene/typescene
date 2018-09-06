import { UIRenderableConstructor } from "../UIComponent";
import { UIStyle } from "../UIStyle";
import { UIContainer } from "./UIContainer";
/** Represents a UI component that contains other components, in a vertical arrangement */
export declare class UIColumn extends UIContainer {
    static preset(presets: UIColumn.Presets, ...rest: Array<UIRenderableConstructor | undefined>): Function;
    style: UIStyle;
    /** Returns true if spacing between components should be non-zero (used by renderer) */
    hasComponentSpacing(): boolean;
    /** Space between components along vertical axis (in dp or string with unit, defaults to 8) */
    spacing?: string | number;
    /** Column width (in dp or string with unit, overrides value set in `UIComponent.dimensions`, if any) */
    width?: string | number;
}
/** Shortcut for `UIColumn` constructor with spacing preset to zero */
export declare let UICloseColumn: typeof UIColumn;
export declare namespace UIColumn {
    /** UIColumn presets type, for use with `Component.with` */
    interface Presets extends UIContainer.Presets {
        /** Space between components along vertical axis (in dp or string with unit, defaults to 8) */
        spacing?: string | number;
        /** Column width (in dp or string with unit, overrides value set in `UIComponent.dimensions`, if any) */
        width?: string | number;
    }
}
