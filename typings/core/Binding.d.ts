import { Component } from "./Component";
import { ManagedList } from "./ManagedList";
/**
 * Represents a value to be included in `Component` presets (using the static `Component.with` method), to be updated asynchronously from a property on active composite objects (see `@compose`).
 * Bindings should be created using the `bind` and `bindf` functions, and assigned to a property of a single object passed to `Component.with`.
 */
export declare class Binding {
    /** Returns true if given value is an instance of `Binding` */
    static isBinding(value: any): value is Binding;
    /** Create a new binding for given property and default value. See `bind`. */
    constructor(source?: string, defaultValue?: any);
    /** Method for duck typing, always returns true */
    isComponentBinding(): true;
    /** Unique ID for this binding */
    readonly id: string;
    /** @internal Constructor for a reader, that reads current bound and filtered values */
    Reader: {
        new (composite: Component): {
            readonly composite: Component;
            getValue(hint?: any): any;
        };
    };
    /** Name of the property that should be observed for this binding (highest level only, does not include names of nested properties or keys) */
    readonly propertyName?: string;
    /** Nested bindings, if any (e.g. for string format bindings, see `bindf`) */
    readonly bindings?: ReadonlyArray<Binding>;
    /** Parent binding, if any (e.g. for nested bindings in string format bindings) */
    parent?: Binding;
    /**
     * Add a filter to this binding, which transforms values to a specific type or format. These can be chained by adding multiple filters in order of execution.
     * Filters can also be specified after the `|` (pipe) separator in string argument given to the `Binding` constructor, or `bind` function.
     * Available bindings include:
     * - `s`, `str`, or `string`: convert non-undefined values to a string using the `String(...)` function.
     * - `n`, `num`, or `number`: convert non-undefined values to a floating-point number using the `parseFloat(...)` function.
     * - `i`, `int`, or `integer`: convert values to whole numbers using the `Math.round(...)` function. Undefined values are converted to `0`.
     * - `dec(1)`, `dec(2)`, `dec(3)` etc.: convert values to decimal numbers as strings, with given number of fixed decimals.
     * - `?` or `!!`, `not?` or `!`: convert values to boolean, applying boolean NOT for `!` and `not?`, and NOT-NOT for `?` and `!!`.
     * - `or(...)`: use given string if value is undefined or a blank string; the string cannot contain a `}` character.
     * - `uniq`: leave only unique values in an array, and discard undefined values
     * - `blank` or `_`: output an empty string, but make the unfiltered value available for the #{...} pattern in `bindf`.
     */
    addFilter(fmt: string): this;
    /** Chained filter function, if any */
    private _filter?;
    /** List of applicable filters, new filters may be added here */
    static readonly filters: {
        [id: string]: (v: any, ...args: any[]) => any;
    };
}
/**
 * Represents a set of bindings (see `Binding`) that are compiled into a single string value.
 * String format bindings should be created using the `bindf` function instead of this constructor.
 */
export declare class StringFormatBinding extends Binding {
    /** Creates a new binding for given format string. See `bindf`. */
    constructor(text: string);
    /** Nested `Binding` instances for all bindings in the format string */
    readonly bindings: ReadonlyArray<Binding>;
}
export declare namespace Binding {
    /**
     * @internal A list of components that are actively bound to a specific binding. Also includes a method to update the value on all components, using the `Component.updateBoundValue` method.
     */
    class Bound extends ManagedList<Component> {
        binding: Binding;
        /** Create a new bound instance for given binding and host composer */
        constructor(binding: Binding, composite: Component);
        /** Bound parent binding */
        readonly parent?: Bound;
        /** Bound property name (highest level only, same as `Binding.propertyName`) */
        readonly propertyName?: string;
        /** Returns true if there already is an actively bound value */
        hasValue(): boolean;
        /** The current bound value, taken from the composite object (or cached) */
        readonly value: any;
        /** Update all components in the list with a new value. The current value of the source property (i.e. using `Binding.propertyName`) may be passed in if it is already known. */
        updateComponents(v?: any): void;
        private _reader;
        private _updatedValue?;
        private _lastValue;
    }
}
/**
 * Returns a new binding, which can be used as a component preset (see `Component.with`) to update components dynamically with the value of an observed property on the composite object.
 *
 * The property name is specified in the first argument. Nested properties are allowed (e.g. `foo.bar`), but only the highest level property will be observed. Hence, changes to nested properties may not be reflected in bound values unless a change event is emitted on the highest level property.
 *
 * Mapped objects in a `ManagedMap` can be bound using a `#` prefix for keys (e.g. `map.#key`).
 * A `ManagedMap` can be bound as a plain object using a `#` nested property (e.g. `map.#`).
 * Properties of all objects in a `ManagedList` can be bound (as an array) using a `*` prefix for the nested property (e.g. `list.*foo`).
 * A `ManagedList` can be bound as a plain array using a `*` nested property (e.g. `list.*`).
 *
 * The property name may be appended with a `|` (pipe) character and a *filter* name: see `Binding.addFilter` for available filters. Multiple filters may be chained together if their names are separated with more pipe characters.
 *
 * A default value may also be specified. This value is used when the bound value itself is undefined.
 */
export declare function bind(propertyName?: string, defaultValue?: any): Binding;
/**
 * Returns a new binding, which can be used as a component preset (see `Component.with`) to update components dynamically with a string that includes property values from the composite object.
 *
 * A format string should be passed as a first argument. The text is bound as-is, with the following types of tags replaced:
 *
 * - `${binding.foo|filter}`: inserts a bound value, as if the tag content was used as a parameter to `bind`.
 * - `#{one/two}`: inserts one of the given options, based on the value of the previous (or first) binding as an absolute number _or_ length of an array or managed list. The order of given options is 1/other, 0/1/other, 0/1/2/other, etc., unless handled differently by the current language service. Within the options, `#_` is replaced with the value of the relevant binding.
 * - `#{2:one/two}`: as above, but refers to the binding at given index (base 1) instead of the previous binding.
 *
 * @note To use plurals or number forms based on values that should not be included in the output themselves, use the `_` (blank) filter, e.g. `"There ${n|_}#{are no/is one/are #_} item#{/s}"`.
 */
export declare function bindf(text: string): StringFormatBinding;
