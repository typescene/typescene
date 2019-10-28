import {
  Stringable,
  UIComponentEvent,
  UIComponentEventHandler,
  UIRenderable,
  UIRenderableConstructor,
} from "../UIComponent";
import { UIStyle } from "../UIStyle";
import { UITheme } from "../UITheme";
import { UIContainer } from "./UIContainer";

/** Style mixin that is automatically applied on each instance */
const _mixin = UIStyle.create("UICell", {
  containerLayout: { distribution: "space-around", gravity: "center" },
  position: { top: 0 },
});

/** Represents a UI component that visually groups other components in a rectangular cell */
export class UICell extends UIContainer {
  static preset(
    presets: UICell.Presets,
    ...rest: Array<UIRenderableConstructor | undefined>
  ): Function {
    if (presets.allowKeyboardFocus) presets.allowFocus = presets.allowKeyboardFocus;
    if (presets.selectOnFocus) {
      presets.allowFocus = true;
      presets.onFocusIn = "+Select";
      delete presets.selectOnFocus;
    }
    if (presets.highlight) {
      let highlight = presets.highlight;
      delete presets.highlight;
      this.observe(
        class {
          constructor(public readonly cell: UICell) {
            this.baseProperties = {
              background: presets.background,
              textColor: presets.textColor,
              borderThickness: presets.borderThickness || 0,
              borderColor: presets.borderColor,
              borderStyle: presets.borderStyle || "solid",
              dropShadow: presets.dropShadow || 0,
            };
          }
          baseProperties: Partial<UICell>;
          selected = false;
          focused = false;
          onFocusIn(e: UIComponentEvent) {
            if (e.source === this.cell) this._set(this.selected, (this.focused = true));
          }
          onFocusOut(e: UIComponentEvent) {
            if (e.source === this.cell) this._set(this.selected, (this.focused = false));
          }
          onSelect(e: UIComponentEvent) {
            if (e.source === this.cell) this._set((this.selected = true), this.focused);
          }
          onDeselect(e: UIComponentEvent) {
            if (e.source === this.cell) this._set((this.selected = false), this.focused);
          }
          private _set(selected?: boolean, focused?: boolean) {
            function def(a: any, takeB?: boolean, b = a, takeC?: boolean, c = b, bc = c) {
              return takeC ? (takeB ? bc : c) : takeB ? b : a;
            }
            this.cell.background = def(
              this.baseProperties.background,
              selected,
              highlight.selectedBackground,
              focused,
              highlight.focusedBackground,
              highlight.focusedSelectedBackground
            );
            this.cell.textColor = def(
              this.baseProperties.textColor,
              selected,
              highlight.selectedTextColor,
              focused,
              highlight.focusedTextColor,
              highlight.focusedSelectedTextColor
            );
            this.cell.borderThickness = def(
              this.baseProperties.borderThickness,
              selected,
              highlight.selectedBorderThickness,
              focused,
              highlight.focusedBorderThickness,
              highlight.focusedSelectedBorderThickness
            );
            this.cell.borderColor = def(
              this.baseProperties.borderColor,
              selected,
              highlight.selectedBorderColor,
              focused,
              highlight.focusedBorderColor,
              highlight.focusedSelectedBorderColor
            );
            this.cell.borderStyle = def(
              this.baseProperties.borderStyle,
              selected,
              highlight.selectedBorderStyle,
              focused,
              highlight.focusedBorderStyle,
              highlight.focusedSelectedBorderStyle
            );
            this.cell.dropShadow = def(
              this.baseProperties.dropShadow,
              selected,
              highlight.selectedDropShadow,
              focused,
              highlight.focusedDropShadow,
              highlight.focusedSelectedDropShadow
            );
          }
        }
      );
    }
    return super.preset(presets, ...rest);
  }

  constructor(...content: UIRenderable[]) {
    super(...content);
    this.style = UITheme.current.baseContainerStyle.mixin(_mixin);
  }

  isFocusable() {
    return !!(this.allowFocus || this.allowKeyboardFocus);
  }

  isKeyboardFocusable() {
    return !!this.allowKeyboardFocus;
  }

  /** Padding around contained elements (in dp or CSS string, or separate offset values) */
  padding?: UIStyle.Offsets;

  /** Margin around the entire cell (in dp or CSS string, or separate offset values) */
  margin?: UIStyle.Offsets;

  /** Cell background (`UIColor` or string), defaults to transparent */
  background?: Stringable;

  /** Text color (`UIColor` or string), defaults to `inherit` to inherit the text color from a containing cell or background window */
  textColor?: Stringable;

  /** Border thickness (in dp or string with unit, or separate offset values) */
  borderThickness?: UIStyle.Offsets;

  /** Border color (`UIColor` or string) */
  borderColor?: Stringable;

  /** Border style (CSS), defaults to "solid" */
  borderStyle = "solid";

  /** Border radius (in dp or CSS string) */
  borderRadius?: string | number;

  /** Intensity of drop shadow based on visual 'elevation' level (0-1) */
  dropShadow?: number;

  /**
   * Other CSS attributes that are applied directly to the container, if supported (plain object)
   * @note Changes to individual properties are not observed by the renderer.
   */
  css?: Partial<CSSStyleDeclaration> & { className?: string };
}

/** Shortcut for `UICell` constructor with properties preset such that the cell grows along with its content, instead of taking up all available space along the main axis of its container */
export let UIFlowCell = UICell.with({
  style: UIStyle.create("UIFlowCell", { dimensions: { grow: 0 } }),
});

/** Shortcut for `UICell` constructor with properties preset such that the cell takes up all of the available space in its parent container, covering all other components */
export let UICoverCell = UICell.with({
  style: UIStyle.create("UICoverCell", {
    position: {
      gravity: "overlay",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    },
  }),
});

export namespace UICell {
  /** UICell presets type, for use with `Component.with` */
  export interface Presets extends UIContainer.Presets {
    /** Padding around contained elements (in dp or CSS string, or separate offset values) */
    padding?: UIStyle.Offsets;
    /** Margin around the entire cell (in dp or CSS string, or separate offset values) */
    margin?: UIStyle.Offsets;
    /** Cell background (`UIColor` or string) */
    background?: Stringable;
    /** Text color (`UIColor` or string), defaults to `inherit` to inherit the text color from a containing cell or background window */
    textColor?: Stringable;
    /** Border thickness (in dp or string with unit) */
    borderThickness?: UIStyle.Offsets;
    /** Border color (`UIColor` or string) */
    borderColor?: Stringable;
    /** Border style (CSS), defaults to "solid" */
    borderStyle?: string;
    /** Corner radius (in dp or CSS string, defaults to 0) */
    borderRadius?: string | number;
    /** Size of drop shadow based on visual 'elevation' (0-1) */
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
    css?: Partial<CSSStyleDeclaration> & { className?: string };

    onMouseEnter?: UIComponentEventHandler<UICell>;
    onMouseLeave?: UIComponentEventHandler<UICell>;
    onSelect?: UIComponentEventHandler<UICell>;
    onDeselect?: UIComponentEventHandler<UICell>;
  }

  /** `UICell` focus/select properties, for use with `UICell.with` */
  export interface HighlightProperties {
    /** Focused cell background */
    focusedBackground?: Stringable;
    /** Focused cell text color */
    focusedTextColor?: Stringable;
    /** Focused cell border thickness (in dp or string with unit, defaults to 0) */
    focusedBorderThickness?: string | number;
    /** Focused cell border color (`UIColor` or string) */
    focusedBorderColor?: Stringable;
    /** Focused cell border style (CSS), defaults to "solid" */
    focusedBorderStyle?: string;
    /** Focused cell drop shadow size based on visual 'elevation' (0-1, defaults to 0) */
    focusedDropShadow?: number;
    /** Selected cell background */
    selectedBackground?: Stringable;
    /** Selected cell text color */
    selectedTextColor?: Stringable;
    /** Selected cell border thickness (in dp or string with unit, defaults to 0) */
    selectedBorderThickness?: string | number;
    /** Selected cell border color (`UIColor` or string) */
    selectedBorderColor?: Stringable;
    /** Selected cell border style (CSS), defaults to "solid" */
    selectedBorderStyle?: string;
    /** Selected cell drop shadow size based on visual 'elevation' (0-1, defaults to 0) */
    selectedDropShadow?: number;
    /** Focused and selected cell background */
    focusedSelectedBackground?: Stringable;
    /** Focused and selected cell text color */
    focusedSelectedTextColor?: Stringable;
    /** Focused and selected cell border thickness (in dp or string with unit, defaults to 0) */
    focusedSelectedBorderThickness?: string | number;
    /** Focused and selected cell border color (`UIColor` or string) */
    focusedSelectedBorderColor?: Stringable;
    /** Focused and selected cell border style (CSS), defaults to "solid" */
    focusedSelectedBorderStyle?: string;
    /** Focused and selected cell drop shadow size based on visual 'elevation' (0-1, defaults to 0) */
    focusedSelectedDropShadow?: number;
  }
}
