import { ManagedEvent } from "./ManagedEvent";
import { ManagedObject } from "./ManagedObject";
export declare class UnhandledErrorEvent extends ManagedEvent {
    constructor(error: any);
    readonly error: any;
}
export declare class UnhandledErrorEmitter extends ManagedObject {
    static emitError(error: any): void;
    constructor();
    static readonly instance: UnhandledErrorEmitter;
}
export declare function logUnhandledException(error: any): void;
