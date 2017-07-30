import * as Async from "@typescene/core/Async";
import { ObservableObject } from "@typescene/core/Async";
import { Style, Screen } from "@typescene/core/UI";
import { Stylesheet, applyStylesheet } from "./Stylesheet";
import rebootStylesDefinition from "./styles/reboot";
import controlStylesDefinition from "./styles/controls";

/** A set of predefined styles and style sheets that are used by specific components; these may be modified to apply a "theme", which will generally update all styles in the DOM asynchronously; _however_, styles defined here are subject to change for now and it is not guaranteed that selectors and class names will continue to exist across versions */
export namespace Styles {
    /** Groups basic component style sheet definitions together, indexed by class name (e.g. "UI-Container") */
    export const components: { readonly [className: string]: Stylesheet } = {};

    /** Contains basic font settings that are applied globally for this instance; to disable, either set value(s) to `inherit`, or disable `cssReset` altogether */
    export const font = Async.observe({
        /** Base font family (defaults to system font stack) */
        family: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Oxygen-Sans, Ubuntu, \"Helvetica Neue\", Arial, sans-serif"
    });

    /** Contains basic measurements that determine the sizing of text and certain components; custom observable properties can be added here if required */
    export const size = Async.observe({
        /** Base font size used for main application layout and dialogs/drawers (defaults to `1rem`) */
        text: "1rem",

        /** Paragraph label line height (defaults to `1.65em`) */
        paragraphLineHeight: "1.65em",

        /** Default space around control elements (defaults to `1rem`) */
        controlSpacing: "1rem",

        /** Outline width of focused selected list elements (defaults to `0`, because background and text coloring is applied instead) */
        listSelectionFocusOutline: "0",

        /** Default border radius of all dialogs (defaults to `.25rem`) */
        dialogBorderRadius: ".25rem",

        /** Default border radius of card components (defaults to `.25rem`) */
        cardBorderRadius: ".25rem",

        /** Default border radius of badge elements (defaults to `.25rem`) */
        badgeBorderRadius: ".25rem",

        /** Default border radius of all buttons (defaults to `0`) */
        buttonBorderRadius: "0",

        /** Default border radius of text/select input elements (defaults to `0`) */
        inputBorderRadius: "0",

        /** Default border width of all controls (e.g. buttons, input elements, defaults to `2px`) */
        controlBorderWidth: "2px"
    });

    /** Contains an observable color scheme based on the color wheel, with a selection of primary and accent colors; custom observable properties can be added here if required */
    export const color = Async.observe({
        /** Darkest black that matches the color scheme */
        black: "#000000",
        /** Lightest white that matches the color scheme */
        white: "#ffffff",
        /** Darker gray color that matches the color scheme */
        darkerGray: "#333333",
        /** Dark to mid-gray color that matches the color scheme */
        darkGray: "#777777",
        /** Light gray color that matches the color scheme */
        lightGray: "#dddddd",
        /** Blueish (silver) dark to mid-gray color that matches the color scheme */
        slate: "#667788",
        /** Blueish (silver) light gray color that matches the color scheme */
        lightSlate: "#c0c8d0",
        /** Bright red color that matches the color scheme */
        red: "#ee3333",
        /** Bright orange color that matches the color scheme */
        orange: "#ee9922",
        /** Bright yellow color that matches the color scheme */
        yellow: "#ddcc33",
        /** Bright lime green color that matches the color scheme */
        lime: "#99bb33",
        /** Bright green color that matches the color scheme */
        green: "#44aa44",
        /** Bright turquoise color that matches the color scheme */
        turquoise: "#33aaaa",
        /** Bright cyan color that matches the color scheme */
        cyan: "#33bbbb",
        /** Bright blue color that matches the color scheme */
        blue: "#3355aa",
        /** Bright violet color that matches the color scheme */
        violet: "#5533aa",
        /** Bright purple color that matches the color scheme */
        purple: "#8833aa",
        /** Bright magenta color that matches the color scheme */
        magenta: "#dd4488",

        /** Background color for main application layout and dialogs/drawers, defaults to pure white */
        background: "#ffffff",

        /** Text color for main application layout and dialogs/drawers (defaults to 80% opaque black) */
        text: "rgba(0,0,0,.8)",

        /** Faded text color used for smaller text before/after label text (defaults to 45% opaque black) */
        textFaded: "rgba(0,0,0,.45)",

        /** Default divider color (defaults to 20% opaque black) */
        divider: "rgba(0,0,0,.2)",

        /** Primary highlight color (defaults to `.blue`), usually a bright color for e.g. heading row backgrounds; set this property to change all primary* properties, _or_ set those directly as well */
        get primary() { return this.primary || this.blue },
        set primary(v: string) { this.primary = v },

        /** Text color to be used on top of primary-colored backgrounds */
        get primaryText() {
            return this.primaryText ||
                (Stylesheet.isBrightColor(this.primary) ?
                    Stylesheet.mixColors(this.primary, "#000000", .8) :
                    "#ffffff");
        },
        set primaryText(v: string) { this.primaryText = v },

        /** Darker shade of the primary color */
        get primaryDark() {
            return this.primaryDark ||
                Stylesheet.mixColors(this.primary, "#000000", .2);
        },
        set primaryDark(v: string) { this.primaryDark = v },

        /** Lighter shade of the primary color */
        get primaryLight() {
            return this.primaryLight ||
                Stylesheet.mixColors(this.primary, "#ffffff", .2);
        },
        set primaryLight(v: string) { this.primaryLight = v },

        /** Accent color (defaults to `.violet`), denotes interactive elements, usually a bright color for e.g. backgrounds of buttons that should stand out; set this property to change `.accentText` as well, _or_ set that directly to override the accent text color */
        get accent() { return this.accent || this.violet },
        set accent(v: string) { this.accent = v },

        /** Text color to be used on top of accent-colored backgrounds */
        get accentText() {
            return this.accentText ||
                (Stylesheet.isBrightColor(this.accent) ?
                    Stylesheet.mixColors(this.accent, "#000000", .8) :
                    "#ffffff");
        },
        set accentText(v: string) { this.accentText = v },

        /** Darker shade of the accent color */
        get accentDark() {
            return this.accentDark ||
                Stylesheet.mixColors(this.accent, "#000000", .2);
        },
        set accentDark(v: string) { this.accentDark = v },

        /** Lighter shade of the accent color */
        get accentLight() {
            return this.accentLight ||
                Stylesheet.mixColors(this.accent, "#ffffff", .2);
        },
        set accentLight(v: string) { this.accentLight = v },

        /** Link text color (defaults to `.blue`); set this property to change `.linkVisitedText` as well, _or_ set that directly to override the visited link text color */
        get linkText() { return this.linkText || this.blue },
        set linkText(v: string) { this.linkText = v },

        /** Visited link text color (defaults to a darker version of link text) */
        get linkVisitedText() {
            return this.linkVisitedText ||
                Stylesheet.mixColors(this.linkText, "#000000", .35);
        },
        set linkVisitedText(v: string) { this.linkVisitedText = v },

        /** Title bar block color (defaults to `.darkerGray`); set this property to change `.titleBarText` as well, _or_ set that directly to override the title bar text color */
        get titleBarBackground() { return this.titleBarBackground || this.darkerGray },
        set titleBarBackground(v: string) { this.titleBarBackground = v },

        /** Text color to be used on top of title bar blocks */
        get titleBarText() {
            return this.titleBarText ||
                (Stylesheet.isBrightColor(this.titleBarBackground) ?
                    Stylesheet.mixColors(this.titleBarBackground, "#000000", .8) :
                    "#ffffff");
        },
        set titleBarText(v: string) { this.titleBarText = v },

        /** Selected but non-focused list item block color (defaults to `.darkGray`); set this property to change `.listSelectionText` as well, _or_ set that directly to override the selected list item text color */
        get listSelectionBackground() { return this.listSelectionBackground || this.darkGray },
        set listSelectionBackground(v: string) { this.listSelectionBackground = v },

        /** Text color to be used on top of selected but non-focused list items */
        get listSelectionText() {
            return this.listSelectionText ||
                (Stylesheet.isBrightColor(this.listSelectionBackground) ?
                    Stylesheet.mixColors(this.listSelectionBackground, "#000000", .8) :
                    "#ffffff");
        },
        set listSelectionText(v: string) { this.listSelectionText = v },

        /** Selected focused list item block color (defaults to darker version of `.listSelectionBackground`); set this property to change `.listSelectionFocusText` as well, _or_ set that directly to override the selected list item text color */
        get listSelectionFocusBackground() {
            return this.listSelectionFocusBackground ||
                Stylesheet.mixColors(this.listSelectionBackground, "#000000", .35);
        },
        set listSelectionFocusBackground(v: string) { this.listSelectionFocusBackground = v },

        /** Text color to be used on top of selected focused list items */
        get listSelectionFocusText() {
            return this.listSelectionFocusText ||
                (Stylesheet.isBrightColor(this.listSelectionFocusBackground) ?
                    Stylesheet.mixColors(this.listSelectionFocusBackground, "#000000", .8) :
                    "#ffffff");
        },
        set listSelectionFocusText(v: string) { this.listSelectionFocusText = v },

        /** Control base color (defaults to `.lightGray`); set this property to change `.controlBaseText` as well, _or_ set that directly to override the control base text color */
        get controlBase() { return this.controlBase || this.lightGray },
        set controlBase(v: string) { this.controlBase = v },

        /** Text color to be used for controls in base color */
        get controlBaseText() {
            return this.controlBaseText ||
                (Stylesheet.isBrightColor(this.controlBase) ?
                    Stylesheet.mixColors(this.controlBase, "#000000", .8) :
                    "#ffffff");
        },
        set controlBaseText(v: string) { this.controlBaseText = v },

        /** Control focus color (defaults to a darker or lighter version of `.controlBase` depending on its lightness); set this property to change `.controlFocusText` as well, _or_ set that directly to override the text color for controls in focus color */
        get controlFocus() {
            return this.controlFocus ||
                (Stylesheet.isBrightColor(this.controlBase) ?
                    Stylesheet.mixColors(this.controlBase, "#000000", .5) :
                    Stylesheet.mixColors(this.controlBase, "#ffffff", .5));
        },
        set controlFocus(v: string) { this.controlFocus = v },

        /** Text color to be used for controls in focus color */
        get controlFocusText() {
            return this.controlFocusText ||
                (Stylesheet.isBrightColor(this.controlFocus) ?
                    Stylesheet.mixColors(this.controlFocus, "#000000", .8) :
                    "#ffffff");
        },
        set controlFocusText(v: string) { this.controlFocusText = v }
    });

    /** CSS reboot stylesheet that defines basic styles for common HTML elements (except those already overridden by `Component` renderers), _enabled by default_: applied as a live stylesheet at the page level for this instance; can be modified to adjust or add CSS reset styles, or disabled using the `.disable()` method if an external CSS reset stylesheet is already loaded */
    export const rebootStyles = rebootStylesDefinition;

    /** Basic control theme stylesheet that uses colors from the `.color` object, _enabled by default_: applied as a live stylesheet at the page level for this instance; can be modified to adjust or add CSS reset styles, or disabled using the `.disable()` method if external CSS styles are already loaded */
    export const controlStyles = controlStylesDefinition;

    /** @internal Add a component style sheet to `.components` and apply it to the DOM (using `new Stylesheet(...)` and `.applyStylesheet(...)`) */
    export function define(className: string,
        subStyles: { [selector: string]: Style.StyleSet | Style }) {
        var sheet = new Stylesheet(className, subStyles);
        (<any>components)[className.replace(/.*\s/, "")] = sheet;
        applyStylesheet(sheet, true);
    }
}
