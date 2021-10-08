import { UIRenderableConstructor, Stringable } from "./UIComponent";
import { UICellTransition } from "./containers/UICell";
import { UIStyle } from "./UIStyle";

const TEXT_COLOR_B = "rgba(0,0,0,.8)";
const TEXT_COLOR_W = "rgba(255,255,255,.95)";

/** Confirmation/alert dialog builder, platform dependent, used by `ViewActivity.showConfirmationDialogAsync` (abstract) */
export abstract class ConfirmationDialogBuilder {
  /** Set the dialog title */
  abstract setTitle(title: Stringable): this;
  /** Add a block of text to be displayed as a paragraph */
  abstract addMessage(message: Stringable): this;
  /** Set the text label of the primary confirmation button */
  abstract setConfirmButtonLabel(label: Stringable): this;
  /** Set the text label of the cancel button */
  abstract setCancelButtonLabel(label: Stringable): this;
  /** Build a constructor for a renderable dialog with the current options, which should emit a `CloseModal` or `Confirm` event when closing the dialog */
  abstract build(): UIRenderableConstructor;
}

/** Dynamic menu builder, platform dependent (abstract) */
export abstract class UIMenuBuilder {
  /** Remove all current menu items */
  abstract clear(): this;
  /** Add a menu option with given key, text, icon, and hint */
  abstract addOption(
    key: string,
    text: Stringable,
    icon?: string,
    hint?: Stringable,
    hintIcon?: string,
    textStyle?: Partial<UIStyle.TextStyle>,
    hintStyle?: Partial<UIStyle.TextStyle>
  ): this;
  /** Add a list of selectable menu options */
  abstract addSelectionGroup(
    options: Array<{ key: string; text: Stringable }>,
    selectedKey?: string,
    textStyle?: Partial<UIStyle.TextStyle>
  ): this;
  /** Add a menu separator */
  abstract addSeparator(): this;
  /** Set the alignment of the menu to its related component (`start`, `stretch`, or `end`), if applicable */
  abstract setGravity(gravity: "start" | "stretch" | "end"): this;
  /** Set the animation that plays when the menu is displayed, if applicable */
  abstract setRevealTransition(transition: UICellTransition | string): this;
  /** Set the animation that plays when the menu is removed, if applicable */
  abstract setExitTransition(transition: UICellTransition | string): this;
  /** Build a constructor for a menu with the current options, which should emit a `SelectMenuItem` event (of type `UIMenuItemSelectedEvent`) when an item is selected, and a `CloseModal` event to close the menu */
  abstract build(): UIRenderableConstructor;
}

/** Represents a single color (read-only) */
export class UIColor {
  static readonly Black = new UIColor("black");
  static readonly DarkerGray = new UIColor("darkerGray");
  static readonly DarkGray = new UIColor("darkGray");
  static readonly Gray = new UIColor("gray");
  static readonly LightGray = new UIColor("lightGray");
  static readonly White = new UIColor("white");
  static readonly Slate = new UIColor("slate");
  static readonly Red = new UIColor("red");
  static readonly Orange = new UIColor("orange");
  static readonly Yellow = new UIColor("yellow");
  static readonly Lime = new UIColor("lime");
  static readonly Green = new UIColor("green");
  static readonly Turquoise = new UIColor("turquoise");
  static readonly Cyan = new UIColor("cyan");
  static readonly Blue = new UIColor("blue");
  static readonly Violet = new UIColor("violet");
  static readonly Purple = new UIColor("purple");
  static readonly Magenta = new UIColor("magenta");
  static readonly Primary = new UIColor("primary");
  static readonly Accent = new UIColor("accent");
  static readonly Background = new UIColor("background");
  static readonly Text = new UIColor("text");
  static readonly Separator = new UIColor("separator");
  static readonly ControlBase = new UIColor("controlBase");

  /** Create a new color instance using given name (e.g. `green` or `@green/20%`, see `UITheme.replaceColor()`) */
  constructor(colorName?: string) {
    if (colorName) {
      this._f = () => {
        let color = String(
          (UITheme.current && UITheme.current.colors[colorName]) || colorName
        );
        return color[0] === "@" ? UITheme.replaceColor(color) : color;
      };
    }
  }

  /** Return a CSS-compatible string representation */
  toString() {
    return this._f ? this._f() : "transparent";
  }

  /** Return a new `UIColor` instance for a contrasting text color */
  text() {
    let result = new UIColor();
    result._f = () => UITheme.getTextColor(String(this));
    return result;
  }

  /** Return a new `UIColor` instance with given alpha value (0-1) applied, for higher transparency */
  alpha(alpha: number) {
    let result = new UIColor();
    result._f = () => UITheme.mixColors(String(this), "rgba(,,,0)", 1 - alpha);
    return result;
  }

  /** Return a new `UIColor` instance with given luminosity value (between -1 and 1) applied, for darker or lighter colors; set `contrast` parameter to true to invert the scale for dark colors (i.e. move closer to/away from mid-grey instead of strictly lower and higher luminosity) */
  lum(lum: number, contrast?: boolean) {
    let result = new UIColor();
    result._f = () => {
      let c = String(this);
      if (contrast && !UITheme.isBrightColor(c)) lum = -lum;
      return UITheme.mixColors(c, lum > 0 ? "#fff" : "#000", Math.abs(lum));
    };
    return result;
  }

  private _f?: () => string;
}

/** Represents a set of default styles and component presets */
export class UITheme {
  /** The current theme. This value may be changed but it is not observed, use `Application.renderContext` to re-render UI components after changing the theme. Use `clone()` to initialize a new theme instance. */
  static current: UITheme;

  /** Returns a `UIStyle` instance consisting of given named style(s), combined using `UIStyle.mixin(...)` */
  static getStyle(name: string, mixin?: string) {
    let result = this.current.styles[name];
    if (mixin && this.current.styles[mixin]) {
      result = result.mixin(this.current.styles[mixin]);
    }
    return result;
  }

  /** Returns a suitable text color for given background color (mostly black, or mostly white) */
  static getTextColor(bg: UIColor | string): string {
    return this.isBrightColor(String(bg)) ? TEXT_COLOR_B : TEXT_COLOR_W;
  }

  /** Returns true if the pseudo-luminance of given color (in hex format `#112233` or `#123` or rgb(a) format `rgb(255, 255, 255)` or hsl format `hsl(255, 0%, 0%)`) is greater than 55%; can be used e.g. to decide on a contrasting text color for a given background color */
  static isBrightColor(color: UIColor | string) {
    let c = String(color);
    if (c[0] === "#") {
      if (c.length === 4) {
        c = "#" + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
      }
      let r = parseInt(c.slice(1, 3), 16);
      let g = parseInt(c.slice(3, 5), 16);
      let b = parseInt(c.slice(5, 7), 16);
      return 0.3 * r + 0.6 * g + 0.1 * b > 140;
    } else if (c.slice(0, 4) === "rgb(" || c.slice(0, 5) === "rgba(") {
      let v = c.slice(4).split(",").map(parseFloat);
      return 0.3 * v[0] + 0.6 * v[1] + 0.1 * v[2] > 140;
    } else if (c.slice(0, 4) === "hsl(") {
      let lum = parseFloat(c.slice(4).split(",")[2]);
      return lum > 55;
    } else return true;
  }

  /** Returns a color in rgb(a) format (e.g. `rgb(40,60,255)` `rgba(40,60,255,.5)`) that lies between given colors (in hex format `#112233` or `#123` or rgb(a) format `rgb(255, 255, 255)`) at given point (0-1, with 0 being the same as the first color, 1 being the same as the second color, and 0.5 being an equal mix) */
  static mixColors(color1: UIColor | string, color2: UIColor | string, p: number) {
    function parse(color: string) {
      let result = [0, 0, 0, 1];
      if (color[0] === "#") {
        if (color.length === 4) {
          color = "#" + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
        }
        result[0] = parseInt(color.slice(1, 3), 16);
        result[1] = parseInt(color.slice(3, 5), 16);
        result[2] = parseInt(color.slice(5, 7), 16);
      } else if (color.slice(0, 5) === "rgba(") {
        color
          .slice(5)
          .split(",")
          .forEach((n, i) => {
            result[i] = parseFloat(n);
          });
      } else if (color.slice(0, 4) === "rgb(") {
        color
          .slice(4)
          .split(",")
          .forEach((n, i) => {
            result[i] = parseFloat(n);
          });
      } else if (color === "transparent") {
        result[3] = 0;
      }
      return result;
    }
    let q = 1 - p;
    function mix(n1: number, n2: number) {
      return n1 === n2 ? n1 : isNaN(n1) ? n2 : isNaN(n2) ? n1 : Math.floor(q * n1 + p * n2);
    }
    let c1 = parse(String(color1));
    let c2 = parse(String(color2));
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
   * - `@green.text` is substituted with a contrasting text color (mostly-opaque white or black) that is readable on the color `green`.
   */
  static replaceColor(color: UIColor | string) {
    let c = String(color);
    if (!c || color instanceof UIColor) return c;
    // (Note: .text also works as :text for historical reasons)
    return c.replace(
      /\@(\w+)([.:]text)?((\^)?[\+\-]\d+\%)?([.:]text)?(\/\d+\%)?([.:]text)?/g,
      (_str, id, txt, lum, contrast, txt2, alpha, txt3) => {
        let result = (this.current.colors as any)[id] || "rgba(1,2,3,0)";
        if (/\@\w/.test(result)) result = this.replaceColor(result);
        if (txt) result = this.getTextColor(result);
        if (lum) {
          let p = parseFloat(contrast ? lum.slice(1) : lum) / 100;
          if (contrast && !this.isBrightColor(result)) p = -p;
          result = this.mixColors(result, p > 0 ? "#fff" : "#000", Math.abs(p));
        }
        if (txt2) result = this.getTextColor(result);
        if (alpha) {
          let p = parseFloat(alpha.slice(1)) / 100;
          result = this.mixColors(result, "rgba(,,,0)", 1 - p);
        }
        if (txt3) result = this.getTextColor(result);
        return result;
      }
    );
  }

  /** Create a new theme with the same properties, colors, icons, and styles (i.e. a 'deep' copy) */
  clone() {
    let result = new UITheme();
    result.modalDialogShadeOpacity = this.modalDialogShadeOpacity;
    result.spacing = this.spacing;
    result.ConfirmationDialogBuilder = this.ConfirmationDialogBuilder;
    result.MenuBuilder = this.MenuBuilder;
    result.colors = { ...this.colors };
    result.icons = { ...this.icons };
    result.styles = { ...this.styles };
    return result;
  }

  /** Dialog backdrop shader opacity (for `DialogViewActivity`), defaults to 0.3 */
  modalDialogShadeOpacity = 0.3;

  /** Default spacing between components in rows and columns, defaults to 8 */
  spacing: string | number = 8;

  /** Default confirmation/alert dialog builder used by `ViewActivity.showConfirmationDialogAsync` */
  ConfirmationDialogBuilder?: new () => ConfirmationDialogBuilder;

  /** Default platform dependent menu builder */
  MenuBuilder?: new () => UIMenuBuilder;

  /** Set of predefined colors */
  colors: { [name: string]: string } = {
    black: "#000000",
    darkerGray: "#333333",
    darkGray: "#777777",
    gray: "#aaaaaa",
    lightGray: "#dddddd",
    white: "#ffffff",
    slate: "#667788",
    red: "#ff0000",
    orange: "#ee9933",
    yellow: "#ffff00",
    lime: "#77ff00",
    green: "#007700",
    turquoise: "#33aa99",
    cyan: "#00ffff",
    blue: "#0000ff",
    violet: "#ee77cc",
    purple: "#aa3399",
    magenta: "#ff00ff",
    primary: "@blue",
    accent: "@purple",
    background: "@white",
    text: "@background.text",
    separator: "@background^-50%/20%",
    controlBase: "@background",
    modalShade: "@black",
  };

  /** Named icons that can be used on labels or buttons */
  icons: { [name: string]: string } = Object.create(null);

  /** Set of named style _mixins_ that can be applied to a UI component. These include default styles such as 'control', 'container', 'button', 'textfield', etc., but may also include custom styles so that they can be referenced by name. */
  styles: { [name: string]: UIStyle } = {
    container: UIStyle.create("_container", {
      position: { gravity: "stretch" },
      dimensions: { grow: 1, shrink: 0 },
      containerLayout: {
        gravity: "stretch",
        axis: "vertical",
        distribution: "start",
        wrapContent: false,
      },
    }),
    scroll: UIStyle.create("_scroll", {
      dimensions: { grow: 1, shrink: 1 },
    }),
    cell: UIStyle.create("_cell", {
      containerLayout: { distribution: "center", gravity: "center" },
      position: { top: 0 },
    }),
    cell_flow: UIStyle.create("_cell_flow", {
      dimensions: { grow: 0, shrink: 0 },
    }),
    cell_cover: UIStyle.create("_cell_cover", {
      position: {
        gravity: "overlay",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
    }),
    form: UIStyle.create("_form", {
      dimensions: { grow: 0 },
    }),
    column: UIStyle.create("_column", {
      containerLayout: { axis: "vertical", gravity: "start" },
      dimensions: { grow: 0, shrink: 0 },
    }),
    row: UIStyle.create("_row", {
      containerLayout: { axis: "horizontal", gravity: "center" },
      dimensions: { grow: 0, shrink: 0 },
    }),
    row_opposite: UIStyle.create("_row_opposite", {
      containerLayout: { distribution: "end" },
    }),
    row_center: UIStyle.create("_row_center", {
      containerLayout: { distribution: "center" },
    }),
    control: UIStyle.create("_control", {
      dimensions: { shrink: 1, grow: 0 },
    }),
  };

  /** Add or extend a named style in `styles` with given style set; returns the new `UIStyle` instance */
  setStyle(name: string, styles: Partial<UIStyle.StyleObjects>) {
    if (this.styles[name]) {
      styles = { ...this.styles[name].getStyles(), ...styles };
    }
    return (this.styles[name] = UIStyle.create(name, styles));
  }
}
