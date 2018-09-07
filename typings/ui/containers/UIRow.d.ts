import { UIRenderableConstructor } from "../UIComponent";
import { UIStyle } from "../UIStyle";
import { UIContainer } from "./UIContainer";
export declare class UIRow extends UIContainer {
    static preset(presets: UIRow.Presets, ...rest: Array<UIRenderableConstructor | undefined>): Function;
    style: UIStyle;
    hasComponentSpacing(): boolean;
    spacing?: string | number;
    height?: string | number;
}
export declare let UIOppositeRow: typeof UIRow;
export declare let UICenterRow: typeof UIRow;
export declare let UICloseRow: typeof UIRow;
export declare namespace UIRow {
    interface Presets extends UIContainer.Presets {
        spacing?: string | number;
        height?: string | number;
    }
}
