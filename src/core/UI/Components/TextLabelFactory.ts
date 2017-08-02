import Async from "../../Async";
import { Binding } from "../Binding";
import { Style } from "../Style";
import { Label, Paragraph, WideLabel, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6 } from "../";
import { Component } from "./Component";

/** Shared factory implementation for a piece of text as a string and/or as (an observable value representing) a Label instance (or sub class); can be used in Component factory specs using UI.tl(...) or with backticks */
export class TextLabelFactory {
    /** Create the text label factory using the given string, stringable (object with a `toString` method), or observable value, along with an optional array of (observable) substitution arguments or a function that returns such an array for a component to bind to, and a Label base class that is used if not overridden by string content prefix */
    constructor(
        text: { toString: () => string } | Async.ObservableValue<{ toString: () => string }>,
        args?: Array<string | Async.ObservableValue<string>> |
            ((baseComponent: Component, propertyName: string) => Array<string | Async.ObservableValue<string>>),
        observeArgs?: boolean, baseClass?: typeof Label) {
        this._value = text;
        if (args) this._args = args;
        if (observeArgs) this._observe = true;
        if (baseClass) this._baseClass = baseClass;
    }

    /** Get the (translated) encapsulated text as a string; adds a dependency on the observable value if called from an observable value getter; trims {...} prefix if present */
    public toString() {
        // return string (use ObservableValue:toString if needed)
        if (typeof this._args === "function") throw new Error("Cannot resolve bindings in text label");
        return this._toString(this._args).replace(/^\{[^\}]\}/, "");
    }

    /** Get the encapsulated text wrapped in a new Label (or derived) instance, or an observable value representing the instance; uses {...} prefix to control component type and its properties; parameters are used by component factory to initialize bindings used in `tl` strings, if any */
    public getComponent(baseComponent?: Component,
        propertyName?: string): Label | Async.ObservableValue<Label> {
        var args = (typeof this._args === "function") ?
            this._args(baseComponent!, propertyName!) : this._args;

        if (this._observe) {
            // map the observable value to a Label instance
            var label: Label;
            return Async.observe(() => this._toString(args))
                .map(text => (label = this._createComponent(text, label)));
        }
        else {
            // just create and return the component itself
            return this._createComponent(this._toString(args));
        }
    }

    /** @internal Injectable method to translate given text (including substitution and pluralization placeholders); injected by App sub module to proxy the `culture` service */
    @Async.injectable
    public ["@translateText"](text: string) { return text }

    /** @internal Injectable method to pick a plural form for given number; defaults to English (singular/plural) forms; injected by App sub module to proxy the `culture` service */
    @Async.injectable
    public ["@pluralizeText"](n: number, forms: string[]) {
        return (n > 1 || n < -1) ? (forms[1] || forms[0]) : forms[0];
    }

    /** Returns string value with specific substituted arguments */
    private _toString(args?: any[]) {
        var val = String(this._value);

        // find out where prefix ends, if any
        var start = val[0] === "{" ? val.indexOf("}") + 1 : 0;
        if (start === val.length) return val;

        // translate text itself
        var text = val.slice(start);
        if (args && args.length && text === "%{1}") {
            // shortcut: substitute first argument right away
            return val.slice(0, start) + args[0];
        }
        text = this["@translateText"](text);

        // replace substitutions and put the string back together
        return val.slice(0, start) + text.replace(
            /%\{(\d+)((?:\|[^\|\}]*)+)?\}/g,
            (s, n, plu) => {
                // ignore substitution/pluralization placeholder if no argument
                if (!args || args.length < n) return s;

                // get value and either pluralize or substitute
                var val = args[parseInt(n, 10) - 1];
                if (plu) return this["@pluralizeText"](val, plu.slice(1).split("|"));
                else return String(val);
            });
    }

    /** Helper function to turn text into a component instance (possibly reusing given old Label instance) */
    private _createComponent(str: string, prev?: Label) {
        var LabelClass = this._baseClass;
        var icon: string | undefined, width: string | undefined;
        var style: Style | undefined;
        let setStyle = (key: string, value: string) => {
            if (!style) style = new Style();
            style.set(key, value);
        }
        if (str[0] === "{") {
            var idx = str.indexOf("}");
            if (idx > 0) {
                // interpret flags to change label class or styles
                var flags = str.slice(1, idx).split("|");
                str = str.slice(idx + 1);
                flags.forEach(f => {
                    switch (f) {
                        case "p": LabelClass = Paragraph; break;
                        case "w": LabelClass = WideLabel; break;
                        case "l": LabelClass = Label; break;
                        case "h1": LabelClass = Heading1; break;
                        case "h2": LabelClass = Heading2; break;
                        case "h3": LabelClass = Heading3; break;
                        case "h4": LabelClass = Heading4; break;
                        case "h5": LabelClass = Heading5; break;
                        case "h6": LabelClass = Heading6; break;
                        case "b": setStyle("fontWeight", "bold"); break;
                        case "i": setStyle("fontStyle", "italic"); break;
                        case "u": setStyle("textDecoration", "underline"); break;
                        case "start": case "end":    
                        case "left": case "right": case "center":
                            setStyle("textAlign", f);
                            if (!LabelClass) LabelClass = Paragraph;
                            break;
                        default:
                            if (/^l:[\d\.]+(\%|[a-z]+)$/.test(f))
                                width = f.slice(2);
                            else if (/^#\w+$/.test(f))
                                setStyle("color", f);
                            else if (/^icon:/.test(f))
                                icon = f.slice(5);
                            else if (/^\d+$/.test(f))
                                setStyle("fontWeight", f);
                            else if (/^[\d\.]+(\%|[a-z]+)$/.test(f))
                                setStyle("fontSize", f);
                            else if (/^\./.test(f))
                                f.slice(1).split(".").forEach(s =>
                                    (style || (style = new Style)).addClass(s));
                            else {
                                var match = /^([\w-]+)\s*=\s*(.*)$/.exec(f);
                                if (match) {
                                    var prop = match[1].replace(/-\w/g,
                                        s => s[1].toUpperCase());
                                    var val = match[2];
                                    setStyle(prop, (val[0] === '"') ?
                                        JSON.parse(val) : val);
                                }
                            }
                    }
                });
            }
        }

        // create or reuse Label instance
        if (!LabelClass) LabelClass = Label;
        var result = (prev instanceof LabelClass) ? prev : new LabelClass();
        if (icon) result.icon = icon;
        if (style) result.style.override(style);
        if (width) result.width = width;
        result.text = str;

        return result;
    }

    private _baseClass: typeof Label;
    private _value: { toString: () => string } | Async.ObservableValue<{ toString: () => string }>;
    private _args?: Array<string | Async.ObservableValue<string>> | ((baseComponent: Component, propertyName: string) => Array<string | Async.ObservableValue<string>>);
    private _observe?: boolean
}

/** Tagged template string function that returns a text label factory instance to be used with component factory content lists; functions in the expanded values (i.e. result of `${...}`), and bindings (instanceof Binding), are used as getters for nested observable string values (e.g. `${() => ...}` is observed and converted to a string); pluralization forms can be substituted based on existing arguments by number (base 1) using e.g. `%{1|is|are}`; prefixes can be used to change the type of component factory created and its styles and properties:
 * * `{p}` for Paragraph,
 * * `{h1-6}` for Heading,
 * * `{w}` for WideLabel,
 * * `{b|i|u}` for text styles,
 * * `{left|center|right}` for alignment,
 * * `{#...}` for text colors,
 * * `{nnn}` for font weights,
 * * `{icon:...}` for icons,
 * * `{icon:... property-name=...}` for icon style properties,
 * * `{property-name=...}` or `{propertyName=...}` for individual style properties,
 * * `{.classname}` and `{.class1.class2}` for class name(s),
 * * `{...%|...em|...rem| etc.}` for font sizes, and
 * * `{l:...%|...rem| etc.}` for Label with given width;
 *
 * Prefixes can be combined using the pipe | symbol and may also be the result of an expanded value (i.e. first ${...} part)
 */
export function tl(strings: TemplateStringsArray, ...values: any[]): TextLabelFactory;

/** Simplified version of tagged template helper .tl\`...\` with a single piece of text, possibly with a base Label class that is used if given string does not override the class using e.g. `{p}` or `{h1}` */
export function tl(text: string | Async.ObservableValue<string>, baseClass?: typeof Label): TextLabelFactory;

/** Simplified version of tagged template helper .tl\`...\` observing a single piece of text, possibly with a base Label class that is used if given string does not override the class using e.g. `{p}` or `{h1}` */
export function tl(getter: () => (string | Async.ObservableValue<string>), baseClass?: typeof Label): TextLabelFactory;

/** Simplified version of tagged template helper .tl\`...\` observing a single binding, possibly with a base Label class that is used if given string does not override the class using e.g. `{p}` or `{h1}` */
export function tl(getter: Binding<string>, baseClass?: typeof Label): TextLabelFactory;

// implementation:
export function tl(
    strings: { toString: () => string } | (() => { toString: () => string }) | string[] | Binding<string>,
    ...values: any[]): TextLabelFactory {
    if (strings instanceof Array) {
        if (strings.length === 1) {
            // if given just a single text, use a shortcut here
            return new TextLabelFactory(strings[0]);
        }

        // map all function/binding values to observable values with getters
        var hasBindings = false, hasObservables = false;
        var args = values && values.map(v => {
            if (typeof v === "function") {
                // use given function as an observable getter
                v = new Async.ObservableValue(v);
                hasObservables = true;
            }
            else if (v instanceof Binding) {
                // make sure to turn into observable later
                hasBindings = true;
            }
            else if (v instanceof Async.ObservableValue) {
                // remember to observe any other observables
                hasObservables = true;
            }
            return v;
        });

        // substitute values with placeholders in the text
        var text = strings.map((s, i) => i ? i + "}" + s : s).join("%{");

        if (hasBindings) {
            // pass a function that returns the substitution args, after binding
            return new TextLabelFactory(text, (baseComponent, propName) =>
                args.map(v => (v instanceof Binding) ?
                    v.observeOn(baseComponent, propName) : v),
                true);
        }
        else {
            // pass (observable) values directly
            return new TextLabelFactory(text, args, hasObservables);
        }
    }
    else if (typeof strings === "function") {
        // if given a getter function, map single observable
        return new TextLabelFactory(
            new Async.ObservableValue<{ toString: () => string }>(strings),
            undefined, true, values[0]);
    }
    else if (strings instanceof Binding) {
        // if given a single binding, create a function that returns
        // the observable value that returns the final text
        return new TextLabelFactory("%{1}",
            (baseComponent, propName) => [strings.observeOn(baseComponent, propName)],
            true, values[0]);
    }
    else {
        // if given just a single value, just use a single piece of text
        return new TextLabelFactory(strings, undefined, false, values[0]);
    }
}
