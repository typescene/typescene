import { ManagedEvent } from "../core";
import { UIComponent, UIRenderable, UIRenderableConstructor, UIRenderContext, UIRenderPlacement } from "../ui";
import { AppActivity } from "./AppActivity";
/**
 * Represents an application activity with content that can be rendered when activated.
 * @note This class is similar to `ViewComponent`, but has additional functionality to allow it to be used as an application activity (derived from `AppActivity`).
 */
export declare class ViewActivity extends AppActivity {
    static preset(presets: ViewActivity.Presets, View?: UIRenderableConstructor): Function;
    /** Create a new inactive view activity with given name and path */
    constructor(name?: string, path?: string);
    /** The root component that makes up the content for this view, as a child component */
    view?: UIRenderable;
    /** @internal Recreate view instance (defined on prototype) */
    ["@resetView"](): void;
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
    render(callback?: UIRenderContext.RenderCallback): void;
    /**
     * Remove the view output that was rendered by `ViewActivity.render`, if any.
     * This method is called automatically after the root view component or render context is removed, and should not be called directly.
     */
    removeViewAsync(): Promise<any>;
    /** @internal Checks if component can be activated and rendered (shared with `ViewComponent`) */
    protected _activateOnRender(): boolean;
    /** Request input focus on the last (or first) focused UI component, if any */
    restoreFocus(firstFocused?: boolean): void;
    /** The UI component that was focused first, if any */
    firstFocused?: UIComponent;
    /** The UI component that was most recently focused, if any */
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
    showDialogAsync(View: UIRenderableConstructor, modalShadeClickToClose?: boolean, eventHandler?: (this: DialogViewActivity, e: ManagedEvent) => void): Promise<ViewActivity>;
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
    showConfirmationDialogAsync(message: string | string[], title?: string, confirmButtonLabel?: string, cancelButtonLabel?: string): Promise<boolean>;
    private _renderCallback?;
}
/** Represents an application activity with a view that is rendered as a full page */
export declare class PageViewActivity extends ViewActivity {
    placement: UIRenderPlacement;
}
/** Represents an application activity with a view that is rendered as a modal dialog */
export declare class DialogViewActivity extends ViewActivity {
    placement: UIRenderPlacement;
    modalShadeOpacity: number;
}
export declare namespace ViewActivity {
    /** View activity presets type, for use with `Component.with` */
    interface Presets extends AppActivity.Presets {
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
