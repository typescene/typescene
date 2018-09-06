import { Binding } from "../../core";
import { UIStyle } from "../UIStyle";
import { UIControl } from "./UIControl";
/** Represents a UI component that contains a piece of text */
export declare class UILabel extends UIControl {
    /** Creates a preset label class with given text and style override, if any */
    static withText(text: string | Binding, style?: UIStyle.TextStyle | UIStyle | string): typeof UILabel;
    /** Creates a preset label class with given icon *only* */
    static withIcon(icon: string | Binding, size?: string | number, color?: string): typeof UILabel;
    static preset(presets: UILabel.Presets): Function;
    /** Create a new label with given text */
    constructor(text?: string);
    style: UIStyle;
    shrinkwrap: boolean;
    isFocusable(): boolean;
    isKeyboardFocusable(): boolean;
    /** True if this label may receive direct input focus using the mouse, touch, or using `UIComponent.requestFocus` (cannot be changed after rendering this component), defaults to false */
    allowFocus?: boolean;
    /** True if this label may receive input focus using the keyboard and all other methods (cannot be changed after rendering this component), defaults to false */
    allowKeyboardFocus?: boolean;
    /** Heading level (1 = largest) */
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
    /** True if text should be rendered as HTML instead of plain text */
    htmlFormat: boolean;
    /** Label text */
    text: string;
    /** Icon name (platform and build system dependent) */
    icon?: string;
    /** Icon size (in dp or string with unit) */
    iconSize?: string | number;
    /** Margin between icon and label text (in dp or string with unit) */
    iconMargin?: string | number;
    /** Icon color */
    iconColor?: string;
    /** Set to true to make the icon appear after the text instead of before */
    iconAfter?: boolean;
}
/** Shortcut for `UILabel` constructor preset with the `heading1` style set, and `UILabel.headingLevel` set to 1 */
export declare let UIHeading1: typeof UILabel;
/** Shortcut for `UILabel` constructor preset with the `heading2` style set, and `UILabel.headingLevel` set to 2 */
export declare let UIHeading2: typeof UILabel;
/** Shortcut for `UILabel` constructor preset with the `heading3` style set, and `UILabel.headingLevel` set to 3 */
export declare let UIHeading3: typeof UILabel;
/** Shortcut for `UILabel` constructor preset with the `paragraph` style set, which automatically wraps text across multiple lines */
export declare let UIParagraph: typeof UILabel;
/** Shortcut for `UILabel` constructor preset with the `label_close` style set, which removes any margin or padding */
export declare let UICloseLabel: typeof UILabel;
/** Shortcut for `UILabel` constructor preset such that the label takes up as much space as possible */
export declare let UIExpandedLabel: typeof UILabel;
/**
 * Shortcut function that returns a `UILabel` constructor with given text.
 * If the text contains tags of the format `${...}` then the text is first wrapped in a call to `bindf`, to include nested bindings and format the result.
 * If the text starts with a tag in curly braces (i.e. `{...}`), then the result is affected in the following ways:
 * - {b} mixes in a text style that sets the `bold` flag
 * - {i} mixes in a text style that sets the `italic` flag
 * - {h1} through {h3} return a `UIHeading1`, `UIHeading2`, or `UIHeading3` constructor
 * - {p} returns a `UIParagraph` constructor
 * - {c} returns a `UICloseLabel` constructor
 * - {x} returns an `UIExpandedLabel` constructor
 * - {10} mixes in a text style with given font size (any number, optionally followed by a CSS unit)
 * - {@color} mixes in a text style with given text color (any color defined by the current theme)
 *
 * @note The style tags above can be combined using the `|` (pipe) character where possible, e.g. `{b|i|20|@color}`.
 * @note The text will also be translated when language services are implemented; either using a filter in the `bindf` call, or directly using the current language service. This function will then return a 'translated label' (hence 'tl').
 */
export declare function tl(text: string): typeof UILabel;
export declare namespace UILabel {
    /** UILabel presets type, for use with `Component.with` */
    interface Presets extends UIControl.Presets {
        /** Heading level (1-6, or undefined for no heading) */
        headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
        /** True if text should be rendered as HTML instead of plain text */
        htmlFormat?: boolean;
        /** Label text */
        text?: string;
        /** Icon name (platform and build system dependent) */
        icon?: string;
        /** Icon size (in dp or string with unit) */
        iconSize?: string | number;
        /** Margin between icon and label text (in dp or string with unit) */
        iconMargin?: string | number;
        /** Icon color */
        iconColor?: string;
        /** Set to true to make the icon appear after the text instead of before */
        iconAfter?: boolean;
        /** Set to true to allow this label to receive input focus using mouse, touch, or `UIComponent.requestFocus` */
        allowFocus?: boolean;
        /** Set to true to allow this label to receive input focus using the keyboard as well as other methods; implies `allowFocus` */
        allowKeyboardFocus?: boolean;
    }
}
