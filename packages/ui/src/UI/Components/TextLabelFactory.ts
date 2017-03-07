import * as Async from "@typescene/async";
import { Binding } from "../Binding";
import { Style } from "../Style";
import { Label, Paragraph, WideLabel, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6 } from "../";
import { Component } from "./Component";

/** Shared factory implementation for a piece of text as a string and/or as (an observable value representing) a Label instance (or sub class); can be used in Component factory specs using UI.tl(...) or with backticks */
export class TextLabelFactory {
    /** Create the text label factory using the given string, stringable (object with .toString method), observable value, or a function that returns an observable value, and a Label base class that is used if not overridden by string content prefix */
    constructor(text: { toString } | Async.ObservableValue<{ toString }> | TextLabelFactory.TLInitializer,
        baseClass?: typeof Label) {
        this._value = text;
        if (baseClass) this._baseClass = baseClass;
    }

    /** Get the encapsulated text as a string; adds a dependency on the observable value if called from an obserable value getter; trims {...} prefix if present */
    public toString() {
        // return string (use ObservableValue:toString if needed)
        return String(this._value).replace(/^\{[^\}]\}/, "");
    }

    /** Get the encapsulated text wrapped in a new Label (or derived) instance, or an observable value representing the instance; uses {...} prefix to control component type and its properties; parameters are used by compononent factory to initialize bindings used in `tl` strings, if any */
    public getComponent(baseComponent?: Component, propertyName?: string): Label | Async.ObservableValue<Label> {
        var value = (typeof this._value === "function") ?
            this._value(baseComponent!, propertyName!) : this._value;
        if (value instanceof Async.ObservableValue) {
            // map the observable value to a Label instance
            var label: Label;
            return (<Async.ObservableValue<{ toString }>>value)
                .map(text => (label = this._createComponent(text, label)));
        }
        else {
            // just create and return the component itself
            return this._createComponent(<string>this._value);
        }
    }

    // helper function to turn text into a component instance (possibly reusing
    // given old Label instance)
    private _createComponent(text: { toString }, prev?: Label) {
        var LabelClass = this._baseClass;
        var icon: string | undefined, width: string | undefined;
        var style: Style | undefined;
        let setStyle = (key: string, value: string) => {
            if (!style) style = new Style();
            style.set(key, value);
        }
        var str = String(text);
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
    private _value: { toString } | Async.ObservableValue<{ toString }> | TextLabelFactory.TLInitializer;
}

export namespace TextLabelFactory {
    /** Function used by `tl` to construct TextLabelFactory that can only construct a `Label` instance if a base component and property name is given, to convert bindings into observables */
    export type TLInitializer = (baseComponent: Component, propertyName: string) => Async.ObservableValue<string>;
}

/** Tagged template string function that returns a text label factory instance to be used with component factory content lists; functions in the expanded values (i.e. result of ${...}), and bindings (instanceof Binding), are used as getters for nested observable string values (e.g. ${() => ...} is observed and converted to a string); prefixes can be used to change the type of component factory created and its styles and properties:
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
    strings: { toString } | (() => { toString }) | string[] | Binding<string>,
    ...values: any[]): TextLabelFactory {
    if (strings instanceof Array) {
        var len = (<string[]>strings).length;

        // map all function/binding values to observable values with getters
        var hasObservables = false, hasBindings = false;
        var vals = values && values.map(v => {
            if (typeof v === "function") {
                // use given function as an observable getter
                hasObservables = true;
                v = new Async.ObservableValue(v);
            }
            else if (v instanceof Binding) {
                // make sure to turn into observable later
                hasObservables = hasBindings = true;
            }
            return v;
        });

        // helper to create the function that generates the final string
        let makeGetter = (vals: any[]) => () => {
            var result = "";
            for (var i = 0; i < len; i++) {
                if (i) result += String(vals && vals[i - 1])
                result += (<string[]>strings)[i];
            }
            return result;
        };

        if (!hasObservables) {
            // if nothing is observable, just use a piece of text
            return new TextLabelFactory(makeGetter(vals)());
        }
        else if (!hasBindings) {
            // otherwise, use an observable that returns the text
            return new TextLabelFactory(
                new Async.ObservableValue<string>(makeGetter(vals)));
        }
        else {
            // create a function that returns the observable
            return new TextLabelFactory((baseComponent, propName) => {
                // ... after turning bindings into observables
                var clone = vals.map(v => (v instanceof Binding) ?
                    v.observeOn(baseComponent, propName) : v);
                return new Async.ObservableValue<string>(makeGetter(clone));
            });
        }
    }
    else if (strings instanceof Function) {
        // if given a getter function, map single observable
        return new TextLabelFactory(
            new Async.ObservableValue<{ toString }>(strings), values[0]);
    }
    else if (strings instanceof Binding) {
        // if given a single binding, create a function that returns
        // the observable value that returns the final text
        return new TextLabelFactory((baseComponent, propName) =>
            strings.observeOn(baseComponent, propName),
            values[0]);
    }
    else {
        // if given just a single value, just use a single piece of text
        return new TextLabelFactory(strings, values[0]);
    }
}
