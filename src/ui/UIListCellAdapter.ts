import { Component, logUnhandledException, managedChild, ManagedObject, shadowObservable } from "../core";
import { UICell } from "./containers/UICell";
import { UIComponent, UIComponentEvent, UIRenderableConstructor } from "./UIComponent";
import { UIRenderableController } from "./UIRenderableController";
import { UIRenderContext } from "./UIRenderContext";

/** Event that is emitted on a particular `UIListCellAdapter`. */
export class UIListCellAdapterEvent<TObject extends ManagedObject = ManagedObject> extends UIComponentEvent {
    constructor(name: string, source: UIComponent, cell: UICell, object?: TObject, event?: any) {
        super(name, source, event);
        this.object = object;
        this.cell = cell;
    }

    /** The cell that contains the component that originally emitted this event */
    readonly cell: UICell;

    /** The object encapsulated by the `UIListCellAdapter`, if any */
    readonly object?: TObject;
}

/** Component that can be used as an adapter to render items in a `UIList`. Instances are constructed using a single argument (a managed object from `UIList.items`), and are immediately activated to create the cell component. The static `with` method takes the same arguments as `UICell` itself along with additional properties to manage display of selected and focused cells. Encapsulated content can include bindings to the `object` and `selected` properties. */
export class UIListCellAdapter<TObject extends ManagedObject = ManagedObject> extends Component {
    static preset(presets: UIListCellAdapter.Presets,
        ...rest: Array<UIRenderableConstructor>): Function {
        if (presets.selectOnFocus) {
            presets.allowFocus = true;
            presets.onFocusIn = "+Select";
            delete presets.selectOnFocus;
        }

        // create UICell constructor and listen for focus/select
        let cell = UICell.with(presets, ...rest);
        cell.observe(class {
            constructor(cell: UICell) {
                this.cell = cell as any;
                this.baseProperties = {
                    background: presets.background,
                    textColor: presets.textColor,
                    borderWidth: presets.borderWidth || 0,
                    borderColor: presets.borderColor,
                    borderStyle: presets.borderStyle || "solid",
                    dropShadow: presets.dropShadow || 0
                };
            }
            cell: UICell & typeof presets;
            baseProperties: Partial<UICell>;
            selected = false;
            focused = false;
            onFocusIn(e: UIComponentEvent) {
                if (e.source === this.cell) this._set(this.selected, this.focused = true);
            }
            onFocusOut(e: UIComponentEvent) {
                if (e.source === this.cell) this._set(this.selected, this.focused = false);
            }
            onSelect(e: UIComponentEvent) {
                if (e.source === this.cell) this._set(this.selected = true, this.focused);
            }
            onDeselect(e: UIComponentEvent) {
                if (e.source === this.cell) this._set(this.selected = false, this.focused);
            }
            private _set(selected?: boolean, focused?: boolean) {
                function def(a: any, takeB?: boolean, b = a,
                    takeC?: boolean, c = b, bc = c) {
                    return takeC ? (takeB ? bc : c) : (takeB ? b : a);
                }
                this.cell.background = def(this.baseProperties.background,
                    selected, this.cell.selectedBackground,
                    focused, this.cell.focusedBackground,
                    this.cell.focusedSelectedBackground);
                this.cell.textColor = def(this.baseProperties.textColor,
                    selected, this.cell.selectedTextColor,
                    focused, this.cell.focusedTextColor,
                    this.cell.focusedSelectedTextColor);
                this.cell.borderWidth = def(this.baseProperties.borderWidth,
                    selected, this.cell.selectedBorderWidth,
                    focused, this.cell.focusedBorderWidth,
                    this.cell.focusedSelectedBorderWidth);
                this.cell.borderColor = def(this.baseProperties.borderColor,
                    selected, this.cell.selectedBorderColor,
                    focused, this.cell.focusedBorderColor,
                    this.cell.focusedSelectedBorderColor);
                this.cell.borderStyle = def(this.baseProperties.borderStyle,
                    selected, this.cell.selectedBorderStyle,
                    focused, this.cell.focusedBorderStyle,
                    this.cell.focusedSelectedBorderStyle);
                this.cell.dropShadow = def(this.baseProperties.dropShadow,
                    selected, this.cell.selectedDropShadow,
                    focused, this.cell.focusedDropShadow,
                    this.cell.focusedSelectedDropShadow);
            }
        });
        this.presetActiveComponent("cell", cell, UIRenderableController);
        return super.preset({});
    }

    /**
     * Create a new component for given object, and activate this object immediately.
     * @param object
     *  The encapsulated object */
    constructor(object: TObject) {
        super();
        this.object = object;
        this.activateManagedAsync().catch(logUnhandledException);
        this.propagateChildEvents(e => {
            if (this.cell && e instanceof UIComponentEvent) {
                if (e.source === this.cell) {
                    switch (e.name) {
                        case "Select": this._selected = true; break;
                        case "Deselect": this._selected = false; break;
                        case "MouseEnter": this._hovered = true; break;
                        case "MouseLeave": this._hovered = false; break;
                    }
                }
                return new UIListCellAdapterEvent(e.name, e.source, this.cell!, this.object, e.event);
            }
        });
    }

    async onManagedStateActiveAsync() {
        await super.onManagedStateActiveAsync();
        if (this._lastRenderCallback) {
            let callback = this._lastRenderCallback;
            this._lastRenderCallback = undefined;
            this.cell && this.cell.render(callback);
        }
    }

    /** The encapsulated object */
    readonly object: TObject;

    /** True if the cell is currently selected (based on `Select` and `Deselect` events) */
    @shadowObservable("_selected")
    get selected() { return this._selected }

    /** True if the cell is currently hovered over using the mouse cursor (based on `MouseEnter` and `MouseLeave` events) */
    @shadowObservable("_hovered")
    get hovered() { return this._hovered }

    /** The encapsulated cell, as a child component */
    @managedChild
    readonly cell?: UICell;

    /** Request input focus on the current cell */
    requestFocus() {
        this.cell && this.cell.requestFocus();
    }

    /** Request input focus for the next sibling cell */
    requestFocusNext() {
        this.cell && this.cell.requestFocusNext();
    }

    /** Request input focus for the previous sibling cell */
    requestFocusPrevious() {
        this.cell && this.cell.requestFocusPrevious();
    }

    render(callback: UIRenderContext.RenderCallback) {
        if (this.cell) this.cell.render(callback);
        else this._lastRenderCallback = callback;
    }

    private _lastRenderCallback?: UIRenderContext.RenderCallback;
    private _selected = false;
    private _hovered = false;
}

export namespace UIListCellAdapter {
    /** UIListCellAdapter presets type, for use with `Component.with` */
    export interface Presets extends UICell.Presets {
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
