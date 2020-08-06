import { strf } from "../core/I18nService";

/**
 * Custom error type that contains properties for a code and localizable (I18n) message.
 * To extend, use the static `AppException.type()` method, the base class cannot be instantiated.
 * @note The `instanceof` operator cannot be used with typed errors; compare the `code` property of an error instance to the _static_ `code` property (or a known value) of an `AppException` class, e.g. `if (err.code === MyAppException.code) ...`.
 */
export abstract class AppException extends Error {
  /** Create an `AppException` class that sets given code and message when instantiated. Given message is formatted using `strf` when an error object is created, with constructor parameters passed through as values. */
  static type(code: string, message: string) {
    let strMessage = strf(message);
    return class AppExceptionType extends AppException {
      static code = code;
      constructor(...data: any[]) {
        super();
        this.message = strMessage.update([data]).toString();
      }
      code = code;
    } as { new (data?: number | string): AppException; code: typeof code };
  }

  /** Known error code for all instances of this error; should be checked instead of using the `instanceof` operator */
  static code: string;

  protected constructor(..._data: any[]) {
    super();
  }

  /** Mandatory error code that identifies the type of error */
  abstract readonly code: string;
}
