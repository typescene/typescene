import { Component, managed, managedChild } from "../core";
import { UIComponent, UIComponentEvent, UIRenderable, UIRenderableConstructor } from "./UIComponent";
import { renderContextBinding, UIRenderContext } from "./UIRenderContext";

/** Base class for a controller that wraps around a single renderable component */
export class UIRenderableController extends Component.with({
    renderContext: renderContextBinding,
}) implements UIRenderable {
    static preset(presets: object, content?: UIRenderableConstructor): Function {
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

    /** Renderable content, as a managed child reference */
    @managedChild
    content?: UIRenderable;

    render(callback?: UIRenderContext.RenderCallback) {
        this._renderer.render(this.content, callback);
    }

    private _renderer = new UIComponent.DynamicRendererWrapper();
}

// observe to re-render when content changes
UIRenderableController.observe(class {
    constructor (public readonly component: UIRenderableController) {}
    onContentChange() { this.component.render() }
});
