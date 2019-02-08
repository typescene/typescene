import { managed, ManagedChangeEvent, ManagedRecord } from "../../core";
import { Stringable } from '../UIComponent';
import { formContextBinding } from "../UIFormContextController";
import { UITheme } from "../UITheme";
import { UIControl } from "./UIControl";

/** Represents a toggle component with an optional text label */
export class UIToggle extends UIControl {
    static preset(presets: UIToggle.Presets): Function {
        this.presetBinding("formContext", formContextBinding);
        return super.preset(presets);
    }

    /** Creates a preset toggle class with given name and label, if any */
    static withName(name: string, label?: string) {
        return this.with({ name, label });
    }

    style = UITheme.current.baseControlStyle.mixin(UITheme.current.styles["toggle"]);
    shrinkwrap = true;

    isFocusable() { return true }
    isKeyboardFocusable() { return true }

    /** Form state context, propagated from the parent composite object */
    @managed
    formContext?: ManagedRecord;

    /** Label text, if any */
    label?: Stringable;

    /** Highlight (background) color, if any */
    highlightColor?: string;

    /** Current toggle state, true for 'on' state, false for 'off' */
    state?: boolean;

    /** Form context property name */
    name?: string;
}
UIToggle.observe(class {
    constructor(public component: UIToggle) { }
    onFormContextChange() {
        if (this.component.formContext && this.component.name &&
            this.component.name in this.component.formContext) {
            let value = (this.component.formContext as any)[this.component.name];
            this.component.state = !!value;
        }
    }
    onInput() { this.onChange() }
    onChange() {
        if (this.component.formContext && this.component.name &&
            (this.component.formContext as any)[this.component.name] !== !!this.component.state) {
            (this.component.formContext as any)[this.component.name] = !!this.component.state;
            this.component.formContext.emit(ManagedChangeEvent.CHANGE);
        }
    }
});

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
