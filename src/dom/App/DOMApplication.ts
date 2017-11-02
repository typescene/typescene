import * as Async from "@typescene/core/Async";
import { Screen } from "../UI";
import { Application, Activity, ActivityTransition } from "@typescene/core/App";

/** Amount of time (ms) during which popstate should be ignored after manually moving back in browser history */
const HISTORY_SYNC_DELAY_MS = 250;

/** Minimum history sync interval, to give the browser time to update its history after going forward/back */
const HISTORY_SYNC_TIMER = 50;

/** True if browser history is enabled */
var _useBrowserHistory = true;

/** True if never pushed to the history stack before */
var _isCleanHistory = true;

/** Flag to indicate that popstate should not be handled (if > 0) */
var _ignorePopState = 0;

/** If history.pushState is not defined, this is the last history state ID encountered */
var _historyIdFromHash = "";

/** True if moving towards browser history state, false if moving towards activity state */
var _moveToHistoryState = false;

/** True if waiting for activity stack to transition after browser history movement */
var _movingState = false;

/** Timer after which history is synchronized using ._syncHistory() */
var _syncTimer: number | undefined;

/** New title for activity with ID stored in _newTitleActivityId */
var _newTitle: string | undefined;

/** Activity for which new title has been generated asynchronously */
var _newTitleActivityId: string | undefined;

/** Platform specific encapsulation of the application as a singleton object */
export class DOMApplication extends Application {
    /** Disable synchronization of activity stack with browser history */
    public static disableBrowserHistory() {
        _useBrowserHistory = false;
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
            Async.observe(() => {
                var activityTitle = this.historyActivity && this.historyActivity.title || "";
                return [
                    activityTitle,
                    this.title !== activityTitle ? this.title : ""
                ].filter(s => !!s).join(" - ");
            }).subscribe(title => {
                // apply to DOM document/window
                document.title = title;
            });
        });
    }

    /** The activity that corresponds with the current history position in the browser; e.g. used for displaying the page title that corresponds to the current URL (observable) */
    @Async.observable
    protected historyActivity?: Activity;

    /** Returns the full URL from `location.href`; used to resolve relative URLs to start routed activities */
    protected getCurrentUrl() { return String(location.href); }

    /** Sets the browser's current URL (using `location.href`), to navigate to another page or website */
    protected navigateToUrl(url: string) { location.href = url; }

    /** @internal Helper that sets event handlers and listens for activity transitions */
    private _listen() {
        // listen for activity transitions
        this.activities.onTransitionSync(t => {
            if (!_useBrowserHistory || _movingState ||
                t.to && t.to.options && t.to.options.isBackgroundActivity)
                return;
            _moveToHistoryState = false;
            console.log("Moving activity stack", t);
            this._scheduleSync();
        });

        // listen for hash changes (triggered by user)
        window.addEventListener("hashchange", () => {
            if (!_useBrowserHistory || _movingState) return;
            var hash = String(location.hash || "#");

            // return if this is a known state
            if (history.state && history.state.syncId)
                return;

            // check if activity history ID (no pushState support)
            if (hash.slice(0, 3) === "#__") {
                _historyIdFromHash = hash.slice(3);
                if (_ignorePopState) return;
                _moveToHistoryState = true;
                this._scheduleSync();
            }
            else {
                // push activities
                if (hash[1] !== "/") hash = "#/" + hash.slice(1);
                console.log("Starting activity for", hash);
                this.startActivityAsync(hash, false, false);
            }
        });

        // listen for browser history movement (either triggered by user,
        // or after popping an activity)
        var lastPopStateId: any = null;
        window.addEventListener("popstate", event => {
            if (!_useBrowserHistory || _ignorePopState || _movingState) return;
            _moveToHistoryState = true;
            console.log("Browser history moved");
            this._scheduleSync();
        });
    }

    // helper method to set sync timer
    private _scheduleSync() {
        if (_syncTimer) clearTimeout(_syncTimer);
        _syncTimer = setTimeout(() => this._syncHistory(), HISTORY_SYNC_TIMER);
    }

    /** Synchronize activity history with current browser history; invoked ONLY using timer */
    private _syncHistory() {
        _syncTimer = undefined;
        if (_movingState) return;

        // find current browser history state
        var historyId = _historyIdFromHash || (history.state && history.state.syncId) || "";
        _historyIdFromHash = "";
        var dir = historyId ? this.activities.getHistoryPosition(historyId) : -1;
        if (dir === 0) {
            this.historyActivity = this.activities.top;
            return;  // done.
        }
        console.log("Syncing history to", historyId);

        // if moving towards activity state, either go back or push activity state
        if (!_moveToHistoryState) {
            if (dir! > 0) {
                // ignore popstate for a while...
                _ignorePopState++;
                setTimeout(() => { _ignorePopState-- }, HISTORY_SYNC_DELAY_MS);

                // browser history is ahead: go back one step and reschedule
                console.log("Browser is ahead, going back...");
                history.back();
                this._scheduleSync();
            }
            else {
                // browser history is either behind or lost: push/replace next state(s)
                while (true) {
                    var next = dir ? this.activities.getHistoryAfter(historyId) :
                        this.activities.getHistoryState();
                    if (!next) return;
                    var state = { syncId: next.historyId, path: next.path };
                    historyId = next.historyId;

                    // change first push to a replace to avoid lingering initial state
                    if (_isCleanHistory || !dir) {
                        _isCleanHistory = false;
                        console.log("Browser is lost, replacing state...");
                        history.replaceState(state, next.title || "", next.path);
                        this._scheduleSync();
                        return;
                    }
                    else {
                        // perform a regular push
                        console.log("Browser is behind, pushing state...");
                        history.pushState(state, next.title || "", next.path);
                        this.historyActivity = next.activity;
                    }
                }
            }
        }
        else {
            // helper function to handle activity movement and check again
            let moveState = (f: () => PromiseLike<any>) => {
                _movingState = true;
                f().then(() => {
                    // great, now check again
                    console.log("Activity stack updated");
                    _movingState = false;
                    _moveToHistoryState = true;
                    this._scheduleSync();
                }, () => {
                    // failed, add all activities back from current state onwards
                    console.log("Activity stack cannot be updated, resolving...");
                    _movingState = false;
                    _moveToHistoryState = false;
                    this._scheduleSync();
                });
            }

            // helper function to handle situations in which history is lost
            let historyConfusion = () => {
                if (history.state && history.state.path) {
                    console.log("History state not found, trying path", history.state.path);
                    this._startLocationActivity(history.state.path);
                }
                else {
                    console.log("History state not found, going back...")
                    history.back();
                }
            }

            // moving towards browser history state
            if (dir! < 0) {
                // browser went back, try to move stack back to same activity
                moveState(() => this.activities.popAsync());
            }
            else if (dir! > 0) {
                // browser went forward, push next state
                var nextActivity = this.activities.peek(true)!;
                moveState(() => this.activities.pushAsync(nextActivity!));
            }
            else {
                // completely lost, try to use path, otherwise go back
                historyConfusion();
            }
        }
    }

    /** Helper method: start activity based on current location */
    private _startLocationActivity(replace?: boolean) {
        if (location.hash && location.hash !== "#")
            this.startActivityAsync(location.hash, replace, false)
                .then(undefined, () => { location.hash = "" });
        else
            this.startActivityAsync(location.href, replace, false);
    }

    // /** Helper method: update browser history following an activity transition */
    // private _updateHistoryState(op?: ActivityTransition.Operation) {
    //     var current = this.activities.top;
    //     if (current && current.options.isBackgroundActivity) return;

    //     // pop browser history if popping non-background activity
    //     if (op === ActivityTransition.Operation.Pop) {
    //         history.pushState && history.back();
    //         return;
    //     }

    //     // change first push to a replace to avoid lingering initial state
    //     if (_isCleanHistory && op === ActivityTransition.Operation.Push) {
    //         _isCleanHistory = false;
    //         op = ActivityTransition.Operation.Replace;
    //     }

    //     // find new path and activity ID to be pushed/replaced-with
    //     var syncId = this.activities.getHistoryState();
    //     var state: any = { syncId };
    //     try {
    //         if (current) state.path = current.activation.getPath();
    //     }
    //     catch { }
    //     try {
    //         // use pushState or replaceState to add to browser history
    //         if (op === ActivityTransition.Operation.Push) {
    //             if (state.path) {
    //                 if (history.pushState) {
    //                     history.pushState(state, this.title, state.path);
    //                 }
    //                 else {
    //                     location.hash = "#__" + syncId;
    //                 }
    //             }
    //             else {
    //                 if (history.pushState) {
    //                     history.pushState({ syncId }, this.title);
    //                 }
    //                 else {
    //                     location.hash = "#__" + syncId;
    //                 }
    //             }
    //         }
    //         else if (op === ActivityTransition.Operation.Replace) {
    //             if (state.path) {
    //                 if (history.replaceState) {
    //                     history.replaceState(state, this.title, state.path);
    //                 }
    //             }
    //             else {
    //                 if (history.replaceState) {
    //                     history.replaceState(state, this.title);
    //                 }
    //             }
    //         }
    //     }
    //     catch { }
    // }
}
