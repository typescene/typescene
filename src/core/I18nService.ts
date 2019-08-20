import { ManagedList } from "./ManagedList";
import { ManagedObject } from "./ManagedObject";
import { ManagedService, service } from "./ManagedService";

/**
 * Abstract base class definition for a `ManagedService` that provides internationalization features.
 * To implement i18n in an application, extend this class and register an instance for the current locale before rendering the UI. Alternatively, use `UIRenderContext.emitRenderChange` after registering a new service to update the UI. In the application's implementation of the `I18nService` class, the methods `tt` and and `getNonTranslatable` must be defined.
 * @note The service name _must_ remain `"Core.I18n"` (default, assigned by this base class) for global functions such as 'tt' to work.
 */
export abstract class I18nService extends ManagedService {
  name = "Core.I18n";

  /** Locale identifier (e.g. `en-US`) */
  abstract locale: string;

  /**
   * Translate and/or format given value, based on given type string (defaults to 'translate' for strings passed to the `tt` function, or 'datetime' for Date values).
   *
   * @note Use the `tt` function instead where possible, which also removes `***{...}***` tags which can be used for unique string identifiers or comments to translators. This method should not need to remove those tags by itself.
   */
  abstract tt(value: any, type: string): string;

  /** Returns an object with property names set to strings that should have been translated, but for which a translation was not available (abstract) */
  abstract getNonTranslatable(): { [text: string]: any };

  /**
   * Pick one of the given plural forms, based on given number (or given array/ManagedList length). Can be overridden for languages that require more advanced logic.
   *
   * The default implementation chooses the first form for `n >= 1 && n < 2 || n <= -1 && n > -2` and the second form otherwise (i.e. options are 1 or 0/many). If more than two forms are given, this implementation chooses the form based on `Math.floor(Math.abs(n))` (i.e. options are 0, 1, 2, ..., many).
   */
  getPlural(n: any, forms: string[]) {
    return _getPlural(n, forms);
  }
}

/** Singleton class, used to capture the current locale in a dynamic property */
class LocaleMatcher extends ManagedObject {
  @service("Core.I18n")
  service?: I18nService;
}
const _current = new LocaleMatcher();

/**
 * Template string tag for translating the input string using the current locale, whenever an instance of `I18nService` is registered.
 *
 * The template string may also contain other tags:
 * - `#{one/two}`: inserts one of the given options, based on the value of the previous (or first) value as an absolute number _or_ length of an array or managed list. The order of given options is 1/other, 0/1/other, 0/1/2/other, etc., unless handled differently by the current language service. Within the options, `#_` is replaced with the value itself (clipped to an integer value).
 * - `#{2:one/two}`: as above, but refers to the value at given index (base 1) instead of the previous one.
 * - `***{...}***`: removed altogether, this is meant for unique string identifiers or comments to translators.
 *
 * @note To use plurals or number forms based on values that should not be included in the output themselves, use comment tags, e.g. `"There ***{${n}}***#{are no/is one/are #_} item#{/s}"`.
 *
 * @returns a plain _object_ that can be converted to a string when required (using `String(...)` or the `.toString()` method). Locale changes are therefore not observed, and require a render context reset.
 */
export function tt(strings: TemplateStringsArray, ...values: any[]): { toString(): string };

/**
 * Translate and/or format given value using the current locale, whenever an instance of `I18nService` is registered.
 *
 * By default, strings are translated, while Date values are formatted for the current locale; however other types of formatting may be provided by the locale service such as 'currency', 'currency:USD', 'date:short', 'datetime:long', etc.
 *
 * @returns a plain _object_ that can be converted to a string when required (using `String(...)` or the `.toString()` method). Locale changes are therefore not observed, and require a render context reset.
 */
export function tt(value: any, type?: string): { toString(): string };
export function tt(value: any, ...params: any[]) {
  let type: string | undefined;
  let isTagged: boolean | undefined;
  if (!Array.isArray(value)) {
    type = params[0];
  } else {
    isTagged = true;
    value = value.reduce((s, part, i) => (i ? s + "${" + i + "}" + part : part), "");
  }
  if (!type) {
    if (value instanceof Date) type = "datetime";
    else type = "translate";
  }
  if (value && value["_tt_" + type]) return value;
  return {
    ["_tt_" + type]: true,
    toString() {
      let result = _current.service ? _current.service.tt(value, type!) : String(value);
      if (isTagged) {
        let nextIndex = 0;
        result = result.replace(/[\$\#]\{(?:(\d+)\:)?([^\}]+)\}/g, (tag, idx, s) => {
          if (tag[0] === "$") {
            // replace with parameter
            nextIndex++;
            idx = +s;
            return idx > 0 && idx <= params.length ? params[s - 1] : "";
          } else {
            // replace with pluralization option
            let paramIndex = (idx ? Number(idx) : nextIndex) - 1;
            return tt.getPlural(params[paramIndex], s.split("/"));
          }
        });
      }
      result = result.replace(/\*\*\*\{[^\}]*\}\*\*\*/g, "");
      return result;
    },
  };
}

/** @internal */
export namespace tt {
  /** @internal Returns one of the plural forms given in the `forms` array; uses `I18nService` if available */
  export function getPlural(n: any, forms: string[]) {
    return _current.service ? _current.service.getPlural(n, forms) : _getPlural(n, forms);
  }
}

/** Default implementation of `getPlural` */
function _getPlural(n: any, forms: string[]) {
  if (typeof n === "object") {
    if (Array.isArray(n)) n = n.length;
    else if (n instanceof ManagedList) n = n.count;
    else if (typeof n.valueOf === "function") {
      n = n.valueOf();
      if (Array.isArray(n)) n = n.length;
      else if (n instanceof ManagedList) n = n.count;
    }
  }
  let value = (typeof n === "string" ? parseFloat(n) : Number(n)) || 0;
  let absValue = Math.abs(value);
  let result: string;
  if (forms.length === 2) {
    // pick from one/other
    result = forms[absValue >= 1 && absValue < 2 ? 0 : 1];
  } else {
    // otherwise pick from zero/one/etc...
    result = forms[Math.min(forms.length - 1, Math.floor(absValue))];
  }

  // return result, after replacing #_ with int value itself
  return result.replace(/#_/g, value.toFixed(0));
}
