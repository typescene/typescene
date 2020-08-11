import {
  logUnhandledException,
  managed,
  managedChild,
  ManagedEvent,
  observe,
  strf,
} from "../core";
import { err, ERROR } from "../errors";
import {
  UIComponent,
  UIComponentEvent,
  UIRenderable,
  UIRenderableConstructor,
  UIRenderContext,
  UIRenderPlacement,
  UITheme,
} from "../ui";
import { AppActivity } from "./AppActivity";

/**
 * View activity base class. Represents an application activity with content that can be rendered when activated.
 * @note Nothing is rendered if the `placement` property is undefined (default). Make sure this property is set to a `UIRenderPlacement` value before rendering, or use a specific view activity class such as `PageViewActivity`.
 */
export class ViewActivity extends AppActivity implements UIRenderable {
  static preset(presets: ViewActivity.Presets, View?: UIRenderableConstructor): Function {
    let addViewComponent = (View: UIRenderableConstructor) => {
      this.presetBoundComponent("view", View, AppActivity);
      if (this.prototype._allActive) {
        if (this.prototype._ViewClass) {
          // this exact activity class was previously bound to a different view,
          // go through all active instances to replace the view now
          for (let id in this.prototype._allActive) {
            let activity = this.prototype._allActive[id];
            if (activity.isActive()) activity.view = new View();
          }
        }
      } else {
        this.prototype._allActive = Object.create(null);
      }
      this.prototype._ViewClass = View;
      if (!Object.prototype.hasOwnProperty.call(View, "preset")) {
        // add a callback for 'hot' reload to update the view class
        (View as any)["@updateActivity"] = addViewComponent;
      }
    };
    if (View) addViewComponent(View);
    return super.preset(presets);
  }

  /** Create a new (inactive) view activity with given name and path */
  constructor(name?: string, path?: string) {
    super(name, path);
    this.propagateChildEvents(e => {
      if (e instanceof UIComponentEvent && e.name === "FocusIn") {
        if (!this.firstFocused) this.firstFocused = e.source;
        this.lastFocused = e.source;
      }
    });
  }

  /** The root component that makes up the content for this view, as a child component */
  @managedChild
  view?: UIRenderable;

  /** View placement mode, determines if and how view is rendered when activated */
  placement = UIRenderPlacement.NONE;

  /** Modal shade backdrop opacity behind content (0-1), if supported by placement mode */
  modalShadeOpacity?: number;

  /** True if clicking outside a modal component should close it, defaults to false */
  modalShadeClickToClose?: boolean;

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
          output.modalShadeClickToClose = this.modalShadeClickToClose;
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

  /** The UI component that was focused first, if any */
  @managed
  firstFocused?: UIComponent;

  /** The UI component that was most recently focused, if any */
  @managed
  lastFocused?: UIComponent;

  /**
   * Create an instance of given view component, wrapped in a singleton dialog view activity, and adds it to the application to be displayed immediately.
   * @param View
   *  A view component constructor
   * @param modalShadeClickToClose
   *  Set to true to allow the dialog to be closed by clicking outside of it
   * @param eventHandler
   *  A function that is invoked for all events that are emitted by the view; if no function is specified, the `CloseModal` event is handled by destroying the view activity instance.
   * @returns A promise that resolves to the view _activity_ instance after it has been activated.
   */
  showDialogAsync(
    View: UIRenderableConstructor,
    modalShadeClickToClose?: boolean,
    eventHandler?: (this: DialogViewActivity, e: ManagedEvent) => void
  ) {
    let app = this.getApplication();
    if (!app) throw err(ERROR.ViewActivity_NoApplication);

    // create a singleton activity constructor with event handler
    class SingletonActivity extends DialogViewActivity.with(
      { modalShadeClickToClose },
      View
    ) {
      constructor() {
        super();
        if (eventHandler) {
          this.propagateChildEvents(eventHandler);
        }
      }
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
    message: string | string[],
    title?: string,
    confirmButtonLabel?: string,
    cancelButtonLabel?: string
  ) {
    let Builder = UITheme.current.ConfirmationDialogBuilder;
    if (!Builder) {
      throw err(ERROR.ViewActivity_NoDialogBuilder);
    }
    let builder = new Builder();
    if (Array.isArray(message)) message.forEach(m => builder.addMessage(String(strf(m))));
    else builder.addMessage(String(strf(message)));
    if (title) builder.setTitle(String(strf(title)));
    if (confirmButtonLabel) builder.setConfirmButtonLabel(String(strf(confirmButtonLabel)));
    if (cancelButtonLabel) builder.setCancelButtonLabel(String(strf(cancelButtonLabel)));
    let Dialog = builder.build();
    return new Promise<boolean>(resolve => {
      this.showDialogAsync(Dialog, !cancelButtonLabel, function (e) {
        if (e.name === "Confirm") resolve(true), this.destroyAsync();
        if (e.name === "CloseModal") resolve(false), this.destroyAsync();
      });
    });
  }

  private _renderCallback?: UIRenderContext.RenderCallback;
  private _cbContext?: UIRenderContext;
  private _renderer = new UIComponent.DynamicRendererWrapper();

  // these two references are set on the prototype instead (by static `preset()`):
  private _allActive?: { [managedId: string]: ViewActivity };
  private _ViewClass?: UIRenderableConstructor;

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
    onViewChange() {
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
 * Represents an application activity with a view that is rendered as a modal dialog (when active).
 * Use `UIComponent.position` (`UIStyle.Position`, specifically the `gravity` property) to determine the position of the dialog UI.
 */
export class DialogViewActivity extends ViewActivity {
  constructor() {
    super();
    this.placement = UIRenderPlacement.DIALOG;
    this.modalShadeOpacity = UITheme.current.modalDialogShadeOpacity;
    this.propagateChildEvents(e => {
      if (e.name === "CloseModal") this.destroyAsync();
    });
  }
}

export namespace ViewActivity {
  /** View activity presets type, for use with `Component.with` */
  export interface Presets extends AppActivity.Presets {
    /** View placement mode */
    placement?: UIRenderPlacement;
    /** Modal shade backdrop opacity behind content (0-1), if supported by placement mode */
    modalShadeOpacity?: number;
    /** True if clicking outside a modal component should close it, defaults to false */
    modalShadeClickToClose?: boolean;
  }
}
