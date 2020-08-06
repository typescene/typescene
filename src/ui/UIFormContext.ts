import { Component } from "../core/Component";
import { bind } from "../core/Binding";
import { AppException } from "../app";

/** @internal Form context binding, can be reused to avoid creating new bindings */
export const formContextBinding = bind("formContext");

/** Error that is used when a required property is missing */
const REQUIRED_ERROR = AppException.type("FORM_REQUIRED", "%s is required");

/**
 * Represents form field data that can be used by input field components. By default, a `formContext` property on `AppActivity` or `ViewComponent` instances is used, but an alternative form context instance may be bound using a `UIForm` or `UIFormContextController` component.
 *
 * To create a typed form context instance, use the static `create` method instead of the constructor.
 */
export class UIFormContext<TData = any> extends Component {
  /** Create a typed instance with given values */
  static create<TData extends object>(values: TData) {
    let result = new UIFormContext<TData>();
    result._values = values;
    return result;
  }

  /** Retrieve the value for a field with given name */
  get<K extends keyof TData>(name: K): TData[K] | undefined {
    if (name === undefined) return undefined;
    return this._values[name];
  }

  /** Returns true if the field with given name is set (but might be `undefined`) */
  has(name: string) {
    return name in this._values;
  }

  /**
   * Set the value for a field with given name.
   * @param name
   *  Name of the field to set
   * @param value
   *  New field value
   * @param validate
   *  Set to true to automatically run the validation test for this field, if any
   * @param silent
   *  Set to true to avoid emitting a change event after setting the value; this means that bound components will not be updated immediately, since the field value itself cannot be observed directly.
   */
  set(name?: keyof TData, value?: any, validate?: boolean, silent?: boolean) {
    if (!name) return;
    if (typeof this._values[name] === "number") value = +value;
    if (validate || this._values[name] !== value) {
      this._values[name] = value;
      if (validate) this.validate(name);
      if (!silent) this.emitChange();
    }
  }

  /** Remove the value for a field with given name, including any associated error, and emit a change event. The field will also no longer be validated. */
  unset(name: keyof TData) {
    if (!name || !(name in this._values)) return;
    delete this._values[name];
    delete this.errors[name];
    this.emitChange();
  }

  /** Remove all field values from this instance, including any associated errors, and emit a change event. None of the existing fields will be validated anymore, until they are set again (using `set()`). */
  clear() {
    for (let p in this._values) {
      delete this._values[p];
      delete this.errors[p];
    }
    this.emitChange();
  }

  /** Returns a plain object that contains properties for all fields and their values */
  serialize() {
    let result = Object.create(null);
    for (let p in this._values) result[p] = this._values[p];
    return result;
  }

  /** Add a validation test for a field with given name, which results in an error if the current value is undefined, null, false, or an empty string (but not the number '0'). The description is used for generating error messages. */
  required(name: keyof TData, description?: string) {
    this.test(name, t => t.required(description));
    return this;
  }

  /** Add a validation test for a field with given name, replacing the current test for the same name, if any. The function is called whenever the field value changes (unless prevented using the respective parameter for the `set()` method) and upon invocation of `validate()` and `validateAll()` methods. If the function throws an error, either directly or using the methods of the `UIFormContext.ValidationTest` instance (single parameter), the resulting error is added to the `errors` object */
  test<K extends keyof TData>(
    name: K,
    f: (test: UIFormContext.ValidationTest<TData[K]>) => void
  ) {
    this._validations[name] = f;
    return this;
  }

  /** Validate the current value of a field with given name; updates the `error` object, but does _not_ emit a change event. To add validation tests, use the `test()` method. */
  validate(name: keyof TData) {
    let value = this._values[name];
    if (this._validations[name]) {
      try {
        let test = new UIFormContext.ValidationTest(name as string, value);
        this._validations[name](test);
        this.errors[name] = undefined;
      } catch (err) {
        this.errors[name] = err;
      }
    } else {
      this.errors[name] = undefined;
    }
    return !this.errors[name];
  }

  /** Validate the current values of all fields that have been set; updates the `error` object, but does _not_ emit a change event */
  validateAll() {
    for (let p in this._values) this.validate(p);
    return this;
  }

  /**
   * The number of errors that have been recorded after validation of one or more fields.
   * @note This starts out at 0, and is only updated when values are set and/or validated. To retrieve the total number of errors for this instance, call `validateAll()` before reading this property.
   */
  get errorCount() {
    let count = 0;
    for (let p in this.errors) {
      if (this.errors[p]) count++;
    }
    return count;
  }

  /**
   * True if there are currently no recorded errors.
   * @note This **only** reflects validated fields; call `validateAll()` before reading this property to ensure all fields are tested first.
   */
  get valid() {
    for (let p in this.errors) {
      if (this.errors[p]) return false;
    }
    return true;
  }

  /** All errors that have been recorded after validating one or more fields; see also `errorCount` */
  readonly errors: { [name in keyof TData]: Error | undefined } = Object.create(null);

  private _values: Partial<TData> = Object.create(null);
  private _validations: any = Object.create(null);
}

export namespace UIFormContext {
  /** Encapsulates the current value for a specific form field, as passed to validation test functions; see `UIFormContext.test()` */
  export class ValidationTest<TValue> {
    /** Creates a new test case; this constructor is called automatically when validating a particular form field */
    constructor(name: string, value?: TValue) {
      this.name = name;
      this.value = value;
    }

    /** The name of the form field being validated */
    readonly name: string;

    /** The current form field value */
    readonly value?: TValue;

    /** Throws an error when the current value is undefined, null, false, or an empty string (but not the number '0'); the resulting error refers to the field name, or given description */
    required(description?: string) {
      if ((this.value as any) !== 0 && !this.value) {
        throw new REQUIRED_ERROR(description || this.name);
      }
      return this;
    }

    /** Throws an error when the type of the current field value (result of the `typeof` operator) does _not_ match given type */
    typeOf(typeName: string) {
      if (typeof this.value !== typeName) throw new TypeError();
      return this;
    }

    /** Throws an error when the given parameter is false; the resulting error is an instance of `AppException` with given error message. */
    assert(condition: boolean, errorMessage: string) {
      let ErrorType = AppException.type("FORM_TEST", errorMessage);
      if (!condition) throw new ErrorType(this.value as any);
      return this;
    }
  }
}
