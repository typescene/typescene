import { Binding, strf } from "../../core";
import { Stringable } from "../UIComponent";
import { UIStyle } from "../UIStyle";
import { UITheme, UIColor } from "../UITheme";
import { UIControl } from "./UIControl";

/** Represents a UI component that contains a piece of text */
export class UILabel extends UIControl {
  /** Create a preset label class with given text (localized using `strf`) and style override, if any */
  static withText(
    text: Stringable | Binding,
    style?: UIStyle.TextStyle | UIStyle | string
  ) {
    if (typeof text === "string") text = strf(text);
    return style instanceof UIStyle || typeof style === "string"
      ? this.with({ text, style })
      : style
      ? this.with({ text, textStyle: style })
      : this.with({ text });
  }

  /** Create a preset label class with given icon *only* */
  static withIcon(
    icon: string | Binding,
    size?: string | number,
    color?: UIColor | string
  ) {
    return this.with({ icon, iconSize: size, iconColor: color });
  }

  static preset(presets: UILabel.Presets): Function {
    if (presets.allowKeyboardFocus) presets.allowFocus = presets.allowKeyboardFocus;
    return super.preset(presets);
  }

  /** Create a new label view component with given text */
  constructor(text?: Stringable) {
    super();
    this.style = UITheme.getStyle("control", "label");
    if (text !== undefined) this.text = text;
  }

  isFocusable() {
    return !!(this.allowFocus || this.allowKeyboardFocus);
  }

  isKeyboardFocusable() {
    return !!this.allowKeyboardFocus;
  }

  /** True if this label may receive direct input focus using the mouse, touch, or using `UIComponent.requestFocus` (cannot be changed after rendering this component), defaults to false */
  allowFocus?: boolean;

  /** True if this label may receive input focus using the keyboard and all other methods (cannot be changed after rendering this component), defaults to false */
  allowKeyboardFocus?: boolean;

  /** Heading level (1 = largest) */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;

  /** True if text should be rendered as HTML instead of plain text */
  htmlFormat = false;

  /** Label text */
  text?: Stringable;

  /** Icon name (platform and build system dependent) */
  icon?: string;

  /** Icon size (in dp or string with unit) */
  iconSize?: string | number;

  /** Margin between icon and label text (in dp or string with unit) */
  iconMargin?: string | number;

  /** Icon color (`UIColor` or string) */
  iconColor?: UIColor | string;

  /** Set to true to make the icon appear after the text instead of before */
  iconAfter?: boolean;
}

/** Shortcut for `UILabel` constructor preset with the `heading1` style set, and `UILabel.headingLevel` set to 1 */
export let UIHeading1 = UILabel.with({ headingLevel: 1, style: "heading1" });

/** Shortcut for `UILabel` constructor preset with the `heading2` style set, and `UILabel.headingLevel` set to 2 */
export let UIHeading2 = UILabel.with({ headingLevel: 2, style: "heading2" });

/** Shortcut for `UILabel` constructor preset with the `heading3` style set, and `UILabel.headingLevel` set to 3 */
export let UIHeading3 = UILabel.with({ headingLevel: 3, style: "heading3" });

/** Shortcut for `UILabel` constructor preset with the `paragraph` style set, which automatically wraps text across multiple lines */
export let UIParagraph = UILabel.with({ style: "paragraph" });

/** Shortcut for `UILabel` constructor preset with the `label_close` style set, which removes any margin or padding */
export let UICloseLabel = UILabel.with({ style: "label_close" });

/** Shortcut for `UILabel` constructor preset such that the label takes up as much space as possible */
export let UIExpandedLabel = UILabel.with({ shrinkwrap: false });

export namespace UILabel {
  /** UILabel presets type, for use with `Component.with` */
  export interface Presets extends UIControl.Presets {
    /** Heading level (1-6, or undefined for no heading) */
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
    /** True if text should be rendered as HTML instead of plain text */
    htmlFormat?: boolean;
    /** Label text */
    text?: Stringable;
    /** Icon name (platform and build system dependent) */
    icon?: string;
    /** Icon size (in dp or string with unit) */
    iconSize?: string | number;
    /** Margin between icon and label text (in dp or string with unit) */
    iconMargin?: string | number;
    /** Icon color (`UIColor` or string) */
    iconColor?: UIColor | string;
    /** Set to true to make the icon appear after the text instead of before */
    iconAfter?: boolean;
    /** Set to true to allow this label to receive input focus using mouse, touch, or `UIComponent.requestFocus` */
    allowFocus?: boolean;
    /** Set to true to allow this label to receive input focus using the keyboard as well as other methods; implies `allowFocus` */
    allowKeyboardFocus?: boolean;
  }
}
