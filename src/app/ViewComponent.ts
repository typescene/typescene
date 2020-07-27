import { ComponentEvent, logUnhandledException, managedChild, ManagedState } from "../core";
import { UIComponent, UIRenderable, UIRenderableConstructor, UIRenderContext } from "../ui";
import { AppComponent } from "./AppComponent";
import { ViewActivity } from "./ViewActivity";
import { err, ERROR } from "../errors";

/**
 * Represents an application component that encapsulates a view as a bound component. Bindings and event handlers in nested view components are bound to the ViewComponent instance itself, and events are propagated by default.
 * @note This class is similar in functionality to `ViewActivity`, but `ViewComponent` views are created immediately, whereas view activities need to be activated first before their views are created.
 */
export class ViewComponent extends AppComponent implements UIRenderable {
  static preset(presets: object, ...View: UIRenderableConstructor[]): Function {
    if (View.length > 1) throw err(ERROR.ViewComponent_InvalidChild);
    if (View[0]) this.presetChildView("view", View[0], true);
    return super.preset(presets);
  }

  /**
   * Create a child view of given type automatically for each instance of the view component. Bindings for given properties are bound to the ViewComponent instance, others are ignored so that their values will be taken from the containing bound parent instead of the ViewComponent itself.
   * @param propertyName
   *  The property that will be set. This property must _already_ be a designated managed child property (see `@managedChild`).
   * @param View
   *  The (preset) constructor for the child view. This constructor will be used to create a child component for each `ViewComponent` instance.
   * @param boundProperties
   *  A list of properties for which bindings (on the child component) should be bound to the `ViewComponent` instance, instead of the original parent. Alternatively, set this to `true` to bind _all_ bindings on the `ViewComponent` instance.
   */
  static presetChildView<TViewComponent>(
    this: { new (...args: never[]): TViewComponent } & typeof ViewComponent,
    propertyName: keyof TViewComponent,
    View: UIRenderableConstructor,
    boundProperties: Array<keyof TViewComponent> | true = []
  ) {
    let composition = this.presetBoundComponent(propertyName as any, View, ViewActivity);
    if (boundProperties !== true) {
      composition.limitBindings(...(boundProperties as string[]));
    }
    if (!Object.prototype.hasOwnProperty.call(this.prototype, "_Views")) {
      this.prototype._Views = Object.create(this.prototype._Views || null);
    }
    this.prototype._Views[propertyName] = View;
  }

  constructor() {
    super();
    this.propagateChildEvents(ComponentEvent);
    if (this._Views) {
      for (let p in this._Views) {
        (this as any)[p] = new this._Views[p]();
      }
    }
  }

  /** The root component that makes up the content for this view, bound to the `ViewComponent` itself */
  @managedChild
  view?: UIRenderable;

  /** Render the encapsulated view for this component. This method should not be called directly; it is called automatically based on changes to the application render context. */
  render(callback?: UIRenderContext.RenderCallback) {
    if (!this.renderContext) {
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

  // these references are set on the prototype instead (by static `preset()` method):
  private _Views?: { [propertyName: string]: UIRenderableConstructor };
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
