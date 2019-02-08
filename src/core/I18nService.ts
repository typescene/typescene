import { ManagedObject } from './ManagedObject';
import { ManagedService, service } from './ManagedService';

/** Abstract base class definition for a `ManagedService` that provides internationalization features */
export abstract class I18nService extends ManagedService {
    name = "Core.I18n";

    /** Locale identifier (e.g. `en-US`) */
    abstract locale: string;

    /** Translate and/or format given value, based on given type string (defaults to 'translate' for strings passed to the `tt` function, or 'datetime' for Date values) */
    abstract tt(value: any, type: string): string;

    /** Returns an object with property names set to strings that should have been translated, but for which a translation was not available */
    abstract getNonTranslatable(): { [text: string]: any };
}

/** Singleton class, used to capture the current locale in a dynamic property */
class LocaleMatcher extends ManagedObject {
    @service("Core.I18n")
    service?: I18nService;
}
const _current = new LocaleMatcher();

/**
 * Translate and/or format given value using the current locale, whenever an instance of `I18nService` is registered.
 *
 * By default, strings are translated, while Date values are formatted for the current locale; however other types of formatting may be provided by the locale service such as 'currency:USD', 'date:short', 'datetime:long', etc.
 *
 * @returns a plain _object_ that can be converted to a string when required (using `String(...)` or the `.toString()` method). Locale changes are therefore not observable, and require a render context reset. The `type` parameter is stored in the result, and re-translation/formatting of the same value with the same type string is prevented.
 */
export function tt(value: any, type?: string) {
    if (!type) {
        if (value instanceof Date) type = "datetime";
        else type = "translate";
    }
    if (value && value["_tt_" + type]) return value;
    return {
        ["_tt_" + type]: true,
        toString() {
            return _current.service ? _current.service.tt(value, type!) : String(value);
        }
    }
}
