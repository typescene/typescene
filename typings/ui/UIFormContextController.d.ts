import { Component, ManagedRecord } from "../core";
import { UIComponentEventHandler, UIRenderable, UIRenderableConstructor } from "./UIComponent";
import { UIRenderContext } from "./UIRenderContext";
export declare class UIFormContextController extends Component {
    static preset(presets: UIFormContextController.Presets, content?: UIRenderableConstructor): Function;
    renderContext?: UIRenderContext;
    formContext: ManagedRecord;
    content?: UIRenderable;
    render(callback?: UIRenderContext.RenderCallback): void;
    private _lastRenderCallback?;
}
export declare namespace UIFormContextController {
    interface Presets {
        formContext?: ManagedRecord;
        onFormContextChange: UIComponentEventHandler<UIFormContextController>;
        onEnterKeyPress: UIComponentEventHandler<UIFormContextController>;
    }
}
