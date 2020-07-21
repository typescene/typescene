import {
  Component,
  ComponentConstructor,
  logUnhandledException,
  managedChild,
  ManagedList,
  ManagedService,
} from "../core";
import { err, ERROR } from "../errors";
import { UIRenderContext } from "../ui";
import { AppActivationContext } from "./AppActivationContext";
import { AppActivity } from "./AppActivity";
import { AppActivityList } from "./AppActivityList";

/**
 * Represents the application itself, encapsulates activities (`AppActivity` components) and contexts for rendering and activation using URL-like paths.
 * Use the static `run` method to create and activate an application using a set of activity constructors, or create an application class that includes activities as sub components (properties decorated using the `@compose` decorator). For a manually created class, an instance must be created and activated (see `activate`) for the application to start.
 * @note Do not use the `Application` class directly, as it will __not__ initialize rendering or activation contexts. Instead, use platform specific application classes such as `BrowserApplication` that is exported by the `@typescene/webapp` package.
 */
export class Application extends Component {
  /**
   * Create an application that includes given activities, and start it immediately.
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
      // TODO: this doesn't work anymore without active composition
      this.presetBoundComponent(
        "activities",
        AppActivityList.with(...activities),
        AppActivity
      );
    }
    return super.preset(presets);
  }

  /** The application name */
  readonly name: string = "Application";

  /** List of root activities, as child components */
  @managedChild
  activities?: AppActivityList;

  /** Application render context as a managed child object, propagated to all (nested) `AppComponent` instances */
  @managedChild
  renderContext?: UIRenderContext;

  /** Activity activation context as a managed child object, propagated to all (nested) `AppComponent` instances */
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

  /** Navigate to given (relative) path, or go back in history if argument is `:back`, using the current `Application.activationContext` */
  navigate(path: string) {
    if (this.activationContext) this.activationContext.navigate(path);
    return this;
  }

  /** Add given activities to the application. Activities with matching paths will be activated immediately (see `AppActivity.path`). */
  add(...activities: AppActivity[]) {
    if (!this.activities) {
      throw err(ERROR.Application_Inactive);
    }
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
