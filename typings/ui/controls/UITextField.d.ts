import { ManagedRecord } from "../../core";
import { UIControl } from "./UIControl";
export declare class UITextField extends UIControl {
    static preset(presets: UITextField.Presets): Function;
    static withName(name: string, placeholder?: string): typeof UITextField;
    style: import("../UIStyle").UIStyle;
    shrinkwrap: boolean;
    isFocusable(): boolean;
    isKeyboardFocusable(): boolean;
    formContext?: ManagedRecord;
    multiline?: boolean;
    placeholder: string;
    value: string;
    name?: string;
}
export declare let UIBorderlessTextField: typeof UITextField;
export declare namespace UITextField {
    interface Presets extends UIControl.Presets {
        multiline?: boolean;
        placeholder?: string;
        value?: string;
        name?: string;
    }
}
