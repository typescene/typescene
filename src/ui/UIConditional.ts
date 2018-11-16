import { UIRenderableConstructor } from "./UIComponent";
import { UIRenderableController } from "./UIRenderableController";
import { UIRenderContext } from "./UIRenderContext";

/** Encapsulates content that is added/removed asynchronously based on the value of a (bound) property */
export class UIConditional extends UIRenderableController {
    static preset(presets: UIConditional.Presets, content?: UIRenderableConstructor): Function {
        this.presetBindingsFrom(content);
        let f = super.preset(presets);
        return function (this: UIConditional) {
            f.call(this);
            (this as any).ContentConstructor = content;
        }
    }

    /** Content component constructor (read only) */
    readonly ContentConstructor?: UIRenderableConstructor;

    /** Current condition state, content is rendered only if this evaluates to true */
    state?: boolean;

    /** Render the conditional component, if any. */
    render(callback?: UIRenderContext.RenderCallback) {
        if (!this.content) {
            // do not attempt to render but keep callback
            if (this._renderCallback) this._renderCallback(undefined);
            if (callback) this._renderCallback = callback;
            return;
        }
        if (callback && callback !== this._renderCallback) {
            if (this._renderCallback) this._renderCallback(undefined);
            this._renderCallback = callback;
        }
        if (this._renderCallback) {
            let renderProxy: UIRenderContext.RenderCallback = (output, afterRender) => {
                this._renderCallback = this._renderCallback!(output, afterRender);
                return renderProxy;
            };
            this.content.render(renderProxy);
        }
    }

    private _renderCallback?: UIRenderContext.RenderCallback;
}
UIConditional.observe(class {
    constructor(public component: UIConditional) { }
    onStateChange() {
        if (!this.component.ContentConstructor ||
            !!this.component.content === !!this.component.state) return;
        this.component.content = this.component.state ?
            new this.component.ContentConstructor() :
            undefined;
    }
    on_ContentConstructorChange() {
        this.onStateChange();
    }
    onContentChange() {
        this.component.render();
    }
});

export namespace UIConditional {
    /** UIConditional presets type, for use with `Component.with` */
    export interface Presets {
        /** Current condition state, content is rendered only if this evaluates to true */
        state?: boolean;
    }
}
