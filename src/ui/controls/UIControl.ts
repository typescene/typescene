import { Binding } from "../../core";
import { UIComponent, UIComponentEventHandler } from "../UIComponent";
import { UIStyle } from "../UIStyle";

/** Represents an interactive UI control component (abstract) */
export abstract class UIControl extends UIComponent {
  static preset(presets: UIControl.Presets): Function {
    let decoration = presets.decoration;
    let textStyle = presets.textStyle;
    delete presets.decoration;
    delete presets.textStyle;
    let origDecoration: Readonly<UIStyle.Decoration>;
    let origTextStyle: Readonly<UIStyle.TextStyle>;
    if (Binding.isBinding(decoration)) {
      (this as any).presetBinding("decoration", decoration, function (
        this: UIControl,
        v: any
      ) {
        this.decoration = v ? { ...origDecoration!, ...v } : origDecoration;
      });
      decoration = undefined;
    }
    if (Binding.isBinding(textStyle)) {
      (this as any).presetBinding("textStyle", textStyle, function (
        this: UIControl,
        v: any
      ) {
        this.textStyle = v ? { ...origTextStyle!, ...v } : origTextStyle;
      });
      textStyle = undefined;
    }
    let f = super.preset(presets);
    return function (this: UIControl) {
      f.call(this);
      if (decoration) this.decoration = { ...this.decoration, ...decoration };
      else origDecoration = this.decoration;
      if (textStyle) this.textStyle = { ...this.textStyle, ...textStyle };
      else origTextStyle = this.textStyle;
    };
  }

  protected applyStyle(style?: UIStyle) {
    if (!style) return;
    super.applyStyle(style);
    this.decoration = style.getStyles().decoration;
    this.textStyle = style.getStyles().textStyle;
  }

  /** Text style options */
  textStyle!: Readonly<UIStyle.TextStyle>;

  /** Options for the appearance of this control */
  decoration!: Readonly<UIStyle.Decoration>;

  /** Set to true to disable this control */
  disabled?: boolean;

  /** Set to true to shrink this element to use as little space as possible within its container, set to false to expand; defaults to true but may be overridden by individual components, e.g. `UILabel` (also overrides `grow` property of `UIComponent.dimensions`) */
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
