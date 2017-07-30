import * as Async from "@typescene/core/Async";
import { Style } from "@typescene/core/UI";

/** Last selection class set, default blank */
var _selectionClass = "";

/** Unique random identifier for this runtime instance of the library, used as an identifier on page root elements */
export const uid = "__a" + Math.random().toFixed(8).replace(/\D/, "");

/** Represents a (live updating) style sheet, with an optional base class name; the style sheet consists of one or more CSS selectors that each contain a reference to a `Style` instance */
export class Stylesheet {
    /** Returns true if the pseudo-luminance of given color (in hex format `#112233` or `#123` or rgb format `rgb(255, 255, 255)` or hsl format `hsl(255, 0%, 0%)`) is greater than 55%; can be used e.g. to decide on a contrasting text color for a given background color */
    public static isBrightColor(color: string) {
        color = String(color);
        if (color[0] === "#") {
            if (color.length === 4) {
                color = "#" + color[1] + color[1] +
                    color[2] + color[2] +
                    color[3] + color[3];
            }
            var r = parseInt(color.slice(1, 3), 16);
            var g = parseInt(color.slice(3, 5), 16);
            var b = parseInt(color.slice(5, 7), 16);
            return (0.3 * r + 0.6 * g + 0.1 * b) > 140;
        }
        else if (color.slice(0, 4) === "rgb(") {
            var v = color.slice(4).split(",").map(parseFloat);
            return (0.3 * v[0] + 0.6 * v[1] + 0.1 * v[2]) > 140;
        }
        else if (color.slice(0, 4) === "hsl(") {
            var lum = parseFloat(color.slice(4).split(",")[2]);
            return lum > 55;
        }
        else return false;
    }

    /** Returns a color in hex format (e.g. `#112233`) that lies between given colors (in hex format `#112233` or `#123` or rgb format `rgb(255, 255, 255)`) at given point (0-1, with 0 being the same as the first color, 1 being the same as the second color, and 0.5 being an equal mix) */
    public static mixColors(color1: string, color2: string, p: number) {
        function parse(color: string) {
            color = String(color);
            if (color[0] === "#") {
                if (color.length === 4) {
                    color = "#" + color[1] + color[1] +
                        color[2] + color[2] +
                        color[3] + color[3];
                }
                return [
                    parseInt(color.slice(1, 3), 16),
                    parseInt(color.slice(3, 5), 16),
                    parseInt(color.slice(5, 7), 16)
                ];
            }
            else if (color.slice(0, 4) === "rgb(") {
                return color.slice(4).split(",").map(parseFloat);
            }
            else return [0, 0, 0];
        }
        var q = 1 - p;
        var c1 = parse(color1);
        var c2 = parse(color2);
        var c = [
            q * c1[0] + p * c2[0],
            q * c1[1] + p * c2[1],
            q * c1[2] + p * c2[2]
        ];
        let hex2 = (n: number) => (n < 16 ? "0" : "") + Math.floor(n).toString(16);
        return "#" + hex2(c[0]) + hex2(c[1]) + hex2(c[2]);
    }

    /** Create a new style sheet, with given base class name(s) (optional) and given selectors and styles; selectors may be written as `"@... { selector }"` for e.g. @keyframe and @media nested at-rules; also, `.~~` will be replaced with the full base class name and `.~` with the final part, or if not included then the base class name will be prepended */
    constructor(baseClassName?: string,
        sheet?: { [selector: string]: Style.StyleSet | Style | undefined }) {
        this.baseClassName = baseClassName!;
        this._selectors = <any>new Async.ObservableObject();
        if (sheet) {
            for (var key in sheet) {
                if (sheet[key] &&
                    Object.prototype.hasOwnProperty.call(sheet, key))
                    this.define(key, sheet[key]!);
            }
        }
    }

    /** Base class name for this style sheet (set using constructor call) */
    public readonly baseClassName: string;

    /** Disable all style rules in one go without removing them (use `.enable()` to reverse the effect); returns this */
    public disable() {
        this._disabled.value = true;
        return this;
    }

    /** Re-enable all style rules (after using `.disable()` to disable them); returns this */
    public enable() {
        this._disabled.value = false;
        return this;
    }

    /** Returns a list of selectors defined in this style sheet (observable) */
    public listSelectors() {
        return this._keys.slice(0);
    }

    /** Append a rule to this style sheet; returns this */
    public define(text: string): this;

    /** Define or override styles for given selector, based on the properties stored in given `Style` instance (class names are ignored); selectors may be written as `"@... { selector }"` for e.g. @keyframe and @media nested at-rules; returns this */
    public define(selector: string, style: Style.StyleSet | Style): this;

    public define(selector: string, style?: Style.StyleSet | Style) {
        if (!this._selectors.hasObservableProperty(selector)) {
            // make property observable and set style
            Async.makePropertyObservable(this._selectors, selector);
            this._keys.push(selector);
            this._selectors[selector] = (style instanceof Style) ?
                style : new Style(style);
        }
        else if (style) {
            // create a new Style instance to combine old and new styles
            this._selectors[selector] = new Style()
                .override(this._selectors[selector])
                .override(style);
        }
        return this;
    }

    /** Remove defined styles for given selector or pattern; returns this */
    public remove(selector: string | RegExp) {
        if (selector instanceof RegExp) {
            // remove all matching selectors
            this._keys.forEach(key => {
                if (selector.test(key))
                    this._selectors[key] = undefined;
            });
        }
        else {
            // remove selector directly
            this._selectors[String(selector)] = undefined;
        }
        return this;
    }

    /** Invoke given function for each selector of this style sheet, including instance identifier class and base class (except for keyframe selectors), if any, and the referenced `Style` instance, if any; to be used in an observable context to watch for changes*/
    public forEach(callback: (selector: string, style?: Style) => void) {
        if (this._disabled.value) return;
        var base = (this.baseClassName || "");
        if (base) base = "." + base.trim().replace(/\s+/, ".");
        var baseLast = base.replace(/.*(\.[^\.]+)$/, "$1");
        var uidSel = "#" + uid + " ";
        var kf = /^@keyframes/;
        this._keys.forEach(key => {
            if (this._selectors[key]) {
                var selector: string;
                if (!kf.test(key)) {
                    // add base class where necessary
                    selector = key.split(/\s*,\s*/g).map(k => {
                        // check for .~ and/or @...{ block }
                        if (k.indexOf(".~") >= 0)
                            return k.replace(/\.\~\~/g, base)
                                .replace(/\.\~/g, baseLast)
                                .replace(/^((?:[^\{]*\{\s*)?)/, "$1" + uidSel);
                        else
                            return k.replace(/^((?:[^\{]*\{\s*)?)/,
                                "$1" + uidSel + (base && base + " "));
                    }).join(", ");
                }
                else {
                    // keep keyframe percentage/from/to as is
                    selector = key;
                }

                // pass callback the augmented selector and Style
                callback(selector, this._selectors[key]);
            }
        });
    }

    private _selectors: Async.ObservableObject & { [name: string]: Style | undefined };
    private _keys = new Async.ObservableArray<string>();
    private _disabled = new Async.ObservableValue<boolean>();
}

/** Define global CSS styles from given style sheet, in the context of the current runtime instance; if the `liveUpdate` argument is set to true, changes to the style sheet and any of its observable properties are observed and reflected in the DOM asynchronously (and the `.disable` method can be used to remove the stylesheet from the DOM temporarily or permanently) */
export function applyStylesheet(
    sheet: Stylesheet | { [selector: string]: Style.StyleSet | Style },
    liveUpdate?: boolean): void {
    var styleElt = document.createElement("style");
    if (!(sheet instanceof Stylesheet))
        sheet = new Stylesheet(undefined, sheet);

    // helper function to return combined CSS text for all selectors
    function getCSSText() {
        var result = "";
        var lastBlockID: string | undefined;
        (<Stylesheet>sheet).forEach((key, style) => {
            var text: string;
            if (style) {
                // get CSS text from style instance
                var instances = style.getOverrides();
                text = "";
                instances.forEach(s => {
                    s.forEachProperty((key, value) => {
                        if (key[0] !== "." && key[0] !== ":") {
                            key = key.replace(/([A-Z])/g, "-$1").toLowerCase()
                                .replace(/^(webkit|o|ms|moz)-/, "-$1-");
                            for (var str of String(value).split("||").reverse())
                                text += key + ": " + str + "; ";
                        }
                        else if (key === ":shadow") {
                            // add box shadow for given depth factor
                            var boxShadow = getBoxShadowText(Number(<any>value));
                            text += "box-shadow: " + boxShadow + "; ";
                        }
                    });
                });
                if (text) text = " {" + text.slice(0, -2) + "}";
            }
            else {
                // use key as entire CSS text
                text = key, key = "";
            }

            // append selector and CSS text, if any
            if (text) {
                var blockMatch = key.match(/^(.*)\{\s*(.*)\s*\}\s*$/);
                if (blockMatch) {
                    var blockID = blockMatch[1].trim();
                    if (lastBlockID !== blockID) {
                        // insert text within defined @...{ block }
                        result += blockID + " { " +
                            blockMatch[2] + text + "}\n";
                    }
                    else {
                        // append text to same block
                        result = result.slice(0, -2) + "\n" +
                            blockMatch[2] + text + "}\n";
                    }
                    lastBlockID = blockID;
                }
                else {
                    // insert text after selector
                    result += key + text + "\n";
                    lastBlockID = undefined;
                }
            }
        });
        return result;
    }

    if (liveUpdate) {
        // keep the <style> element updated
        Async.observe(getCSSText).subscribe(text => {
            styleElt.textContent = text;
            document.head.appendChild(styleElt);
        });
    }
    else {
        // insert the <style> element only once
        styleElt.textContent = getCSSText();
        document.head.appendChild(styleElt);
    }
}

/** Helper function to apply Style properties to given DOM element; returns the Style object (does not observe styles directly, but can be used in an observable getter, e.g. using `ComponentRenderer#watch` to reapply styles when they change) */
export function applyStyleTo(style: Style, element: HTMLElement): void {
    if (element instanceof HTMLElement) {
        // get a list of all overrides recursively
        var instances: Style[] = style.getOverrides();
        var overridesStr = instances.map(s => s.uid).join("|");

        // clear style if any changes occurred since styles were last applied
        var lastOverridesStr = (styleElementMap ? styleElementMap.get(element) :
            element.getAttribute("data-ui-style-map")) || "";
        if (lastOverridesStr !== overridesStr && element.style.length) {
            var props: string[] = [];
            for (var i = element.style.length - 1; i >= 0; i--)
                props.push(element.style.item(i));
            for (i = props.length - 1; i >= 0; i--)
                element.style.removeProperty(props[i]);
        }

        // combine sorted overridden styles
        var classNames: any = {};
        var isHidden = false, isSelected = false;
        instances.forEach((style: Style) => {
            if (!style) return;
            style.forEachProperty((name, value) => {
                if (name === ":hidden") {
                    // set hidden status if true or false
                    if (value !== undefined) isHidden = !!value;
                }
                else if (name === ":selected") {
                    // set selection status if true or false
                    if (value !== undefined) {
                        isSelected = !!value;
                        if (_selectionClass) {
                            // also add/remove selection class
                            classNames["." + _selectionClass] = value;
                        }
                    }
                }
                else if (name === ":shadow") {
                    // add box shadow for given depth factor
                    element.style.boxShadow =
                        getBoxShadowText(Number(<any>value));
                }
                else if (name[0] === ".") {
                    // add class name (still prefixed with dot)
                    classNames[name] = value;
                }
                else {
                    // set style property using DOM directly
                    for (var str of String(value).split("||").reverse())
                        (<any>element.style)[name] = str;
                }
            });
        });

        // collate and set class name
        var className = "";
        for (var key in classNames) {
            if (key[0] === "." && classNames[key])
                className += " " + key.slice(1);
        }
        className = className.slice(1) +
            ((isSelected && _selectionClass) ? " " + _selectionClass : "");
        if (className || element.className)
            element.className = className;

        // hide or show the element
        if (isHidden)
            element.setAttribute("hidden", "hidden");
        else
            element.removeAttribute("hidden");

        // select or deselect the element
        if (isSelected)
            element.setAttribute("selected", "selected");
        else
            element.removeAttribute("selected");
    }
}

/** Get boxShadow property for given shadow height (0-1) */
function getBoxShadowText(d: number) {
    d = Math.min(1, Math.max(0, d));
    return `0 0 ${d * 2}rem ${d * -.25}rem rgba(0,0,0,${d * d * .1 + d * .08}),` +
        `0 ${d * .85}rem ${d * 1}rem ${d * -.25}rem rgba(0,0,0,${d * .15 + .1}),` +
        `0 ${d * d * .5 + d * .6}rem ${d * 1}rem ${d * -1}rem rgba(0,0,0,.4),` +
        `0 ${d * d * 1.5}rem ${d * 3}rem ${d * -1}rem rgba(0,0,0,.3),` +
        `0 ${d * d * 3}rem ${d * 2.5}rem ${d * -2}rem rgba(0,0,0,.3)`;
}

/** Set the global root-em unit size in pixels or using a CSS value string; the `rem` unit size is defined at the HTML level and should be set to `16px` on all browsers, however some CSS frameworks (e.g. Bootstrap 3) modify this unit; use this method to override the `rem` unit size again */
export function setCSSRemSize(px: number | string) {
    var strPx = (typeof px === "string") ? px : (px + "px");
    var elt = document.createElement("style");
    elt.textContent = `html { font-size: ${strPx} }`;
    document.head.appendChild(elt);
}

/** Set the class name globally applied to selected items (in addition to the `selected` DOM attribute), i.e. those items selected using `Style.select` */
export function setSelectionClass(className: string) {
    _selectionClass = String(className || "");
}

/** Get the class name globally applied to selected items (if any) */
export function getSelectionClass() {
    return _selectionClass;
}

/** Load external stylesheet(s) by URL; returns a promise that resolves after the style sheet(s) have been applied OR after a 1 second wait (e.g. when offline or browser does not support this function) */
export function loadExternalCSS(...urls: string[]): PromiseLike<any> {
    return Async.Promise.race<any>([
        Async.Promise.sleep(1000),
        Async.Promise.all(urls.map(url => {
            return new Async.Promise<void>((resolve, reject) => {
                // dynamically create link element
                var linkElt = document.createElement("link");
                linkElt.addEventListener("load", () => { (<any>resolve)() });
                linkElt.addEventListener("error", () => { reject(new Error()) });

                // set attributes and append to head
                linkElt.setAttribute('rel', 'stylesheet');
                linkElt.setAttribute('type', 'text/css');
                linkElt.setAttribute('href', url);
                document.getElementsByTagName('head').item(0)
                    .appendChild(linkElt);
            });
        }))
    ]);
}

/** Weak map (if available) of elements and the Style UIDs that have been applied to them */
var styleElementMap = (typeof WeakMap !== "undefined") ?
    new WeakMap<HTMLElement, string>() : undefined;
declare class WeakMap<SourceT, TargetT>{ get: any; set: any; };
