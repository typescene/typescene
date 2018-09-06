import { UIComponent, UIComponentEventHandler } from "../UIComponent";
import { UIStyle } from "../UIStyle";
/** Represents a UI component that the user can interact with (abstract) */
export declare abstract class UIControl extends UIComponent {
    static preset(presets: UIControl.Presets): Function;
    protected applyStyle(style: UIStyle): void;
    /** Apply properties from given object on top of the default `controlStyle` properties from the current style set */
    protected applyControlStyle(controlStyle: Partial<UIStyle.ControlStyle>): void;
    /** Apply properties from given object on top of the default `texttyle` properties from the current style set */
    protected applyTextStyle(textStyle: Partial<UIStyle.TextStyle>): void;
    /** Text style options */
    textStyle: UIStyle.TextStyle;
    /** Miscellaneous style options */
    controlStyle: UIStyle.ControlStyle;
    /** Set to true to disable this control */
    disabled?: boolean;
    /** Set to true to shrink this element to use as little space as possible within its container, set to false to expand; defaults to true but may be overridden by individual components (also overrides `grow` property of `UIComponent.dimensions`) */
    shrinkwrap: boolean;
}
export declare namespace UIControl {
    /** UIControl presets type, for use with `Component.with` */
    interface Presets extends UIComponent.Presets {
        /** Text style options (overrides) */
        textStyle?: Partial<UIStyle.TextStyle | {}>;
        /** Miscellaneous style options (overrides) */
        controlStyle?: Partial<UIStyle.ControlStyle | {}>;
        /** Disable this control */
        disabled?: boolean;
        /** Shrink or grow this control */
        shrinkwrap?: boolean;
        onChange?: UIComponentEventHandler<UIControl>;
        onInput?: UIComponentEventHandler<UIControl>;
        onCopy?: UIComponentEventHandler<UIControl>;
        onCut?: UIComponentEventHandler<UIControl>;
        onPaste?: UIComponentEventHandler<UIControl>;
    }
}
