import { Component, ManagedRecord } from "../core";
import { UIRenderable, UIRenderableConstructor } from "./UIComponent";
import { UIRenderContext } from "./UIRenderContext";
/** Base class for a controller that wraps around a single renderable component */
export declare class UIRenderableController extends Component {
    static preset(presets: object, content?: UIRenderableConstructor): Function;
    /** Create a new controller with given content */
    constructor(content?: UIRenderable);
    /** Application render context, propagated from the parent composite object */
    renderContext?: UIRenderContext;
    /** Form state context, propagated from the parent composite object */
    formContext?: ManagedRecord;
    /** Renderable content, as a managed child reference */
    content?: UIRenderable;
    render(callback: UIRenderContext.RenderCallback): void;
}
