import { UIComponent, UIComponentEventHandler } from "../UIComponent";
import { UIStyle } from "../UIStyle";
export declare abstract class UIControl extends UIComponent {
    static preset(presets: UIControl.Presets): Function;
    protected applyStyle(style: UIStyle): void;
    protected applyControlStyle(controlStyle: Partial<UIStyle.ControlStyle>): void;
    protected applyTextStyle(textStyle: Partial<UIStyle.TextStyle>): void;
    textStyle: UIStyle.TextStyle;
    controlStyle: UIStyle.ControlStyle;
    disabled?: boolean;
    shrinkwrap: boolean;
}
export declare namespace UIControl {
    interface Presets extends UIComponent.Presets {
        textStyle?: Partial<UIStyle.TextStyle | {}>;
        controlStyle?: Partial<UIStyle.ControlStyle | {}>;
        disabled?: boolean;
        shrinkwrap?: boolean;
        onChange?: UIComponentEventHandler<UIControl>;
        onInput?: UIComponentEventHandler<UIControl>;
        onCopy?: UIComponentEventHandler<UIControl>;
        onCut?: UIComponentEventHandler<UIControl>;
        onPaste?: UIComponentEventHandler<UIControl>;
    }
}
