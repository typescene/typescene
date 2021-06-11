import { managed, observe } from "../../core";
import { Stringable } from "../UIComponent";
import { UITheme, UIColor } from "../UITheme";
import { UIControl } from "./UIControl";
import { formContextBinding, UIFormContext } from "../UIFormContext";

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
  }

  isFocusable() {
    return true;
  }

  isKeyboardFocusable() {
    return true;
  }

  /** Label text, if any */
  label?: Stringable;

  /** Highlight (background) color, if any */
  highlightColor?: UIColor | string;

  /** Current toggle state, true for 'on' state, false for 'off' */
  state?: boolean;

  /** Form context property name */
  name?: string;

  /** Bound form context, if any */
  @managed
  formContext?: UIFormContext;

  /** @internal */
  @observe
  protected static UIToggleObserver = (() => {
    class UIToggleObserver {
      constructor(public component: UIToggle) {}
      onFormContextChange() {
        if (this.component.formContext && this.component.name) {
          let value = this.component.formContext.get(this.component.name);
          this.component.state = !!value;
        }
      }
      onStateChange() {
        this.component.formContext?.set(this.component.name, this.component.state, true);
      }
    }
    return UIToggleObserver;
  })();
}

UIToggle.presetBinding("formContext", formContextBinding);

export namespace UIToggle {
  /** UIToggle presets type, for use with `Component.with` */
  export interface Presets extends UIControl.Presets {
    /** Label text, if any */
    label?: Stringable;
    /** Highlight (background) color, if any */
    highlightColor?: UIColor | string;
    /** Toggle state */
    state?: boolean;
    /** Form state property */
    name?: string;
  }
}
