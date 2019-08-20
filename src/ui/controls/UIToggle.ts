import { CHANGE, managed, ManagedEvent, onPropertyEvent } from "../../core";
import { FormContextChangeEvent, UIForm } from "../containers";
import { Stringable } from "../UIComponent";
import { UIRenderContext } from "../UIRenderContext";
import { UITheme } from "../UITheme";
import { UIControl } from "./UIControl";

/** Represents a toggle component with an optional text label */
export class UIToggle extends UIControl {
  static preset(presets: UIToggle.Presets): Function {
    // quietly change 'text' to label to support JSX tag content
    if ("text" in (presets as any)) presets.label = (presets as any).text;

    return super.preset(presets);
  }

  /** Creates a preset toggle class with given name and label, if any */
  static withName(name: string, label?: string) {
    return this.with({ name, label });
  }

  style = UITheme.current.baseControlStyle.mixin(UITheme.current.styles["toggle"]);
  shrinkwrap = true;

  isFocusable() {
    return true;
  }

  isKeyboardFocusable() {
    return true;
  }

  render(callback: UIRenderContext.RenderCallback) {
    // update form context controller reference
    this.form = UIForm.find(this);
    super.render(callback);
  }

  /** Label text, if any */
  label?: Stringable;

  /** Highlight (background) color, if any */
  highlightColor?: string;

  /** Current toggle state, true for 'on' state, false for 'off' */
  state?: boolean;

  /** Form context property name */
  name?: string;

  /** Form component (updated automatically before rendering) */
  @managed
  form?: { formContext: any };
}
class UIToggleObserver {
  constructor(public component: UIToggle) {}
  @onPropertyEvent("form")
  handleFormUpdate(_form: any, e: ManagedEvent) {
    if (e instanceof FormContextChangeEvent) {
      let ctx = e.formContext as any;
      if (ctx && this.component.name && this.component.name in ctx) {
        let value = ctx[this.component.name];
        this.component.state = !!value;
      }
    }
  }
  onInput() {
    this.onChange();
  }
  onChange() {
    let ctx = this.component.form && this.component.form.formContext;
    if (ctx && this.component.name && ctx[this.component.name] !== !!this.component.state) {
      ctx[this.component.name] = !!this.component.state;
      ctx.emit(CHANGE);
    }
  }
}
UIToggle.observe(UIToggleObserver);

export namespace UIToggle {
  /** UIToggle presets type, for use with `Component.with` */
  export interface Presets extends UIControl.Presets {
    /** Label text, if any */
    label?: Stringable;
    /** Highlight (background) color, if any */
    highlightColor?: string;
    /** Toggle state */
    state?: boolean;
    /** Form state property */
    name?: string;
  }
}
