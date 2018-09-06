import { AppActivationContext } from "./AppActivationContext";
import { AppComponent } from "./AppComponent";
import { Application } from "./Application";
/** Represents a component of an application, which can be activated and deactivated independently */
export declare class AppActivity extends AppComponent {
    static preset(presets: AppActivity.Presets): Function;
    /** Create a new activity with given name. */
    constructor(name?: string, path?: string);
    /** Optional human readable name for this activity */
    name?: string;
    /** Optional activation path; if set to a string, this activity is automatically activated and deactivated asynchronously, depending on the current target path (e.g. URL path, handled by a platform dependent `ActivationContext` instance). */
    path?: string;
    /** The path segments that were captured *last* based on the target path, as matched by the `ActivationContext`, for a path such as `foo/bar/:id`, `foo/*name`, or `./:id`. This property is set when the activity is activated through `activateAsync`. */
    readonly match: Readonly<AppActivationContext.MatchedPath> | undefined;
    /** Returns the activity instance that contains a managed child reference that (indirectly) points to this activity instance. */
    getParentActivity(): AppActivity | undefined;
    /** Returns the parent application that contains this activity, if any */
    getApplication(): Application | undefined;
    /** Activate this activity, based on given captured path segments (returned by `ActivationContext.match`, for a path such as `foo/bar/:id`, `foo/*name`, or `./:id`). This method is called automatically when the activity path matches the current target path, and can be overridden to validate the captured path segments before activation. */
    activateAsync(match?: AppActivationContext.MatchedPath): Promise<void>;
    /** Deactivate this activity */
    deactivateAsync(): Promise<void>;
    /** Destroy this activity */
    destroyAsync(): Promise<void>;
    /** Returns true if this activity is currently active */
    isActive(): boolean;
    /** The time (result of `Date.now()`) when this activity was last deactivated; or undefined if this activity has never been deactivated. */
    deactivated?: number;
    private _matchedPath?;
}
export declare namespace AppActivity {
    /** Activity presets type, for use with `Component.with` */
    interface Presets {
        /** Human readable name for this activity */
        name?: string;
        /** (Partial) activation path, see `Activity.path` */
        path?: string;
    }
}
