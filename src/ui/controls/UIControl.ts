import { Binding } from "../../core";
import { UIComponent, UIComponentEventHandler } from "../UIComponent";
import { UIStyle } from "../UIStyle";

/** Represents a UI component that the user can interact with (abstract) */
export abstract class UIControl extends UIComponent {
    static preset(presets: UIControl.Presets): Function {
        let controlStyle = presets.controlStyle;
        let textStyle = presets.textStyle;
        delete presets.controlStyle;
        delete presets.textStyle;
        if (Binding.isBinding(controlStyle)) {
            (this as any).presetBinding("controlStyle", controlStyle, UIControl.prototype.applyControlStyle);
            controlStyle = undefined;
        }
        if (Binding.isBinding(textStyle)) {
            (this as any).presetBinding("textStyle", textStyle, UIControl.prototype.applyTextStyle);
            textStyle = undefined;
        }
        let f = super.preset(presets);
        return function (this: UIControl) {
            if (controlStyle) this.controlStyle = { ...this.controlStyle, ...controlStyle };
            if (textStyle) this.textStyle = { ...this.textStyle, ...textStyle };
            return f.call(this);
        };
    }

    protected applyStyle(style: UIStyle) {
        super.applyStyle(style);
        this.controlStyle = style.getStyles().controlStyle;
        this.textStyle = style.getStyles().textStyle;
    }

    /** Apply properties from given object on top of the default `controlStyle` properties from the current style set */
    protected applyControlStyle(controlStyle: Partial<UIStyle.ControlStyle>) {
        let result = this.style.getOwnStyles().controlStyle;
        this.controlStyle = { ...result, ...controlStyle };
    }

    /** Apply properties from given object on top of the default `texttyle` properties from the current style set */
    protected applyTextStyle(textStyle: Partial<UIStyle.TextStyle>) {
        let result = this.style.getOwnStyles().textStyle;
        this.textStyle = { ...result, ...textStyle };
    }

    /** Text style options */
    textStyle!: UIStyle.TextStyle;

    /** Miscellaneous style options */
    controlStyle!: UIStyle.ControlStyle;

    /** Set to true to disable this control */
    disabled?: boolean;

    /** Set to true to shrink this element to use as little space as possible within its container, set to false to expand; defaults to true but may be overridden by individual components (also overrides `grow` property of `UIComponent.dimensions`) */
    shrinkwrap = true;
}

export namespace UIControl {
    /** UIControl presets type, for use with `Component.with` */
    export interface Presets extends UIComponent.Presets {
        /** Text style options (overrides) */
        textStyle?: Partial<UIStyle.TextStyle | {}>;
        /** Miscellaneous style options (overrides) */
        controlStyle?: Partial<UIStyle.ControlStyle | {}>;
        /** Disable this control */
        disabled?: boolean;
        /** Shrink or grow this control */
        shrinkwrap?: boolean;

        // control element event handlers
        onChange?: UIComponentEventHandler<UIControl>;
        onInput?: UIComponentEventHandler<UIControl>;
        onCopy?: UIComponentEventHandler<UIControl>;
        onCut?: UIComponentEventHandler<UIControl>;
        onPaste?: UIComponentEventHandler<UIControl>;
    }
}
