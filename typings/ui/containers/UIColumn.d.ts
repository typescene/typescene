import { UIRenderableConstructor } from "../UIComponent";
import { UIStyle } from "../UIStyle";
import { UIContainer } from "./UIContainer";
export declare class UIColumn extends UIContainer {
    static preset(presets: UIColumn.Presets, ...rest: Array<UIRenderableConstructor | undefined>): Function;
    style: UIStyle;
    hasComponentSpacing(): boolean;
    spacing?: string | number;
    width?: string | number;
}
export declare let UICloseColumn: typeof UIColumn;
export declare namespace UIColumn {
    interface Presets extends UIContainer.Presets {
        spacing?: string | number;
        width?: string | number;
    }
}
