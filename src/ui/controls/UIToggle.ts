import { managed, ManagedChangeEvent } from "../../core";
import { Stringable } from '../UIComponent';
import { UIFormContextController } from "../UIFormContextController";
import { UIRenderContext } from '../UIRenderContext';
import { UITheme } from "../UITheme";
import { UIControl } from "./UIControl";

/** Represents a toggle component with an optional text label */
export class UIToggle extends UIControl {
    static preset(presets: UIToggle.Presets): Function {
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

    render(callback: UIRenderContext.RenderCallback) {
        // update form context controller reference
        let controller = this.getParentComponent(UIFormContextController);
        this.formContextController = controller;
        super.render(callback);
    }

    /** Form context controller (parent component, if any; updated before rendering) */
    @managed
    formContextController?: UIFormContextController;

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
    onFormContextControllerChange() {
        let ctx: any = this.component.formContextController &&
            this.component.formContextController.formContext;
        if (ctx && this.component.name && this.component.name in ctx) {
            let value = ctx[this.component.name];
            this.component.state = !!value;
        }
    }
    onInput() { this.onChange() }
    onChange() {
        let ctx: any = this.component.formContextController &&
            this.component.formContextController.formContext;
        if (ctx && this.component.name &&
            ctx[this.component.name] !== !!this.component.state) {
            ctx[this.component.name] = !!this.component.state;
            ctx.emit(ManagedChangeEvent.CHANGE);
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
