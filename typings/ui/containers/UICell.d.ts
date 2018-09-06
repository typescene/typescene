import { UIComponentEventHandler, UIRenderableConstructor } from "../UIComponent";
import { UIStyle } from "../UIStyle";
import { UIContainer } from "./UIContainer";
/** Type definition for padding, margin, or border thickness measurements */
export declare type UICellOffsets = string | number | {
    x?: string | number;
    y?: string | number;
    top?: string | number;
    bottom?: string | number;
    left?: string | number;
    right?: string | number;
};
export declare class UICell extends UIContainer {
    static preset(presets: UICell.Presets, ...rest: Array<UIRenderableConstructor | undefined>): Function;
    style: UIStyle;
    isFocusable(): boolean;
    isKeyboardFocusable(): boolean;
    /** True if this cell *itself* may receive direct input focus using the mouse, touch, or using `UIComponent.requestFocus` (cannot be changed after rendering this component), defaults to false */
    allowFocus?: boolean;
    /** True if this cell *itself* may receive input focus using the keyboard and all other methods (cannot be changed after rendering this component), defaults to false */
    allowKeyboardFocus?: boolean;
    /** Padding around contained elements (in dp or CSS string, or separate offset values, defaults to 0) */
    padding?: UICellOffsets;
    /** Margin around the entire cell (in dp or CSS string, or separate offset values, defaults to 0) */
    margin?: UICellOffsets;
    /** Cell background (see `UITheme.replaceColor`), defaults to transparent */
    background?: string;
    /** Text color (see `UITheme.replaceColor`), defaults to `inherit` to inherit the text color from a containing cell or background window */
    textColor?: string;
    /** Border width (in dp or string with unit, or separate offset values, defaults to 0) */
    borderWidth?: UICellOffsets;
    /** Border color (see `UITheme.replaceColor`) */
    borderColor?: string;
    /** Border style (CSS), defaults to "solid" */
    borderStyle: string;
    /** Border radius (in dp or CSS string, defaults to 0) */
    borderRadius?: string | number;
    /** Intensity of drop shadow based on visual 'elevation' level (0-1, defaults to 0) */
    dropShadow?: number;
    /**
     * Other CSS attributes that are applied directly to the container, if supported (plain object)
     * @note Changes to individual properties are not observed by the renderer.
     */
    css?: Partial<CSSStyleDeclaration> & {
        className?: string;
    };
}
/** Shortcut for `UICell` constructor with properties preset such that the cell grows along with its content, instead of taking up all available space along the main axis of its container */
export declare let UIFlowCell: typeof UICell;
export declare namespace UICell {
    /** UIRow presets type, for use with `Component.with` */
    interface Presets extends UIContainer.Presets {
        /** Padding around contained elements (in dp or CSS string, defaults to 0) */
        padding?: UICellOffsets;
        /** Margin around the entire cell (in dp or CSS string, defaults to 0) */
        margin?: UICellOffsets;
        /** Cell background (see `UITheme.replaceColor`) */
        background?: string;
        /** Text color (see `UITheme.replaceColor`), defaults to `inherit` to inherit the text color from a containing cell or background window */
        textColor?: string;
        /** Border width (in dp or string with unit, defaults to 0) */
        borderWidth?: UICellOffsets;
        /** Border color (see `UITheme.replaceColor`) */
        borderColor?: string;
        /** Border style (CSS), defaults to "solid" */
        borderStyle?: string;
        /** Corner radius (in dp or CSS string, defaults to 0) */
        borderRadius?: string | number;
        /** Size of drop shadow based on visual 'elevation' (0-1, defaults to 0) */
        dropShadow?: number;
        /** Set to true to allow this cell *itself* to receive input focus using mouse, touch, or `UIComponent.requestFocus` */
        allowFocus?: boolean;
        /** Set to true to allow this cell *itself* to receive input focus using the keyboard as well as other methods; implies `allowFocus` */
        allowKeyboardFocus?: boolean;
        /** Other CSS attributes that are applied directly to the container, if supported (plain object). */
        css?: Partial<CSSStyleDeclaration>;
        onMouseEnter?: UIComponentEventHandler<UICell>;
        onMouseLeave?: UIComponentEventHandler<UICell>;
        onSelect?: UIComponentEventHandler<UICell>;
        onDeselect?: UIComponentEventHandler<UICell>;
    }
}
