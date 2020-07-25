import { Binding } from "../../core";
import { UIComponent, UIComponentEventHandler } from "../UIComponent";
import { UIStyle } from "../UIStyle";

/** Represents a UI component that the user can interact with (abstract) */
export abstract class UIControl extends UIComponent {
  static preset(presets: UIControl.Presets): Function {
    let decoration = presets.decoration;
    let textStyle = presets.textStyle;
    delete presets.decoration;
    delete presets.textStyle;
    if (Binding.isBinding(decoration)) {
      (this as any).presetBinding(
        "decoration",
        decoration,
        UIControl.prototype.applyDecoration
      );
      decoration = undefined;
    }
    if (Binding.isBinding(textStyle)) {
      (this as any).presetBinding(
        "textStyle",
        textStyle,
        UIControl.prototype.applyTextStyle
      );
      textStyle = undefined;
    }
    let f = super.preset(presets);
    return function (this: UIControl) {
      f.call(this);
      if (decoration) this.decoration = { ...this.decoration, ...decoration };
      if (textStyle) this.textStyle = { ...this.textStyle, ...textStyle };
    };
  }

  protected applyStyle(style: UIStyle) {
    super.applyStyle(style);
    this.decoration = style.getStyles().decoration;
    this.textStyle = style.getStyles().textStyle;
  }

  /** Apply properties from given object on top of the default `decoration` properties from the current style set */
  protected applyDecoration(decoration: Partial<UIStyle.Decoration>) {
    let result = this.style.getOwnStyles().decoration;
    this.decoration = { ...result, ...decoration };
  }

  /** Apply properties from given object on top of the default `textStyle` properties from the current style set */
  protected applyTextStyle(textStyle: Partial<UIStyle.TextStyle>) {
    let result = this.style.getOwnStyles().textStyle;
    this.textStyle = { ...result, ...textStyle };
  }

  /** Text style options */
  textStyle!: UIStyle.TextStyle;

  /** Options for the appearance of this control */
  decoration!: UIStyle.Decoration;

  /** Set to true to disable this control */
  disabled?: boolean;

  /** Set to true to shrink this element to use as little space as possible within its container, set to false to expand; defaults to true but may be overridden by individual components (also overrides `grow` property of `UIComponent.dimensions`) */
  shrinkwrap = true;
}

export namespace UIControl {
  /** UIControl presets type, for use with `Component.with` */
  export interface Presets extends UIComponent.Presets {
    /** Text style options (overrides) */
    textStyle?: Partial<UIStyle.TextStyle | {}>;
    /** Options for the appearance of this control (overrides) */
    decoration?: Partial<UIStyle.Decoration | {}>;
    /** Disable this control */
    disabled?: boolean;
    /** Shrink or grow this control */
    shrinkwrap?: boolean;

    // control element event handlers
    onChange?: UIComponentEventHandler<UIControl>;
    onInput?: UIComponentEventHandler<UIControl>;
    onCopy?: UIComponentEventHandler<UIControl>;
    onCut?: UIComponentEventHandler<UIControl>;
    onPaste?: UIComponentEventHandler<UIControl>;
  }
}
