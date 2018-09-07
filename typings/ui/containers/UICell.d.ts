import { UIComponentEventHandler, UIRenderableConstructor } from "../UIComponent";
import { UIStyle } from "../UIStyle";
import { UIContainer } from "./UIContainer";
export declare type UICellOffsets = string | number | {
    x?: string | number;
    y?: string | number;
    top?: string | number;
    bottom?: string | number;
    left?: string | number;
    right?: string | number;
};
export declare class UICell extends UIContainer {
    static preset(presets: UICell.Presets, ...rest: Array<UIRenderableConstructor | undefined>): Function;
    style: UIStyle;
    isFocusable(): boolean;
    isKeyboardFocusable(): boolean;
    allowFocus?: boolean;
    allowKeyboardFocus?: boolean;
    padding?: UICellOffsets;
    margin?: UICellOffsets;
    background?: string;
    textColor?: string;
    borderWidth?: UICellOffsets;
    borderColor?: string;
    borderStyle: string;
    borderRadius?: string | number;
    dropShadow?: number;
    css?: Partial<CSSStyleDeclaration> & {
        className?: string;
    };
}
export declare let UIFlowCell: typeof UICell;
export declare namespace UICell {
    interface Presets extends UIContainer.Presets {
        padding?: UICellOffsets;
        margin?: UICellOffsets;
        background?: string;
        textColor?: string;
        borderWidth?: UICellOffsets;
        borderColor?: string;
        borderStyle?: string;
        borderRadius?: string | number;
        dropShadow?: number;
        allowFocus?: boolean;
        allowKeyboardFocus?: boolean;
        css?: Partial<CSSStyleDeclaration>;
        onMouseEnter?: UIComponentEventHandler<UICell>;
        onMouseLeave?: UIComponentEventHandler<UICell>;
        onSelect?: UIComponentEventHandler<UICell>;
        onDeselect?: UIComponentEventHandler<UICell>;
    }
}
