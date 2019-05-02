import { ManagedState, rateLimit, shadowObservable } from "../core";
import { AppActivationContext } from "./AppActivationContext";
import { AppComponent } from "./AppComponent";
import { Application } from "./Application";

/** Represents a component of an application, which can be activated and deactivated independently */
export class AppActivity extends AppComponent {
    static preset(presets: AppActivity.Presets): Function {
        return super.preset(presets);
    }

    /** Create a new activity with given name. */
    constructor(name?: string, path?: string) {
        super();
        this.name = name;
        this.path = path;
    }

    /** Optional human readable name for this activity */
    name?: string;

    /** Optional activation path; if set to a string, this activity is automatically activated and deactivated asynchronously, depending on the current target path (e.g. URL path, handled by a platform dependent `AppActivationContext` instance). */
    path?: string;

    /** The path segments that were captured *last* based on the target path, as matched by the `AppActivationContext`, for a path such as `foo/bar/:id`, `foo/*name`, or `./:id`. This property is set when the activity is activated through `activateAsync`. */
    @shadowObservable("_matchedPath")
    get match() { return this._matchedPath }

    /** Returns the activity instance that contains a managed child reference that (indirectly) points to this activity instance. */
    getParentActivity() {
        return this.getManagedParent(AppActivity);
    }

    /** Returns the parent application that contains this activity, if any */
    getApplication() {
        return this.getManagedParent(Application);
    }

    /** Activate this activity, based on given captured path segments (returned by `AppActivationContext.match`, for a path such as `foo/bar/:id`, `foo/*name`, or `./:id`). This method is called automatically when the activity path matches the current target path, and can be overridden to validate the captured path segments before activation. */
    async activateAsync(match?: AppActivationContext.MatchedPath) {
        this._matchedPath = Object.freeze(match || { path: "" });
        await this.activateManagedAsync();
    }

    /** Deactivate this activity */
    async deactivateAsync() {
        await this.deactivateManagedAsync();
        this.deactivated = Date.now();
    }

    /** Destroy this activity */
    async destroyAsync() {
        await this.destroyManagedAsync();
        this.deactivated = Date.now();
    }

    /** Returns true if this activity is currently active */
    isActive() { return this.managedState === ManagedState.ACTIVE }

    /** The time (result of `Date.now()`) when this activity was last deactivated; or undefined if this activity has never been deactivated. */
    deactivated?: number;

    private _matchedPath?: Readonly<AppActivationContext.MatchedPath>;
}

// Observe all activities to check for path activation
class ActivityObserver {
    constructor(public activity: AppActivity) { }
    @rateLimit(0)
    onPathChangeAsync() { return this.checkActivateAsync() }
    onActivationContextChangeAsync() { return this.checkActivateAsync() }
    async checkActivateAsync() {
        if (typeof this.activity.path === "string") {
            let match: AppActivationContext.MatchedPath | undefined;
            if (this.activity.activationContext &&
                (match = this.activity.activationContext
                    .match(this.activity.path, this.activity))) {
                await this.activity.activateAsync(match);
            }
            else if (
                this.activity.managedState === ManagedState.ACTIVATING ||
                this.activity.managedState === ManagedState.ACTIVE) {
                await this.activity.deactivateAsync();
            }
        }
    }
}
AppActivity.observe(ActivityObserver);

export namespace AppActivity {
    /** Activity presets type, for use with `Component.with` */
    export interface Presets {
        /** Human readable name for this activity */
        name?: string,
        /** (Partial) activation path, see `AppActivity.path` */
        path?: string
    }
}
