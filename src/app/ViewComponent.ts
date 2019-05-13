import { logUnhandledException, managed, managedChild, ManagedRecord, ManagedState } from "../core";
import { formContextBinding, UIComponent, UIComponentEvent, UIRenderable, UIRenderableConstructor, UIRenderContext } from "../ui";
import { AppComponent } from "./AppComponent";
import { ViewActivity } from "./ViewActivity";

/**
 * Represents an application component that encapsulates a view made up of UI components (or other renderable components, such as nested `ViewComponent` instances).
 * The encapsulated view is created the first time this component is rendered. After that, all UI events are propagated from the encapsulated view to the `ViewComponent` instance.
 * @note This class is similar in functionality to `ViewActivity`, but `ViewComponent` views are created immediately, whereas view activities need to be activated first before their views are created.
 */
export class ViewComponent extends AppComponent implements UIRenderable {
    static preset(presets: object,
        View?: UIRenderableConstructor): Function {
        this.presetBinding("formContext", formContextBinding);
        if (View) this.presetActiveComponent("view", View, ViewActivity);
        return super.preset(presets);
    }

    /** Form state context, propagated from the parent composite object */
    @managed
    formContext?: ManagedRecord;

    /** The root component that makes up the content for this view, as a child component; only created when the `ViewComponent` is rendered */
    @managedChild
    view?: UIRenderable;

    async onManagedStateActivatingAsync() {
        super.onManagedStateActivatingAsync();
        this.propagateChildEvents(UIComponentEvent);
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
        }
        else if (!this.renderContext) {
            // something is wrong: not a child component
            throw Error("[ViewComponent] Render context not found (not a child component?)");
        }
        else {
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
ViewComponent.observe(class {
    constructor (public component: ViewComponent) { }
    async onRenderContextChange(ctx: UIRenderContext) {
        if (ctx) this.component.render();
        else this.component.removeViewAsync(true).catch(logUnhandledException);
    }
});

export namespace ViewComponent {
    /** Shortcut type for declaring a static `preset` method which accepts an object with presets with the same type as given properties of the view component itself */
    export type PresetFor<TComponent, K extends keyof TComponent> = (presets: TComponent | Pick<TComponent, K>) => Function;
}
