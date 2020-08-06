import { ManagedService } from "./ManagedService";
import { sprintf } from "./format";
import { ManagedReference } from "./ManagedReference";

/** Currently registered I18nService, if any (maintained by `register` method) */
const _currentRef = new ManagedReference<I18nService>();

/** Number of times the registered I18nService changed */
let _i18nChanged = 0;

/**
 * Abstract base class definition for a `ManagedService` that provides internationalization features.
 * To implement i18n in an application, extend this class and register an instance for the current locale before rendering the UI. Alternatively, use `UIRenderContext.emitRenderChange` after registering a new service to update the UI.
 * @note The service name _must_ remain `"Core.I18n"` (default, assigned by this base class) for internationalization features to work properly.
 */
export abstract class I18nService extends ManagedService {
  /** Returns the currently registered I18n service, if any */
  static get() {
    return _currentRef.get();
  }

  // override register method to keep track of the current I18n service
  // (better performance than having to go through ManagedService every time)
  register() {
    super.register();
    _currentRef.set(this);
    _i18nChanged++;
    return this;
  }

  name = "Core.I18n";

  /** Locale identifier (e.g. `en-US`) */
  abstract locale: string;

  /** Decimal separator used by `strf` and `bindf`; defaults to `.` */
  decimalSeparator = ".";

  /** Load translations for use by `getText`; given source must be an array of tuples (i.e. arrays with 2 elements: the original key or string in the source language, and its translation) */
  protected loadTexts(source: string[][]) {
    if (!this._loadedTexts) {
      this._loadedTexts = {};
    }
    for (let tup of source) {
      if (tup[1]) this._loadedTexts[tup[0]] = tup[1];
    }

    // increase counter to make sure I18nString texts are updated
    _i18nChanged++;
  }
  private _loadedTexts?: { [key: string]: string };

  /**
   * Returns a translation for given string. The string may contain formatting placeholders such as %s, these should exist in the translation as well, although their order may be changed.
   * If a translation is not found, the input string is returned as-is.
   * @note This method is called automatically by `strf` and `bindf`, and it should not be necessary to call this method directly.
   */
  getText(str: string) {
    return this._loadedTexts?.[str] ? this._loadedTexts[str] : str;
  }

  /**
   * Pick one of the given plural forms, based on given number. Can be overridden for languages that have plural forms that are different from English and Germanic languages.
   * @note This method is called automatically by `strf` and `bindf`, and it should not be necessary to call this method directly.
   */
  getPlural(n: number, forms: string[]) {
    return forms[n == 1 ? 0 : 1] || "";
  }

  /**
   * Returns a formatted string for given value, using given type specification(s) if needed, e.g. `date`, `datetime`, etc.
   * @note This method is called automatically by `strf`, `bind`, and `bindf`. Any types supported here can be used with the `|local:...` binding filter and `%{local:...}` string format placeholder.
   */
  abstract format(value: any, ...type: string[]): string;
}

/**
 * Encapsulates a string, which is translated and formatted lazily (i.e. the first time `toString` is called), as well as any input values.
 * Before formatting, the string is automatically translated using the `I18nService.getText()` method of the currently registered I18n service, if any.
 * @note Objects of this class are returned by the `strf` function, refer to this function for valid format string placeholders.
 */
export class I18nString {
  constructor(format: string | { toString(): string }, values?: any[]) {
    this.format = format;
    if (values) this.update(values);
  }

  /** Original format string */
  readonly format: { toString(): string };

  /** Translated format string, if any */
  text?: string;

  /** Returns the resulting string */
  toString() {
    return ""; // overridden
  }

  /** Updates input values to given values; this clears the current result, if any */
  update(values: any[]) {
    let result: string | undefined;
    let format = this.format;
    let changed = _i18nChanged;
    this.toString = () => {
      // return cached result if any
      if (_i18nChanged !== changed) {
        result = undefined;
        this.text = undefined;
      }
      if (result !== undefined) return result;

      // translate text if needed
      let i18n: I18nService | undefined;
      if (this.text === undefined) {
        this.text = ((i18n = _currentRef.get())
          ? i18n.getText(String(format))
          : String(format)
        ).replace(/\*\*\*\{.*\}\*\*\*/g, "");
      }

      // if no values given, we're done
      if (!values.length) return (result = this.text);

      // replace plural placeholders
      let text = this.text.replace(
        /\#\{([^}]*)\}/g,
        (i18n = i18n || _currentRef.get())
          ? (_s, opts) => i18n!.getPlural(+values[0] || 0, opts.split("/"))
          : (_s, opts) => opts.split("/")[values[0] == 1 ? 0 : 1]
      );

      // use sprintf to format result
      return (result = sprintf(text, values));
    };
    return this;
  }
}

/**
 * Returns an `I18nString` that encapsulates a translated and formatted string, incorporating given values. Before formatting, the format string is automatically translated using the `I18nService.getText()` method of the currently registered I18n service, if any.
 * Placeholders in the format string are compatible with C-style _sprintf_, e.g. %s, %+8i, %.5f, etc. as well as the following custom placeholders:
 * - `***{comments}***` which are removed
 * - `#{a/b}`, `#{a/b/c}` to select an option based on the numeric value of the _first_ value in the parameter list, for pluralization (e.g. `strf("%i file#{/s}", n)`)
 * - `%{_}` to insert nothing at all (blank string)
 * - `%{uc}`, %{lc}` for uppercase and lowercase strings
 * - `%{?}` for true or false (boolean) and `%{!}` for negation
 * - `%{then:a:b}` to select strings a or b based on boolean value
 * - `%{or:b}` to select string b if the value is not boolean true
 * - `%{local:...}` for I18n-formatted values; the type part(s) are variable, and will need to be implemented by the `I18nService.format` method of the currently registered I18n service, e.g. `strf("%{local:date}", new Date())`.
 * @note Asterisks (`*`) anywhere in a placeholder are replaced by the next value in the parameter list (_before_ the value being represented itself), e.g. in `strf("%.*f", precision, number)` and `strf("%{local:currency:*}", currency, number)`.
 * @note Floating point numbers are formatted using the decimal separator specified by the `I18nService.decimalSeparator` property of the currently registered I18n service, if any. Number grouping separators are not supported, and if necessary numbers will need to be formatted using %{local:...}.
 */
export function strf(format: string | { toString(): string }, ...values: any[]) {
  if (format instanceof I18nString) {
    if (!values.length) return format;
    return new I18nString(format.format, values);
  }
  return new I18nString(format, values);
}
