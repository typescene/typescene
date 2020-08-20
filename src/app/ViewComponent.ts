import {
  ComponentEvent,
  logUnhandledException,
  managedChild,
  ManagedState,
  Binding,
  ManagedEvent,
  Component,
  ComponentConstructor,
  ComponentPresetArgType,
} from "../core";
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

  // Note: the monster below makes it easier to declare view components
  // without having to add a preset method and use JSX.tag() every time.
  // It is NOT good practice to override the `with` method (instead of
  // a static preset method), but the fact that the below works with JSX
  // is probably worth it.

  /** Declare a view component class with given properties and view */
  static with<
    T extends typeof ViewComponent,
    PresetT = object,
    ContentPropertiesT extends string = "content"
  >(
    this: T,
    options?: {
      /** Default values for all properties on this component */
      defaults?: PresetT | (() => PresetT);
      /** Content property names, if any */
      content?: ContentPropertiesT[];
      /** The encapsulated view */
      view: ComponentConstructor<UIRenderable> | typeof Component;
      // NOTE ^ need to be liberal here to make sure compiler does not
      // accidentally pick the simpler override below with `object` type
      /** View event handler */
      event?: (e: any) => ManagedEvent | ManagedEvent[] | undefined | void;
    }
  ): ViewComponent.PresetType<PresetT, ContentPropertiesT>;
  /** Declare a view component class with given preset properties */
  static with<T extends typeof ViewComponent>(
    this: T,
    presets: ComponentPresetArgType<T>
  ): T;
  /** Declare a view component class with given preset properties and content */
  static with<T extends typeof ViewComponent>(
    this: T,
    presets: ComponentPresetArgType<T>,
    ...content: [UIRenderableConstructor, ...UIRenderableConstructor[]]
  ): T;
  /** Declare a view component class with given view or content */
  static with<T extends typeof ViewComponent>(
    this: T,
    ...content: [UIRenderableConstructor, ...UIRenderableConstructor[]]
  ): T;
  static with(arg: any, ..._rest: any[]) {
    // fall back to normal `with` method if no view given
    if (!arg || typeof arg === "function" || !arg.view) {
      return (Component.with as any).apply(this, arguments);
    }

    // initialize options
    let args: {
      defaults?: any;
      content?: string[];
      view: UIRenderableConstructor;
      event?: (e: any) => any;
    } = arg;
    if (!args.content) args.content = ["content"];
    let defaults = args.defaults;

    // create a class that derives from the base class with added presets
    class PresetViewComponent extends this {
      static with = Component.with;
      static preset(
        presets: any,
        ...contents: Array<UIRenderableConstructor | undefined>
      ): Function {
        // preset content if any (passed in to .with or JSX tag content)
        for (let i = 0; i < contents.length; i++) {
          let propertyName = args.content![i];
          if (propertyName && contents[i]) {
            managedChild(this.prototype, propertyName);
            this.presetChildView(propertyName as any, contents[i]!);
          }
        }
        return super.preset(presets);
      }
      constructor(values?: any) {
        super();

        // add event handler/propagation function
        if (args.event) this.propagateChildEvents(args.event as any);

        // apply defaults and given values directly
        const apply = (o: any) => {
          for (let p in o) {
            if (Object.prototype.hasOwnProperty.call(o, p)) {
              let v = o[p];
              if (v instanceof Binding) throw TypeError();
              (this as any)[p] = v;
            }
          }
        };
        if (defaults) apply(defaults);
        if (values) apply(values);
      }
      protected isPresetComponent() {
        return true;
      }
    }

    // if defaults function is provided, make sure it runs before the constructor
    if (typeof defaults === "function") {
      let f = defaults;
      defaults = undefined;
      PresetViewComponent._addInitializer(() => {
        defaults = f();
      });
    }

    // preset view constructor and return result
    PresetViewComponent.presetChildView("view", args.view, true);
    return PresetViewComponent as any;
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
      this.beforeRender();
      this._renderer.render(this.view, callback);
    }
  }

  /** Method that is called immediately before the view is rendered; can be overridden */
  protected beforeRender() {}

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

export namespace ViewComponent {
  /** The result of ViewComponent.with(...), used like any other preset component constructor */
  export interface PresetViewComponentConstructor<
    PresetT,
    ContentPropertiesT extends string
  > {
    /** Declare a view component class with given preset properties and content */
    with(
      presets:
        | { [P in keyof PresetT]?: PresetT[P] | Binding.Type }
        | { [eventName: string]: string },
      ...content: Array<UIRenderableConstructor | undefined>
    ): ViewComponent.PresetType<PresetT, ContentPropertiesT>;
    preset(
      presets: PresetT,
      ...contents: Array<UIRenderableConstructor | undefined>
    ): Function;
    /**
     * Create a view component, copying all properties from given object
     * @note Bindings are not allowed as arguments to this constructor, but are added as a type here to allow JSX-syntax tags to include bindings.
     */
    new (
      values?:
        | { [P in keyof PresetT]?: PresetT[P] | Binding.Type }
        | { [eventName: string]: string }
    ): ViewComponent &
      { [P in keyof PresetT]?: PresetT[P] } &
      { [P in ContentPropertiesT]?: UIRenderable };
  }
  /** The result of ViewComponent.with(...), used like any other preset component constructor */
  export type PresetType<PresetT, ContentPropertiesT extends string> = {
    [P in keyof typeof ViewComponent]: typeof ViewComponent[P];
  } &
    PresetViewComponentConstructor<PresetT, ContentPropertiesT>;
}
