import { Application } from "../../app";
import { Binding } from "../../core";
import { UIComponent } from "../UIComponent";
import { UITheme } from "../UITheme";
import { UIControl } from "./UIControl";

/** Represents a button component */
export class UIButton extends UIControl {
    static preset(presets: UIButton.Presets): Function {
        if (presets.navigateTo) {
            let path = presets.navigateTo;
            if (Binding.isBinding(path)) {
                throw TypeError("[UIButton] Property navigateTo cannot be bound");
            }
            delete presets.navigateTo;
            presets.onClick = function (this: UIComponent) {
                let app = this.getCompositeParent(Application);
                app && app.navigate(path);
            }
        }
        return super.preset(presets);
    }

    /** Creates a preset button class with given label and onClick handler, if any */
    static withLabel(label: string, onClick?: string) {
        return this.with({ label, onClick });
    }

    /** Creates a preset button class with given icon *only*, and onClick handler, if any */
    static withIcon(icon: string, onClick?: string, size?: string | number, color?: string) {
        return this.with({ icon, iconSize: size, iconColor: color, onClick });
    }

    /** Create a new button with given label */
    constructor(label?: string) {
        super();
        if (label !== undefined) this.label = label;
    }

    style = UITheme.current.baseControlStyle.mixin(UITheme.current.styles["button"]);
    shrinkwrap = true;

    isFocusable() { return true }
    isKeyboardFocusable() { return !this.disableKeyboardFocus }

    /** Set to true to disable keyboard focus for this button */
    disableKeyboardFocus?: boolean;

    /** Label text */
    label = "";

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
