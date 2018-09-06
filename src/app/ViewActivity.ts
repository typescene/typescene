import { Binding, logUnhandledException, managed, ManagedChangeEvent, managedChild, ManagedEvent } from "../core";
import { UIComponent, UIComponentEvent, UIRenderable, UIRenderableConstructor, UIRenderContext, UIRenderPlacement, UITheme } from "../ui";
import { AppActivity } from "./AppActivity";
import { ViewComponent } from "./ViewComponent";

/**
 * Represents an application activity with content that can be rendered when activated.
 * @note This class is similar to `ViewComponent`, but has additional functionality to allow it to be used as an application activity (derived from `AppActivity`).
 */
export class ViewActivity extends AppActivity {
    static preset(presets: ViewActivity.Presets,
        View?: UIRenderableConstructor): Function {
        let addViewComponent = (View: UIRenderableConstructor) => {
            this.presetActiveComponent("view", View, AppActivity);
            if (!Object.prototype.hasOwnProperty.call(View, "preset")) {
                (View as any)["@updateActivity"] = addViewComponent;
                this.prototype["@resetView"] = function (this: ViewActivity) {
                    if (this.isActive() &&
                        !(this.view instanceof View)) {
                        // clear old view, then emit Change
                        // to wake up new component observer
                        this.view = undefined;
                        this.emit(ManagedChangeEvent.CHANGE);
                    }
                }
            }
        }
        let viewClass = View || presets.view;
        delete presets.view;
        if (Binding.isBinding(viewClass)) {
            throw TypeError("[ViewActivity] View property cannot be bound");
        }
        if (viewClass) addViewComponent(viewClass);
        return super.preset(presets);
    }

    /** Create a new inactive view activity with given name and path */
    constructor(name?: string, path?: string) {
        super(name, path);
        this.propagateChildEvents(e => {
            if ((e instanceof UIComponentEvent) && e.name === "FocusIn") {
                if (!this.firstFocused) this.firstFocused = e.source;
                this.lastFocused = e.source;
            }
        });
    }

    /** The root component that makes up the content for this view, as a child component */
    @managedChild
    view?: UIRenderable;

    /** @internal Recreate view instance (defined on prototype) */
    ["@resetView"]() { }

    /** View placement mode, should be set if this component is not rendered by another view */
    placement?: UIRenderPlacement;

    /** Modal shade backdrop opacity behind content (0-1), if supported by placement mode */
    modalShadeOpacity?: number;

    /** True if clicking outside a modal component should close it, defaults to false */
    modalShadeClickToClose?: boolean;

    /**
     * Render the view for this activity and display it, if it is not currently visible.
     * This method is called automatically after the root view component is created and/or when an application render context is made available or emits a change event, and should not be called directly.
     */
    render(callback?: UIRenderContext.RenderCallback) {
        if (callback && callback !== this._renderCallback) {
            if (this._renderCallback) this._renderCallback(undefined);
            this._renderCallback = callback;
        }
        if (!this._renderCallback) {
            if (!this.placement) throw new Error("[ViewActivity] Placement mode not set");
            if (!this.renderContext) throw Error("[ViewActivity] Render context not found");
            let placement = this.placement;
            let rootCallback = this.renderContext.getRenderCallback();
            let rootProxy: NonNullable<typeof callback> = (output, afterRender) => {
                if (output) {
                    output.placement = placement;
                    output.modalShadeOpacity = this.modalShadeOpacity;
                    output.modalShadeClickToClose = this.modalShadeClickToClose;
                }
                rootCallback = rootCallback(output as any, afterRender) as NonNullable<typeof callback>;
                return rootProxy;
            };
            this._renderCallback = rootProxy;
        }
        ViewComponent.prototype.render.call(this, this._renderCallback);
    }

    /**
     * Remove the view output that was rendered by `ViewActivity.render`, if any.
     * This method is called automatically after the root view component or render context is removed, and should not be called directly.
     */
    async removeViewAsync() {
        return ViewComponent.prototype.removeViewAsync.call(this);
    }

    /** @internal Checks if component can be activated and rendered (shared with `ViewComponent`) */
    protected _activateOnRender() { return false }

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
     *  A function that is invoked for all events that are emitted by the view
     * @returns A promise that resolves to the view _activity_ instance after it has been activated.
     */
    showDialogAsync(View: UIRenderableConstructor, modalShadeClickToClose?: boolean,
        eventHandler?: (this: DialogViewActivity, e: ManagedEvent) => void) {
        let app = this.getApplication();
        if (!app) throw Error("[ViewActivity] Application instance not found");

        // create a singleton activity constructor with event handler
        class SingletonActivity extends DialogViewActivity.with({ modalShadeClickToClose }, View) {
            constructor() {
                super();
                this.propagateChildEvents(function (e) {
                    eventHandler && eventHandler.call(this, e);
                });
            }
        }
        let activity: ViewActivity = new SingletonActivity();
        return app.showViewActivityAsync(activity);
    }

    /**
     * Display a confirmation/alert dialog with given content. If the 'cancel' button label is not provided, the dialog will only contain a 'confirm' button.
     * @param message
     *  The message to be displayed, or multiple message paragraphs (if array type)
     * @param title
     *  The dialog title, displayed at the top of the dialog
     * @param confirmButtonLabel
     *  The label for the 'confirm' button
     * @param cancelButtonLabel
     *  The label for the 'cancel' button, if any
     * @returns A promise that resolves to true if the OK button was clicked, false otherwise.
     */
    showConfirmationDialogAsync(message: string | string[], title?: string, confirmButtonLabel?: string, cancelButtonLabel?: string) {
        let Builder = UITheme.current.ConfirmationDialogBuilder;
        if (!Builder) {
            throw Error("[ViewActivity] Dialog builder not found");
        }
        let builder = new Builder();
        if (Array.isArray(message)) message.forEach(m => builder.addMessage(m));
        else builder.addMessage(message);
        if (title) builder.setTitle(title);
        if (confirmButtonLabel) builder.setConfirmButtonLabel(confirmButtonLabel);
        if (cancelButtonLabel) builder.setCancelButtonLabel(cancelButtonLabel);
        let Dialog = builder.build();
        return new Promise<boolean>(resolve => {
            this.showDialogAsync(Dialog, !cancelButtonLabel, function (e) {
                if (e.name === "Confirm") resolve(true), this.destroyAsync();
                if (e.name === "CloseModal") resolve(false), this.destroyAsync();
            });
        });
    }

    // this property is shared with `ViewComponent` -- do not change
    private _renderCallback?: UIRenderContext.RenderCallback;
}

// observe view activities to render when needed
ViewActivity.observe(class {
    constructor (public activity: ViewActivity) { }
    async onRenderContextChange(_ctx: any, event: any) {
        if (event) this.activity["@resetView"]();
        this.checkAndRender()
    }
    onViewChange() { this.checkAndRender() }
    checkAndRender() {
        if (this.activity.renderContext && this.activity.view) this.activity.render();
        else this.activity.removeViewAsync().catch(logUnhandledException);
    }
});

/** Represents an application activity with a view that is rendered as a full page */
export class PageViewActivity extends ViewActivity {
    placement = UIRenderPlacement.PAGE;
}

/** Represents an application activity with a view that is rendered as a modal dialog */
export class DialogViewActivity extends ViewActivity {
    placement = UIRenderPlacement.DIALOG;
    modalShadeOpacity = UITheme.current.modalDialogShadeOpacity;
}

export namespace ViewActivity {
    /** View activity presets type, for use with `Component.with` */
    export interface Presets extends AppActivity.Presets {
        /** View component constructor, to be instantiated and rendered when the activity is activated */
        view?: UIRenderableConstructor;
        /** View placement mode */
        placement?: UIRenderPlacement;
        /** Modal shade backdrop opacity behind content (0-1), if supported by placement mode */
        modalShadeOpacity?: number;
        /** True if clicking outside a modal component should close it, defaults to false */
        modalShadeClickToClose?: boolean;
    }
}
