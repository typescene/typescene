import { UIRenderableConstructor } from "./UIComponent";
import { UIRenderableController } from "./UIRenderableController";

/** Encapsulates content that is added/removed asynchronously based on the value of a (bound) property */
export class UIConditional extends UIRenderableController {
  static preset(
    presets: UIConditional.Presets,
    content?: UIRenderableConstructor
  ): Function {
    this.presetBindingsFrom(content);
    let f = super.preset(presets);
    return function (this: UIConditional) {
      f.call(this);
      (this as any).ContentConstructor = content;
    };
  }

  /** Content component constructor (read only) */
  readonly ContentConstructor?: UIRenderableConstructor;

  /** Current condition state, content is rendered only if this is set to true */
  state?: boolean;
}

// observe to set/unset content reference when state changes
UIConditional.addObserver(
  class {
    constructor(public component: UIConditional) {}
    onStateChange() {
      if (
        !this.component.ContentConstructor ||
        !!this.component.content === !!this.component.state
      )
        return;
      this.component.content = this.component.state
        ? new this.component.ContentConstructor()
        : undefined;
    }
    on_ContentConstructorChange() {
      this.onStateChange();
    }
  }
);

export namespace UIConditional {
  /** UIConditional presets type, for use with `Component.with` */
  export interface Presets {
    /** Current condition state, content is rendered only if this evaluates to true */
    state?: boolean;
  }
}
