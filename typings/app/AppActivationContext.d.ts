import { ManagedObject } from "../core";
import { AppActivity } from "./AppActivity";
export declare class AppActivationContext extends ManagedObject {
    target: string;
    private _target;
    private _split;
    navigate(path: string): void;
    match(path: string, activity?: AppActivity): AppActivationContext.MatchedPath | undefined;
}
export declare namespace AppActivationContext {
    interface MatchedPath {
        path: string;
        [captureId: string]: string;
    }
}
