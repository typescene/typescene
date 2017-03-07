import * as Async from "@typescene/async";
import { Component, Page } from "@typescene/ui";
import { Activity } from "./Activity";
import { ViewActivity } from "./"; // break circular dependency

var currentHistoryIDBase = "_A" + String(Math.random()).slice(-5);
var currentHistoryID = 0;
var nextTransitionID = 0;

var previousTransition: ActivityTransition | null = null;

/** Represents a stack of activated activities (like browser history) */
export class ActivityStack {
    /** Set to true to enable trace logging (on `console.log`) for activity operations */
    public static TRACE_LOG = false;

    /** Add an activity to the foreground asynchronously, does nothing if given activity was already in the foreground; returns Promise that resolves to the completed transition */
    public pushAsync(activity: Activity): PromiseLike<ActivityTransition> {
        if (!(activity instanceof Activity))
            throw new Error("Invalid activity");

        // push activity and its parents on the stack
        this._upToHubOrRoot(activity);
        return this._transitionP = <PromiseLike<ActivityTransition>>(this._transitionP || Async.Promise.resolve(null))
            .then(t => {
                previousTransition = null;
                var result: PromiseLike<ActivityTransition> | undefined;
                this._findParents(activity).forEach(a => {
                    var p = () => this._processTransition(a,
                        ActivityTransition.Operation.Push);
                    result = result ? result.then(p) : p();
                });
                return result || t;
            });
    }

    /** Replace the current activity asynchronously (throws error if none), or remove current activity if given activity was already directly below current activity in the activity stack; returns Promise that resolves to the completed transition */
    public replaceAsync(activity: Activity): PromiseLike<ActivityTransition> {
        if (!(activity instanceof Activity))
            throw new Error("Invalid activity");

        // process replace transaction
        this._upToHubOrRoot(activity);
        return this._transitionP = (this._transitionP || Async.Promise.resolve(null))
            .then(t => {
                previousTransition = null;
                var lonely = (this.topIndex < 0);

                // pop if already directly below, otherwise replace or push
                if (!lonely && this.stack[this.topIndex - 1] === activity)
                    return this._processTransition(
                        activity, ActivityTransition.Operation.Pop);
                else {
                    // replace/push activity and its parents on the stack
                    var result: PromiseLike<ActivityTransition> | undefined;
                    this._findParents(activity, true).forEach(a => {
                        var p = () => this._processTransition(a,
                            (result || lonely) ?
                                ActivityTransition.Operation.Push :
                                ActivityTransition.Operation.Replace);
                        result = result ? result.then(p) : p();
                    });
                    return result || t;
                }
            });
    }

    /** Remove the current foreground activity (go back) asynchronously, returns Promise that resolves to the completed transition */
    public popAsync(): PromiseLike<ActivityTransition>;
    /** Remove the current foreground activity (go back) asynchronously if and only if it is the given activity, returns Promise that resolves to the completed transition, if any */
    public popAsync(activity: Activity): PromiseLike<ActivityTransition | null>;
    public popAsync(activity?: Activity): PromiseLike<ActivityTransition | null> {
        return this._transitionP = (this._transitionP || Async.Promise.resolve(null))
            .then(() => {
                previousTransition = null;
                if (this.topIndex < 0)
                    throw new Error("No activity to suspend");
                if (activity !== undefined && this.top !== activity)
                    return Async.Promise.resolve(null);

                // send signals and return promise
                return this._processTransition(this.stack[this.topIndex - 1],
                    ActivityTransition.Operation.Pop);
            });
    }

    /** Remove foreground activities until given activity or activity of given type is in the foreground; returns Promise that resolves to activity, or null if there was no matching activity on the stack */
    public upAsync(activityOrClass: Activity | typeof Activity): PromiseLike<Activity | null> {
        var isActivity = (activityOrClass instanceof Activity);
        var recurse = () => {
            if (isActivity ?
                (this.top === activityOrClass) :
                (this.top instanceof <typeof Activity>activityOrClass))
                return Async.Promise.resolve(this.top);
            if (this.stack.some(activity => isActivity ?
                (activity === activityOrClass) :
                (activity instanceof <typeof Activity>activityOrClass)))
                return this._processTransition(this.stack[this.topIndex - 1],
                    ActivityTransition.Operation.Pop)
                    .then(() => recurse());
            else
                return Async.Promise.resolve(null);
        };
        return this._transitionP = (this._transitionP || Async.Promise.resolve(null))
            .then(() => {
                previousTransition = null;
                return recurse();
            });
    }

    /** Reload state using given history ID, if possible (i.e. not yet deactivated relevant activities in the meantime); returns a promise that resolves when the state has been reached */
    public restoreHistoryStateAsync(historyID: string): PromiseLike<void> {
        var idx = this._ids.lastIndexOf(historyID);
        if (idx < 0 && historyID !== "0") throw new Error("Cannot resume activities");
        if (idx === this.topIndex) return <any>Async.Promise.resolve(null);

        // either go back or go forward and check again
        return (idx < this.topIndex ?
            this.popAsync() :
            this.pushAsync(this.stack[this.topIndex + 1]))
            .then(() => this.restoreHistoryStateAsync(historyID));
    }

    /** Get an ID that represents the current state, for use with `.restoreHistoryStateAsync` */
    public getHistoryState() {
        return this._ids[this.topIndex] || "0";
    }

    /** Get the activity closest to the foreground of the given type, if any (excluding foreground activity itself, and before given activity in second parameter, if any) */
    public getParent<T>(ActivityClass: typeof Activity & { new(...args): T },
        before?: Activity): T | undefined {
        var seenBefore = (this.stack[this.topIndex] === before);
        for (var i = this.topIndex - 1; i >= 0; i--) {
            if ((seenBefore || !before) &&
                this.stack[i] instanceof ActivityClass)
                return <any>this.stack[i];
            if (this.stack[i] === before)
                seenBefore = true;
        }
        return undefined;
    }

    /** Get Component instance for given named outlet, from the view activity closest to the foreground that has given outlet mapped using `.mapView(...)` or the `mapToActivity(...)` decorator on a view Component class */
    public getViewComponent(outlet: string): Component | undefined {
        var cur: Activity;
        for (var i = this.topIndex; i >= 0; i--) {
            if ((cur = this.stack[i]) instanceof ViewActivity) {
                var view = cur.getViewByName(outlet);
                if (view instanceof Component) return view;
            }
        }
        return undefined;
    }

    /** Returns true if the stack contains given activity */
    public contains(activity: Activity) {
        for (var i = this.topIndex; i >= 0; i--)
            if (this.stack[i] === activity) return true;

        return false;
    }

    /** The current foreground activity (top of stack, if any; observable) */
    public get top() {
        if (this.topIndex < 0) return undefined;
        return this.stack[this.topIndex];
    }

    /** The number of activities on the stack (observable) */
    public get length() {
        return this.topIndex + 1;
    }

    /** The title of the topmost activity that has a title defined (observable) */
    public get title() {
        for (var i = this.topIndex; i >= 0; i--)
            if (this.stack[i].title !== undefined)
                return this.stack[i].title;

        return "";
    }

    /** Signal that is emitted when a transition occurs (after Activating/Resuming/Suspending but before Activated/Resumed) */
    public readonly Transition: Async.Signal.Emittable<ActivityTransition, typeof ActivitySignal> = Async.defineSignal(ActivitySignal);

    /** Helper method to find parent activity/ies for given activity; returns an array of activities to be pushed (including activity itself) */
    private _findParents(activity: Activity, excludeTop?: boolean) {
        var result = [activity];
        while (result[0].options.parentActivity) {
            // ensure parent is on stack somewhere
            var parent = result[0].options.parentActivity!;
            if (parent instanceof Activity) {
                if (this.contains(parent) &&
                    (!excludeTop || this.top !== parent))
                    break;
                result.unshift(parent);
            }
            else {
                if ((!excludeTop && (this.top instanceof parent)) ||
                    this.getParent(parent))
                    break;
                result.unshift(parent.getInstance());
            }
        }
        return result;
    }

    /** Helper method to move up to existing root activity, or hub parent activity if needed */
    private _upToHubOrRoot(activity: Activity) {
        // check if activity is a root activity and move up if possible
        if (activity.options.isRootActivity && this.contains(activity)) {
            this.upAsync(activity);

            // wait until browser history is synchronized
            this._transitionP =
                (this._transitionP || Async.Promise.resolve(null))
                .then(() => Async.sleep(2));
        }
        else {
            // find out if existing parent activity is a hub activity
            var parent: Activity | typeof Activity | undefined;
            if (parent = activity.options.parentActivity) {
                if (!(parent instanceof Activity))
                    parent = this.getParent(parent);
                if (parent && parent.options.isHubActivity)
                    this.upAsync(parent);

                // wait until browser history is synchronized
                this._transitionP =
                    (this._transitionP || Async.Promise.resolve(null))
                    .then(() => Async.sleep(2));
            }
        }
    }

    /** Helper method for sending signals and creating promise */
    private _processTransition(to: Activity, operation: ActivityTransition.Operation) {
        // create transition operation
        var t = Object.freeze(<ActivityTransition>{
            id: "T" + nextTransitionID++,
            activityStack: this,
            operation,
            from: this.top,
            to,
            previous: previousTransition
        });
        previousTransition = t;
        if (ActivityStack.TRACE_LOG) {
            console.log("Activity trace:",
                ActivityTransition.Operation[operation], t);
        }

        // check if anything to do at all
        if (this.top === to) {
            if (operation === ActivityTransition.Operation.Pop) this.topIndex--;
            return Async.Promise.resolve(t);
        }

        // gather promises for Suspending results
        var top = this.top;
        var suspense = top ? new top.Suspending(t).emit().results : [];

        // try to activate/resume new activity and return promise
        var resuming = !!to && this.contains(to);
        return Async.Promise.all(suspense)
            .then(() => Async.Promise.all(
                // signal that transition is about to happen
                resuming ?
                    new t.to.Resuming(t).emit().results :
                    t.to ? new t.to.Activating(t).emit().results : []))
            .then(() => {
                // when all handlers are OK, go ahead:
                this.Transition(t);
                switch (t.operation) {
                    case ActivityTransition.Operation.Pop:
                        // just decrease stack top
                        this.topIndex--;
                        break;
                    case ActivityTransition.Operation.Replace:
                        // decrease stack top and then push
                        this.topIndex--;
                    case ActivityTransition.Operation.Push:
                        // only move stack top if same activity above
                        if (this.stack.length > this.topIndex + 1 &&
                            this.stack[this.topIndex + 1] === t.to) {
                            this.topIndex++;
                        }
                        else {
                            // deactivate overwritten stack top
                            while (this.stack.length > this.topIndex + 1) {
                                var oldTop = this.stack.pop()!;
                                if (!this.contains(oldTop))
                                    oldTop.Deactivated(t);
                            }

                            // push new activity
                            this.topIndex = this.stack.push(t.to) - 1;
                            this._ids.length = this.stack.length;
                            this._ids[this.topIndex] =
                                currentHistoryIDBase + currentHistoryID++;
                        }
                }

                // signal that transition has happened
                if (t.to) resuming ? t.to.Resumed(t) : t.to.Activated(t);
                top && top.Suspended(t);
                return t;
            });
    }

    /** @internal */
    @Async.observable
    protected topIndex = -1;

    /** @internal */
    @Async.observable
    protected stack: Activity[] = [];

    private _ids: string[] = [];
    private _transitionP: PromiseLike<ActivityTransition>;
}

/** Represents a transition from one foreground activity to another */
export interface ActivityTransition {
    /** Unique ID for this transition */
    id: string;

    /** The activity stack that is transitioning */
    activityStack: ActivityStack;

    /** The activity that is currently in the foreground, if any */
    from: Activity;

    /** The new foreground activity, if any */
    to: Activity;

    /** The stack operation being performed: push, replace, or pop */
    operation: ActivityTransition.Operation;

    /** The previous transition that is part of the same operation (pop/push/pop/up) */
    previous: ActivityTransition;
}
export namespace ActivityTransition {
    /** Operation type that triggered a transition */
    export enum Operation {
        /** Push operation */
        Push,
        /** Replace operation */
        Replace,
        /** Pop operation */
        Pop
    };
}

/** Signal that is emitted when a change in the activity stack occurs */
export class ActivitySignal extends Async.Signal<ActivityTransition> { }
