import { ManagedRecord } from "../../core";
import { UIControl } from "./UIControl";
/** Represents a text field component */
export declare class UITextField extends UIControl {
    static preset(presets: UITextField.Presets): Function;
    /** Creates a preset text field class with given name and placeholder, if any */
    static withName(name: string, placeholder?: string): typeof UITextField;
    style: import("../UIStyle").UIStyle;
    shrinkwrap: boolean;
    isFocusable(): boolean;
    isKeyboardFocusable(): boolean;
    /** Form state context, propagated from the parent composite object */
    formContext?: ManagedRecord;
    /** Set to true to enable multiline input; also suppresses the EnterKeyPress event */
    multiline?: boolean;
    /** Placeholder text */
    placeholder: string;
    /** Input value */
    value: string;
    /** Form context property name */
    name?: string;
}
/** Shortcut for `UITextField` constructor preset with the `textfield_borderless` style set */
export declare let UIBorderlessTextField: typeof UITextField;
export declare namespace UITextField {
    /** UITextField presets type, for use with `Component.with` */
    interface Presets extends UIControl.Presets {
        /** Set to true to enable multiline input */
        multiline?: boolean;
        /** Placeholder text */
        placeholder?: string;
        /** Input value */
        value?: string;
        /** Form state property */
        name?: string;
    }
}
