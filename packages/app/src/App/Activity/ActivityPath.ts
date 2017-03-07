import Async from "@typescene/async";
import { Activity, ResourceActivity } from "./Activity";

export type PathInitializerPart = ResourceActivity | ActivityResourcePath | string;

/** Represents a resource path (URL/hash segment) that is handled by one or more activities */
export class ActivityResourcePath {
    /** Create a new resource path from given parts (string, ResourceActivity instance, or another resource path) */
    constructor(...parts: PathInitializerPart[]) {
        this._parts = parts;
    }

    /** Append a part to the end of this path and return new path */
    public concat(...parts: PathInitializerPart[]) {
        var result = new ActivityResourcePath();
        result._parts = parts;
        return result;
    }

    /** Returns the URL that can be used e.g. in href attributes; does not contain final slash so can be concatenated */
    public toString() {
        var prefix = "#/";
        var firstPart = true, startAt = 0;
        var result = this._parts.map((part, i) => {
            if (part instanceof ResourceActivity)
                part = (<ResourceActivity>part).resourcePath!;
            var urlPart = String(part);

            // find and remove prefix, use only first part's prefix
            var prefixMatch = urlPart.match(/^(#|\.\.?)?\/|^#/);
            if (prefixMatch) {
                var currentPrefix = prefixMatch[0];
                if (currentPrefix === "/" || currentPrefix === "#/")
                    firstPart = true, startAt = i;
                if (firstPart) prefix = currentPrefix;
                if (urlPart) firstPart = false;
                urlPart = urlPart.slice(currentPrefix.length);
            }
            return urlPart;
        }).slice(startAt).filter(part => !!part.length)
            .join("/");
        return prefix + result.replace(/\/+$/, "");
    }

    /** Check if given URL or path (e.g. http://... or /... or #/...) matches this path (or a sub path); returns matching prefix and remainder if matched successfully, undefined otherwise */
    public match(location: string) {
        var target = String(this);
        var isHash = false;
        if (target.charAt(0) === "#") {
            // only use hash from given location
            location = "#" + location.split("#").slice(1).join("#");
            if (location === "#") location = "#/";
            isHash = true;
        }
        else if (target.charAt(0) === "/" && location.charAt(0) !== "/") {
            // only use path name from given location
            location = "/" + location.replace(/^\w*\:\/\//, "").replace(/#.*/, "")
                .split("/").slice(1).join("/");
        }

        // check if prefix matches, if so return match information
        if (location.slice(0, target.length) === target &&
            (location.length === target.length || target.slice(-1) === "/" ||
                location.charAt(target.length) === "/")) {
            return <ActivityResourcePath.Match>{
                remainder: location.slice(target.length).replace(/^\/+/, ""),
                isHash
            };
        }
        return undefined;
    }

    private _parts: PathInitializerPart[] = [];
}
export namespace ActivityResourcePath {
    /** Information for a resource path match */
    export interface Match {
        /** The path name or hash prefix that was matched */
        location: string;

        /** The remainder of the location after the matching prefix, without leading slash (if any) */
        remainder: string;

        /** True if location matched by hash (part after #/...) */
        isHash: boolean;
    }
}

/** Represents a mapping of paths to activity providers (routes) */
export class ActivityResourceMap {
    /** Add a route that invokes given callback with parameters that correspond to the parts of the path remainder when current location matches with given path (#/... or /...); the final parameter is set to all remaining parts joined with slashes (glob); if the callback has no parameters, an exact match is required; returns a signal connection that can be used to unregister */
    public register(
        path: PathInitializerPart | PathInitializerPart[],
        callback: (...params: string[]) =>
            Activity | Activity[] | PromiseLike<Activity | Activity[]> | undefined):
        Async.SignalConnection {
        // get a proper activity path together
        var resourcePath: ActivityResourcePath = <any>path;
        if (!(path instanceof ActivityResourcePath)) {
            resourcePath = ActivityResourcePath.prototype.concat.apply(
                new ActivityResourcePath(),
                (path instanceof Array) ? path : [path]);
        }

        // connect to signal to call activity provider if path matches
        return this._Signal.connect(this._getMatcher(resourcePath, callback));
    }

    /** Get a promise that resolves to a list of activities that are registered for given path (#/... or /... or full href, %-decoded) */
    public obtainAsync(location: string | ActivityResourcePath):
        PromiseLike<Activity[]> {
        var path = String(location);
        var signal = new this._Signal(path).emit();
        return Async.Promise.all(signal.results)
            .then(results => {
                var activities: Activity[] = [];
                results.forEach(function getActivities(result) {
                    if (result instanceof Array)
                        result.forEach(getActivities);
                    else if (result instanceof Activity)
                        activities.push(result);
                });
                activities.forEach(activity => {
                    if ((activity instanceof ResourceActivity) &&
                        activity.resourcePath === undefined)
                        activity.resourcePath = path;
                });
                return activities;
            });
    }

    /** Get a function that matches a location with given resource path and calls callback with location remainder */
    private _getMatcher(resourcePath: ActivityResourcePath, callback) {
        return (location => {
            var match = resourcePath.match(location);
            if (match) {
                // target URL prefix matches
                if (callback.length) {
                    // call callback with remainder
                    var params: string[] = [];
                    var split = match.remainder.split("/");
                    for (var i = 0; i < callback.length - 1; i++)
                        params.push(split.shift()!);
                    params.push(split.join("/"));
                    return callback.apply(undefined, params);
                }
                else if (!match.remainder) {
                    // exact match, also call callback
                    return callback();
                }
            }
        });
    }

    private _Signal = Async.defineSignal<string>();
}
