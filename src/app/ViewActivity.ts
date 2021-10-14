import {
  ComponentEvent,
  delegateEvents,
  logUnhandledException,
  managed,
  managedChild,
  ManagedEvent,
  observe,
} from "../core";
import { err, ERROR } from "../errors";
import {
  UIComponent,
  UIRenderable,
  UIRenderableConstructor,
  UIRenderContext,
  UIRenderPlacement,
  UITheme,
  Stringable,
} from "../ui";
import { AppActivity } from "./AppActivity";
import { Application } from "./Application";

/**
 * View activity base class. Represents an application activity with content that can be rendered when activated.
 * @note Nothing is rendered if the `placement` property is undefined (default). Make sure this property is set to a `UIRenderPlacement` value before rendering, or use a specific view activity class such as `PageViewActivity`.
 */
export class ViewActivity extends AppActivity implements UIRenderable {
  /**
   * Register this activity class with the application auto-update handler (for automatic reload/hot module update). When possible, updates to the module trigger updates to any existing activity instances, with new methods and a new view instance.
   * @param module
   *  Reference to the module that should be watched for updates (build system-specific)
   */
  static autoUpdate(module: any) {
    Application.registerAutoUpdate(module, this, "@reload");
  }

  /** @internal Update prototype for given class with newer prototype */
  static ["@reload"](Old: typeof ViewActivity, Updated: typeof ViewActivity) {
    if (Old.prototype._OrigClass) Old = Old.prototype._OrigClass;
    Updated.prototype._OrigClass = Old;
    let desc = (Object as any).getOwnPropertyDescriptors(Updated.prototype);
    for (let p in desc) Object.defineProperty(Old.prototype, p, desc[p]);
    let View = (Old.prototype._ViewClass = Updated.prototype._ViewClass);
    if (View && Old.prototype._PresetClass) {
      Old.prototype._PresetClass.presetBoundComponent("view", View, AppActivity);
      for (var id in Old.prototype._allActive) {
        var activity = Old.prototype._allActive[id];
        if (activity.isActive()) activity.view = new View();
      }
    }
  }

  static preset(presets: ViewActivity.Presets, View?: UIRenderableConstructor): Function {
    if (View) {
      this.presetBoundComponent("view", View, AppActivity);
      if (!this.prototype._allActive) this.prototype._allActive = Object.create(null);
      this.prototype._ViewClass = View;
      this.prototype._PresetClass = this;
    }
    return super.preset(presets);
  }

  /** The root component that makes up the content for this view, as a child component */
  @delegateEvents
  @managedChild
  view?: UIRenderable;

  /** View placement mode, determines if and how view is rendered when activated */
  placement = UIRenderPlacement.NONE;

  /** Modal shade backdrop opacity behind content (0-1), if supported by placement mode */
  modalShadeOpacity?: number;

  /**
   * Render the view for this activity and display it, if it is not currently visible.
   * This method is called automatically after the root view component is created and/or when an application render context is made available or emits a change event, and should not be called directly.
   */
  render(callback?: UIRenderContext.RenderCallback) {
    if (this._cbContext !== this.renderContext) {
      // remember this render context and invalidate
      // previous callback if context changed
      this._renderCallback = undefined;
      this._cbContext = this.renderContext;
    }
    if (callback && callback !== this._renderCallback) {
      if (this._renderCallback) this._renderCallback(undefined);
      this._renderCallback = callback;
    }
    if (!this._renderCallback) {
      if (!this.placement) return;
      if (!this.renderContext) {
        throw err(ERROR.ViewActivity_NoRenderContext);
      }
      let placement = this.placement;
      let rootCallback = this.renderContext.getRenderCallback();
      let rootProxy: NonNullable<typeof callback> = (output, afterRender) => {
        if (output) {
          output.placement = placement;
          output.modalShadeOpacity = this.modalShadeOpacity;
        }
        rootCallback = rootCallback(output as any, afterRender) as NonNullable<
          typeof callback
        >;
        return rootProxy;
      };
      this._renderCallback = rootProxy;
    }
    this._renderer.render(this.view, this._renderCallback);
  }

  /**
   * Remove the view output that was rendered by `ViewActivity.render`, if any.
   * This method is called automatically after the root view component or render context is removed, and should not be called directly.
   */
  async removeViewAsync() {
    await this._renderer.removeAsync();
  }

  /** Request input focus on the last (or first) focused UI component, if any */
  restoreFocus(firstFocused?: boolean) {
    if (firstFocused) this.firstFocused && this.firstFocused.requestFocus();
    else this.lastFocused && this.lastFocused.requestFocus();
  }

  /** Handle FocusIn UI event, remember first/last focused component */
  protected onFocusIn(e: ComponentEvent): boolean | void {
    if (e.source instanceof UIComponent) {
      if (!this.firstFocused) this.firstFocused = e.source;
      this.lastFocused = e.source;
    }
  }

  /** The UI component that was focused first, if any */
  @managed
  firstFocused?: UIComponent;

  /** The UI component that was most recently focused, if any */
  @managed
  lastFocused?: UIComponent;

  /**
   * Create an instance of given view component, wrapped in a singleton dialog view activity, and adds it to the application to be displayed immediately. Unless an event handler is specified explicitly, the activity responds to the CloseModal event by destroying the activity, which removes the view as well.
   * @param View
   *  A view component constructor
   * @param eventHandler
   *  A function that is invoked for all events that are emitted by the view
   * @returns A promise that resolves to the view _activity_ instance after it has been activated.
   * @note Use the `Application.showViewActivityAsync` method, or reference an activity using a managed child property to show a view that is already encapsulated in an activity.
   */
  showDialogAsync(
    View: UIRenderableConstructor,
    eventHandler?: (this: DialogViewActivity, e: ManagedEvent) => void
  ) {
    let app = this.getApplication();
    if (!app) throw err(ERROR.ViewActivity_NoApplication);

    // create a singleton activity constructor with event handler
    class SingletonActivity extends DialogViewActivity.with(View) {}
    if (eventHandler) {
      SingletonActivity.prototype.delegateEvent = eventHandler;
    }
    let activity: ViewActivity = new SingletonActivity();
    return app.showViewActivityAsync(activity);
  }

  /**
   * Display a confirmation/alert dialog with given content. If the 'cancel' button label is not provided, the dialog will only contain a 'confirm' button. All strings are automatically translated to the current locale using the `strf` function.
   * @param message
   *  The message to be displayed, or multiple message paragraphs (for arrays)
   * @param title
   *  The dialog title, displayed at the top of the dialog (optional)
   * @param confirmButtonLabel
   *  The label for the 'confirm' button
   * @param cancelButtonLabel
   *  The label for the 'cancel' button, if any
   * @returns A promise that resolves to true if the OK button was clicked, false otherwise.
   */
  showConfirmationDialogAsync(
    message: Stringable | Stringable[],
    title?: Stringable,
    confirmButtonLabel?: Stringable,
    cancelButtonLabel?: Stringable
  ) {
    let Builder = UITheme.current.ConfirmationDialogBuilder;
    if (!Builder) {
      throw err(ERROR.ViewActivity_NoDialogBuilder);
    }
    let builder = new Builder();
    if (Array.isArray(message)) message.forEach(m => builder.addMessage(m));
    else builder.addMessage(message);
    if (title) builder.setTitle(title);
    if (confirmButtonLabel) builder.setConfirmButtonLabel(confirmButtonLabel);
    if (cancelButtonLabel) builder.setCancelButtonLabel(cancelButtonLabel);
    let Dialog = builder.build();
    return new Promise<boolean>(resolve => {
      this.showDialogAsync(Dialog, function (e) {
        if (e.name === "Confirm") {
          resolve(true);
          this.destroyAsync();
        }
        if (e.name === "CloseModal" && cancelButtonLabel) {
          resolve(false);
          this.destroyAsync();
        }
      });
    });
  }

  private _renderCallback?: UIRenderContext.RenderCallback;
  private _cbContext?: UIRenderContext;
  private _renderer = new UIComponent.DynamicRendererWrapper();

  // these references are set on the prototype instead (by static `preset()`):
  private _allActive?: { [managedId: string]: ViewActivity };
  private _ViewClass?: UIRenderableConstructor;
  private _PresetClass?: typeof ViewActivity;
  private _OrigClass?: typeof ViewActivity;

  /** @internal Observe view activities to create views and render when needed */
  @observe
  protected static ViewActivityObserver = class {
    constructor(public activity: ViewActivity) {}
    onActive() {
      if (this.activity._allActive) {
        this.activity._allActive[this.activity.managedId] = this.activity;
      }
      if (this.activity._ViewClass) {
        this.activity.view = new this.activity._ViewClass();
      }
    }
    onInactive() {
      if (this.activity._allActive) {
        delete this.activity._allActive[this.activity.managedId];
      }
      this.activity.view = undefined;
    }
    async onRenderContextChange() {
      if (this.activity.isActive() && this.activity._ViewClass) {
        this.activity.view = undefined;
        if (this.activity.renderContext) {
          // introduce a delay artificially to clear the old view
          await Promise.resolve();
          setTimeout(() => {
            if (
              !this.activity.view &&
              this.activity.renderContext &&
              this.activity.isActive() &&
              this.activity._ViewClass
            ) {
              this.activity.view = new this.activity._ViewClass();
            }
          }, 1);
        }
      }
    }
    onViewChangeAsync() {
      this.checkAndRender();
    }
    checkAndRender() {
      if (this.activity.renderContext && this.activity.view) this.activity.render();
      else this.activity.removeViewAsync().catch(logUnhandledException);
    }
  };
}

/** Represents an application activity with a view that is rendered as a full page (when active) */
export class PageViewActivity extends ViewActivity {
  placement = UIRenderPlacement.PAGE;
}

/**
 * Represents an application activity with a view that is rendered as a modal dialog (when active). The activity is destroyed automatically when a `CloseModal` event is emitted on the view instance.
 * @note Use `UIComponent.position` (`UIStyle.Position`, specifically the `gravity` property) to determine the position of the dialog UI.
 */
export class DialogViewActivity extends ViewActivity {
  /** Create a new activity that is rendered as a modal dialog */
  constructor() {
    super();
    this.placement = UIRenderPlacement.DIALOG;
    this.modalShadeOpacity = UITheme.current.modalDialogShadeOpacity;
  }

  /** Handle CloseModal event by destroying this activity; stops propagation of the event */
  protected onCloseModal(): boolean | void {
    this.destroyAsync();
    return true;
  }
}

export namespace ViewActivity {
  /** View activity presets type, for use with `Component.with` */
  export interface Presets extends AppActivity.Presets {
    /** View placement mode */
    placement?: UIRenderPlacement;
    /** Modal shade backdrop opacity behind content (0-1), if supported by placement mode */
    modalShadeOpacity?: number;
  }
}
