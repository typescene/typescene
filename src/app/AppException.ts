import { I18nString, strf } from "../core/I18nService";

/**
 * Custom error type that contains properties for a code and localizable (I18n) message.
 * To extend, use the static `AppException.type()` method, the base class cannot be instantiated.
 * @note The `instanceof` operator cannot be used with typed errors; compare the `code` property of an error instance to the _static_ `code` property (or a known value) of an `AppException` class, e.g. `if (err.code === MyAppException.code) ...`.
 */
export abstract class AppException extends Error {
  /** Create an object that contains multiple `AppException` classes, indexed by code. Given messages must be of type `I18nString`, i.e. the result of a call to `strf()`, to allow dynamic localization when the error object is created. */
  static group<CodeStrT extends string>(
    src: { [code in CodeStrT]: I18nString }
  ): { [code in CodeStrT]: AppException.ClassType<code> } {
    let result: any = {};
    for (let code in src) {
      result[code] = this.type(code, src[code]);
    }
    return result;
  }

  /** Create an `AppException` class that sets given code and message when instantiated. Given message is formatted (as if used in a call to `strf`) each time an error object is created, with constructor parameters passed through as values. */
  static type(
    code: string,
    message: string | { toString(): string }
  ): AppException.ClassType<typeof code> {
    let strMessage = strf(message);
    return class AppExceptionType extends AppException {
      static code = code;
      constructor(...data: any[]) {
        super();
        this.message = strMessage.update([data]).toString();
      }
      code = code;
      message!: string;
    };
  }

  /** Known error code for all instances of this error; should be checked instead of using the `instanceof` operator */
  static code: string;

  protected constructor(..._data: any[]) {
    super();
  }

  /** Mandatory error code that identifies the type of error */
  abstract readonly code: string;

  /** Error message, generated using `I18nString` from the error message that was specified when this error type was created, and constructor argument(s), if any */
  abstract readonly message: string;
}

export namespace AppException {
  /** Type definition for a class that is created using `AppException.type`, which can be used to construct error instances with a particular code (string) */
  export interface ClassType<CodeT extends string = string> {
    /** Create a new instance of this error type */
    new (...data: any[]): AppException & { code: CodeT };

    /** Known error code for all instances of this error; should be checked instead of using the `instanceof` operator */
    code: CodeT;
  }
}
