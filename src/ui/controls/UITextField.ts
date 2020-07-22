import { managed, ManagedEvent, onPropertyEvent, observe } from "../../core";
import { FormContextChangeEvent, UIForm } from "../containers";
import { Stringable } from "../UIComponent";
import { UIRenderContext } from "../UIRenderContext";
import { UITheme } from "../UITheme";
import { UIControl } from "./UIControl";

/** Represents a text field component */
export class UITextField extends UIControl {
  static preset(presets: UITextField.Presets): Function {
    // quietly change 'text' to placeholder to support JSX tag content
    if ("text" in (presets as any)) presets.placeholder = (presets as any).text;

    return super.preset(presets);
  }

  /** Creates a preset text field class with given name and placeholder, if any */
  static withName(name: string, placeholder?: Stringable) {
    return this.with({ name, placeholder });
  }

  constructor() {
    super();
    this.style = UITheme.current.baseControlStyle.mixin(
      UITheme.current.styles["textfield"]
    );
    this.shrinkwrap = false;
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

  /** Input type as string, defaults to `text` */
  type: UITextField.InputType | string = "text";

  /** Set to true to enable multiline input; also suppresses the EnterKeyPress event */
  multiline?: boolean;

  /** Placeholder text */
  placeholder?: Stringable;

  /** Input value */
  value?: string;

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
      this.value = value === undefined ? "" : String(value);
    }
  }

  /** Update the form context value, if any */
  private _updateCtx() {
    let ctx = this.form && this.form.formContext;
    if (ctx && this.name) {
      let value: any = this.value;
      let oldValue = ctx[this.name];
      if (typeof oldValue === "number" && this.type === "number") {
        value = parseFloat(value);
      }
      if (oldValue !== value) {
        ctx[this.name] = value;
        ctx.emitChange();
      }
    }
  }

  /** @internal */
  @observe
  protected static UITextFieldObserver = (() => {
    class UITextFieldObserver {
      constructor(public component: UITextField) {}
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
    return UITextFieldObserver;
  })();
}

/** Shortcut for `UITextField` constructor preset with the `textfield_borderless` style set */
export let UIBorderlessTextField = UITextField.with({ style: "textfield_borderless" });

export namespace UITextField {
  /** UITextField presets type, for use with `Component.with` */
  export interface Presets extends UIControl.Presets {
    /** Input type as string, defaults to `text` */
    type?: InputType | string;
    /** Set to true to enable multiline input */
    multiline?: boolean;
    /** Placeholder text */
    placeholder?: Stringable;
    /** Input value */
    value?: Stringable;
    /** Form state property */
    name?: string;
  }

  /** Standardized input type names */
  export type InputType = "text" | "password" | "number" | "date" | "color";
}
