import { observe, managed } from "../../core";
import { Stringable } from "../UIComponent";
import { UITheme } from "../UITheme";
import { UIControl } from "./UIControl";
import { formContextBinding, UIFormContext } from "../UIFormContext";

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
    this.style = UITheme.getStyle("control", "textfield");
    this.shrinkwrap = false;
  }

  isFocusable() {
    return true;
  }

  isKeyboardFocusable() {
    return true;
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

  /** Action name that is displayed on the 'enter' key on some devices */
  enterKeyHint?: UITextField.EnterKeyHintType;

  /** Bound form context, if any */
  @managed
  formContext?: UIFormContext;

  /** @internal */
  @observe
  protected static UITextFieldObserver = (() => {
    class UITextFieldObserver {
      constructor(public component: UITextField) {}
      onFormContextChange() {
        if (this.component.formContext && this.component.name) {
          let value = this.component.formContext.get(this.component.name);
          this.component.value = value === undefined ? "" : String(value);
        }
      }
      onInput() {
        this.component.formContext?.set(this.component.name, this.component.value);
      }
      onChange() {
        this.component.formContext?.set(this.component.name, this.component.value, true);
      }
    }
    return UITextFieldObserver;
  })();
}

UITextField.presetBinding("formContext", formContextBinding);

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
    /** Action name that is displayed on the 'enter' key on some devices */
    enterKeyHint?: UITextField.EnterKeyHintType;
  }

  /** Standardized input type names */
  export type InputType = "text" | "password" | "number" | "date" | "color";

  /** Action names that are displayed on the 'enter' key on some devices */
  export type EnterKeyHintType =
    | "enter"
    | "done"
    | "go"
    | "next"
    | "previous"
    | "search"
    | "send";
}
