import {
  ManagedState,
  shadowObservable,
  observe,
  ComponentConstructor,
  ActionEvent,
  Component,
} from "../core";
import type { AppActivationContext } from "./AppActivationContext";
import type { Application } from "./Application";
import { AppComponent } from "./AppComponent";

/** Represents a target that can be 'navigated' to, i.e. using `Application.navigate()`. Objects are referenced from any `AppActivity` or from `UIButton` instances, and can be used with `NavigationEvent` events, which are handled by `AppActivity.onNavigate` (by default) to navigate to a given target path. */
export class NavigationTarget {
  /** Create a new navigation target for given path or activity; if an activity is provided, the path is taken from its `AppActivity.path` property when requested */
  constructor(path: string | AppActivity, title?: string | { toString(): string }) {
    this.title = title;
    if (path instanceof AppActivity) {
      this._activity = path;
      if (title === undefined && path.name) this.title = path.name;
    } else {
      this._path = String(path);
    }
  }

  /** Optional name of this target, as a string or an object that can be cast to a string (e.g. `I18nString`, the result of `strf`) */
  title?: string | { toString(): string };

  /** Returns the path that is associated with this target */
  toString() {
    let path = String((this._activity ? this._activity.path : this._path) || "");
    let activity = this._activity;
    while (activity && path[0] === "." && path[1] === "/") {
      // replace `./` prefix with parent path, if needed
      activity = activity.getParentActivity();
      if (activity instanceof AppActivity && typeof activity.path === "string") {
        path = activity.path.replace(/\/$/, "") + path.slice(1);
      }
    }
    return path;
  }

  private _path?: string;
  private _activity?: AppActivity;
}

/** An event that causes the app to navigate to a target path, when handled by `AppActivity.onNavigate`. The navigation target is determined by the source component, using its 'getNavigationTarget' method; otherwise this is a regular instance of `ActionEvent` with its `name` property set to 'Navigate' */
export interface NavigationEvent<
  T extends Component = Component & {
    getNavigationTarget?: () => string | NavigationTarget;
  }
> extends ActionEvent<T> {
  name: "Navigate";
}

/** Activity base class. Represents a component of an application, which can be activated and deactivated independently. Can be used for activities that are activated independently of the UI; otherwise refer to any of the `ViewActivity` classes. Activities are usually preset on the `Application` constructor instead of being constructed independently, except when necessary to facilitate 'lazy' loading of parts of the application code. */
export class AppActivity extends AppComponent {
  static preset(presets: AppActivity.Presets): Function {
    return super.preset(presets);
  }

  /** @internal Application reference (avoid importing Application to break circular dependency) */
  static Application: ComponentConstructor;

  /** Create a new activity with given name and activation path, both optional. */
  constructor(name?: string, path?: string) {
    super();
    this.name = name;
    this.path = path;
  }

  /** Optional human readable name for this activity */
  name?: string;

  /** Optional activation path; if set to a string, this activity is automatically activated and deactivated asynchronously, depending on the current target path (e.g. URL path, handled by a platform dependent `AppActivationContext` instance). This string may contain segments such as ':id' or '*name' to capture variable parts of the path; when matched, these parts are stored in the object referenced by the `match` property. */
  path?: string;

  /** Optional navigation target for this activity; only useful if this activity has a direct path (no segments such as ':id' or '*name'). Allows the activity title to be translatable if set to an `I18nString` using e.g. `strf()` */
  navigationTarget?: NavigationTarget;

  /** The path segments that were captured *last* based on the target path, as matched by the `AppActivationContext`, for a path such as `foo/bar/:id`, `foo/*name`, or `./:id`. This property is set when the activity is activated through the `activateAsync` method. */
  @shadowObservable("_matchedPath")
  get match() {
    return this._matchedPath;
  }

  /** Returns the activity instance that contains a managed child reference that (indirectly) points to this activity instance. */
  getParentActivity() {
    return this.getManagedParent(AppActivity);
  }

  /** Returns the parent application that contains this activity, if any */
  getApplication() {
    return this.getManagedParent(AppActivity.Application) as Application | undefined;
  }

  /** Activate this activity, optionally based on given captured path segments (returned by `AppActivationContext.match`, for a path such as `foo/bar/:id`, `foo/*name`, or `./:id`). This method is called automatically when the activity path matches the current target path, but may also be called directly. This method can be overridden to validate the captured path segments before activation. */
  async activateAsync(match?: AppActivationContext.MatchedPath) {
    this._matchedPath = Object.freeze(match || { path: "" });
    await this.activateManagedAsync();
  }

  /** Destroy this activity */
  async destroyAsync() {
    await this.destroyManagedAsync();
  }

  /** Returns true if this activity is currently active */
  isActive() {
    return this.managedState === ManagedState.ACTIVE;
  }

  /** The timestamp (result of `Date.now()`) corresponding to the moment this activity was last activated; or undefined if this activity has never been activated */
  activated?: number;

  /** The timestamp (result of `Date.now()`) corresponding to the moment this activity was last deactivated; or undefined if this activity has never been deactivated. */
  deactivated?: number;

  /** Handle navigation events (emitted by e.g. `UIButton`) by navigating to a corresponding path using `Application.navigate()`; should be overridden if non-standard navigation behavior is required, for e.g. master-detail navigation; requires events to be delegated for components that may emit 'Navigate' events such as nested views and activities */
  onNavigate(e: NavigationEvent): boolean | void {
    if (this.isActive()) {
      let path = String(e.source.getNavigationTarget?.() || "");
      if (path) this.getApplication()?.navigate(path);
      return true;
    }
  }

  private _matchedPath?: Readonly<AppActivationContext.MatchedPath>;

  /** @internal Observer that monitors activity paths and the activation context, to activate/deactivate the activity automatically */
  @observe
  protected static ActivityObserver = class {
    constructor(public activity: AppActivity) {}
    onActive() {
      this.activity.activated = Date.now();
    }
    onInactive() {
      this.activity.deactivated = Date.now();
    }
    onPathChangeAsync() {
      return this.checkActivateAsync();
    }
    onActivationContextChangeAsync() {
      return this.checkActivateAsync();
    }
    async checkActivateAsync() {
      if (typeof this.activity.path === "string") {
        let match: AppActivationContext.MatchedPath | undefined;
        if (
          this.activity.activationContext &&
          (match = this.activity.activationContext.match(this.activity.path, this.activity))
        ) {
          await this.activity.activateAsync(match);
        } else if (
          this.activity.managedState === ManagedState.ACTIVATING ||
          this.activity.managedState === ManagedState.ACTIVE
        ) {
          await this.activity.deactivateManagedAsync();
        }
      }
    }
  };
}

export namespace AppActivity {
  /** Activity presets type, for use with `Component.with` */
  export interface Presets {
    /** Human readable name for this activity */
    name?: string;
    /** (Partial) activation path, see `AppActivity.path` */
    path?: string;
  }
}
