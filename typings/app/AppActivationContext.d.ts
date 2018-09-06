import { ManagedObject } from "../core";
import { AppActivity } from "./AppActivity";
/** Represents the application state using a single path in URL format. */
export declare class AppActivationContext extends ManagedObject {
    /** The current full target path, in URL format without leading or trailing slashes (e.g. `foo/bar/123`), defaults to the empty string. Changes to this property automatically result in a change event being emitted on the object itself. */
    target: string;
    private _target;
    private _split;
    /** Navigate to given (relative) path, in URL format or `:back` to go back in history; to be overridden, the base implementation does nothing. */
    navigate(path: string): void;
    /**
     * Check if given activity path matches the current target path.
     * @param path
     *  The activity path to match, without leading slashes (e.g. `foo/bar`). Paths with a trailing slash (e.g. `foo/bar/`) match the exact path as well as sub paths. Paths may contain partial captures as either `:foo` or `*foo`, matching a single segment without slashes and the full remainder of the target path, respectively - but *not* an empty segment. The prefix `./` is replaced with the path (string) of the closest parent activity that has a `path` string property.
     * @param activity
     *  The activity that is used to search for parent activities if necessary.
     * @returns An object with properties for all partial captures *if* given path matches the current target, or undefined otherwise.
     */
    match(path: string, activity?: AppActivity): AppActivationContext.MatchedPath | undefined;
}
export declare namespace AppActivationContext {
    /** Captured path segments, matched by `ActivationContext.math` */
    interface MatchedPath {
        /** The full path that was matched */
        path: string;
        /** Any captured path segments from the matching activity path */
        [captureId: string]: string;
    }
}
