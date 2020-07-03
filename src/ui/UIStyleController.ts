import { ComponentConstructor } from "../core";
import { UIComponent } from "./UIComponent";
import { UIRenderableController } from "./UIRenderableController";
import { UIStyle } from "./UIStyle";

/** Renderable wrapper that controls the style of its single content component, by applying one of the given styles based on the current value of a property */
export class UIStyleController extends UIRenderableController {
  static preset(
    presets: UIStyleController.Presets,
    content?: ComponentConstructor & { new (): UIComponent }
  ): Function {
    return super.preset(presets, content);
  }

  /** Currently selected style (string index into `UIStyleController.styles` object) */
  state?: string;

  /** Available styles to be applied to the content component (plain object) */
  styles: { [name: string]: UIStyle } = {};

  /** Base style (taken from the content component right after it is assigned to the `content` property) */
  baseStyle?: UIStyle;
}
UIStyleController.addObserver(
  class {
    constructor(public controller: UIStyleController) {}
    onContentChange() {
      if (this.controller.content instanceof UIComponent) {
        this.controller.baseStyle = this.controller.content.style;
        this.onStateChange();
      }
    }
    onStateChange() {
      if (this.controller.content instanceof UIComponent) {
        let baseStyle = this.controller.baseStyle;
        let style = this.controller.styles[String(this.controller.state)];
        let toApply = baseStyle && (style ? baseStyle.mixin(style) : baseStyle);
        if (toApply) this.controller.content.style = toApply;
      }
    }
  }
);

export namespace UIStyleController {
  /** UIStyleController presets type, for use with `Component.with` */
  export interface Presets {
    /** Currently selected style (string index into `UIStyleController.styles` object, typically bound to a property on the composite component) */
    state?: string;
    /** Available styles to be applied to the content component (plain object) */
    styles: { [name: string]: UIStyle };
  }
}
