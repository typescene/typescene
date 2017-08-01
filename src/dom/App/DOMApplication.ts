import * as Async from "@typescene/core/Async";
import { Screen } from "../UI";
import { Application, ActivityTransition } from "@typescene/core/App";

/** True if browser history is enabled */
var useBrowserHistory = true;

/** Platform specific encapsulation of the application as a singleton object */
export class DOMApplication extends Application {
    /** Disable synchronization of activity stack with browser history */
    public static disableBrowserHistory() {
        useBrowserHistory = false;
    }

    /** Create the application instance (either from a derived class or from the Application class itself); can be called only once */
    constructor(title?: string) {
        super(title);

        // initialize page view
        Screen.ready.then(() => {
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
    }

    /** Returns the full URL from `window.location.href`; used to resolve relative URLs to start routed activities */
    protected getCurrentUrl() { return String(window.location.href); }

    /** Sets the browser's current URL (using `window.location.href`), to navigate to another page or website */
    protected navigateToUrl(url: string) { window.location.href = url; }

    /** @internal Helper that sets event handlers and listens for activity transitions */
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

            // return if this is a known state
            if (window.history.state && window.history.state.activityID)
                return;

            // check if activity history ID (no pushState support)
            if (hash.slice(0, 3) === "#__") {
                withExternal(() => this.activities.restoreHistoryStateAsync(hash.slice(3)));
                return;
            }

            // push activities
            if (hash[1] !== "/") hash = "#/" + hash.slice(1);
            withExternal(() => this.startActivityAsync(hash, false, false));
        });

        // listen for browser history movement (either triggered by user,
        // or by function below after popping an activity): reset state
        var lastPopStateID: any = null;
        window.addEventListener("popstate", event => {
            if (!useBrowserHistory) return;
            var id = lastPopStateID = event.state && event.state.activityID;

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
                var op = t.op;
                this._updateHistoryState(op);
            }
        });
    }

    // start activity based on current location
    private _startLocationActivity(replace?: boolean) {
        if (window.location.hash && window.location.hash !== "#")
            this.startActivityAsync(window.location.hash, replace, false)
                .then(undefined, () => { window.location.hash = "" });
        else
            this.startActivityAsync(window.location.href, replace, false);
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
        if (op === ActivityTransition.Operation.Push) {
            let path = current && current.activation.getPath();
            let activityID = this.activities.getHistoryState();
            if (path) {
                if (window.history.pushState) {
                    window.history.pushState({ activityID, path },
                        this.title, path);
                }
                else {
                    window.location.hash = "#__" + activityID;
                }
            }
            else {
                if (window.history.pushState) {
                    window.history.pushState({ activityID }, this.title);
                }
                else {
                    window.location.hash = "#__" + activityID;
                }
            }
        }
        else if (op === ActivityTransition.Operation.Replace) {
            let path = current && current.activation.getPath();
            let activityID = this.activities.getHistoryState();
            if (path) {
                if (window.history.replaceState) {
                    window.history.replaceState({ activityID, path },
                        this.title, path);
                }
            }
            else {
                if (window.history.replaceState) {
                    window.history.replaceState({ activityID }, this.title);
                }
            }
        }
        else if (op === ActivityTransition.Operation.Pop) {
            window.history.pushState && window.history.back();
        }
    }
}
