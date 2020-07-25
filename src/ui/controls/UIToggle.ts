import { managed, ManagedEvent, onPropertyEvent, observe } from "../../core";
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
  static withName(name: string, label?: Stringable) {
    return this.with({ name, label });
  }

  constructor() {
    super();
    this.style = UITheme.getStyle("control", "toggle");
    this.shrinkwrap = true;
  }

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
  highlightColor?: Stringable;

  /** Current toggle state, true for 'on' state, false for 'off' */
  state?: boolean;

  /** Form context property name */
  name?: string;

  /** Form component (updated automatically before rendering) */
  @managed
  form?: { formContext: any };

  /** Update the input value from the current form context, if any */
  private _updateValue() {
    let ctx = this.form && (this.form.formContext as any);
    if (ctx && this.name && this.name in ctx) {
      let value = ctx[this.name];
      this.state = !!value;
    }
  }

  /** Update the form context value, if any */
  private _updateCtx() {
    let ctx = this.form && this.form.formContext;
    if (ctx && this.name && ctx[this.name] !== !!this.state) {
      ctx[this.name] = !!this.state;
      ctx.emitChange();
    }
  }

  /** @internal */
  @observe
  protected static UIToggleObserver = (() => {
    class UIToggleObserver {
      constructor(public component: UIToggle) {}
      @onPropertyEvent("form")
      handleFormUpdate(_form: any, e: ManagedEvent) {
        if (e instanceof FormContextChangeEvent) {
          this.component._updateValue();
        }
      }
      onFormChange() {
        this.component._updateValue();
      }
      onInput() {
        this.component._updateCtx();
      }
      onChange() {
        this.component._updateCtx();
      }
    }
    return UIToggleObserver;
  })();
}

export namespace UIToggle {
  /** UIToggle presets type, for use with `Component.with` */
  export interface Presets extends UIControl.Presets {
    /** Label text, if any */
    label?: Stringable;
    /** Highlight (background) color, if any */
    highlightColor?: Stringable;
    /** Toggle state */
    state?: boolean;
    /** Form state property */
    name?: string;
  }
}
