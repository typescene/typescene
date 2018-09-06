import { UIRenderableConstructor, UITransitionType } from "./UIComponent";
import { UIStyle } from "./UIStyle";

/** Confirmation/alert dialog builder, platform dependent, used by `ViewActivity.showConfirmationDialogAsync` (abstract) */
export abstract class ConfirmationDialogBuilder {
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
export abstract class UIMenuBuilder {
    /** Remove all current menu items */
    abstract clear(): this;
    /** Add a menu option with given key, text, icon, and hint */
    abstract addOption(key: string, text: string, icon?: string,
        hint?: string, hintIcon?: string,
        textStyle?: Partial<UIStyle.TextStyle>,
        hintStyle?: Partial<UIStyle.TextStyle>): this;
    /** Add a list of selectable menu options */
    abstract addSelectionGroup(options: Array<{ key: string, text: string }>,
        selectedKey?: string, textStyle?: Partial<UIStyle.TextStyle>): this;
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
export class UITheme {
    /** The current theme. This value may be changed but it is not observed. */
    static current: UITheme;

    /** Returns true if the pseudo-luminance of given color (in hex format `#112233` or `#123` or rgb(a) format `rgb(255, 255, 255)` or hsl format `hsl(255, 0%, 0%)`) is greater than 55%; can be used e.g. to decide on a contrasting text color for a given background color */
    public static isBrightColor(color: string) {
        color = String(color);
        if (color[0] === "#") {
            if (color.length === 4) {
                color = "#" + color[1] + color[1] +
                    color[2] + color[2] +
                    color[3] + color[3];
            }
            let r = parseInt(color.slice(1, 3), 16);
            let g = parseInt(color.slice(3, 5), 16);
            let b = parseInt(color.slice(5, 7), 16);
            return (0.3 * r + 0.6 * g + 0.1 * b) > 140;
        }
        else if (color.slice(0, 4) === "rgb(" || color.slice(0, 5) === "rgba(") {
            let v = color.slice(4).split(",").map(parseFloat);
            return (0.3 * v[0] + 0.6 * v[1] + 0.1 * v[2]) > 140;
        }
        else if (color.slice(0, 4) === "hsl(") {
            let lum = parseFloat(color.slice(4).split(",")[2]);
            return lum > 55;
        }
        else return true;
    }

    /** Returns a color in rgb(a) format (e.g. `rgb(40,60,255)` `rgba(40,60,255,.5)`) that lies between given colors (in hex format `#112233` or `#123` or rgb(a) format `rgb(255, 255, 255)`) at given point (0-1, with 0 being the same as the first color, 1 being the same as the second color, and 0.5 being an equal mix) */
    public static mixColors(color1: string, color2: string, p: number) {
        function parse(color: string) {
            let result = [0,0,0,1];
            color = String(color);
            if (color[0] === "#") {
                if (color.length === 4) {
                    color = "#" + color[1] + color[1] +
                        color[2] + color[2] +
                        color[3] + color[3];
                }
                result[0] = parseInt(color.slice(1, 3), 16);
                result[1] = parseInt(color.slice(3, 5), 16);
                result[2] = parseInt(color.slice(5, 7), 16);
            }
            else if (color.slice(0, 5) === "rgba(") {
                color.slice(5).split(",")
                    .forEach((n, i) => { result[i] = parseFloat(n) });
            }
            else if (color.slice(0, 4) === "rgb(") {
                color.slice(4).split(",")
                    .forEach((n, i) => { result[i] = parseFloat(n) });
            }
            else if (color === "transparent") {
                result[3] = 0;
            }
            return result;
        }
        let q = 1 - p;
        function mix(n1: number, n2: number) {
            return (n1 === n2) ? n1 :
                isNaN(n1) ? n2 : isNaN(n2) ? n1 :
                Math.floor(q * n1 + p * n2);
        }
        let c1 = parse(color1);
        let c2 = parse(color2);
        let rgbStr = mix(c1[0], c2[0]) + "," + mix(c1[1], c2[1]) + "," + mix(c1[2], c2[2]);
        let alpha = q * c1[3] + p * c2[3];
        return alpha >= 1 ? "rgb(" + rgbStr + ")" : "rgba(" + rgbStr + "," + alpha + ")";
    }

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
    static replaceColor(color: string) {
        if (!color) return color;
        return color.replace(/\@(\w+)((\^)?[\+\-]\d+\%)?(\/\d+\%)?(\:text)?/g, (_str, id, lum, contrast, alpha, txt) => {
            let result = (this.current.colors as any)[id] || "rgba(1,2,3,0)";
            if (/\@\w/.test(result)) result = this.replaceColor(result);
            if (lum) {
                let p = parseFloat(contrast ? lum.slice(1) : lum) / 100;
                if (contrast && !this.isBrightColor(result)) p = -p;
                result = this.mixColors(result, p > 0 ? "#fff" : "#000", Math.abs(p));
            }
            if (alpha) {
                let p = parseFloat(alpha.slice(1)) / 100;
                result = this.mixColors(result, "rgba(,,,0)", 1 - p);
            }
            if (txt) {
                result = this.isBrightColor(result) ?
                    "rgba(0,0,0,.8)" : "rgba(255,255,255,.95)";
            }
            return result;
        });
    }

    /** Base container style, should not need to be overridden at all */
    baseContainerStyle = UIStyle.create("UIContainer", {
        position: { gravity: "stretch" },
        dimensions: { grow: 1, shrink: 0 },
        containerLayout: {
            gravity: "stretch",
            axis: "vertical",
            distribution: "start",
            wrapContent: false
        }
    });

    /** Base control style, can be overridden and extended with e.g. default text style set */
    baseControlStyle = UIStyle.create("UIControl", {
        position: { gravity: "baseline" },
        dimensions: { shrink: 1, grow: 0 }
    });

    /** Dialog backdrop shader opacity (for `DialogViewActivity`), defaults to 0.3 */
    modalDialogShadeOpacity = .3;
    
    /** Default confirmation/alert dialog builder used by `ViewActivity.showConfirmationDialogAsync` */
    ConfirmationDialogBuilder?: new () => ConfirmationDialogBuilder;

    /** Default platform dependent menu builder */
    MenuBuilder?: new () => UIMenuBuilder;

    /** Set of predefined colors */
    colors: { [name: string]: string } = {
        red: "red",
        green: "green",
        blue: "blue",
        black: "black",
        white: "white",
        primary: "@blue",
        accent: "@red",
        background: "@white",
        text: "@background:text",
        separator: "@background^-50%/20%",
        modalShade: "@black"
    };

    /** Define a new color with given name; may reference another color, see `UITheme.replaceColor` */
    addColor(name: string, color: string) {
        this.colors[name] = color;
        return this;
    }

    /** Set of basic icons that can be used on labels or buttons (empty by default) */
    icons: { [name: string]: string } = {};

    /** Define a new icon with given name */
    addIcon(name: string, icon: string) {
        this.icons[name] = icon;
        return this;
    }

    /** Set of named style set mixins that can be applied to a UI component, or on a preset object using the `style` property in the first argument to `Component.with`. Overridden styles should also include base styles (`button`, `button_primary`, etc.) */
    styles: { [name: string]: UIStyle } = {};

    /** Add a mixin style with given name and style set */
    addStyle(name: string, styles: Partial<UIStyle.StyleObjects>) {
        this.styles[name] = UIStyle.create(name, styles);
        return this;
    }

    /** Add given mixin styles, using their own name (i.e. `UIStyle.name`) */
    addStyles(...styles: UIStyle[]) {
        for (let style of styles) {
            this.styles[style.name] = style;
        }
        return this;
    }
}
