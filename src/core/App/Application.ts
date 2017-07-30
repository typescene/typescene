import Async, { Signal } from "../Async";
import { Component, Page, Screen, NavList, Button } from "../UI";
import { Activation, Activity, ActivityTransition, ActivityStack } from "./Activity";
import { injectService } from "./Service";
import { CultureService } from "./Culture";

/** RegExp to parse a URL */
const urlRE = /^(?:([^:/?#]+):)?(?:\/\/([^\/?#]*))?([^?#]*)(\?[^#]*)?(#.*)?/;

/** Helper to check if given reference refers to an Activity class */
function isActivityClass(a: any): a is typeof Activity {
    return (typeof a === "function" && a.prototype instanceof Activity);
}

/** Encapsulates the application as a singleton object */
export class Application extends Async.ObservableObject {
    /** The current (and only) Application instance, when created */
    public static current: Application;

    /** Promise that resolves to the application instance after it has been created */
    public static ready: PromiseLike<Application> = new Async.Promise<Application>(
        resolve => { Application._resolve_ready = resolve });
    private static _resolve_ready: ((ready: Application) => void) | undefined;

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
            Application._resolve_ready = undefined;
        });

        // install handlers for NavList and Button activation
        let activate = (target: any) => { this.startActivityAsync(target) };
        let isActive = (target: any) => { this.isActive(target) };
        Async.inject(Button.Activation, { activate });
        Async.inject(NavList.Activation, { activate, isActive });
    }

    /** The application name to be displayed in the title bar (observed), overridden by the title of the current activity/ies, if any */
    @Async.observable_string
    public title = "";

    /** The currently active i18n culture service (`CultureService` instance), referred to by ID `culture`; to activate another culture, use `addServiceAlias` to alias another culture to the `culture` identifier; changes will be reflected in this property asynchronously, and will also be reflected in the UI flow direction (`ltr` or `rtl`) and translations using `UI.tl` */
    @injectService("culture")
    public readonly culture: CultureService;

    /** Signal that is emitted when no activity is found for a location */
    public readonly PageNotFound = Signal.create<string>();

    /** Signal that is emitted when all activities have been dropped and none have been started */
    public readonly NoActivity = Signal.create();

    /** Activity stack instance */
    public activities = new ActivityStack();

    /** Returns the activity that is currently in the foreground (observable) */
    public getTopActivity() {
        return this.activities.top;
    }

    /** Start given activity as foreground activity (push/replace, same as calling `.activities.push/replace(...)` directly), or start activity using given resource path or string (`#/...` or `/...`, or relative path as `#./...`, `#../...`, `./...` or `../...`); if `navigateIfNotFound` is not false, then the browser/app will navigate to the new location if no matching activity is found (automatic for external URLs), otherwise invokes onPageNotFound handler; note that activities transition asynchronously and any updates will not be reflected until a few milliseconds after calling this method */
    public startActivityAsync(
        activatable: Activity | typeof Activity | Activation | string,
        replace?: boolean, navigateIfNotFound?: boolean):
        PromiseLike<ActivityTransition | undefined> {
        if (isActivityClass(activatable)) {
            activatable = (<typeof Activity>activatable).getInstance();
            if (!(activatable instanceof Activity))
                throw new Error("Invalid activity instance");
        }
        if (activatable instanceof Activation) {
            return activatable.getActivityAsync().then(activity => {
                if (activity) return this.startActivityAsync(activity);
                this.PageNotFound((<Activation>activatable).getPath()!);
                return undefined;
            });
        }
        if (activatable instanceof Activity) {
            // check if background activity
            if (activatable.options.isBackgroundActivity)
                throw new Error("Cannot start background activity directly");

            // push or replace directly
            return replace ? this.activities.replaceAsync(activatable) :
                this.activities.pushAsync(activatable);
        }

        // normalize given path/URL to absolute path, if possible
        var path = this.normalizePath(activatable);

        // check if path already active
        var currentActivityPath = this.activities.top &&
            this.activities.top.activation.getPath();
        if (currentActivityPath && currentActivityPath === path) {
            return Async.Promise.resolve(undefined);
        }

        // route based on the resulting path
        var activation = Activation.route(path!);
        if (activation) {
            // recurse for activation object
            return this.startActivityAsync(activation);
        }
        else if (navigateIfNotFound !== false) {
            // if no route/activity mapped, navigate directly
            this.navigateToUrl(activatable);
        }
        else {
            // if not supposed to navigate, emit signal
            this.PageNotFound(path!);
        }
        return Async.Promise.resolve(undefined);
    }

    /** Go back in activity history; either to previous activity or to activity of given class; returns promise that resolves to the new foreground activity, or undefined if activity was not found; the NoActivity signal is emitted if all activities have been dropped and there is no current activity anymore */
    public dropActivityAsync(ActivityClass?: typeof Activity): PromiseLike<Activity | undefined> {
        if (ActivityClass) {
            // go up to given activity, and stay put for 2ms to allow
            // platform to catch up
            return this.activities.upAsync(ActivityClass)
                .then(a => <PromiseLike<Activity | undefined>>Async.sleep(2, a));
        }
        else if (this.activities.length) {
            // pop current activity
            let resolve = (): Activity | PromiseLike<Activity | undefined> => {
                var top = this.activities.top;

                // pop again if top activity is now a background activity
                if (top && top.options.isBackgroundActivity)
                    return this.activities.popAsync(top).then(resolve);

                // emit NoActivity if none left after 10ms
                if (!top) {
                    return Async.sleep(10).then(() => {
                        if (!this.activities.length) this.NoActivity();
                        return undefined;
                    });
                }

                return top;
            };
            return this.activities.popAsync().then(resolve);
        }
        else {
            // nothing to pop, emit NoActivity and return empty promise
            this.NoActivity();
            return Async.Promise.resolve(undefined);
        }
    }

    /** Returns true if the given path matches or is a prefix of the currently active path (e.g. `#/items` is considered active if the current path is `#/items/123` or `#/items`) */
    public isActive(path: string): boolean;

    /** Returns true if the current activity or one of its parent activities is an instance of the given activity class */
    public isActive(activityClass: typeof Activity): boolean;

    /** Returns true if the given activity matches the current activity or one of its parent activities */
    public isActive(activity: Activity): boolean;

    public isActive(pathOrActivity: string | Activity | typeof Activity) {
        if ((pathOrActivity instanceof Activity) ||
            typeof pathOrActivity === "function") {
            // only check top activity and its parent activities
            var current = this.activities.top;
            while (current) {
                if (current === pathOrActivity ||
                    (current instanceof <any>pathOrActivity))
                    return true;
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
            return false;
        }
        else {
            // normalize given path and check against current URL
            var path = this.normalizePath(pathOrActivity);
            if (!path) return false;
            var cur = this.getCurrentUrl();
            if (path[0] === "#") {
                // looking for hash: trim everything except hash path
                cur = cur.replace(/[^#]*/, "").replace(/\/$/, "");
            }
            else {
                // looking for base path: keep path and hash
                cur = cur.replace(/^(?:([^:/?#]+):)?(?:\/\/([^\/?#]*))/, "")
                    .replace(/\/?\?[^#]*/, "/").replace(/\/$/, "");
            }
            var l = path.length;
            return (cur.slice(0, l) === path &&
                (cur.length === l || cur[l] === "/"));
        }
    }

    /** Remove the activity that is currently in the foreground, and reinstantiate a new activity using the `Activation` object that was used to instantiate the current activity; this also re-displays the view, if any; also increments the `.activationIndex` property; returns a promise that is fulfilled after the activity has been started */
    public reactivate(): PromiseLike<ActivityTransition | undefined> {
        if (!this.activities.top) return Async.Promise.resolve(undefined);
        var activation = this.activities.top.activation;
        if (!this._activationIndex) this._activationIndex = 0;
        this._activationIndex++;
        return this.dropActivityAsync().then(() => this.startActivityAsync(activation));
    }

    /** Counter that is incremented every time `.reactivate` is called */
    public get activationIndex() { return this._activationIndex }

    /** Returns a normalized version of given path/URL, i.e. either `/...` or `#/...`, or undefined if given path/URL cannot be normalized; relative paths are also supported (e.g. `../foo` or `#../foo`) */
    protected normalizePath(path = "") {
        let [_, proto, host, targetPath, query, targetHash] =
            String(path).match(urlRE) || (<string[]>[]);

        // if path is empty, force home and use either `/` or `#/`
        if (!_) return (this.getCurrentUrl().indexOf("#") >= 0) ? "#/" : "/";

        // check if given a full URL that is actually on the same domain
        if (proto || host) {
            let [_, curProto, curHost, curPath, curQuery, curHash] =
                this.getCurrentUrl().match(urlRE) || (<string[]>[]);
            if (!_ || curProto !== proto || curHost !== host) {
                // domain does not match
                return undefined;
            }
            curPath = curPath.replace(/\/$/, "");
            targetPath = targetPath.replace(/\/$/, "");
            if (targetHash && curPath === targetPath && curQuery == query) {
                // use hash part only
                path = targetHash;
            }
            else {
                // use full path
                targetPath += (targetHash ? "/" + targetHash : "");
                path = targetPath || "/";
            }
        }

        // check target type
        if (/^#?\//.test(path)) {
            // full path or hash path: stop here
            return path;
        }
        else if (path[0] === "#") {
            // relative hash path: resolve against current URL
            let current = this.getCurrentUrl();
            current = current.replace(/[^#]*/, "").replace(/\/$/, "").slice(1);
            path = (current + "/" + path.slice(1)).replace(/\.\//g, "");
            for (var oldPath = path;
                oldPath !== (path = path.replace(/[^\/]+\/\.\.\//, "")););
            return "#" + path;
        }
        else {
            // relative path: resolve against current URL
            let current = this.getCurrentUrl();
            current = current.replace(/^(?:([^:/?#]+):)?(?:\/\/([^\/?#]*))/, "")
                .replace(/\#.*/, "").replace(/\/$/, "");
            path = (current + "/" + path).replace(/\.\//g, "");
            for (var oldPath = path;
                oldPath !== (path = path.replace(/[^\/]+\/\.\.\//, "")););
            return path;
        }
    }

    /** Returns the (browser/app) platform's current URI as a string, if available */
    protected getCurrentUrl() { return /* platform defined */ ""; }

    /** Directs the (browser/app) platform to given URL, e.g. a full URL to navigate away from the current application */
    protected navigateToUrl(url: string) { /* platform defined */ url; }

    /** Activation counter */
    private _activationIndex?: number;
}

/** Alias for `Application#startActivityAsync` on the current `Application` instance; if there is no current instance, this function waits for an Application instance to be created first */
export function startActivityAsync(
    activityOrPath: Activity | typeof Activity | Activation | string,
    replace?: boolean, navigateIfNotFound?: boolean):
    PromiseLike<ActivityTransition | undefined> {
    let go = (app: Application) =>
        app.startActivityAsync(activityOrPath, replace, navigateIfNotFound);

    if (Application.current) return go(Application.current);
    return Application.ready.then(app => go(app));
}

/** Get the activity closest to the foreground of given type, if any */
export function findActivity<T>(
    ActivityClass: typeof Activity & { new (...args: any[]): T }):
    T | undefined {
    if (!Application.current) return undefined;
    if (Application.current.activities.top instanceof ActivityClass)
        return <any>Application.current.activities.top;
    return Application.current.activities.getParent(ActivityClass);
}
