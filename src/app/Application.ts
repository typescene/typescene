import {
  Component,
  ComponentConstructor,
  logUnhandledException,
  managedChild,
  ManagedList,
  ManagedService,
  ManagedCoreEvent,
  delegateEvents,
} from "../core";
import { UIRenderContext } from "../ui";
import { AppActivationContext } from "./AppActivationContext";
import { AppActivity } from "./AppActivity";
import { AppActivityList } from "./AppActivityList";

/**
 * Represents the application itself, encapsulates activities (`AppActivity` components) and contexts for rendering and activation using URL-like paths.
 * Use the static `run` method to create and activate an application using a set of activity constructors, or create an application class that includes activities as (preset) bound components.
 * @note Do not use the `Application` class directly, as it will __not__ initialize rendering or activation contexts. Instead, use platform specific application classes such as `BrowserApplication` that is exported by the `@typescene/webapp` package.
 */
export class Application extends Component {
  /**
   * Create an application that includes given activities, and start it immediately. If none of the activities has a `path` property, then all activities are activated immediately; otherwise each activity will activate itself using the current `activationContect`.
   * @returns the application instance
   * @note Calling this method directly on `Application` creates an application without any context (i.e. `activationContext` and `renderContext`). Instead, use a constructor that is meant for a specific platform (e.g. `BrowserApplication`).
   */
  static run<T extends Application>(
    this: typeof Application,
    ...activities: Array<ComponentConstructor<AppActivity>>
  ): T {
    let C = this.with(...(activities as any[]));
    return new C().activate() as any;
  }

  /** All `Application` instances that are currently active */
  static active = (() => {
    let result = new ManagedList<Application>();
    Application.addObserver(
      class {
        constructor(public instance: Application) {}
        onActive() {
          if (!result.includes(this.instance)) result.add(this.instance);
        }
        onInactive() {
          result.remove(this.instance);
        }
      }
    );
    return result;
  })();

  static preset(
    presets: Application.Presets,
    ...activities: Array<ComponentConstructor<AppActivity>>
  ): Function {
    if (activities.length) {
      // preset an AppActivityList with given activities
      let L = AppActivityList.with(...activities);
      this.presetBoundComponent("activities", L, AppActivity);
      this.addEventHandler(function (e) {
        // toggle property based on activation state
        if (e === ManagedCoreEvent.INACTIVE) {
          this.activities = undefined;
        }
        if (e === ManagedCoreEvent.ACTIVE) {
          this.activities = new L();

          // if none of the activities has a path, activate all of them now
          let paths = this.activities.map(a => a.path).filter(s => !!s);
          if (!paths.length) {
            this.activities.forEach(a => {
              a.activateAsync().catch(logUnhandledException);
            });
          }
        }
      });
    }
    return super.preset(presets);
  }

  /** The application name */
  readonly name: string = "Application";

  /** List of root activities, as child components */
  @delegateEvents
  @managedChild
  activities?: AppActivityList;

  /** Application render context as a managed child object, propagated to all (nested) `AppComponent` instances. This object is set by specialized application classes such as `BrowserApplication` to match the capabilities of the runtime platform.  */
  @managedChild
  renderContext?: UIRenderContext;

  /** Activity activation context as a managed child object, propagated to all (nested) `AppComponent` instances. This object is set by specialized application classes such as `BrowserApplication` to match the capabilities of the runtime platform. */
  @managedChild
  activationContext?: AppActivationContext;

  /**
   * Activate this application asynchronously, immediately creating all primary activities; any errors during activation are handled by logging them to the console (uses `UnhandledErrorEmitter`)
   * @returns the application itself
   */
  activate() {
    this.activateAsync().catch(logUnhandledException);
    return this;
  }

  /** Activate this application, immediately creating all primary activities */
  async activateAsync() {
    await this.activateManagedAsync();
  }

  /** Deactivate this application, immediately destroying all actvities */
  async deactivateAsync() {
    await this.deactivateManagedAsync();
  }

  /** Destroy this application, immediately destroying all activities */
  async destroyAsync() {
    await this.destroyManagedAsync();
  }

  /** Navigate to given (relative) path using the current `Application.activationContext` */
  navigate(path: string) {
    if (this.activationContext) this.activationContext.navigate(path);
    return this;
  }

  /** Go back to the previous navigation path, if implemented by the current `Application.activationContext` */
  goBack() {
    if (this.activationContext) this.activationContext.navigate(":back");
    return this;
  }

  /** Add given activities to the application. Activities with matching paths will be activated immediately (see `AppActivity.path`). */
  add(...activities: AppActivity[]) {
    if (!this.activities) this.activities = new AppActivityList();
    this.activities.add(...activities.filter(a => !this.activities!.includes(a)));
    return this;
  }

  /**
   * Add given view activity to the application, and activate it immediately regardless of `AppActivity.path`; this causes corresponding views to be rendered if possible.
   * @returns A promise that resolves to the view activity after it has been activated.
   */
  async showViewActivityAsync<TViewActivity extends AppActivity & { render: Function }>(
    viewActivity: TViewActivity
  ) {
    this.add(viewActivity);
    await viewActivity.activateAsync();
    return viewActivity;
  }

  /** Returns the currently registered service with given name, if any. This is an alias of `ManagedService.find()`. */
  findService(name: string) {
    return ManagedService.find(name);
  }
}

export namespace Application {
  /** Application presets type, for use with `Component.with` */
  export interface Presets {
    /** Human readable application name */
    name?: string;
    /** Platform dependent application render context */
    renderContext?: UIRenderContext;
    /** Platform dependent activation context (router) */
    activationContext?: AppActivationContext;
  }
}
