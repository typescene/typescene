import { UIRenderableConstructor, UITransitionType } from "./UIComponent";
import { UIStyle } from "./UIStyle";
/** Confirmation/alert dialog builder, platform dependent, used by `ViewActivity.showConfirmationDialogAsync` (abstract) */
export declare abstract class ConfirmationDialogBuilder {
    /** Set the dialog title */
    abstract setTitle(title: string): this;
    /** Add a block of text to be displayed as a paragraph */
    abstract addMessage(message: string): this;
    /** Set the text label of the primary confirmation button */
    abstract setConfirmButtonLabel(label: string): this;
    /** Set the text label of the cancel button */
    abstract setCancelButtonLabel(label: string): this;
    /** Build a constructor for a renderable dialog with the current options, which should emit a `CloseModal` or `Confirm` event when closing the dialog */
    abstract build(): UIRenderableConstructor;
}
/** Dynamic menu builder, platform dependent (abstract) */
export declare abstract class UIMenuBuilder {
    /** Remove all current menu items */
    abstract clear(): this;
    /** Add a menu option with given key, text, icon, and hint */
    abstract addOption(key: string, text: string, icon?: string, hint?: string, hintIcon?: string, textStyle?: Partial<UIStyle.TextStyle>, hintStyle?: Partial<UIStyle.TextStyle>): this;
    /** Add a list of selectable menu options */
    abstract addSelectionGroup(options: Array<{
        key: string;
        text: string;
    }>, selectedKey?: string, textStyle?: Partial<UIStyle.TextStyle>): this;
    /** Add a menu separator */
    abstract addSeparator(): this;
    /** Set the alignment of the menu to its related component (`start`, `stretch`, or `end`), if applicable */
    abstract setGravity(gravity: "start" | "stretch" | "end"): this;
    /** Set the animation that plays when the menu is displayed, if applicable */
    abstract setRevealTransition(transition: UITransitionType): this;
    /** Set the animation that plays when the menu is removed, if applicable */
    abstract setExitTransition(transition: UITransitionType): this;
    /** Build a constructor for a menu with the current options, which should emit a `SelectMenuItem` event (of type `UIMenuItemSelectedEvent`) when an item is selected, and a `CloseModal` event to close the menu */
    abstract build(): UIRenderableConstructor;
}
/** Represents a set of default styles and component presets */
export declare class UITheme {
    /** The current theme. This value may be changed but it is not observed. */
    static current: UITheme;
    /** Returns true if the pseudo-luminance of given color (in hex format `#112233` or `#123` or rgb(a) format `rgb(255, 255, 255)` or hsl format `hsl(255, 0%, 0%)`) is greater than 55%; can be used e.g. to decide on a contrasting text color for a given background color */
    static isBrightColor(color: string): boolean;
    /** Returns a color in rgb(a) format (e.g. `rgb(40,60,255)` `rgba(40,60,255,.5)`) that lies between given colors (in hex format `#112233` or `#123` or rgb(a) format `rgb(255, 255, 255)`) at given point (0-1, with 0 being the same as the first color, 1 being the same as the second color, and 0.5 being an equal mix) */
    static mixColors(color1: string, color2: string, p: number): string;
    /**
     * Replace color variables in given string with colors from `UITheme.colors`.
     * - `@green` is substituted with the color `green` defined in `UITheme.colors`
     * - `@green-20%` takes the color `green` and darkens by 20%
     * - `@green+20%` takes the color `green` and lightens by 20%
     * - `@green^-20%` takes the color `green` and darkens light colors, lightens dark colors by 20%
     * - `@green^+20%` takes the color `green` and lightens light colors, darkens dark colors by 20%
     * - `@green/80%` takes the color `green` and makes it 20% (more) transparent
     * - `@green:text` is substituted with a contrasting text color (mostly-opaque white or black) that is readable on the color `green`.
     */
    static replaceColor(color: string): string;
    /** Base container style, should not need to be overridden at all */
    baseContainerStyle: UIStyle;
    /** Base control style, can be overridden and extended with e.g. default text style set */
    baseControlStyle: UIStyle;
    /** Dialog backdrop shader opacity (for `DialogViewActivity`), defaults to 0.3 */
    modalDialogShadeOpacity: number;
    /** Default confirmation/alert dialog builder used by `ViewActivity.showConfirmationDialogAsync` */
    ConfirmationDialogBuilder?: new () => ConfirmationDialogBuilder;
    /** Default platform dependent menu builder */
    MenuBuilder?: new () => UIMenuBuilder;
    /** Set of predefined colors */
    colors: {
        [name: string]: string;
    };
    /** Define a new color with given name; may reference another color, see `UITheme.replaceColor` */
    addColor(name: string, color: string): this;
    /** Set of basic icons that can be used on labels or buttons (empty by default) */
    icons: {
        [name: string]: string;
    };
    /** Define a new icon with given name */
    addIcon(name: string, icon: string): this;
    /** Set of named style set mixins that can be applied to a UI component, or on a preset object using the `style` property in the first argument to `Component.with`. Overridden styles should also include base styles (`button`, `button_primary`, etc.) */
    styles: {
        [name: string]: UIStyle;
    };
    /** Add a mixin style with given name and style set */
    addStyle(name: string, styles: Partial<UIStyle.StyleObjects>): this;
    /** Add given mixin styles, using their own name (i.e. `UIStyle.name`) */
    addStyles(...styles: UIStyle[]): this;
}
