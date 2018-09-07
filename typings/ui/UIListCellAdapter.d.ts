import { Component, ManagedObject } from "../core";
import { UICell } from "./containers/UICell";
import { UIComponent, UIComponentEvent, UIRenderableConstructor } from "./UIComponent";
import { UIRenderContext } from "./UIRenderContext";
export declare class UIListCellAdapterEvent<TObject extends ManagedObject = ManagedObject> extends UIComponentEvent {
    constructor(name: string, source: UIComponent, cell: UICell, object?: TObject, event?: any);
    readonly cell: UICell;
    readonly object?: TObject;
}
export declare class UIListCellAdapter<TObject extends ManagedObject = ManagedObject> extends Component {
    static preset(presets: UIListCellAdapter.Presets, ...rest: Array<UIRenderableConstructor>): Function;
    constructor(object: TObject);
    onManagedStateActiveAsync(): Promise<void>;
    readonly object: TObject;
    readonly selected: boolean;
    readonly hovered: boolean;
    readonly cell?: UICell;
    requestFocus(): void;
    requestFocusNext(): void;
    requestFocusPrevious(): void;
    render(callback: UIRenderContext.RenderCallback): void;
    private _lastRenderCallback?;
    private _selected;
    private _hovered;
}
export declare namespace UIListCellAdapter {
    interface Presets extends UICell.Presets {
        selectOnFocus?: boolean;
        focusedBackground?: string;
        focusedTextColor?: string;
        focusedBorderWidth?: string | number;
        focusedBorderColor?: string;
        focusedBorderStyle?: string;
        focusedDropShadow?: number;
        selectedBackground?: string;
        selectedTextColor?: string;
        selectedBorderWidth?: string | number;
        selectedBorderColor?: string;
        selectedBorderStyle?: string;
        selectedDropShadow?: number;
        focusedSelectedBackground?: string;
        focusedSelectedTextColor?: string;
        focusedSelectedBorderWidth?: string | number;
        focusedSelectedBorderColor?: string;
        focusedSelectedBorderStyle?: string;
        focusedSelectedDropShadow?: number;
    }
}
