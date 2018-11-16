import { Component, managed, managedChild, ManagedRecord } from "../core";
import { UIComponentEvent, UIRenderable, UIRenderableConstructor } from "./UIComponent";
import { formContextBinding } from "./UIFormContextController";
import { renderContextBinding, UIRenderContext } from "./UIRenderContext";

/** Base class for a controller that wraps around a single renderable component */
export class UIRenderableController extends Component {
    static preset(presets: object, content?: UIRenderableConstructor): Function {
        this.presetBinding("renderContext", renderContextBinding);
        this.presetBinding("formContext", formContextBinding);
        let f = super.preset(presets, content);
        return function (this: UIRenderableController) {
            f.call(this);
            if (content) this.content = new content();
        }
    }

    /** Create a new controller with given content */
    constructor(content?: UIRenderable) {
        super();
        this.content = content;
        this.propagateChildEvents(UIComponentEvent);
    }

    /** Application render context, propagated from the parent composite object */
    @managed
    renderContext?: UIRenderContext;

    /** Form state context, propagated from the parent composite object */
    @managed
    formContext?: ManagedRecord;

    /** Renderable content, as a managed child reference */
    @managedChild
    content?: UIRenderable;

    render(callback: UIRenderContext.RenderCallback) {
        if (this.content) this.content.render(callback);
    }
}
