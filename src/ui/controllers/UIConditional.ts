import { UIRenderableConstructor } from "../UIComponent";
import { UIRenderableController } from "../UIRenderableController";
import { observe } from "../../core";

/** Encapsulates content that is added/removed asynchronously based on the value of a (bound) property */
export class UIConditional extends UIRenderableController {
  static preset(
    presets: UIConditional.Presets,
    Content?: UIRenderableConstructor
  ): Function {
    // leave out content class and instantiate independently
    this.presetBindingsFrom(Content);
    this.prototype._ConditionalContentClass = Content;
    return super.preset(presets);
  }

  /** Current condition state, content is rendered only if this is set to true */
  state?: boolean;

  // set on prototype
  private _ConditionalContentClass?: UIRenderableConstructor;

  /** @internal */
  @observe
  protected static UIConditionalObserver = class {
    constructor(public component: UIConditional) {}
    onStateChange() {
      if (
        !this.component._ConditionalContentClass ||
        !!this.component.content === !!this.component.state
      )
        return;
      this.component.content = this.component.state
        ? new this.component._ConditionalContentClass()
        : undefined;
    }
  };
}

export namespace UIConditional {
  /** UIConditional presets type, for use with `Component.with` */
  export interface Presets {
    /** Current condition state, content is rendered only if this evaluates to true */
    state?: boolean;
  }
}
