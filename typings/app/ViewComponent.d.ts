import { ManagedRecord } from "../core";
import { UIRenderable, UIRenderableConstructor, UIRenderContext } from "../ui";
import { AppComponent } from "./AppComponent";
/**
 * Represents a application component that encapsulates and renders its view made up of UI components (or other renderable components, e.g. `ViewComponent` instances).
 * The encapsulated view is only created the first time this component is rendered. After that, all UI component events are propagated from the encapsulated view to the `ViewComponent` instance.
 * @note This class is similar in functionality to `ViewActivity`, but view _activities_ can be added to an application and activated using its activation context (router). View components can only be used as child components of other view components, UI components, or as a child component of a view activity.
 */
export declare class ViewComponent extends AppComponent {
    static preset(presets: object, View?: UIRenderableConstructor): Function;
    /** Form state context, propagated from the parent composite object */
    formContext?: ManagedRecord;
    /** The root component that makes up the content for this view, as a child component; this component is only created when it is first rendered */
    view?: UIRenderable;
    onManagedStateActivatingAsync(): Promise<void>;
    /**
     * Render the encapsulated view for this component.
     * This method is called automatically after the root view component is created and/or when an application render context is made available or emits a change event, and should not be called directly.
     */
    render(callback?: UIRenderContext.RenderCallback): void;
    /**
     * Remove the current view output, if any.
     * This method is called automatically after the root view component or render context is removed, and should not be called directly.
     */
    removeViewAsync(deactivate?: boolean): Promise<{} | undefined>;
    /** @internal Checks if component can be activated and rendered */
    protected _activateOnRender(): void;
    private _renderCallback?;
}
export declare namespace ViewComponent {
    /** Shortcut type for declaring a static `preset` method which accepts an object with presets with the same type as given properties of the view component itself */
    type PresetFor<TComponent, K extends keyof TComponent> = (presets: TComponent | Pick<TComponent, K>) => Function;
}
