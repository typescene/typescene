import { ManagedChangeEvent, ManagedObject } from "../core";
import { AppActivity } from "./AppActivity";

/** Represents the application state using a single path in URL format. */
export class AppActivationContext extends ManagedObject {
    /** The current full target path, in URL format without leading or trailing slashes (e.g. `foo/bar/123`), defaults to the empty string. Changes to this property automatically result in a change event being emitted on the object itself. */
    get target() { return this._target }
    set target(v) {
        let target = String(v || "").replace(/^\/|\/\s*$/g, "");
        this._target = target;
        this._split = target ? target.split("/") : [];
        this.emit(ManagedChangeEvent.CHANGE);
    }
    private _target = "";
    private _split: string[] = [];

    /** Navigate to given (relative) path, in URL format or `:back` to go back in history; to be overridden, the base implementation does nothing. */
    navigate(_path: string) {
        // to be overridden
    }

    /**
     * Check if given activity path matches the current target path.
     * @param path
     *  The activity path to match, without leading slashes (e.g. `foo/bar`). Paths with a trailing slash (e.g. `foo/bar/`) match the exact path as well as sub paths. Paths may contain partial captures as either `:foo` or `*foo`, matching a single segment without slashes and the full remainder of the target path, respectively - but *not* an empty segment. The prefix `./` is replaced with the path (string) of the closest parent activity that has a `AppActivity.path` string property.
     * @param activity
     *  The activity that is used to search for parent activities if necessary.
     * @returns An object with properties for all partial captures *if* given path matches the current target, or undefined otherwise.
     */
    match(path: string, activity?: AppActivity): AppActivationContext.MatchedPath | undefined {
        path = String(path || "");

        // recursively replace `./` prefix with parent path, if needed
        while (activity && path[0] === "." && path[1] === "/") {
            activity = activity.getParentActivity();
            if ((activity instanceof AppActivity) &&
                typeof activity.path === "string") {
                path = activity.path.replace(/\/$/, "") + path.slice(1);
            }
        }

        // remove leading and trailing slashes
        let partial = false;
        if (path.slice(-1) === "/") path = path.slice(0, -1), partial = true;
        if (path[0] === "/") path = path.slice(1);

        // now go through all path segments, bail out as soon as match fails
        let segments = path ? path.split("/") : [];
        let result: AppActivationContext.MatchedPath = { path: this._target };
        let i = 0;
        while (i < this._split.length) {
            if (i >= segments.length) {
                return partial ? result : undefined;
            }
            if (segments[i][0] === "*") {
                // capture complete remainder
                if (segments.length > i + 1) {
                    throw Error("[ActivationContext] Invalid path: " + path);
                }
                result[segments[i].slice(1)] = this._split.slice(i).join("/");
                return result;
            }
            else if (segments[i][0] === ":" && this._split[i]) {
                // capture this segment and continue
                result[segments[i].slice(1)] = this._split[i];
            }
            else if (segments[i] !== this._split[i]) {
                // no match
                return undefined;
            }
            i++;
        }

        // done, match if path is not longer still
        return i === segments.length ? result : undefined;
    }
}

export namespace AppActivationContext {
    /** Captured path segments, matched by `AppActivationContext.match` */
    export interface MatchedPath {
        /** The full path that was matched */
        path: string;
        /** Any captured path segments from the matching activity path */
        [captureId: string]: string;
    }
}
