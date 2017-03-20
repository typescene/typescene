import * as Async from "@typescene/async";
import { ActivityResourcePath } from "./ActivityPath";
import { ActivitySignal, ActivityTransition } from "./";

/** Represents a UI activity */
export class Activity extends Async.ObservableObject {
    /** Get an instance of this activity class, can be overridden to alter behavior when e.g. pushing a parent activity by class; by default simply constructs the instance without parameters */
    public static getInstance() {
        return new this();
    }

    /** Create an activity with given display title */
    constructor(title?: string) {
        super();
        if (title !== undefined) this.title = title;
    }

    /** Display title of this activity (observable) */
    @Async.observable_string
    public title: string | undefined;

    /** Object that contains options for this activity (observable, not null or undefined) */
    @Async.observable_not_null
    public options: Activity.ActivityOptions = {};

    /** Signal that is emitted before this activity is pushed to foreground, if any handler throws an error then the activity is not activated */
    public readonly Activating: Async.Signal.Emittable<ActivityTransition, typeof ActivitySignal> = Async.defineSignal(ActivitySignal);

    /** Signal that is emitted after this activity is pushed to foreground */
    public readonly Activated: Async.Signal.Emittable<ActivityTransition, typeof ActivitySignal> = Async.defineSignal(ActivitySignal);

    /** Signal that is emitted before another activity is pushed to foreground, if any handler throws an error then the activity is not suspended */
    public readonly Suspending: Async.Signal.Emittable<ActivityTransition, typeof ActivitySignal> = Async.defineSignal(ActivitySignal);

    /** Signal that is emitted when this activity is no longer in foreground */
    public readonly Suspended: Async.Signal.Emittable<ActivityTransition, typeof ActivitySignal> = Async.defineSignal(ActivitySignal);

    /** Signal that is emitted before this activity is put back in foreground, if any handler throws an error then the activity is not suspended */
    public readonly Resuming: Async.Signal.Emittable<ActivityTransition, typeof ActivitySignal> = Async.defineSignal(ActivitySignal);

    /** Signal that is emitted when this activity is back in foreground */
    public readonly Resumed: Async.Signal.Emittable<ActivityTransition, typeof ActivitySignal> = Async.defineSignal(ActivitySignal);

    /** Signal that is emitted after this activity is removed from history */
    public readonly Deactivated: Async.Signal.Emittable<ActivityTransition, typeof ActivitySignal> = Async.defineSignal(ActivitySignal);
}

export namespace Activity {
    /** Options for an activity that determine its behavior in the activity stack */
    export interface ActivityOptions {
        /** The parent activity, if any; the activity stack will ensure the given activity (or an instance of given class) exists in its history stack when activating this activity, or insert it before */
        parentActivity?: Activity | typeof Activity;

        /** Set to true to require this activity to be in the foreground, or move up to it, when used as a parent activity; i.e. when starting or resuming a child activity, all activities on top of the hub activity are suspended and replaced with the child activity; can be used to prevent buildup of activities on the history stack and therefore memory leaks */
        isHubActivity?: boolean;

        /** Set to true to allow only one copy of an activity on the stack; i.e. when pushing an instance that is already on the stack, the stack is transitioned up to the existing instance instead; use with a singleton activity to implement e.g. an application home activity */
        isRootActivity?: boolean;

        /** Set to true to mark this activity as a background activity; i.e. it should not be started directly, and it should be skipped when navigating back in history (enforced by `Application`, not `ActivityStack` itself, to allow background activities in the foreground temporarily, and to enable skipping past a first background activity on the stack by exiting the application) */
        isBackgroundActivity?: boolean;
    }
}

/** Represents an activity pertaining to a resource (URL path) */
export class ResourceActivity extends Activity {
    /** Create an activity with given resource path */
    constructor(title?: string, path?: ActivityResourcePath | string) {
        super(title);
        this.resourcePath = path;
    }

    /** The path (URL/hash segment) that is associated with this activity */
    public resourcePath: ActivityResourcePath | string | undefined;
}
