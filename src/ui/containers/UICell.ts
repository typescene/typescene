import { UIComponentEventHandler, UIRenderableConstructor } from "../UIComponent";
import { UIStyle } from "../UIStyle";
import { UITheme } from "../UITheme";
import { UIContainer } from "./UIContainer";

/** Style mixin that is automatically applied on each instance */
const _mixin = UIStyle.create("UICell", {
    containerLayout: { distribution: "space-around", gravity: "center" },
    position: { top: 0 }
});

/** Type definition for padding, margin, or border thickness measurements */
export type UICellOffsets = string | number | {
    x?: string | number, y?: string | number,
    top?: string | number, bottom?: string | number,
    left?: string | number, right?: string | number
};

export class UICell extends UIContainer {
    static preset(presets: UICell.Presets,
        ...rest: Array<UIRenderableConstructor | undefined>): Function {
        if (presets.allowKeyboardFocus) presets.allowFocus = presets.allowKeyboardFocus;
        return super.preset(presets, ...rest);
    }

    style = UITheme.current.baseContainerStyle.mixin(_mixin);

    isFocusable() { return !!(this.allowFocus || this.allowKeyboardFocus) }
    isKeyboardFocusable() { return !!this.allowKeyboardFocus }

    /** True if this cell *itself* may receive direct input focus using the mouse, touch, or using `UIComponent.requestFocus` (cannot be changed after rendering this component), defaults to false */
    allowFocus?: boolean;

    /** True if this cell *itself* may receive input focus using the keyboard and all other methods (cannot be changed after rendering this component), defaults to false */
    allowKeyboardFocus?: boolean;

    /** Padding around contained elements (in dp or CSS string, or separate offset values, defaults to 0) */
    padding?: UICellOffsets = 0;

    /** Margin around the entire cell (in dp or CSS string, or separate offset values, defaults to 0) */
    margin?: UICellOffsets = 0;

    /** Cell background (see `UITheme.replaceColor`), defaults to transparent */
    background?: string;

    /** Text color (see `UITheme.replaceColor`), defaults to `inherit` to inherit the text color from a containing cell or background window */
    textColor?: string;

    /** Border width (in dp or string with unit, or separate offset values, defaults to 0) */
    borderWidth?: UICellOffsets = 0;

    /** Border color (see `UITheme.replaceColor`) */
    borderColor?: string;

    /** Border style (CSS), defaults to "solid" */
    borderStyle = "solid";

    /** Border radius (in dp or CSS string, defaults to 0) */
    borderRadius?: string | number = 0;

    /** Intensity of drop shadow based on visual 'elevation' level (0-1, defaults to 0) */
    dropShadow?: number = 0;

    /**
     * Other CSS attributes that are applied directly to the container, if supported (plain object)
     * @note Changes to individual properties are not observed by the renderer.
     */
    css?: Partial<CSSStyleDeclaration> & { className?: string };
}

/** Shortcut for `UICell` constructor with properties preset such that the cell grows along with its content, instead of taking up all available space along the main axis of its container */
export let UIFlowCell = UICell.with({
    style: UIStyle.create("UIFlowCell", { dimensions: { grow: 0 } })
});

export namespace UICell {
    /** UIRow presets type, for use with `Component.with` */
    export interface Presets extends UIContainer.Presets {
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
