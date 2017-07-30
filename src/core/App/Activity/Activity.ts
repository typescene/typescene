import Async, { Signal } from "../../Async";
import { Activation } from "./Activation";
import { ActivityTransition } from "./ActivityStack";
import { Application } from "../Application";

/** Current unique ID for Activity instances */
var _nextUID = 0;

/** Activity base class, represents a UI activity; to be extended by application code, and registered using an activation decorator (i.e. `mapActivation` or `mapRoute`); can be linked to a view class to be displayed by decorating the view (`UI.Component` or `UI.Page` class using `mapViewActivity`) */
export class Activity extends Async.ObservableObject {
    /** Get an instance of this activity class, can be overridden to alter behavior when e.g. pushing a parent activity by class; by default simply constructs the instance without parameters */
    public static getInstance(activation?: Activation | object) {
        if (this === Activity) throw new TypeError();
        return new this(activation);
    }

    /** Create an activity instance, using given activation object if any; if the activation object is the result of a route mapping, it contains all routing parameters as string properties; otherwise the activation object may contain any type of data that can be used to initialize the new activity, and replace it with a new instance (following `Application.reactivate`) */
    constructor(activation: Activation | object = {}) {
        super();
        if (activation instanceof Activation) {
            // use given activation object
            this.activation = activation;
        }
        else {
            // no object specified, create class on the fly
            class DirectActivation extends Activation { }
            this.activation = new DirectActivation(activation);
        }

        this["@initialize"]();
        Async.defer(() => {
            var p = this.onCreateAsync();
            if (p) this.Starting.connectOnce(() => p);
        });
    }

    /** Method that is called asynchronously after this activity is created; override this method to perform any initialization that must be completed before the activity is started; if this method returns a promise, it must be fulfilled _before_ the activity can be pushed to the foreground */
    protected onCreateAsync(): PromiseLike<any> | undefined | void {
        /* nothing here */
    }

    /** @internal Injectable method called by the constructor, used by activity decorators */
    @Async.injectable
    public ["@initialize"]() { }

    /** Globally unique activity identifier */
    public readonly uid = "A" + _nextUID++;

    /** Activation object that was supplied to the constructor when this activity was instantiated (or an activation object that contains all properties of the object that was supplied, if any) */
    public readonly activation: Activation;

    /** Display title of this activity (observable) */
    @Async.observable_string
    public title: string | undefined;

    /** Object that contains options for this activity (observable, never null or undefined) */
    @Async.observable_not_null
    public options: Activity.ActivityOptions = {};

    /** Signal that is emitted before this activity is pushed to foreground, if any handler throws an error then the activity is not activated */
    public readonly Starting = Signal.create<ActivityTransition>();

    /** Signal that is emitted after this activity is pushed to foreground (note that `.Resumed` will also always be emitted) */
    public readonly Started = Signal.create<ActivityTransition>();

    /** Signal that is emitted before another activity is pushed to foreground, if any handler throws an error then the activity is not suspended */
    public readonly Suspending = Signal.create<ActivityTransition>();

    /** Signal that is emitted after this activity is no longer in foreground */
    public readonly Suspended = Signal.create<ActivityTransition>();

    /** Signal that is emitted before this activity is put back in foreground, if any handler throws an error then the previous activity is not suspended */
    public readonly Resuming = Signal.create<ActivityTransition>();

    /** Signal that is emitted after this activity is in foreground (emitted after `.Resuming`, or after `.Starting` together with `.Started`) */
    public readonly Resumed = Signal.create<ActivityTransition>();

    /** Signal that is emitted after this activity is removed from history, and will not be resumed anymore */
    public readonly Deactivated = Signal.create<ActivityTransition>();
}

export namespace Activity {
    /** Options for an activity that determine its behavior in the activity stack */
    export interface ActivityOptions {
        /** Required parent activity, if any; the activity stack will ensure that the required activity (or an instance of given class) exists in its history stack when activating this activity, or insert it before pushing this activity */
        parentActivity?: Activity | typeof Activity;

        /** Set to true to require this activity to be in the foreground, or move up to it, when used as a parent activity; i.e. when starting or resuming a child activity, all activities on top of the hub activity are suspended and replaced with the child activity; can be used to prevent buildup of activities on the history stack and therefore possible memory leaks */
        isHubActivity?: boolean;

        /** Set to true to allow only one copy of an activity on the stack; i.e. when attempting to push an instance that is already on the stack, the stack is transitioned _up_ to the existing instance instead; use with a singleton activity to implement e.g. an application home activity */
        isRootActivity?: boolean;

        /** Set to true to mark this activity as a background activity; i.e. it should not be started directly, and it should be skipped when navigating back in history (enforced by `Application`, not `ActivityStack` itself, to allow background activities in the foreground temporarily, and to enable skipping past a first background activity on the stack by exiting the application) */
        isBackgroundActivity?: boolean;

        /** Set to true to mark this activity as a foreground-only activity; i.e. it will be removed automatically before another activity is started (in replace mode, the new activity replaces the activity on the stack before the transient activity); can be used for e.g. modal dialogs, drawers, and messages */
        isTransient?: boolean;
    }
}

/** Represents an activity that should be created only once and re-used if required (overrides .getInstance static method); abstract class, to be overridden */
export abstract class SingletonActivity extends Activity {
    /** Get the instance of this activity class, constructs the instance without parameters once and returns this instance every time */
    public static getInstance(activation?: Activation | object) {
        if (this._instanceIndex !== Application.current.activationIndex) {
            delete this._instance;
            this._instanceIndex = Application.current.activationIndex;
        }
        return this._instance || new (<any>this)(activation);
    }

    /** Create a new activity; can be used only once */
    constructor(activation?: Activation | object) {
        super(activation);
        var self = (<typeof SingletonActivity>this.constructor);
        if (self._instance)
            throw new Error("Cannot create another instance of this activity");
        self._instance = this;
    }

    private static _instance?: SingletonActivity;
    private static _instanceIndex?: number;
}

/** Represents a singleton activity that may only exist in the background (i.e. it should not be started directly, and it should be skipped when navigating back in history, enforced by `Application`), created only once and re-used if required (overrides .getInstance static method); abstract class, needs to be overridden */
export abstract class SupportActivity extends SingletonActivity {
    constructor(activation?: Activation | object) {
        super(activation);
        this.options.isBackgroundActivity = true;
    }
}

/** Represents a singleton activity that is both a root activity (i.e. may exist only once on the activity stack, starting/replacing the activity again transitions the stack up to the existing activity instead), and a hub activity (i.e. starting any activity that specifies this activity as its parent activity, transitions the stack up to the hub activity first, suspending all other activities that used to be in the foreground), created only once and re-used if required (overrides .getInstance static method); abstract class, to be overridden */
export abstract class RootActivity extends SingletonActivity {
    constructor(activation?: Activation | object) {
        super(activation);
        this.options.isHubActivity = true;
        this.options.isRootActivity = true;
    }
}

/** *Class decorator*, associates a parent activity class with the decorated `Activity` class: whenever an activity instance of the class decorated with this decorator is started, an instance of the given parent activity class must already exist on the stack, or a (new) instance will be started in advance [decorator] */
export function mapParentActivity(parentActivityClass: typeof Activity) {
    return (target: typeof Activity) => {
        var current = Async.inject(target, {
            "@initialize": function (this: Activity) {
                current["@initialize"].call(this);

                // set parent activity class reference
                if (!(parentActivityClass.prototype instanceof Activity))
                    throw new TypeError("Invalid parent activity");
                if (this.options.parentActivity &&
                    this.options.parentActivity !== parentActivityClass)
                    throw new Error("Cannot add more than one parent activity");
                this.options.parentActivity = parentActivityClass;
            }
        });
    };
}
