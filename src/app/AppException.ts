import { tt } from "../core/I18nService";

/**
 * Custom error type that contains properties for a code and localizable (I18n) message.
 * To extend, use the static `AppException.type()` method.
 * @note The `instanceof` operator cannot be used with typed errors; compare the `code` property of an error instance to the _static_ `code` property (or a known value) of an `AppException` class, e.g. `if (err.code === MyAppException.code) ...`.
 */
export abstract class AppException extends Error {
  /** Create an `AppException` class that sets given code and message when instantiated. Given message is localized, and translated (using `tt`) when an error object is created. If the (translated) message contains the characters `$$`, this substring is replaced by the value of the first constructor parameter. */
  static type(code: string, message: string) {
    let ttMessage = tt(message);
    return class AppExceptionType extends AppException {
      static code = code;
      constructor(data?: number | string) {
        super();
        this.message = String(ttMessage).replace("$$", String(data));
      }
      code = code;
    } as { new (data?: number | string): AppException; code: typeof code };
  }

  /** Known error code for all instances of this error; should be checked instead of using the `instanceof` operator */
  static code: string;

  protected constructor(public readonly data?: number | string) {
    super();
  }

  /** Mandatory error code that identifies the type of error */
  abstract readonly code: string;
}
