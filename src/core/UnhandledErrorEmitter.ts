import { ManagedEvent } from "./ManagedEvent";
import { ManagedObject } from "./ManagedObject";
import * as util from "./util";

/** Event that is emitted by `UnhandledErrorEmitter` for each unhandled error (see `UnhandledErrorEmitter`) */
export class UnhandledErrorEvent extends ManagedEvent {
  constructor(error: any) {
    super("ERROR");
    this.error = error;
  }

  /** The error that occurred */
  readonly error: any;
}

/**
 * Singleton managed object class that logs errors and emits an `UnhandledErrorEvent` for otherwise unhandled exceptions.
 * The (single) instance of this class can be observed to capture errors as `UnhandledErrorEvent` events, to handle errors in different ways
 */
export class UnhandledErrorEmitter extends ManagedObject {
  /** Log and emit given error */
  static emitError(error: any) {
    if (console.error) console.error(error);
    else if (console.log) console.log(error);
    UnhandledErrorEmitter.instance.emit(UnhandledErrorEvent, error);
  }

  /** Singleton constructor, do not use directly */
  constructor() {
    super();
    if (UnhandledErrorEmitter.instance) throw Error();
  }

  /** Singleton instance of this class (read-only) */
  static readonly instance = new UnhandledErrorEmitter();
}

// set exception handler for managed objects (to break circular dependency)
util.setExceptionHandler(UnhandledErrorEmitter.emitError);

/** Log given error and emit an event on the `UnhandledErrorEmitter` instance */
export function logUnhandledException(error: any) {
  UnhandledErrorEmitter.emitError(error);
}
