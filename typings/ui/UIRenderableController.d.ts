import { Component, ManagedRecord } from "../core";
import { UIRenderable, UIRenderableConstructor } from "./UIComponent";
import { UIRenderContext } from "./UIRenderContext";
export declare class UIRenderableController extends Component {
    static preset(presets: object, content?: UIRenderableConstructor): Function;
    constructor(content?: UIRenderable);
    renderContext?: UIRenderContext;
    formContext?: ManagedRecord;
    content?: UIRenderable;
    render(callback: UIRenderContext.RenderCallback): void;
}
