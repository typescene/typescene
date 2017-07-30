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

/** True if requestAnimationFrame works */
var canRequestAnimationFrame = (typeof window !== "undefined") &&
    (typeof window.requestAnimationFrame === "function") &&
    (typeof performance !== "undefined");

/** True if native Promise exists */
var resolvedPromise = (typeof window !== "undefined") &&
    (typeof (<any>window).Promise !== "undefined") &&
    (<any>window).Promise.resolve(0);

/** Run a batch of deferred functions */
function _runDeferred(time?: number, manualYield?: any) {
    var trackTime = (time! > 0);
    if (manualYield !== true) scheduled = false;
    if (deferTimeout >= 0) {
        clearTimeout(deferTimeout);
        deferTimeout = -1;
    }

    // run a number of deferred functions
    runningDeferred = true;
    var n = deferred.length;
    var max = Math.max(trackTime ? 1000 : 100, n >> 2);
    for (var i = 0; i < deferred.length && i < max; i++) {
        try {
            deferred[i].apply(undefined, deferredArgs[i]);
        }
        catch (err) {
            UnhandledException(err);
        }

        // stop if exceeding animation frame time (if applicable),
        // keep going if queue is still growing
        if (trackTime && (deferred.length < n + i) &&
            performance.now() - time! > 60)
            break;
    }
    runningDeferred = false;

    // reschedule if necessary
    if (i < deferred.length) {
        deferred.splice(0, i);
        deferredArgs.splice(0, i);

        // reschedule slowly if queue didn't grow significantly
        _reschedule(deferred.length > n + 20);
    }
    else {
        deferred.length = 0;
        deferredArgs.length = 0;
    }
}

/** Schedule a deferred function run (but not through Promise twice in a row) */
function _reschedule(immediate?: boolean) {
    if (!scheduled && !runningDeferred) {
        scheduled = true;
        if (!immediate && canRequestAnimationFrame)
            window.requestAnimationFrame(_runDeferred);    
        else if (immediate && resolvedPromise)
            resolvedPromise.then(_runDeferred);
        else if (canPostMessage)
            window.postMessage("yield", "*");
        else
            deferTimeout = setTimeout(_runDeferred, 0, 0);
    }
}

/** Execute given function only when idle, with given arguments (array or `arguments` object) if any */
export function defer(f: (...args: any[]) => void, args?: any[] | IArguments) {
    deferred.push(f);
    deferredArgs.push(args);
    _reschedule(true);
}

/** Run a batch of deferred functions; returns true if there are still more deferred functions in the queue, or false if there are none or if already running; set argument to true to run _all_ deferred functions that are currently in the queue (but not those that get added after the call to `runYield`) */
export function runYield(yieldAll?: boolean) {
    if (runningDeferred) return false;
    if (yieldAll) {
        // run up to current position in queue
        var stop = false;
        deferred.push(() => { stop = true });
        deferredArgs.push(undefined);
        while (_runDeferred(0, true) && !stop); 
    }
    else {
        // run only one batch or until timed out
        var time = canRequestAnimationFrame ? performance.now() : 0;
        _runDeferred(time, true);
    }
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
