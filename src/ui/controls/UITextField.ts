import { managed, ManagedChangeEvent, ManagedRecord } from "../../core";
import { formContextBinding } from "../UIFormContextController";
import { UITheme } from "../UITheme";
import { UIControl } from "./UIControl";

/** Represents a text field component */
export class UITextField extends UIControl {
    static preset(presets: UITextField.Presets): Function {
        this.presetBinding("formContext", formContextBinding);
        return super.preset(presets);
    }

    /** Creates a preset text field class with given name and placeholder, if any */
    static withName(name: string, placeholder?: string) {
        return this.with({ name, placeholder });
    }

    style = UITheme.current.baseControlStyle.mixin(UITheme.current.styles["textfield"]);
    shrinkwrap = false;

    isFocusable() { return true }
    isKeyboardFocusable() { return true }

    /** Form state context, propagated from the parent composite object */
    @managed
    formContext?: ManagedRecord;

    /** Input type as string, defaults to `text` */
    type: UITextField.InputType | string = "text";

    /** Set to true to enable multiline input; also suppresses the EnterKeyPress event */
    multiline?: boolean;

    /** Placeholder text */
    placeholder = "";

    /** Input value */
    value = "";

    /** Form context property name */
    name?: string;
}
UITextField.observe(class {
    constructor(public component: UITextField) { }
    onFormContextChange() {
        if (this.component.formContext && this.component.name &&
            this.component.name in this.component.formContext) {
            let value = (this.component.formContext as any)[this.component.name];
            this.component.value = value === undefined ? "" : String(value);
        }
    }
    onInput() { this.onChange() }
    onChange() {
        if (this.component.formContext && this.component.name &&
            (this.component.formContext as any)[this.component.name] !== this.component.value) {
            (this.component.formContext as any)[this.component.name] = this.component.value;
            this.component.formContext.emit(ManagedChangeEvent.CHANGE);
        }
    }
});

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
        placeholder?: string;
        /** Input value */
        value?: string;
        /** Form state property */
        name?: string;
    }

    /** Standardized input type names */
    export type InputType = "text" | "password" | "number" | "date" | "color";
}
