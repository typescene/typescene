import type { NavigationTarget } from "../../app";
import { Binding, strf } from "../../core";
import { Stringable } from "../UIComponent";
import { UITheme, UIColor } from "../UITheme";
import { UIControl } from "./UIControl";

// NOTE: button click handlers are defined in the platform package, not here.
// This is to accomodate special cases like right-click, ctrl-click, etc.
// The click handler emits a 'Navigate' action event (if the button is not disabled),
// which is handled by `AppActivity` unless overridden, which uses the
// getNavigationTarget method defined here.

/** Represents a button component */
export class UIButton extends UIControl {
  static preset(presets: UIButton.Presets): Function {
    // quietly change 'text' to label to support JSX tag content
    if ("text" in (presets as any)) presets.label = (presets as any).text;

    // use a 'link' role automatically if navigation target is specified
    if ((presets.navigateTo || presets.navigationTarget) && !presets.accessibleRole) {
      presets.accessibleRole = "link";
    }
    return super.preset(presets);
  }

  /** Create a preset button class with given label (localized using `strf`) and onClick handler, if any */
  static withLabel(label: Stringable | Binding, onClick?: string) {
    if (typeof label === "string") label = strf(label);
    return this.with({ label, onClick });
  }

  /** Create a preset button class with given icon *only*, and onClick handler, if any */
  static withIcon(
    icon: string,
    onClick?: string,
    size?: string | number,
    color?: UIColor | string
  ) {
    return this.with({ icon, iconSize: size, iconColor: color, onClick });
  }

  /** Create a new button view component with given label */
  constructor(label?: Stringable) {
    super();
    this.style = UITheme.getStyle("control", "button");
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
  iconColor?: UIColor | string;

  /** Set to true to make the icon appear after the text instead of before */
  iconAfter?: boolean;

  /** Path to navigate to automatically when clicked, if not blank; use `:back` to go back in history */
  navigateTo?: string;

  /** Navigation target, can be bound to an `AppActivity.navigationTarget` property, if set */
  navigationTarget?: NavigationTarget;

  /** Returns the navigation target for this button (as a string or `NavigationTarget` instance), if either `navigateTo` or `navigationTarget` properties have been set */
  getNavigationTarget() {
    return this.navigationTarget || this.navigateTo;
  }
}

/** Shortcut for `UIButton` constructor preset with the `button_primary` named style from the current theme (see `UITheme`) */
export let UIPrimaryButton = UIButton.with({ style: "button_primary" });

/** Shortcut for `UIButton` constructor preset with the `button_borderless` named style from the current theme (see `UITheme`) */
export let UIBorderlessButton = UIButton.with({ style: "button_borderless" });

/** Shortcut for `UIButton` constructor preset with the `button_outline` named style from the current theme (see `UITheme`) */
export let UIOutlineButton = UIButton.with({ style: "button_outline" });

/** Shortcut for `UIButton` constructor preset with the `button_link` named style from the current theme (see `UITheme`) */
export let UILinkButton = UIButton.with({ style: "button_link" });

/** Shortcut for `UIButton` constructor preset with the `button_large` named style from the current theme (see `UITheme`) */
export let UILargeButton = UIButton.with({ style: "button_large" });

/** Shortcut for `UIButton` constructor preset with the `button_small` named style from the current theme (see `UITheme`) */
export let UISmallButton = UIButton.with({ style: "button_small" });

/** Shortcut for `UIButton` constructor preset with the `button_icon` named style from the current theme (see `UITheme`) */
export let UIIconButton = UIButton.with({ style: "button_icon" });

export namespace UIButton {
  /** UIButton presets type, for use with `Component.with` */
  export interface Presets extends UIControl.Presets {
    /** Button label text */
    label?: Stringable;
    /** Icon name (platform and build system dependent) */
    icon?: string;
    /** Icon size (in dp or string with unit) */
    iconSize?: string | number;
    /** Margin between icon and text (in dp or string with unit) */
    iconMargin?: string | number;
    /** Icon color (`UIColor` or string) */
    iconColor?: UIColor | string;
    /** Set to true to make the icon appear after the text instead of before */
    iconAfter?: boolean;
    /** Path to navigate to automatically when clicked, if not blank; use `:back` to go back in history */
    navigateTo?: string;
    /** Navigation target, can be bound to an `AppActivity.navigationTarget` property, if set */
    navigationTarget?: NavigationTarget;
    /** Set to true to disable keyboard focus for this button */
    disableKeyboardFocus?: boolean;
  }
}
