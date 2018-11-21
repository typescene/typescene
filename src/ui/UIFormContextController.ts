import { bind, Component, logUnhandledException, managed, managedChild, ManagedEvent, ManagedRecord } from "../core";
import { UIComponent, UIComponentEvent, UIComponentEventHandler, UIRenderable, UIRenderableConstructor } from "./UIComponent";
import { UIRenderableController } from "./UIRenderableController";
import { renderContextBinding, UIRenderContext } from "./UIRenderContext";

/** @internal Form state context binding, can be reused to avoid creating new bindings */
export let formContextBinding = bind("formContext");

/** Renderable wrapper that injects a form context record, to be used by (nested) child input controls. */
export class UIFormContextController extends Component implements UIRenderable {
    static preset(presets: UIFormContextController.Presets,
        content?: UIRenderableConstructor): Function {
        this.presetBinding("renderContext", renderContextBinding);

        // use this trick to add form controller as a component, BUT
        // add all bindings on the parent component (except formContext)
        this.presetActiveComponent("content", UIRenderableController.
            with({ formContext: formContextBinding }));
        let f = super.preset(presets, content);
        return function (this: UIFormContextController) {
            f.call(this);
            this.propagateChildEvents(UIComponentEvent);
            this.activateManagedAsync()
                .then(() => {
                    if (content && this.content) {
                        (this.content as any).content = new content();
                    }
                    this.render();
                })
                .catch(logUnhandledException);
        }
    }

    /** Application render context, propagated from the parent composite object */
    @managed
    renderContext?: UIRenderContext;

    /** Form state context, propagated to all child components; defaults to an empty managed record */
    @managed
    formContext = new ManagedRecord();

    /** Renderable content (wrapped), as a managed child component */
    @managedChild
    content?: UIRenderable;

    render(callback?: UIRenderContext.RenderCallback) {
        this._renderer.render(this.content, callback);
    }

    private _renderer = new UIComponent.DynamicRendererWrapper();
}

// observe to emit event when form context changes
UIFormContextController.observe(class {
    constructor(public controller: UIFormContextController) { }
    onFormContextChange(e: ManagedEvent) {
        this.controller.propagateComponentEvent("FormContextChange", e);
    }
});

export namespace UIFormContextController {
    /** UIFormStateController presets type, for use with `Component.with` */
    export interface Presets {
        /** Form state object; must be a (binding to a) managed record, see `ManagedRecord` */
        formContext?: ManagedRecord;
        /** Event handler for any change to the form state */
        onFormContextChange: UIComponentEventHandler<UIFormContextController>;
        /** Event handler for Enter key presses (ignoring Enter key presses on multiline text fields and buttons, which do not emit the EnterKeyPress event) */
        onEnterKeyPress: UIComponentEventHandler<UIFormContextController>;
    }
}
