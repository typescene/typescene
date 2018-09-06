import { ManagedEvent } from "./ManagedEvent";
import { ManagedObject } from "./ManagedObject";
/** Event that is emitted by `UnhandledErrorEmitter` for each unhandled error */
export declare class UnhandledErrorEvent extends ManagedEvent {
    constructor(error: any);
    /** The error that occurred */
    readonly error: any;
}
/**
 * Singleton managed object class that logs errors and emits an `UnhandledErrorEvent` for otherwise unhandled exceptions.
 * The (single) instance of this class can be observed to capture errors as `UnhandledErrorEvent` events, to handle errors in different ways
 */
export declare class UnhandledErrorEmitter extends ManagedObject {
    /** Log and emit given error */
    static emitError(error: any): void;
    /** Singleton constructor, do not use directly */
    constructor();
    /** Singleton instance of this class (read-only) */
    static readonly instance: UnhandledErrorEmitter;
}
/** Log given error and emit an event on the `UnhandledErrorEmitter` instance */
export declare function logUnhandledException(error: any): void;
