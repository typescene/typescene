import { UnhandledException } from "./Signal";

/** Queue of functions to execute when idle (deferred functions) */
var deferred: (() => void)[] = [];
var deferredArgs: (any[] | IArguments | undefined)[] = [];

/** True if currently handling deferred functions */
var runningDeferred = false;

/** True if already scheduled next handler */
var scheduled: boolean;

/** Current setTimeout ID, if >= 0 */
var deferTimeout = -1;

/** True if postMessage works, too */
var canPostMessage: boolean;

/** True if native Promise exists */
var canPromise = (typeof window !== "undefined") &&
    (typeof (<any>window).Promise !== "undefined");

/** Run a batch of deferred functions */
function _runDeferred(schedMode?: "Y" | "P") {
    if (schedMode !== "Y") scheduled = false;
    if (deferTimeout >= 0) {
        clearTimeout(deferTimeout);
        deferTimeout = -1;
    }

    // run a number of deferred functions
    runningDeferred = true;
    var max = Math.max(100, deferred.length >> 2);
    for (var i = 0; i < deferred.length && i < max; i++) {
        try {
            deferred[i].apply(undefined, deferredArgs[i]);
        }
        catch (err) {
            UnhandledException(err);
        }
    }
    runningDeferred = false;

    // reschedule if necessary
    if (i < deferred.length) {
        deferred.splice(0, i);
        deferredArgs.splice(0, i);
        _reschedule(schedMode);
    }
    else {
        deferred.length = 0;
        deferredArgs.length = 0;
    }
}

/** Schedule a deferred function run (but not through Promise twice in a row) */
function _reschedule(oldSchedMode?: "Y" | "P") {
    if (!scheduled && !runningDeferred) {
        scheduled = true;
        if (canPromise && oldSchedMode !== "P")
            (<any>window).Promise.resolve().then(_runDeferred);
        else if (canPostMessage)
            window.postMessage("yield", "*");
        else
            deferTimeout = setTimeout(_runDeferred, 0);
    }
}

/** Execute given function only when idle, with given arguments (array or `arguments` object) if any */
export function defer(f: (...args: any[]) => void, args?: any[] | IArguments) {
    deferred.push(f);
    deferredArgs.push(args);
    _reschedule();
}

/** Run a batch of deferred functions; returns true if there are still more deferred functions in the queue (or false to stop infinite recursion if already running) */
export function yieldAll() {
    if (runningDeferred) return false;
    _runDeferred("Y");
    return (deferred.length > 0);
}

// check if postMessage works in this browser and set flag
if (typeof window === "object") {
    window.addEventListener("message", () => {
        canPostMessage = true;
        _runDeferred();
    });
    setTimeout(() => window.postMessage("yield", "*"), 1);
}