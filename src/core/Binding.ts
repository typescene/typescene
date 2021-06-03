import { err, ERROR } from "../errors";
import type { Component } from "./Component";
import { ManagedList } from "./ManagedList";
import { logUnhandledException } from "./UnhandledErrorEmitter";
import { HIDDEN } from "./util";
import { formatValue } from "./format";
import { I18nString } from "./I18nService";

/** Running ID for new `Binding` instances */
let _nextBindingUID = 16;

/** Definition of a reader instance that provides a bound value */
interface BoundReader {
  readonly boundParent: Component;
  getValue(hint?: any): any;
}

/**
 * Component property binding base class.
 * Bindings should be created using the `bind` and `bindf` functions, and used as a property of the object passed to `Component.with`.
 */
export class Binding {
  /** Returns true if given value is an instance of `Binding` */
  static isBinding(value: any): value is Binding {
    return !!(value && value.isComponentBinding && value instanceof Binding);
  }

  /** Create a new binding for given property and default value. See `bind`. */
  constructor(source?: string, defaultValue?: any) {
    let path: string[] | undefined;
    let propertyName = source !== undefined ? String(source) : undefined;
    if (propertyName) this._source = source;

    // parse property name, path, and filters
    if (propertyName !== undefined) {
      let parts = String(propertyName).split("|");
      path = parts.shift()!.split(".");
      propertyName = path.shift()!;
      while (propertyName[0] === "!") {
        propertyName = propertyName.slice(1);
        this.addFilter("!");
      }
      if (!path.length) path = undefined;
      for (let part of parts) this.addFilter(part);
    }
    this.propertyName = propertyName;

    // create a reader class that provides a value getter
    let self = this;
    this.Reader = class {
      /** Create a new reader, linked to given bound parent */
      constructor(public readonly boundParent: Component) {}

      /** The current (filtered) value for this binding */
      getValue(propertyHint?: any) {
        let result =
          arguments.length > 0
            ? propertyHint
            : propertyName !== undefined
            ? (this.boundParent as any)[propertyName]
            : undefined;

        // find nested properties
        if (path) {
          for (let i = 0; i < path.length && result != undefined; i++) {
            let p = path[i];
            if (
              typeof result === "object" &&
              !(p in result) &&
              typeof result.get === "function"
            ) {
              result = result.get(p);
            } else {
              result = result[p];
            }
          }
        }

        // return filtered result
        if (self._filter) {
          result = self._filter(result, this.boundParent);
        }
        return result === undefined && defaultValue !== undefined ? defaultValue : result;
      }
    };
  }

  /** Method for duck typing, always returns true */
  isComponentBinding(): true {
    return true;
  }

  /** Unique ID for this binding */
  readonly id = HIDDEN.BINDING_ID_PREFIX + _nextBindingUID++;

  /** @internal Constructor for a reader, that reads current bound and filtered values */
  Reader: new (boundParent: Component) => BoundReader;

  /** Name of the property that should be observed for this binding (highest level only, does not include names of nested properties or keys) */
  readonly propertyName?: string;

  /** Nested bindings, if any (e.g. for string format bindings, see `bindf`) */
  get bindings() {
    return this._bindings as ReadonlyArray<Binding>;
  }

  /** @internal */
  protected _bindings?: Binding[];

  /** Parent binding, if any (e.g. for nested bindings in string format bindings) */
  parent?: Binding;

  /**
   * Add a filter to this binding, which transforms values to a specific type or format, optionally localized using the currently registered `I18nService`. Filters can be chained by adding multiple filters in order of execution.
   * The argument may be any of the format placeholders that are available for `strf`, except for comments and plural forms -- without the leading `%` sign or grouping `{` and `}`, e.g. `s`, `+8i`, `.5f`, `?`, and `local:date`.
   * @note Filters can also be specified after the `|` (pipe) separator in string argument given to the `Binding` constructor, or `bind` function.
   */
  addFilter(fmt: string) {
    fmt = String(fmt).trim();

    // store new chained filter
    let oldFilter = this._filter;
    this._filter = (v, boundParent) => {
      if (oldFilter) v = oldFilter(v, boundParent);
      return formatValue(fmt, v);
    };
    return this;
  }

  /** Add a boolean transform to this binding: use the given value _instead_ of the bound value if that is equal to true (according to the `==` operator) */
  then(trueValue: any) {
    // store new chained filter
    let oldFilter = this._filter;
    this._filter = (v, boundParent) => {
      if (oldFilter) v = oldFilter(v, boundParent);
      return v ? trueValue : v;
    };
    return this;
  }

  /**
   * Add a boolean transform to this binding: use the given value _instead_ of the bound value if that is equal to false (according to the `==` operator)
   * @note Alternatively, use the `defaultValue` argument to `bind()` to specify a default value without an extra step.
   */
  else(falseValue: any) {
    // store new chained filter
    let oldFilter = this._filter;
    this._filter = (v, boundParent) => {
      if (oldFilter) v = oldFilter(v, boundParent);
      return v ? v : falseValue;
    };
    return this;
  }

  /** Add a filter to this binding to compare the bound value to the given value(s), the result is always either `true` (at least one match) or `false` (none match) */
  match(...values: any[]) {
    let oldFilter = this._filter;
    this._filter = (v, boundParent) => {
      if (oldFilter) v = oldFilter(v, boundParent);
      return values.some(w => w === v);
    };
    return this;
  }

  /** Add a filter to this binding to compare the bound value to the given value(s), the result is always either `true` (none match) or `false` (at least one match) */
  nonMatch(...values: any[]) {
    let oldFilter = this._filter;
    this._filter = (v, boundParent) => {
      if (oldFilter) v = oldFilter(v, boundParent);
      return !values.some(w => w === v);
    };
    return this;
  }

  /**
   * Add an 'and' term to this binding (i.e. logical and, like `&&` operator).
   * @note The combined binding can only be bound to a single component, e.g. within a list view cell, bindings targeting both the list element and the activity can **not** be combined using this method.
   */
  and(source: Binding): this;
  and(source: string, defaultValue?: any): this;
  and(source: string | Binding, defaultValue?: any) {
    let binding = source instanceof Binding ? source : new Binding(source, defaultValue);
    binding.parent = this;
    if (this._source) this._source += " and " + String(source);
    if (!this._bindings) this._bindings = [];
    this._bindings.push(binding);

    // add filter to get value from binding and AND together
    let oldFilter = this._filter;
    this._filter = (v, boundParent) => {
      if (oldFilter) v = oldFilter(v, boundParent);
      let bound = boundParent.getBoundBinding(binding);
      if (!bound) throw err(ERROR.Binding_NotFound, this.toString());
      return v && bound.value;
    };
    return this;
  }

  /**
   * Add an 'or' term to this binding (i.e. logical or, like `||` operator).
   * @note The combined binding can only be bound to a single component, e.g. within a list view cell, bindings targeting both the list element and the activity can **not** be combined using this method.
   */
  or(source: Binding): this;
  or(source: string, defaultValue?: any): this;
  or(source: string | Binding, defaultValue?: any) {
    let binding = source instanceof Binding ? source : new Binding(source, defaultValue);
    binding.parent = this;
    if (this._source) this._source += " or " + String(source);
    if (!this._bindings) this._bindings = [];
    this._bindings.push(binding);

    // add filter to get value from binding and AND together
    let oldFilter = this._filter;
    this._filter = (v, boundParent) => {
      if (oldFilter) v = oldFilter(v, boundParent);
      let bound = boundParent.getBoundBinding(binding);
      if (!bound) throw err(ERROR.Binding_NotFound, this.toString());
      return v || bound.value;
    };
    return this;
  }

  /** Log a message to the console whenever the value of this binding changes, for debugging purposes */
  debuggerLog() {
    let oldFilter = this._filter;
    this._filter = (v, boundParent) => {
      if (oldFilter) v = oldFilter(v, boundParent);
      console.log("--- ", this.toString(), v);
      return v;
    };
    return this;
  }

  /** Return a string representation of this binding, for error messages and debug logging */
  toString() {
    return "bind(" + (this._source || "") + ")";
  }

  /** Chained filter function, if any */
  private _filter?: (v: any, boundParent: Component) => any;

  /** Binding source text */
  private _source?: string;
}

/**
 * Represents a set of bindings (see `Binding`) that are compiled into a single string value.
 * @note Use the `bindf` function to create instances of this class.
 */
export class StringFormatBinding extends Binding {
  /** Creates a new binding for given format string and bindings. See `bindf`. */
  constructor(format: string, ...args: Array<string | Binding>) {
    super(undefined);
    this._format = format;

    // add bindings that are specified inline as ${...}
    if (!args.length) {
      format = String(format).replace(/\$\{[^}]+\}/g, s => {
        args.push(s.slice(2, -1));
        return "%s";
      });
    }

    // store bindings for use by component constructor
    let bindings = (this._bindings = args.map(a => {
      let binding = a instanceof Binding ? a : new Binding(a);
      binding.parent = this;
      return binding;
    }));

    // amend reader to get values from bindings and compile text
    this.Reader = class extends this.Reader {
      constructor(boundParent: Component) {
        super(boundParent);
        this.i18nString = new I18nString(format);
      }
      i18nString: I18nString;
      getValue() {
        // take values for all bindings first
        let values = bindings.map((binding, i) => {
          let bound = this.boundParent.getBoundBinding(binding);
          if (!bound) throw err(ERROR.Binding_NotFound, args[i]);
          return bound.value;
        });

        // use I18nString to format string with values
        let result = this.i18nString.update(values).toString();
        return super.getValue(result);
      }
    };
  }

  private _format: string;

  toString() {
    return "bindf(" + JSON.stringify(this._format) + ")";
  }
}

export namespace Binding {
  /** Binding type (duck typed) */
  export interface Type {
    isComponentBinding(): true;
  }

  /**
   * @internal A list of components that are actively bound to a specific binding. Also includes a method to update the value on all components, using the `Component.updateBoundValue` method.
   */
  export class Bound extends ManagedList<Component> {
    /** Create a new bound instance for given binding and its currently bound parent component */
    constructor(public binding: Binding, boundParent: Component) {
      super();
      if (binding.parent) {
        // find bound parent first
        let parent = boundParent.getBoundBinding(binding.parent);
        if (!parent) throw err(ERROR.Binding_ParentNotFound);
        this.parent = parent;
      }

      // set own properties
      this.propertyName = binding.propertyName;
      this._reader = new binding.Reader(boundParent);
    }

    /** Bound parent binding */
    readonly parent?: Bound;

    /** Bound property name (highest level only, same as `Binding.propertyName`) */
    readonly propertyName?: string;

    /** Returns true if there already is an actively bound value */
    hasValue() {
      return !!this._updatedValue;
    }

    /** The current bound value, taken from the bound parent component (or cached) */
    get value() {
      // use existing value, or get a value from the reader
      return this._updatedValue ? this._lastValue : this._reader.getValue();
    }

    /** Update all components in the list with a new value. The current value of the source property (i.e. using `Binding.propertyName`) may be passed in if it is already known. */
    updateComponents(_v?: any) {
      if (!this.count && !this.parent) {
        // do not update, invalidate stored value
        this._updatedValue = false;
        return;
      }

      // get a new value and check if an update is even necessary
      let value = this._reader.getValue(...arguments); // _v if given
      if (!this._updatedValue || this._lastValue !== value) {
        this._updatedValue = true;
        let oldValue = this._lastValue;
        this._lastValue = value;
        if (this.parent) {
          // update parent instead
          this.parent.updateComponents();
          return;
        }

        // go through all components and update the bound value
        let id = this.binding.id;
        this.forEach((component: any) => {
          try {
            if (typeof component[id] !== "function") {
              throw err(ERROR.Binding_NoComponent);
            }
            component[id](value, oldValue);
          } catch (err) {
            logUnhandledException(err);
          }
        });
      }
    }

    /** True if stored value is up to date */
    private _updatedValue?: boolean;

    private _reader: InstanceType<Binding["Reader"]>;
    private _lastValue: any;
  }
}

/**
 * Returns a new binding, which can be used as a component preset (see `Component.with`) to update components dynamically with the value of an observed property on the bound parent component, such as the `AppActivity` for a view, the `Application` for an activity, or the `ViewComponent` for nested views.
 *
 * The bound property name is specified using the first argument. Nested properties are allowed (e.g. `foo.bar`), but _only_ the first property will be observed.
 *
 * If a nested property does not exist, but a `get` method does (e.g. `ManagedMap.get()`), then this method is called with the property name as its only argument, and the resulting value used as the bound value.
 *
 * The property name may be appended with a `|` (pipe) character and a *filter* name: see `Binding.addFilter` for available filters. Multiple filters may be chained together if their names are separated with more pipe characters.
 *
 * For convenience, `!property` is automatically rewritten as `property|!` to negate property values, and `!!property` to convert any value to a boolean value.
 *
 * A default value may also be specified. This value is used when the bound value itself is undefined.
 */
export function bind(propertyName?: string, defaultValue?: any) {
  return new Binding(propertyName, defaultValue);
}

/**
 * Returns a new binding, which can be used as a component preset (see `Component.with`) to update components dynamically with a string that includes property values from the bound parent component, such as the `AppActivity` for a view, the `Application` for an activity, or the `ViewComponent` for nested views.
 *
 * The format string may contain placeholders for bound values; as soon as the value of a binding changes, the formatted string is also updated. Bindings are specified as strings, in the same format as the argument to `bind()`, using parameters (e.g. `"foo"`) OR placeholders such as `${foo}` which add bindings as if created using `bind("foo")`.
 *
 * Strings are translated and following the same rules as `strf`, refer to its documentation for a list of available formatting placeholders.
 */
export function bindf(format: string, ...bindings: string[]) {
  return new StringFormatBinding(format, ...bindings);
}
