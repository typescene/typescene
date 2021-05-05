import { ComponentConstructor } from "../../core";
import { UICell, UIContainer } from "../containers";
import { UIControl } from "../controls";
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
    private _initial = true;
    onContentChange() {
      let content = this.controller.content;
      if (content instanceof UIComponent) {
        let baseStyle = content.style;
        let overrides: Partial<UIStyle.StyleObjects> = Object.create(null);
        let overridden = 0;
        if (UIStyle.isStyleOverride(content.dimensions, baseStyle)) {
          overrides.dimensions = content.dimensions;
          overridden++;
        }
        if (UIStyle.isStyleOverride(content.position, baseStyle)) {
          overrides.position = content.position;
          overridden++;
        }
        if (content instanceof UIContainer) {
          if (UIStyle.isStyleOverride(content.layout, baseStyle)) {
            overrides.containerLayout = content.layout;
            overridden++;
          }
          if (content instanceof UICell) {
            if (UIStyle.isStyleOverride(content.decoration, baseStyle)) {
              overrides.decoration = content.decoration;
              overridden++;
            }
          }
        }
        if (content instanceof UIControl) {
          if (UIStyle.isStyleOverride(content.decoration, baseStyle)) {
            overrides.decoration = content.decoration;
            overridden++;
          }
          if (UIStyle.isStyleOverride(content.textStyle, baseStyle)) {
            overrides.textStyle = content.textStyle;
            overridden++;
          }
        }
        this.controller.baseStyle = overridden ? baseStyle.extend(overrides) : baseStyle;
        this.onStateChange();
      }
    }
    onStateChange() {
      let controller = this.controller;
      if (!controller.baseStyle) return;
      if (controller.content instanceof UIComponent) {
        let baseStyle = controller.baseStyle;
        let style = controller.styles?.[String(controller.state)];
        if (!style && controller.state) style = controller.style;
        if (typeof style === "string") style = UITheme.getStyle(style);
        if (style instanceof UIStyle) {
          this._initial = false;
          controller.content.style = baseStyle.mixin(style);
        } else if (!this._initial) {
          controller.content.style = baseStyle;
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
