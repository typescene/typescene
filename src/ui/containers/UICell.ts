import {
  Stringable,
  UIComponentEventHandler,
  UIRenderable,
  UIRenderableConstructor,
} from "../UIComponent";
import { UIStyle } from "../UIStyle";
import { UITheme } from "../UITheme";
import { UIContainer } from "./UIContainer";

/** Basic animated transition types, used for `UIComponent.revealTransition` and `UIComponent.exitTransition`. More transitions may be available depending on platform and cell type. */
export enum UICellTransition {
  right = "right",
  left = "left",
  up = "up",
  down = "down",
  fade = "fade",
  rightFast = "right-fast",
  leftFast = "left-fast",
  upFast = "up-fast",
  downFast = "down-fast",
  fadeFast = "fade-fast",
}

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
    return super.preset(presets, ...rest);
  }

  constructor(...content: UIRenderable[]) {
    super(...content);
    this.style = UITheme.getStyle("container", "cell");
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

  /** Opacity (0-1; defaults to fully opaque if undefined) */
  opacity?: number;

  /** Animated transition that plays when this cell is first rendered */
  revealTransition?: UICellTransition | string;

  /** Animated transition that plays when this cell is removed from a container */
  exitTransition?: UICellTransition | string;

  /**
   * Other CSS attributes that are applied directly to the container, if supported (plain object)
   * @note Changes to individual properties are not observed by the renderer.
   */
  css?: Partial<CSSStyleDeclaration> & { className?: string };
}

/** Represents a cell (see `UICell`) that grows and shrinks along with its content, instead of taking up all available space */
export let UIFlowCell = UICell.with({ style: "cell_flow" });

/** Represents a cell (see `UICell`) that overlays the entire available area within its parent container */
export let UICoverCell = UICell.with({ style: "cell_cover" });

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
    /** Opacity (0-1) */
    opacity?: number;

    /** Set to true to select cells on focus (or click), implies allowFocus as well */
    selectOnFocus?: boolean;
    /** Set to true to allow this cell *itself* to receive input focus using mouse, touch, or `UIComponent.requestFocus` */
    allowFocus?: boolean;
    /** Set to true to allow this cell *itself* to receive input focus using the keyboard as well as other methods; implies `allowFocus` */
    allowKeyboardFocus?: boolean;

    /** Animation that plays when this cell is first rendered */
    revealTransition?: UICellTransition | string;
    /** Animation that plays when this cell is removed from a container */
    exitTransition?: UICellTransition | string;

    /** Other CSS attributes that are applied directly to the container, if supported (plain object). */
    css?: Partial<CSSStyleDeclaration> & { className?: string };

    onMouseEnter?: UIComponentEventHandler<UICell>;
    onMouseLeave?: UIComponentEventHandler<UICell>;
    onSelect?: UIComponentEventHandler<UICell>;
    onDeselect?: UIComponentEventHandler<UICell>;
  }
}
