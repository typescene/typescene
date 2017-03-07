import * as Async from "@typescene/async";

/** Next UID to be used */
var _nextUID = 0;

/** Encapsulates CSS style properties, classes, and hidden/selected attributes; these styles are observed when applied to components on screen, by themselves or overridden using another Style instance (see `.override(...)`); properties are always applied in alphabetical order, i.e `backgroundColor` after `background`, `paddingTop` after `padding`, etc. */
export class Style {
    /** Create a Style instance that only contains given class name(s); alias for new Style(undefined, className) */
    public static withClass(className: string) {
        return new Style(undefined, className);
    }

    /** Create a new instance with given styles; class name argument may contain multiple class names separated with spaces */
    constructor(styles?: Style.StyleSet, className?: string, hidden?: boolean) {
        this._keys = new Async.ObservableArray<string>();
        this._status = new Async.ObservableValue<number>();
        this._overrides = new Async.ObservableValue<Style[]>();

        if (className !== undefined)
            this.addClass.apply(this, className.split(/\s+/));
        if (hidden !== undefined)
            hidden ? this.hide() : this.show();
        if (styles)
            this.set(styles);
    }

    /** Globally unique ID for this Style instance */
    public readonly uid = "S" + _nextUID++;

    /** Add the given class name(s); returns this */
    public addClass(...classNames: string[]) {
        for (var s of classNames) {
            s = s.trim();
            if (s) this._setProperty("." + s, true);
        }
        return this;
    }

    /** Remove the given class name(s), from this instance as well as any instances that this instance overrides; returns this */
    public removeClass(...classNames: string[]) {
        for (var s of classNames) {
            s = s.trim();
            if (s) this._setProperty("." + s, false);
        }
        return this;
    }

    /** Remove (all) existing CSS class name(s) and use given class(es) (only on this Style instance, not on overriding or overridden styles); returns this */
    public setClass(...classNames: string[]) {
        this._keys.forEach(name => {
            if (name[0] === ".") this._props![name] = false;
        });
        this.addClass.apply(this, classNames);
        return this;
    }

    /** Returns the current CSS class name(s) stored in this instance (observable) */
    public getClassName() {
        return this._keys
            .map(key => key[0] === "." ? " " + key.slice(1) : "")
            .join("").slice(1);
    }

    /** Returns the full CSS text for all properties set/overridden */
    public getCSSText() {
        var text = "";
        this._keys.forEach(key => {
            if (key[0] !== "." && key[0] !== ":") {
                text += key.replace(/([A-Z])/g, "-$1").toLowerCase()
                    .replace(/^(webkit|o|ms|moz)-/, "-$1-") +
                    ": " + this._props![key] + "; ";
            }
        });
        if (text) text = text.slice(0, -2);
        var overrides = this._overrides.value;
        overrides && overrides.forEach(style => {
            if (style) text += (text ? "; " : "") + style.getCSSText();
        });
        return text;
    }

    /** Returns value for given property; the property must be set explicitly on this Style instance or overriding Style instances */
    public get(propertyName: string) {
        var result = this._props && this._props[propertyName];
        var overrides = this._overrides.value;
        overrides && overrides.forEach(style => {
            var r = style && style.get(propertyName);
            if (r !== undefined) result = r;
        });
        return result;
    }

    /** Add a drop shadow effect, with given depth factor (0-1); returns this */
    public addShadowEffect(depth: number | Async.ObservableValue<number>) {
        this._setProperty(":shadow", depth);
        return this;
    }

    /** Add the "hidden" attribute; returns this */
    public hide(): this;

    /** Map the "hidden" attribute to the value of given observable; returns this */
    public hide(hidden?: boolean | Async.ObservableValue<boolean>);

    public hide(hidden: any = true) {
        this._setProperty(":hidden", hidden);
        return this;
    }

    /** Remove the "hidden" attribute; returns this */
    public show() {
        this._setProperty(":hidden", false);
        return this;
    }

    /** Returns hidden state for this Style instance, true if explicitly hidden, false if explicity shown, undefined otherwise (observable) */
    public isHidden() {
        if (!this._props || !this._props[":hidden"])
            this._setProperty(":hidden");
        return this._props![":hidden"];
    }

    /** Add the "selected" attribute; returns this */
    public select();

    /** Map the "selected" attribute to the value of given observable; returns this */
    public select(selected?: boolean | Async.ObservableValue<boolean>);

    public select(selected: any = true) {
        this._setProperty(":selected", selected);
        return this;
    }

    /** Remove the "selected" attribute; returns this */
    public deselect() {
        this._setProperty(":selected", false);
        return this;
    }

    /** Returns selection state for this Style instance, true if explicitly selected, false if explicity deselected, undefined otherwise (observable) */
    public isSelected() {
        if (!this._props || !this._props[":selected"])
            this._setProperty(":selected");
        return this._props![":selected"];
    }

    /** Set a style property; if given value is observable, this value will be observed while this Style instance is applied to an element on screen; returns this */
    public set(propertyName: string, value: string | Async.ObservableValue<string>): this;

    /** Set multiple style properties using values (strings or `ObservableValue` instances) in given object; if given object is an `ObservableObject`, only _existing observable_ properties are observed; returns this */
    public set(obj: Style.StyleSet | Async.ObservableObject): this;

    public set(obj: any, value?: any) {
        if (typeof obj === "string") {
            // set single property
            this._setProperty(obj, value);
        }
        else if (obj instanceof Async.ObservableObject) {
            // proxy all existing observable properties
            for (var prop in obj) {
                if (obj.hasObservableProperty(prop))
                    this._setProperty(prop, Async.observe(() => obj[prop]));
            }
        }
        else {
            // copy all properties directly
            for (var prop in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, prop))
                    this._setProperty(prop, obj[prop]);
            }
        }

        // update observable list of sorted properties
        var sorted = this._keys;
        if (sorted.length) {
            var unsorted = Object.keys(this._props);
            sorted.length = unsorted.length;
            unsorted.sort().forEach((key, i) => { sorted[i] = key });
        }

        return this;
    }

    /** @internal Call given callback for each property that has been set on this Style instance, in alphabetical (ASCII) order, _plus_ properties ":hidden", ":selected" and ".classname" properties if defined on this instance */
    public forEachProperty(
        f: (name: string, value: string | boolean | number | undefined) => void) {
        this._keys.forEach(name => { f(name, this._props![name]) });
    }

    /** Override styles and classes with those from given Style instance; returns this */
    public override(style?: Style | Style.StyleSet | Async.ObservableObject |
        Async.ObservableValue<Style | Style.StyleSet | Async.ObservableObject | undefined>): this {
        var overrides = this._overrides.value ||
            (this._overrides.value = new Async.ObservableArray<Style>());

        if (style instanceof Async.ObservableValue) {
            // add an observable value to the overrides list
            overrides.push(<any>Async.observe(() => {
                var s = (<Async.ObservableValue<any>>style).value;
                if (s && !(s instanceof Style))
                    s = Async.unobserved(() => new Style(s));
                return s;
            }));
        }
        else if (style) {
            // add a Style instance to the overrides list
            if (!(style instanceof Style))
                style = new Style(<any>style);
            else if (style === this)
                throw new Error();
            overrides.push(style);
        }
        return this;
    }

    /** Returns a list that consists of this Style instance itself, plus any recursively overriding Style instances in effect; except for instances without any non-empty properties or classes (observable) */
    public getOverrides() {
        var result: Style[] = [];
        var base = this;
        (function addOverrides(s: Style) {
            if (!s) return;
            if (s._status.value! >= (s === base ? 2 : 1))
                result.push(s);
            var overrides = s._overrides.value;
            overrides && overrides.forEach(addOverrides);
        })(this);
        return result;
    }

    /** Helper method to set an observable property on `._props` to given value and set `._status` accordingly; creates the `._props` object, makes the property observable, and adds the property name to the `._keys` array if needed (but does NOT sort it) */
    private _setProperty(name: string, value?: any) {
        if (!this._props) this._props = new Async.ObservableObject();

        // make property observable and add to list of keys
        if (!this._props.hasObservableProperty(name)) {
            Async.makePropertyObservable(this._props, name);
            this._keys.push(name);
        }

        // set value
        this._props[name] = value;

        // increase current status
        var status = (value !== undefined && value !== "") ? 2 : 1;
        if (!this._status.value || this._status.value < status)
            this._status.value = status;
    }

    /** @internal Status: set to 2 if non-empty styles/classes/attrs were added, set to 1 if only empty styles (undefined or empty string) were added, undefined otherwise */
    private _status: Async.ObservableValue<number>;

    /** @internal Properties, along with :hidden, :selected (undefined, true, or false) and .classnames (undefined, true or false) */
    private _props?: Async.ObservableObject;
    /** @internal Sorted list of property names */
    private _keys: Async.ObservableArray<string>;

    /** @internal List of overrides, or undefined if not overridden */
    private _overrides: Async.ObservableValue<Array<Style | undefined>>;
}

export namespace Style {
    /** A set of styles: properties with CSS values, e.g. { textAlign: "left" }; the operator "||" may be used within CSS value strings to indicate fallbacks for older platforms, e.g. "start || left" where "left" is applied before "start" */
    export interface StyleSet {
        [cssProperty: string]: string | Async.ObservableValue<string>
    };
}

