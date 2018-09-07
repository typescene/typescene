import { UIControl } from "./UIControl";
export declare class UIButton extends UIControl {
    static preset(presets: UIButton.Presets): Function;
    static withLabel(label: string, onClick?: string): typeof UIButton;
    static withIcon(icon: string, onClick?: string, size?: string | number, color?: string): typeof UIButton;
    constructor(label?: string);
    style: import("../UIStyle").UIStyle;
    shrinkwrap: boolean;
    isFocusable(): boolean;
    isKeyboardFocusable(): boolean;
    disableKeyboardFocus?: boolean;
    label: string;
    icon?: string;
    iconSize?: string | number;
    iconMargin?: string | number;
    iconColor?: string;
    iconAfter?: boolean;
}
export declare let UIPrimaryButton: typeof UIButton;
export declare let UIBorderlessButton: typeof UIButton;
export declare let UIOutlineButton: typeof UIButton;
export declare let UILinkButton: typeof UIButton;
export declare let UILargeButton: typeof UIButton;
export declare let UISmallButton: typeof UIButton;
export declare let UIIconButton: typeof UIButton;
export declare namespace UIButton {
    interface Presets extends UIControl.Presets {
        label?: string;
        icon?: string;
        iconSize?: string | number;
        iconMargin?: string | number;
        iconColor?: string;
        iconAfter?: boolean;
        navigateTo?: string;
        disableKeyboardFocus?: boolean;
    }
}
