import { Component, ManagedObject } from "../core";
import { UICell } from "./containers/UICell";
import { UIComponent, UIComponentEvent, UIRenderableConstructor } from "./UIComponent";
import { UIRenderContext } from "./UIRenderContext";
/** Event that is emitted on a particular `UIListCellAdapter`. */
export declare class UIListCellAdapterEvent<TObject extends ManagedObject = ManagedObject> extends UIComponentEvent {
    constructor(name: string, source: UIComponent, cell: UICell, object?: TObject, event?: any);
    /** The cell that contains the component that originally emitted this event */
    readonly cell: UICell;
    /** The object encapsulated by the `UIListCellAdapter`, if any */
    readonly object?: TObject;
}
/** Component that can be used as an adapter to render items in a `UIList`. Instances are constructed using a single argument (a managed object from `UIList.items`), and are immediately activated to create the cell component. The static `with` method takes the same arguments as `UICell` itself along with additional properties to manage display of selected and focused cells. Encapsulated content can include bindings to the `object` and `selected` properties. */
export declare class UIListCellAdapter<TObject extends ManagedObject = ManagedObject> extends Component {
    static preset(presets: UIListCellAdapter.Presets, ...rest: Array<UIRenderableConstructor>): Function;
    /**
     * Create a new component for given object, and activate this object immediately.
     * @param object
     *  The encapsulated object */
    constructor(object: TObject);
    onManagedStateActiveAsync(): Promise<void>;
    /** The encapsulated object */
    readonly object: TObject;
    /** True if the cell is currently selected (based on `Select` and `Deselect` events) */
    readonly selected: boolean;
    /** True if the cell is currently hovered over using the mouse cursor (based on `MouseEnter` and `MouseLeave` events) */
    readonly hovered: boolean;
    /** The encapsulated cell, as a child component */
    readonly cell?: UICell;
    /** Request input focus on the current cell */
    requestFocus(): void;
    /** Request input focus for the next sibling cell */
    requestFocusNext(): void;
    /** Request input focus for the previous sibling cell */
    requestFocusPrevious(): void;
    render(callback: UIRenderContext.RenderCallback): void;
    private _lastRenderCallback?;
    private _selected;
    private _hovered;
}
export declare namespace UIListCellAdapter {
    /** UIListCellAdapter presets type, for use with `Component.with` */
    interface Presets extends UICell.Presets {
        /** Set to true to select cells on focus (or click), implies allowFocus as well */
        selectOnFocus?: boolean;
        /** Focused cell background */
        focusedBackground?: string;
        /** Focused cell text color */
        focusedTextColor?: string;
        /** Focused cell border width (in dp or string with unit, defaults to 0) */
        focusedBorderWidth?: string | number;
        /** Focused cell border color (see `UITheme.replaceColor`) */
        focusedBorderColor?: string;
        /** Focused cell border style (CSS), defaults to "solid" */
        focusedBorderStyle?: string;
        /** Focused cell drop shadow size based on visual 'elevation' (0-1, defaults to 0) */
        focusedDropShadow?: number;
        /** Selected cell background */
        selectedBackground?: string;
        /** Selected cell text color */
        selectedTextColor?: string;
        /** Selected cell border width (in dp or string with unit, defaults to 0) */
        selectedBorderWidth?: string | number;
        /** Selected cell border color (see `UITheme.replaceColor`) */
        selectedBorderColor?: string;
        /** Selected cell border style (CSS), defaults to "solid" */
        selectedBorderStyle?: string;
        /** Selected cell drop shadow size based on visual 'elevation' (0-1, defaults to 0) */
        selectedDropShadow?: number;
        /** Focused and selected cell background */
        focusedSelectedBackground?: string;
        /** Focused and selected cell text color */
        focusedSelectedTextColor?: string;
        /** Focused and selected cell border width (in dp or string with unit, defaults to 0) */
        focusedSelectedBorderWidth?: string | number;
        /** Focused and selected cell border color (see `UITheme.replaceColor`) */
        focusedSelectedBorderColor?: string;
        /** Focused and selected cell border style (CSS), defaults to "solid" */
        focusedSelectedBorderStyle?: string;
        /** Focused and selected cell drop shadow size based on visual 'elevation' (0-1, defaults to 0) */
        focusedSelectedDropShadow?: number;
    }
}
