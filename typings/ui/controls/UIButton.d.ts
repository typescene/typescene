import { UIControl } from "./UIControl";
/** Represents a button component */
export declare class UIButton extends UIControl {
    static preset(presets: UIButton.Presets): Function;
    /** Creates a preset button class with given label and onClick handler, if any */
    static withLabel(label: string, onClick?: string): typeof UIButton;
    /** Creates a preset button class with given icon *only*, and onClick handler, if any */
    static withIcon(icon: string, onClick?: string, size?: string | number, color?: string): typeof UIButton;
    /** Create a new button with given label */
    constructor(label?: string);
    style: import("../UIStyle").UIStyle;
    shrinkwrap: boolean;
    isFocusable(): boolean;
    isKeyboardFocusable(): boolean;
    /** Set to true to disable keyboard focus for this button */
    disableKeyboardFocus?: boolean;
    /** Label text */
    label: string;
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
/** Shortcut for `UIButton` constructor preset with the `button_primary` style set */
export declare let UIPrimaryButton: typeof UIButton;
/** Shortcut for `UIButton` constructor preset with the `button_borderless` style set */
export declare let UIBorderlessButton: typeof UIButton;
/** Shortcut for `UIButton` constructor preset with the `button_outline` style set */
export declare let UIOutlineButton: typeof UIButton;
/** Shortcut for `UIButton` constructor preset with the `button_link` style set */
export declare let UILinkButton: typeof UIButton;
/** Shortcut for `UIButton` constructor preset with the `button_large` style set */
export declare let UILargeButton: typeof UIButton;
/** Shortcut for `UIButton` constructor preset with the `button_small` style set */
export declare let UISmallButton: typeof UIButton;
/** Shortcut for `UIButton` constructor preset with the `button_icon` style set */
export declare let UIIconButton: typeof UIButton;
export declare namespace UIButton {
    /** UILabel presets type, for use with `Component.with` */
    interface Presets extends UIControl.Presets {
        /** Label text */
        label?: string;
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
        /** Path to navigate to when clicked (overrides onClick handler), *or* `:back` to go back in history when clicked */
        navigateTo?: string;
        /** Set to true to disable keyboard focus for this button */
        disableKeyboardFocus?: boolean;
    }
}
