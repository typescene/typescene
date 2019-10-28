import { Binding, tt } from "../../core";
import { Stringable } from "../UIComponent";
import { UITheme } from "../UITheme";
import { UIControl } from "./UIControl";

/** Represents a button component */
export class UIButton extends UIControl {
  static preset(presets: UIButton.Presets): Function {
    // quietly change 'text' to label to support JSX tag content
    if ("text" in (presets as any)) presets.label = (presets as any).text;

    // use a 'link' role automatically if `navigateTo` is specified
    if (presets.navigateTo && !presets.accessibleRole) {
      presets.accessibleRole = "link";
    }
    return super.preset(presets);
  }

  /** Creates a preset button class with given label (localized using `tt` if available) and onClick handler, if any */
  static withLabel(label: Stringable | Binding, onClick?: string) {
    if (typeof label === "string") label = tt(label);
    return this.with({ label, onClick });
  }

  /** Creates a preset button class with given icon *only*, and onClick handler, if any */
  static withIcon(
    icon: string,
    onClick?: string,
    size?: string | number,
    color?: Stringable
  ) {
    return this.with({ icon, iconSize: size, iconColor: color, onClick });
  }

  /** Create a new button with given label */
  constructor(label?: string) {
    super();
    this.style = UITheme.current.baseControlStyle.mixin(UITheme.current.styles["button"]);
    this.shrinkwrap = true;
    if (label !== undefined) this.label = label;
  }

  isFocusable() {
    return true;
  }

  isKeyboardFocusable() {
    return !this.disableKeyboardFocus;
  }

  /** Set to true to disable keyboard focus for this button */
  disableKeyboardFocus?: boolean;

  /** Label text */
  label?: Stringable;

  /** Icon name (platform and build system dependent) */
  icon?: string;

  /** Icon size (in dp or string with unit) */
  iconSize?: string | number;

  /** Margin between icon and label text (in dp or string with unit) */
  iconMargin?: string | number;

  /** Icon color */
  iconColor?: Stringable;

  /** Set to true to make the icon appear after the text instead of before */
  iconAfter?: boolean;

  /** Path to navigate to automatically when clicked, if not blank; use `:back` to go back in history */
  navigateTo?: string;
}

/** Shortcut for `UIButton` constructor preset with the `button_primary` style set */
export let UIPrimaryButton = UIButton.with({ style: "button_primary" });

/** Shortcut for `UIButton` constructor preset with the `button_borderless` style set */
export let UIBorderlessButton = UIButton.with({ style: "button_borderless" });

/** Shortcut for `UIButton` constructor preset with the `button_outline` style set */
export let UIOutlineButton = UIButton.with({ style: "button_outline" });

/** Shortcut for `UIButton` constructor preset with the `button_link` style set */
export let UILinkButton = UIButton.with({ style: "button_link" });

/** Shortcut for `UIButton` constructor preset with the `button_large` style set */
export let UILargeButton = UIButton.with({ style: "button_large" });

/** Shortcut for `UIButton` constructor preset with the `button_small` style set */
export let UISmallButton = UIButton.with({ style: "button_small" });

/** Shortcut for `UIButton` constructor preset with the `button_icon` style set */
export let UIIconButton = UIButton.with({ style: "button_icon" });

export namespace UIButton {
  /** UILabel presets type, for use with `Component.with` */
  export interface Presets extends UIControl.Presets {
    /** Label text */
    label?: Stringable;
    /** Icon name (platform and build system dependent) */
    icon?: string;
    /** Icon size (in dp or string with unit) */
    iconSize?: string | number;
    /** Margin between icon and label text (in dp or string with unit) */
    iconMargin?: string | number;
    /** Icon color (`UIColor` or string) */
    iconColor?: Stringable;
    /** Set to true to make the icon appear after the text instead of before */
    iconAfter?: boolean;
    /** Path to navigate to automatically when clicked, if not blank; use `:back` to go back in history */
    navigateTo?: string;
    /** Set to true to disable keyboard focus for this button */
    disableKeyboardFocus?: boolean;
  }
}
