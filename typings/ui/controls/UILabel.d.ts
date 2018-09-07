import { Binding } from "../../core";
import { UIStyle } from "../UIStyle";
import { UIControl } from "./UIControl";
export declare class UILabel extends UIControl {
    static withText(text: string | Binding, style?: UIStyle.TextStyle | UIStyle | string): typeof UILabel;
    static withIcon(icon: string | Binding, size?: string | number, color?: string): typeof UILabel;
    static preset(presets: UILabel.Presets): Function;
    constructor(text?: string);
    style: UIStyle;
    shrinkwrap: boolean;
    isFocusable(): boolean;
    isKeyboardFocusable(): boolean;
    allowFocus?: boolean;
    allowKeyboardFocus?: boolean;
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
    htmlFormat: boolean;
    text: string;
    icon?: string;
    iconSize?: string | number;
    iconMargin?: string | number;
    iconColor?: string;
    iconAfter?: boolean;
}
export declare let UIHeading1: typeof UILabel;
export declare let UIHeading2: typeof UILabel;
export declare let UIHeading3: typeof UILabel;
export declare let UIParagraph: typeof UILabel;
export declare let UICloseLabel: typeof UILabel;
export declare let UIExpandedLabel: typeof UILabel;
export declare function tl(text: string): typeof UILabel;
export declare namespace UILabel {
    interface Presets extends UIControl.Presets {
        headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
        htmlFormat?: boolean;
        text?: string;
        icon?: string;
        iconSize?: string | number;
        iconMargin?: string | number;
        iconColor?: string;
        iconAfter?: boolean;
        allowFocus?: boolean;
        allowKeyboardFocus?: boolean;
    }
}
