import { UIComponentEvent, UIComponentEventHandler, UIRenderableConstructor } from "../UIComponent";
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
        if (presets.selectOnFocus) {
            presets.allowFocus = true;
            presets.onFocusIn = "+Select";
            delete presets.selectOnFocus;
        }
        if (presets.highlight) {
            let highlight = presets.highlight;
            delete presets.highlight;
            this.observe(class {
                constructor(public readonly cell: UICell) {
                    this.baseProperties = {
                        background: presets.background,
                        textColor: presets.textColor,
                        borderWidth: presets.borderWidth || 0,
                        borderColor: presets.borderColor,
                        borderStyle: presets.borderStyle || "solid",
                        dropShadow: presets.dropShadow || 0
                    };
                }
                baseProperties: Partial<UICell>;
                selected = false;
                focused = false;
                onFocusIn(e: UIComponentEvent) {
                    if (e.source === this.cell) this._set(this.selected, this.focused = true);
                }
                onFocusOut(e: UIComponentEvent) {
                    if (e.source === this.cell) this._set(this.selected, this.focused = false);
                }
                onSelect(e: UIComponentEvent) {
                    if (e.source === this.cell) this._set(this.selected = true, this.focused);
                }
                onDeselect(e: UIComponentEvent) {
                    if (e.source === this.cell) this._set(this.selected = false, this.focused);
                }
                private _set(selected?: boolean, focused?: boolean) {
                    function def(a: any, takeB?: boolean, b = a,
                        takeC?: boolean, c = b, bc = c) {
                        return takeC ? (takeB ? bc : c) : (takeB ? b : a);
                    }
                    this.cell.background = def(this.baseProperties.background,
                        selected, highlight.selectedBackground,
                        focused, highlight.focusedBackground,
                        highlight.focusedSelectedBackground);
                    this.cell.textColor = def(this.baseProperties.textColor,
                        selected, highlight.selectedTextColor,
                        focused, highlight.focusedTextColor,
                        highlight.focusedSelectedTextColor);
                    this.cell.borderWidth = def(this.baseProperties.borderWidth,
                        selected, highlight.selectedBorderWidth,
                        focused, highlight.focusedBorderWidth,
                        highlight.focusedSelectedBorderWidth);
                    this.cell.borderColor = def(this.baseProperties.borderColor,
                        selected, highlight.selectedBorderColor,
                        focused, highlight.focusedBorderColor,
                        highlight.focusedSelectedBorderColor);
                    this.cell.borderStyle = def(this.baseProperties.borderStyle,
                        selected, highlight.selectedBorderStyle,
                        focused, highlight.focusedBorderStyle,
                        highlight.focusedSelectedBorderStyle);
                    this.cell.dropShadow = def(this.baseProperties.dropShadow,
                        selected, highlight.selectedDropShadow,
                        focused, highlight.focusedDropShadow,
                        highlight.focusedSelectedDropShadow);
                }
            });
        }
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

/** Shortcut for `UICell` constructor with properties preset such that the cell takes up all of the available space in its parent container, covering all other components */
export let UICoverCell = UICell.with({
    style: UIStyle.create("UICoverCell", {
        position: {
            gravity: "overlay",
            top: 0, bottom: 0, left: 0, right: 0
        }
    })
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

        /** Visual highlights for focused/selected states */
        highlight?: HighlightProperties;

        /** Set to true to select cells on focus (or click), implies allowFocus as well */
        selectOnFocus?: boolean;
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

    /** `UICell` focus/select properties, for use with `UICell.with` */
    export interface HighlightProperties {
        /** Focused cell background */
        focusedBackground?: string;
        /** Focused cell text color */
        focusedTextColor?: string;
        /** Focused cell border width (in dp or string with unit, defaults to 0) */
        focusedBorderWidth?: string | number;
        /** Focused cell border color (see `UITheme.replaceColor`) */
        focusedBorderColor?: string;
        /** Focused cell border style (CSS), defaults to "solid" */
        focusedBorderStyle?: string;
        /** Focused cell drop shadow size based on visual 'elevation' (0-1, defaults to 0) */
        focusedDropShadow?: number;
        /** Selected cell background */
        selectedBackground?: string;
        /** Selected cell text color */
        selectedTextColor?: string;
        /** Selected cell border width (in dp or string with unit, defaults to 0) */
        selectedBorderWidth?: string | number;
        /** Selected cell border color (see `UITheme.replaceColor`) */
        selectedBorderColor?: string;
        /** Selected cell border style (CSS), defaults to "solid" */
        selectedBorderStyle?: string;
        /** Selected cell drop shadow size based on visual 'elevation' (0-1, defaults to 0) */
        selectedDropShadow?: number;
        /** Focused and selected cell background */
        focusedSelectedBackground?: string;
        /** Focused and selected cell text color */
        focusedSelectedTextColor?: string;
        /** Focused and selected cell border width (in dp or string with unit, defaults to 0) */
        focusedSelectedBorderWidth?: string | number;
        /** Focused and selected cell border color (see `UITheme.replaceColor`) */
        focusedSelectedBorderColor?: string;
        /** Focused and selected cell border style (CSS), defaults to "solid" */
        focusedSelectedBorderStyle?: string;
        /** Focused and selected cell drop shadow size based on visual 'elevation' (0-1, defaults to 0) */
        focusedSelectedDropShadow?: number;
    }
}
