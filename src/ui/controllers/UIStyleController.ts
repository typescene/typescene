import { ComponentConstructor } from "../../core";
import { UIComponent } from "../UIComponent";
import { UIRenderableController } from "../UIRenderableController";
import { UIStyle } from "../UIStyle";
import { UITheme } from "../UITheme";

/** Renderable wrapper that controls the style of its single content component, by applying one of the given styles based on the current value of a property */
export class UIStyleController extends UIRenderableController {
  static preset(
    presets: UIStyleController.Presets,
    content?: ComponentConstructor<UIComponent> & (new () => UIComponent)
  ): Function {
    return super.preset(presets, content);
  }

  /** Currently selected style (string index into `UIStyleController.styles` object, or true to apply the single `style` object) */
  state?: string | boolean;

  /** Style that is applied if the current `state` is not false or undefined */
  style?: UIStyle | string;

  /** Available styles to be applied to the content component (plain object) */
  styles?: { [name: string]: UIStyle | string | undefined };

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
      if (!this.controller.baseStyle) return;
      if (this.controller.content instanceof UIComponent) {
        let baseStyle = this.controller.baseStyle;
        let style = this.controller.styles?.[String(this.controller.state)];
        if (!style && this.controller.state) style = this.controller.style;
        if (typeof style === "string") style = UITheme.getStyle(style);
        if (style instanceof UIStyle) {
          this.controller.content.style = baseStyle.mixin(style);
        } else {
          this.controller.content.style = baseStyle;
        }
      }
    }
  }
);

export namespace UIStyleController {
  /** UIStyleController presets type, for use with `Component.with` */
  export interface Presets {
    /** Currently selected style (string index into `UIStyleController.styles` object; or `true` to apply the single `style` object) */
    state?: string | boolean;
    /** Style that is applied if the current `state` is not false or undefined */
    style?: UIStyle | string;
    /** Available styles to be applied to the content component (plain object) */
    styles: { [name: string]: UIStyle | string };
  }
}
