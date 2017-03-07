import * as Async from "@typescene/async";
import { Component, Page, Screen, NavList, Button } from "@typescene/ui";
import { Activity, ResourceActivity, ActivityTransition, ActivityStack,ActivityResourceMap, ActivityResourcePath, PathInitializerPart } from "./Activity";

/** Global resource mapping */
const _resourceMap = new ActivityResourceMap();

/** True if browser history is enabled */
var useBrowserHistory = true;

/** RegExp to parse a URL */
const urlRE = /^(?:([^:/?#]+):)?(?:\/\/([^\/?#]*))?([^?#]*)(\?[^#]*)?(#.*)?/;

/** Encapsulates the application as a singleton object */
export class Application extends Async.ObservableObject {
    /** Map resource activity on its path (using .resourcePath) */
    public static mapActivity(activity: ResourceActivity): void;

    /** Map given path (#/... or /...) to given activity (i.e. instance or instance of class through static getInstance method) */
    public static mapActivity(path: PathInitializerPart | PathInitializerPart[],
        activity?: Activity | typeof Activity): void;

    public static mapActivity(path: PathInitializerPart | PathInitializerPart[],
        activity?: Activity | typeof Activity) {
        // register callback that returns activity or creates one
        return _resourceMap.register(path, () =>
            (activity instanceof Activity) ? activity :
                activity ? activity.getInstance() :
                    <Activity>path);
    }

    /** Map given path (#/... or /...) to given callback; if callback has no parameters, an exact path match is required; otherwise callback is called with path remainder split on / characters plus glob (last parameter); callback should return an activity or array of activities (or a promise that resolves to either), returned ResourceActivity instances without a resource path will get the requested path set as their resource path automatically */
    public static mapResource(path: PathInitializerPart | PathInitializerPart[],
        callback: (...params: string[]) =>
            Activity | Activity[] | PromiseLike<Activity | Activity[]> | undefined):
        Async.SignalConnection {
        return _resourceMap.register(path, callback);
    }

    /** Disable synchronization of activity stack with browser history */
    public static disableBrowserHistory() {
        useBrowserHistory = false;
    }

    /** The current (and only) Application instance, when created */
    public static current: Application;

    /** Promise that resolves to the application instance after it has been created */
    public static ready: PromiseLike<Application> = new Async.Promise<Application>(
        resolve => { Application._resolve_ready = resolve });
    private static _resolve_ready: ((ready: Application) => void) | null;

    /** Create the application instance (either from a derived class or from the Application class itself); can be called only once */
    constructor(title?: string) {
        super();
        if (Application.current || !Application._resolve_ready)
            throw new Error("Cannot construct more than one Application instance");
        Application.current = (<any>this.constructor).current = this;
        this.title = <any>title;

        // initialize page view
        Screen.ready.then(() => {
            Application._resolve_ready!(this);
            Application._resolve_ready = null;

            // listen for events and activity transitions
            this._listen();

            // start initial page view
            Async.defer(() => {
                if (!this.activities.length)
                    this._startLocationActivity();
            });

            // set title and keep it updated
            Async.observe(() => [this.activities.title, this.title]
                    .filter(s => !!s).join(" - "))
                .subscribe(title => { document.title = title });
        });

        // install handlers for NavList and Button activation
        let activate = (target: any) => { this.startActivity(target) };
        let isActive = (target: any) => { this.isActive(target) };
        Async.inject(Button.Activation, { activate });
        Async.inject(NavList.Activation, { activate, isActive });
    }

    /** The application name to be displayed in the title bar (observed), overridden by the title of the current activity/ies, if any */
    @Async.observable_string
    public title = "";

    /** Signal that is emitted when no activity is found for a location */
    public readonly PageNotFound: Async.Signal.Emittable<string, typeof ApplicationSignal> = Async.defineSignal(ApplicationSignal);

    /** Signal that is emitted when all activities have been dropped and none have been started */
    public readonly NoActivity: Async.Signal.Emittable<void, typeof ApplicationSignal> = Async.defineSignal<typeof ApplicationSignal, any>(ApplicationSignal);

    /** Activity stack instance */
    public activities = new ActivityStack();

    /** Map resource activity on its path (using .resourcePath); returns this; also available as a static method */
    public mapActivity(activity: ResourceActivity): void;

    /** Map given path (#/... or /...) to given activity (i.e. instance or instance of class through static getInstance method); returns this; also available as a static method */
    public mapActivity(path: PathInitializerPart | PathInitializerPart[],
        activity?: Activity | typeof Activity): void;

    public mapActivity(path, activity?) {
        // invoke static method
        Application.mapActivity(path, activity);
        return this;
    }

    /** Map given path (#/... or /...) to given callback; if callback has no parameters, an exact path match is required; otherwise callback is called with path remainder split on / characters except last parameter (glob); callback should return an activity or array of activities (or a promise that resolves to either), returned ResourceActivity instances without a resource path will get the requested path set as their resource path automatically; returns this; also available as a static method */
    public mapResource(path: PathInitializerPart | PathInitializerPart[],
        callback: (...params: string[]) =>
            Activity | Activity[] | PromiseLike<Activity | Activity[]>) {
        // [invoke static method]
        Application.mapResource(path, callback);
        return this;
    }

    /** Get Component instance for given named outlet, from the view activity closest to the foreground that has given outlet mapped using `.mapView(...)` or the `mapToActivity(...)` decorator on a view Component class; can be used as an observable getter to obtain an observable value that changes when activities are started or suspended */
    public getViewComponent(outlet: string): Component | undefined {
        return this.activities.getViewComponent(outlet);
    }

    /** Returns the activity that is currently in the foreground (observable) */
    public getTopActivity() {
        return this.activities.top;
    }

    /** Start given activity as foreground activity (push/replace, same as calling .activities.push/replace(...) directly), or start activity using given resource path or string (#/... or /..., or relative path as #./..., #../..., ./... or ../...); if setHrefIfNotFound is not false, then window.location.href is set to the new location if no matching activity is found (automatic for external URLs), otherwise invokes onPageNotFound handler; note that activities transition asynchronously and any updates may not be reflected until several milliseconds after calling this method */
    public startActivity(
        activityOrPath: Activity | typeof Activity | ActivityResourcePath | string,
        replace?: boolean, setHrefIfNotFound?: boolean):
        PromiseLike<ActivityTransition[]> {
        if (ActivityStack.TRACE_LOG) console.log("App trace: startActivity");
        if (activityOrPath instanceof Function &&
            (<typeof Activity>activityOrPath).getInstance) {
            activityOrPath = (<typeof Activity>activityOrPath).getInstance();
        }
        if (activityOrPath instanceof Activity) {
            // check if background activity
            if (activityOrPath.options.isBackgroundActivity)
                throw new Error("Cannot start background activity directly");

            // push or replace directly
            return (replace ? this.activities.replaceAsync(activityOrPath) :
                this.activities.pushAsync(activityOrPath))
                .then(a => [a]);
        }
        else {
            // strip own hostname and path
            var strPath = String(activityOrPath);
            var [_target, targetProtocol, targetHost, targetPath, targetQuery, targetHash] =
                strPath.match(urlRE) || (<string[]>[]);
            var [_cur, curProtocol, curHost, curPath, curQuery, curHash] =
                String(window.location.href).match(urlRE) || (<string[]>[]);
            targetQuery = _target = _cur = curQuery =
                <any>undefined; // ignore unused
            if (targetHost) {
                if (targetProtocol === curProtocol && targetHost === curHost) {
                    if (targetHash && targetPath === curPath) {
                        // use only hash part if the rest is the same
                        strPath = targetHash || "";
                    }
                    else {
                        // use path and hash if only the host matches
                        if (targetHash === "#") targetHash = "";
                        strPath = targetPath + (targetHash || "");
                    }
                }
                else if (targetProtocol || targetHost) {
                    // different host, do not attempt to start activity
                    window.location.href = strPath;
                    return Async.Promise.resolve([]);
                }
            }

            // fix relative paths
            var top = this.activities.top;
            var path = new ActivityResourcePath(
                (top instanceof ResourceActivity) ? top : "",
                strPath)
                .toString()
                .replace(/^(\#?\/)\/+/, "$1");
            if (path[0] === "#" && (strPath[0] === "." || strPath[0] === "/"))
                path = strPath;
            if (path === "#") path = "#/";
            else if (!path) path = "/";

            // if still relative, do not attempt to start activity
            if (path[0] !== "#" && path[0] !== "/") {
                window.location.href = strPath;
                return Async.Promise.resolve([]);
            }

            // check if URL/hash already active
            if (setHrefIfNotFound !== false &&
                (path.charAt(0) === "#" && path === curHash ||
                path.charAt(0) === "/" && path === curPath && !curHash)) {
                return Async.Promise.resolve([]);
            }

            // find activities using resource map
            return _resourceMap.obtainAsync(path).then(activities => {
                if (activities.length) {
                    // push all activities one by one
                    if (ActivityStack.TRACE_LOG)
                        console.log("App trace: starting", activities);
                    return Async.Promise.all(activities.map(a =>
                        replace ? this.activities.replaceAsync(a) :
                            this.activities.pushAsync(a)));
                }
                else if (setHrefIfNotFound !== false)
                    window.location.href = path;
                else
                    this.PageNotFound(path);

                return [];
            });
        }
    }

    /** Go back in activity history; either to previous activity or to activity of given class; returns promise that resolves to the new foreground activity, or null if activity was not found; the NoActivity signal is emitted if all activities have been dropped and there is no current activity anymore */
    public dropActivity(ActivityClass?: typeof Activity): PromiseLike<Activity | null> {
        if (ActivityStack.TRACE_LOG) console.log("App trace: dropActivity");

        // add a sleep promise for 2ms to make sure popstate has been
        // handled by ._listen() below
        if (ActivityClass) {
            // go up to given activity
            return this.activities.upAsync(ActivityClass)
                .then(a => Async.sleep(2, a));
        }
        else if (this.activities.length) {
            // pop current activity
            let resolve = () => {
                var top = this.activities.top;

                // pop again if top activity is now a background activity
                if (top && top.options.isBackgroundActivity)
                    return this.activities.popAsync(top).then(resolve);

                // emit NoActivity if none left after 10ms
                if (!top) {
                    return Async.sleep(10).then(() => {
                        if (!this.activities.length) this.NoActivity();
                        return null;
                    });
                }

                return top;
            };
            return this.activities.popAsync().then(resolve);
        }
        else {
            // nothing to pop, emit NoActivity and return null promise
            this.NoActivity();
            return Async.Promise.resolve(null);
        }
    }

    /** Returns true if the given path matches or is a prefix of the currently active path (e.g. `#/items` is considered active if the current path is `#/items/123` or `#/items`) */
    public isActive(path: ActivityResourcePath | string): boolean;

    /** Returns true if the current activity or one of its parent activities is an instance of the given activity class */
    public isActive(activityClass: typeof Activity): boolean;

    /** Returns true if the given activity matches the current activity or one of its parent activities */
    public isActive(activity: Activity): boolean;

    public isActive(pathOrActivity: ActivityResourcePath | string | Activity | typeof Activity) {
        if ((pathOrActivity instanceof Activity) ||
            typeof pathOrActivity === "function") {
            // only check top activity and its parent activities
            var current = this.activities.top;
            while (current) {
                if (current === pathOrActivity ||
                    (current instanceof <any>pathOrActivity)) return true;
                var parent = current.options.parentActivity;
                if (parent instanceof Activity) {
                    // check parent activity itself
                    current = parent;
                }
                else if (parent) {
                    // find parent activity in the stack
                    current = this.activities.getParent(parent, current);
                }
            }
        }
        else {
            if (typeof pathOrActivity === "string" &&
                /^#?\.\.?\//.test(pathOrActivity)) {
                // handle (#)./... and (#)../... as special case
                var path = pathOrActivity.slice(pathOrActivity.indexOf("/"));
                var currentPath = (pathOrActivity.charAt(0) === "#") ?
                    window.location.hash : window.location.pathname;
                if (String(currentPath).slice(-path.length) === path)
                    return true;
            }
            else {
                // use ActivityResourcepath .match method
                var target = (pathOrActivity instanceof ActivityResourcePath) ?
                    pathOrActivity : new ActivityResourcePath(pathOrActivity);
                if (target.match(window.location.href))
                    return true;
            }
        }
        return false;
    }

    // set event handlers and listen for activity transitions
    private _listen() {
        // true if external trigger caused activity changes
        var externalTrigger = false;
        function withExternal(f: () => PromiseLike<any>) {
            externalTrigger = true;
            try {
                return f().then(() => { externalTrigger = false },
                    () => { externalTrigger = false });
            }
            catch (err) {
                externalTrigger = false;
                throw err;
            }
        }

        // listen for hash changes (triggered by user)
        window.addEventListener("hashchange", () => {
            if (!useBrowserHistory) return;
            var hash = String(window.location.hash || "#");
            if (ActivityStack.TRACE_LOG)
                console.log("App trace: hashchange", hash);

            // return if this is a known state
            if (window.history.state && window.history.state.activityID)
                return;

            // check if activity history ID (no pushState support)
            if (hash.slice(0, 3) === "#__") {
                withExternal(() => this.activities.restoreHistoryStateAsync(hash.slice(3)));
                return;
            }

            // push activities
            if (hash.charAt(1) !== "/") hash = "#/" + hash.slice(1);
            withExternal(() => this.startActivity(hash, false, false));
        });

        // listen for browser history movement (either triggered by user,
        // or by function below after popping an activity): reset state
        var lastPopStateID = null;
        window.addEventListener("popstate", event => {
            if (!useBrowserHistory) return;
            var id = lastPopStateID = event.state && event.state.activityID;
            if (ActivityStack.TRACE_LOG)
                console.log("App trace: popstate", event.state);

            // defer reset to process only latest popstate event
            id && Async.defer(() => {
                if (id === lastPopStateID && id !== this.activities.getHistoryState()) {
                    try {
                        withExternal(() => this.activities.restoreHistoryStateAsync(id))
                            .then(undefined, () => {
                                // if not successful, try to revert again
                                this._updateHistoryState(ActivityTransition.Operation.Push);
                            });
                    }
                    catch (err) {
                        // if cannot reset activity, just use location
                        this._startLocationActivity(true);
                    }
                }
            });
        });

        // connect to activity manager
        this.activities.Transition.connect(t => {
            if (externalTrigger) {
                // triggered by above, replace state if currrently no ID
                if (window.history.state && !window.history.state.activityID)
                    this._updateHistoryState(ActivityTransition.Operation.Replace);
            }
            else {
                // triggered by application: update browser history
                var op = t.operation;
                this._updateHistoryState(op);
            }
        });
    }

    // start activity based on current location
    private _startLocationActivity(replace?: boolean) {
        if (window.location.hash && window.location.hash !== "#")
            this.startActivity(
                decodeURIComponent(window.location.hash), replace, false)
                .then(undefined, () => { window.location.hash = "" });
        else
            this.startActivity(
                decodeURIComponent(window.location.href), replace, false);
    }

    // update browser history following an activity transition
    private _updateHistoryState(op?: ActivityTransition.Operation) {
        var current = this.activities.top;
        if (current && current.options.isBackgroundActivity) return;
        if (!useBrowserHistory) return;

        // change first push to a replace to avoid lingering initial state
        if (op === ActivityTransition.Operation.Push &&
            window.history.pushState &&
            (!window.history.state || !window.history.state.activityID))
            op = ActivityTransition.Operation.Replace;

        // check what to do: push, replace, or pop history state
        switch (op) {
            case ActivityTransition.Operation.Push:
                if ((current instanceof ResourceActivity) && current.resourcePath) {
                    if (ActivityStack.TRACE_LOG)
                        console.log("App trace: history pushState ",
                            current.resourcePath);
                    window.history.pushState ? window.history.pushState(
                        {
                            activityID: this.activities.getHistoryState(),
                            path: current.resourcePath
                        },
                        this.title,
                        String(current.resourcePath)) :
                        (window.location.hash = "#__" + this.activities.getHistoryState());
                }
                else {
                    if (ActivityStack.TRACE_LOG)
                        console.log("App trace: history pushState [no path]");
                    window.history.pushState ? window.history.pushState(
                        { activityID: this.activities.getHistoryState() },
                        this.title) :
                        (window.location.hash = "#__" + this.activities.getHistoryState());
                }
                break;
            case ActivityTransition.Operation.Replace:
                if ((current instanceof ResourceActivity) && current.resourcePath) {
                    if (ActivityStack.TRACE_LOG)
                        console.log("App trace: history replaceState ",
                            current.resourcePath);
                    window.history.replaceState && window.history.replaceState(
                        {
                            activityID: this.activities.getHistoryState(),
                            path: current.resourcePath
                        },
                        this.title,
                        String(current.resourcePath));
                }
                else {
                    if (ActivityStack.TRACE_LOG)
                        console.log("App trace: history replaceState [no path]");
                    window.history.replaceState && window.history.replaceState(
                        { activityID: this.activities.getHistoryState() },
                        this.title);
                }
                break;
            case ActivityTransition.Operation.Pop:
                if (ActivityStack.TRACE_LOG)
                    console.log("App trace: history popState");
                window.history.pushState && window.history.back();
        }
    }
}

/** *Class decorator*, maps the decorated Activity class to given path (using `Application.mapActivity` method) [decorator] */
export function mapToPath(path: PathInitializerPart | PathInitializerPart[]) {
    return (target: typeof Activity) => {
        Application.mapActivity(path, target);
    };
}

/** *Class decorator*, maps the decorated Activity class to simple sub resources on given path (using `Application.mapResource` method, use that method directly for more options), but not the path itself; the activity class *must* have a constructor that takes a single string parameter, i.e. the resource path glob [decorator] */
export function mapToResource(path: PathInitializerPart | PathInitializerPart[]) {
    return (target: { new(glob: string): Activity }) => {
        Application.mapResource(path, (glob: string) =>
            (glob ? new target(glob) : undefined));
    };
}

/** Alias for `Application#startActivity` on the current Application instance; if there is no current instance, this function waits for the instance to be created first */
export function startActivity(
    activityOrPath: Activity | typeof Activity | ActivityResourcePath | string,
    replace?: boolean, setHrefIfNotFound?: boolean):
    PromiseLike<ActivityTransition[]> {
    let go = (app: Application) =>
        app.startActivity(activityOrPath, replace, setHrefIfNotFound);

    if (Application.current) return go(Application.current);
    return Application.ready.then(app => go(app));
}

/** Get the activity closest to the foreground of given type, if any */
export function findActivity<T>(
    ActivityClass: typeof Activity & { new (...args): T }):
    T | undefined {
    if (!Application.current) return undefined;
    if (Application.current.activities.top instanceof ActivityClass)
        return <any>Application.current.activities.top;
    return Application.current.activities.getParent(ActivityClass);
}

/** A signal that is emitted by `Application` */
export class ApplicationSignal extends Async.Signal<string> { }
