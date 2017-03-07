import * as Async from "@typescene/async";
import { Component } from "../Components/Component";
import { Style } from "../Style";
import { Screen } from "../Screen";

/** Last selection class set, default blank */
var _selectionClass = "";

/** Element to focus as soon as it becomes available (see `focus(...)`) */
var toFocusASAP: HTMLElement | undefined;

/** Static container for helper methods that work with the DOM */
export namespace DOM {
    /** @internal Create a <div> element with given class name and node */
    export function div(className?: string, node?: Node) {
        var result = document.createElement("div");
        if (className) result.className = className;
        if (node) result.appendChild(node);
        return result;
    }

    /** Returns true if given component contains given DOM node */
    export function contains(component: Component, node: Node) {
        // only return true if component output DOM element is equal to the
        // given DOM element, or logically contains it
        var out = component.getLastRenderedOutput();
        return !!(out && out.element && (node === out.element ||
            node.compareDocumentPosition(out.element) & 8));
    }

    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // COMPONENT FOCUS / BLUR

    // Inject focus state logic
    Async.inject(Component, {
        "@getLiveComponentFocusState": function (this: Component) {
            var focused = document.activeElement;
            return !!(focused && DOM.contains(this, focused));
        }
    });

    /** Try to focus given component, its live element (from rendered output), or the first focusable element within given component, as soon as it becomes available */
    export function focus(component: Component) {
        component.getRenderedOutputAsync().then(out => {
            if (!out.element) return;

            // check which element to set focus to
            var focusable: Element | undefined;
            if ((<HTMLElement>out.element).hasAttribute &&
                (<HTMLElement>out.element).hasAttribute("tabindex")) {
                // use element itself
                focusable = out.element;
            }
            else if (out.liveElement) {
                // use live element from output
                focusable = out.liveElement;
            }
            else {
                // find focusable elements (not hidden and parent(s) not hidden)
                var elts: Array<Element | undefined> = out.element.querySelectorAll(
                    "[tabindex],a[href],input:not([disabled])," +
                    "button:not([disabled]),textarea:not([disabled])," +
                    "select:not([disabled])");
                for (var element of elts) {
                    if (!element) continue;
                    var hidden = false, cur: any = element;
                    while (cur && !hidden) {
                        if (cur.hasAttribute && cur.hasAttribute("hidden"))
                            hidden = true;
                        cur = cur.parentElement;
                    }
                    if (!hidden) {
                        focusable = cur;
                        break;
                    }
                }
            }

            // focus the (first focusable) element found
            if (focusable) {
                toFocusASAP = <any>focusable;
                var tries = 0;
                let doFocus = () => {
                    if (toFocusASAP !== focusable) return;
                    if (toFocusASAP && document.activeElement !== toFocusASAP) {
                        // try to focus the element and keep checking back
                        toFocusASAP.focus();
                        if (tries++ < 10)
                            window.setTimeout(doFocus, tries * 2);
                    }
                    else {
                        // managed to focus the element, forget about it:
                        toFocusASAP = undefined;
                    }
                }
                doFocus();
            }
        });
    }

    /** Remove focus from given component, or the currently focused element */
    export function blur(component?: Component) {
        var focused: Node | undefined = <any>document.activeElement;
        if (focused) {
            // do not blur if not contained by given component
            if (component && !contains(component, focused)) return;

            // blur the currently focused element
            focused && (<any>focused).blur && (<any>focused).blur();
        }
    }

    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // CSS IMPLEMENTATION

    /** Unique random identifier for this runtime instance of the library, used as an identifier on page root elements */
    export const uid = "__a" + Math.random().toFixed(8).replace(/\D/, "");

    /** Represents a (live updating) style sheet, with an optional base class name; the style sheet consists of one or more CSS selectors that each contain a reference to a `Style` instance */
    export class Stylesheet {
        /** Create a new style sheet, with given base class name(s) (optional) and given selectors and styles; selectors may be written as `"@... { selector }"` for e.g. @keyframe and @media nested at-rules; also, `.~~` will be replaced with the full base class name and `.~` with the final part, or if not included then the base class name will be prepended */
        constructor(baseClassName?: string,
            sheet?: { [selector: string]: Style.StyleSet | Style | undefined }) {
            this.baseClassName = baseClassName!;
            this._selectors = new Async.ObservableObject();
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

        /** Returns a list of selectors defined in this style sheet (observable) */
        public listSelectors() {
            return this._keys.slice(0);
        }

        /** Append a rule to this style sheet; returns this */
        public define(text: string);

        /** Define or override styles for given selector, based on the properties stored in given `Style` instance (class names are ignored); selectors may be written as `"@... { selector }"` for e.g. @keyframe and @media nested at-rules; returns this */
        public define(selector: string, style: Style.StyleSet | Style);

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
            var base = (this.baseClassName || "");
            if (base) base = "." + base.trim().replace(/\s+/, ".");
            var baseLast = base.replace(/.*(\.[^\.]+)$/, "$1");
            var uidSel = "#" + uid + " ";
            var kf = /^@keyframes/;
            this._keys.forEach(key => {
                if (this._selectors[key]) {
                    var selector: string;
                    if (!kf.test(key)) {
                        // check for .~ and/or @...{ block }
                        if (key.indexOf(".~") >= 0)
                            selector = key
                                .replace(/\.\~\~/g, base)
                                .replace(/\.\~/g, baseLast)
                                .replace(/^((?:[^\{]*\{\s*)?)/, "$1" + uidSel);
                        else
                            selector = key.replace(/^((?:[^\{]*\{\s*)?)/,
                                "$1" + uidSel + base + " ");
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

        private _selectors: Async.ObservableObject;
        private _keys = new Async.ObservableArray<string>();
    }

    /** Define global CSS styles from given list of selectors and style properties, in the context of the current runtime instance */
    export function applyStylesheet(
        styles: { [selector: string]: Style.StyleSet | Style });

    /** Define global CSS styles from given style sheet, in the context of the current runtime instance; if the `liveUpdate` argument is set to true, changes to the style sheet are observed and reflected in the DOM asynchronously */
    export function applyStylesheet(sheet: Stylesheet, liveUpdate?: boolean);

    export function applyStylesheet(sheet: any, liveUpdate?: boolean) {
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
                    text = style.getCSSText();
                    if (text) text = " {" + text + "}";
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
            var classNames = {};
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
                        for (var str of String(value).split("||"))
                            element.style[name] = str;
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
        return `0 0 ${d*2}rem ${d*-.25}rem rgba(0,0,0,${d*d*.1+d*.08}),` +
            `0 ${d*.85}rem ${d*1}rem ${d*-.25}rem rgba(0,0,0,${d*.15+.1}),` +
            `0 ${d*d*.5+d*.6}rem ${d*1}rem ${d*-1}rem rgba(0,0,0,.4),` +
            `0 ${d*d*1.5}rem ${d*3}rem ${d*-1}rem rgba(0,0,0,.3),` +
            `0 ${d*d*3}rem ${d*2.5}rem ${d*-2}rem rgba(0,0,0,.3)`;
    }

    /** Set the global root-em unit size in pixels or using a CSS value string */
    export function setCSSRemSize(px: number | string) {
        var strPx = (typeof px === "string") ? px : (px + "px");
        var elt = document.createElement("style");
        elt.textContent = `html { font-size: ${strPx} }`;
        document.head.appendChild(elt);
    }

    /** Set the class name globally applied to selected items (in addition to the `selected` DOM attribute) */
    export function setSelectionClass(className: string) {
        _selectionClass = String(className || "");
    }

    /** Get the class name globally applied to selected items (if any) */
    export function getSelectionClass() {
        return _selectionClass;
    }

    /** Load external stylesheet(s) by URL; returns a promise that resolves after the style sheet(s) have been applied (or after a 1s timeout for browsers that do not support onload event for link elements) */
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
    declare class WeakMap<SourceT, TargetT>{ get; set; };

    // set CSS root-em size to 16px to override Bootstrap 3 if needed
    applyStylesheet({
        "html": { fontSize: "16px" },
        "[hidden]": { display: "none !important" }
    });

    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // CSS PREDEFINED STYLES

    /** A set of predefined styles and style sheets that are used by specific components; these may be modified to apply a "theme", which will generally update all styles in the DOM asynchronously; _however_, styles defined here are subject to change for now and it is not guaranteed that selectors and class names will continue to exist across versions */
    export namespace CSS {
        /** Groups basic component style sheet definitions together, indexed by class name (e.g. "UI-Container") */
        export const components: { readonly [className: string]: Stylesheet } = {};

        /** Contains observable definitions of basic CSS values that can used in styles and style sheets; initially only contains "baseFontSize" (defaults to `1rem`) and "Paragraph.lineHeight" but more properties can be added here, provided they are properly namespaced */
        export const variables: { [name: string]: Async.ObservableValue<string> } = {
            baseFontSize: Async.ObservableValue.fromValue("1rem"),
            "Paragraph.lineHeight": Async.ObservableValue.fromValue("1.65em")
        };

        /** @internal Add a component style sheet to `.components` and apply it to the DOM (using `new Stylesheet(...)` and `.applyStylesheet(...)`) */
        export function define(className: string,
            styles: { [selector: string]: Style.StyleSet | Style }) {
            var sheet = new Stylesheet(className, styles);
            (<any>components)[className.replace(/.*\s/, "")] = sheet;
            applyStylesheet(sheet, true);
        }
    }

    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // PAGE DISPLAY CONFIGURATION

    /** Collection of options that control page rendering */
    export interface DOMPageOptions {
        /** The z-index style property of the page and all content (default 1000) */
        baseZIndex: number;

        /** Timing (ms) for the modal "shade" in/out animation (default 200) */
        shadeTransition: number;

        /** Opacity level (0-1) for the modal "shade" backdrop (default 0.2) */
        shadeOpacity: number;

        /** CSS base color for the modal "shade" backdrop (default "#000") */
        shadeColor: string;
    }

    /** Options that control page rendering */
    export const PAGE_OPTIONS: DOMPageOptions = {
        baseZIndex: 1000,
        shadeTransition: 200,
        shadeOpacity: .2,
        shadeColor: "#000"
    };

    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // SCREEN & MEASUREMENTS IMPLEMENTATION

    // Note: this uses "load" event rather than "DOMContentLoaded", to avoid
    // displaying the UI while CSS is still loading. This may seen counter-
    // intuitive and not according to modern standards, but it makes more sense
    // to wait for CSS, fonts, and images to be loaded, than to flash unstyled
    // content or (especially) missing icons on buttons.
    // It seems like a better idea to use a static HTML splash screen with a
    // static document title of "Loading...", which then gets replaced after
    // `Screen.ready` fires.
    window.addEventListener("load", () => { Screen.resolveReady(true) });
    if (document.readyState === "complete") Screen.resolveReady(true);

    // listen for changes in window size:
    var deferredDimensionsUpdate: any;
    window.addEventListener("resize", () => {
        if (!deferredDimensionsUpdate) {
            deferredDimensionsUpdate = setTimeout(() => {
                deferredDimensionsUpdate = undefined;
                updateDimensions();
            }, 50);
        }
    });

    function updateDimensions(): any {
        // write to `.dimensions` properties, ignore readonly modifier
        var width = window.innerWidth;
        var height = window.innerHeight;
        if (width && height) {
            (<any>Screen.dimensions).width = width;
            (<any>Screen.dimensions).height = height;
            return true;
        }
    }
    function startUpdateDimensions() {
        if (!updateDimensions())
            setTimeout(startUpdateDimensions, 200);
    }
    startUpdateDimensions();

    // Inject element measurement function into Component class
    Async.inject(Component, {
        getActualDimensions: function (this: Component) {
            var out = this.getLastRenderedOutput();
            var elt: HTMLElement | undefined = out && out.element;
            if (elt) {
                // take current height & width from actual component
                return {
                    height: elt.offsetHeight,
                    width: elt.offsetWidth
                }
            }
            else {
                // return 0x0 since nothing is visible
                return { height: 0, width: 0 };
            }
        }
    });

    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // POLYFILL

    // CustomEvent polyfill (source: MDN)
    (function () {
        try {
            new CustomEvent("test");
        }
        catch (all) {
            var C = function (event: string, params?: CustomEventInit) {
                params = params || { bubbles: false, cancelable: false, detail: undefined };
                var evt = document.createEvent('CustomEvent');
                evt.initCustomEvent(event, !!params.bubbles, !!params.cancelable, params.detail);
                return evt;
            }
            window["CustomEvent"] = C;
            C.prototype = (<any>window).Event.prototype;
        }
    })();
}
