import { ComponentEvent, logUnhandledException, managedChild, ManagedState } from "../core";
import { UIComponent, UIRenderable, UIRenderableConstructor, UIRenderContext } from "../ui";
import { AppComponent } from "./AppComponent";
import { ViewActivity } from "./ViewActivity";
import { err, ERROR } from "../errors";

/**
 * Represents an application component that encapsulates a view made up of UI components (or other renderable components, such as nested `ViewComponent` instances).
 * The encapsulated view (a single renderable component) is created the first time this component is rendered. After that, all UI events are propagated from the encapsulated view to the `ViewComponent` instance.
 * @note This class is similar in functionality to `ViewActivity`, but `ViewComponent` views are created immediately, whereas view activities need to be activated first before their views are created.
 */
export class ViewComponent extends AppComponent implements UIRenderable {
  static preset(presets: object, ...View: UIRenderableConstructor[]): Function {
    if (View.length > 1) throw err(ERROR.ViewComponent_InvalidChild);
    // TODO: this doesn't work anymore without active composition
    if (View[0]) this.presetBoundComponent("view", View[0], ViewActivity);
    return super.preset(presets);
  }

  /** The root component that makes up the content for this view, as a child component; only created when the `ViewComponent` is rendered */
  @managedChild
  view?: UIRenderable;

  async onManagedStateActivatingAsync() {
    super.onManagedStateActivatingAsync();
    this.propagateChildEvents(ComponentEvent);
  }

  /**
   * Render the encapsulated view for this component.
   * This method is called automatically after the root view component is created and/or when an application render context is made available or emits a change event, and should not be called directly.
   */
  render(callback?: UIRenderContext.RenderCallback) {
    if (this.managedState !== ManagedState.ACTIVE && this.renderContext) {
      // activate this component now to create the view
      this._renderer.render(undefined, callback);
      if (this.managedState === ManagedState.CREATED) {
        this.activateManagedAsync()
          .then(() => {
            // check if (still) active, and attempt to render again
            if (this.managedState === ManagedState.ACTIVE) {
              this.render();
            }
          })
          .catch(logUnhandledException);
      }
    } else if (!this.renderContext) {
      // something is wrong: not a child component
      throw err(ERROR.ViewComponent_NoRenderCtx);
    } else {
      // render current view using new or old callback
      this._renderer.render(this.view, callback);
    }
  }

  /**
   * Remove the current view output, if any.
   * This method is called automatically after the root view component or render context is removed, and should not be called directly.
   */
  async removeViewAsync(deactivate?: boolean) {
    if (deactivate && this.managedState === ManagedState.ACTIVE) {
      await this.deactivateManagedAsync();
    }
    await this._renderer.removeAsync();
  }

  /** Request input focus on the view component, if any. */
  requestFocus() {
    if (typeof (this.view && (this.view as UIComponent).requestFocus) === "function") {
      (this.view as UIComponent).requestFocus();
    }
  }

  private _renderer = new UIComponent.DynamicRendererWrapper();
}

// observe view activities to render when needed
ViewComponent.addObserver(
  class {
    constructor(public component: ViewComponent) {}
    onRenderContextChange(ctx: UIRenderContext) {
      if (ctx) this.component.render();
      else this.component.removeViewAsync(true).catch(logUnhandledException);
    }
  }
);

export namespace ViewComponent {
  /** Shortcut type for declaring a static `preset` method which accepts an object with presets with the same type as given properties of the view component itself (excluding methods) */
  export type PresetFor<
    TComponent extends ViewComponent,
    K extends keyof TComponent = Exclude<
      {
        [P in keyof TComponent]: TComponent[P] extends Function ? never : P;
      }[keyof TComponent],
      keyof ViewComponent
    >
  > = (presets: Pick<TComponent, K>, ...C: UIRenderableConstructor[]) => Function;

  /**
   * Returns a `ViewComponent` class that encapsulates the view returned by given function.
   * The function receives `presets` (object) and rest parameters (i.e. content) and should return a component constructor.
   * The resulting class contains a typed `preset` function such that a subsequent call to `.with()` expects the corresponding presets and rest parameter types.
   */
  export function template<TPreset, TRest extends UIRenderableConstructor[]>(
    templateProvider: (presets: TPreset, ...C: TRest) => UIRenderableConstructor
  ): typeof ViewComponent & { preset: (presets: TPreset, ...rest: TRest) => Function } {
    return class ViewComponentWithTemplate extends ViewComponent {
      static preset(presets: any, ...C: TRest) {
        let t = templateProvider(presets, ...C);
        // TODO: this doesn't work anymore without active composition
        this.presetBoundComponent("view", t).limitBindings();
        this.presetBindingsFrom(t);
        return super.preset(presets);
      }
    };
  }
}
