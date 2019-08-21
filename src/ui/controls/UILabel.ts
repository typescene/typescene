import { bindf, Binding, tt } from "../../core";
import { Stringable } from "../UIComponent";
import { UIStyle } from "../UIStyle";
import { UITheme } from "../UITheme";
import { UIControl } from "./UIControl";

/** Represents a UI component that contains a piece of text */
export class UILabel extends UIControl {
  /** Creates a preset label class with given text (localized using `tt` if available) and style override, if any */
  static withText(
    text: Stringable | Binding,
    style?: UIStyle.TextStyle | UIStyle | string
  ) {
    if (typeof text === "string") text = tt(text);
    return style instanceof UIStyle || typeof style === "string"
      ? this.with({ text, style })
      : style
      ? this.with({ text, textStyle: style })
      : this.with({ text });
  }

  /** Creates a preset label class with given icon *only* */
  static withIcon(icon: string | Binding, size?: string | number, color?: Stringable) {
    return this.with({ icon, iconSize: size, iconColor: color });
  }

  static preset(presets: UILabel.Presets): Function {
    if (presets.allowKeyboardFocus) presets.allowFocus = presets.allowKeyboardFocus;
    return super.preset(presets);
  }

  /** Create a new label with given text */
  constructor(text?: string) {
    super();
    if (text !== undefined) this.text = text;
  }

  style = UITheme.current.baseControlStyle.mixin(UITheme.current.styles["label"]);
  shrinkwrap = true;

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
  iconColor?: Stringable;

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

/**
 * Shortcut function that returns a `UILabel` constructor with given text (a 'text label', hence `tl`), and optional text styles.
 * If the text contains tags of the format `${...}` then the text is first wrapped in a call to `bindf`, to include nested bindings and format the result. This also enables the use of `#{...}` tags for pluralization.
 * If the text _starts_ with a tag in curly braces (i.e. `{...}`), then the result is affected in the following ways:
 * - {b} mixes in a text style that sets the `bold` flag
 * - {i} mixes in a text style that sets the `italic` flag
 * - {h1} through {h3} return a `UIHeading1`, `UIHeading2`, or `UIHeading3` constructor
 * - {p} returns a `UIParagraph` constructor
 * - {c} returns a `UICloseLabel` constructor
 * - {x} returns an `UIExpandedLabel` constructor
 * - {10} mixes in a text style with given font size (any number, optionally followed by a CSS unit)
 * - {@color} mixes in a text style with given text color (any color defined by the current theme)
 * - {!tt} prevents translation of the string (see below)
 *
 * @note The style tags above can be combined using the `|` (pipe) character where possible, e.g. `{b|i|20|@color}`.
 *
 * @note The text string (excluding initial tag) is passed through the `tt` function for translation upon construction of the `UILabel` component whenever an `I18nService` instance has been registered.
 */
export function tl(text: string, textStyle?: Partial<UIStyle.TextStyle>) {
  let constructor: typeof UILabel = UILabel;
  let noTT: boolean | undefined;
  if (text[0] === "{") {
    let lastIndex = text.indexOf("}");
    if (lastIndex > 0) {
      if (!textStyle) textStyle = {};
      let styleTag = text.slice(1, lastIndex);
      text = text.slice(lastIndex + 1);
      for (let tag of styleTag.split("|")) {
        switch (tag) {
          case "h1":
            constructor = UIHeading1;
            break;
          case "h2":
            constructor = UIHeading2;
            break;
          case "h3":
            constructor = UIHeading3;
            break;
          case "p":
            constructor = UIParagraph;
            break;
          case "c":
            constructor = UICloseLabel;
            break;
          case "x":
            constructor = UIExpandedLabel;
            break;
          case "b":
            textStyle.bold = true;
            break;
          case "i":
            textStyle.italic = true;
            break;
          case "!tt":
            noTT = true;
            break;
          default:
            if (tag[0] === "@") {
              textStyle.color = tag;
              break;
            } else if (/^[\d\.]+$/.test(tag)) {
              textStyle.fontSize = parseFloat(tag);
              break;
            } else if (/^\d/.test(tag)) {
              textStyle.fontSize = tag;
              break;
            }
        }
      }
    }
  }
  let resultText: any = noTT ? text : tt(text);
  if (text.indexOf("${") >= 0) resultText = bindf(resultText);
  return constructor.with({ text: resultText, textStyle });
}

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
    iconColor?: Stringable;
    /** Set to true to make the icon appear after the text instead of before */
    iconAfter?: boolean;
    /** Set to true to allow this label to receive input focus using mouse, touch, or `UIComponent.requestFocus` */
    allowFocus?: boolean;
    /** Set to true to allow this label to receive input focus using the keyboard as well as other methods; implies `allowFocus` */
    allowKeyboardFocus?: boolean;
  }
}
