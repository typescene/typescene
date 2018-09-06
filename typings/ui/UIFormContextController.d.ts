import { Component, ManagedRecord } from "../core";
import { UIComponentEventHandler, UIRenderable, UIRenderableConstructor } from "./UIComponent";
import { UIRenderContext } from "./UIRenderContext";
/** @internal Form state context binding, can be reused to avoid creating new bindings */
export declare let formContextBinding: import("../core/Binding").Binding;
/** Renderable wrapper that injects a form context record, to be used by (nested) child input controls. */
export declare class UIFormContextController extends Component {
    static preset(presets: UIFormContextController.Presets, content?: UIRenderableConstructor): Function;
    /** Application render context, propagated from the parent composite object */
    renderContext?: UIRenderContext;
    /** Form state context, propagated to all child components; defaults to an empty managed record */
    formContext: ManagedRecord;
    /** Renderable content (wrapped), as a managed child component */
    content?: UIRenderable;
    render(callback?: UIRenderContext.RenderCallback): void;
    private _lastRenderCallback?;
}
export declare namespace UIFormContextController {
    /** UIFormStateController presets type, for use with `Component.with` */
    interface Presets {
        /** Form state object; must be a (binding to a) managed record, see `ManagedRecord` */
        formContext?: ManagedRecord;
        /** Event handler for any change to the form state */
        onFormContextChange: UIComponentEventHandler<UIFormContextController>;
        /** Event handler for Enter key presses (ignoring Enter key presses on multiline text fields and buttons, which do not emit the EnterKeyPress event) */
        onEnterKeyPress: UIComponentEventHandler<UIFormContextController>;
    }
}
