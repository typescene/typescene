import { Component, logUnhandledException, managed, managedChild, ManagedObject, ManagedState, shadowObservable } from "../core";
import { UICell } from "./containers/UICell";
import { UIComponent, UIComponentEvent, UIRenderable, UIRenderableConstructor } from "./UIComponent";
import { UIRenderableController } from "./UIRenderableController";
import { renderContextBinding, UIRenderContext } from "./UIRenderContext";

/** Event that is emitted on a particular `UIListCellAdapter`. */
export class UIListCellAdapterEvent<TObject extends ManagedObject = ManagedObject> extends UIComponentEvent {
    constructor(name: string, source: UIComponent, cell: UICell, object?: TObject, event?: any) {
        super(name, source, undefined, event);
        this.object = object;
        this.cell = cell;
    }

    /** The cell that contains the component that originally emitted this event */
    readonly cell: UICell;

    /** The object encapsulated by the `UIListCellAdapter`, if any */
    readonly object?: TObject;
}

/** Component that can be used as an adapter to render items in a `UIListController`. Instances are constructed using a single argument (a managed object from `UIListController.items`), and are activated when rendered to create the cell component. The static `with` method takes the same arguments as `UICell` itself along with additional properties to manage display of selected and focused cells. Encapsulated content can include bindings to the `object` and `selected` properties. */
export class UIListCellAdapter<TObject extends ManagedObject = ManagedObject>
    extends Component.with({
        renderContext: renderContextBinding,
    })
    implements UIRenderable {
    static preset(presets: UICell.Presets, ...rest: Array<UIRenderableConstructor>): Function {
        this.presetActiveComponent("cell", UICell.with(presets, ...rest), UIRenderableController);
        return super.preset({});
    }

    /**
     * Create a new component for given object. The encapsulated cell is only created when the instance is rendered.
     * @param object
     *  The encapsulated object */
    constructor(object: TObject) {
        super();
        this.object = object;
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

    /** Application render context, propagated from the parent composite object */
    @managed
    renderContext?: UIRenderContext;

    /** The encapsulated object */
    @managed
    readonly object: TObject;

    /** The encapsulated cell, as a child component; only created when the `UIListCellAdapter` is rendered */
    @managedChild
    readonly cell?: UICell;

    async onManagedStateActiveAsync() {
        await super.onManagedStateActiveAsync();
        if (this._pendingRenderCallback) {
            let callback = this._pendingRenderCallback;
            this._pendingRenderCallback = undefined;
            this.cell && this.cell.render(callback);
        }
    }

    async onManagedStateInactiveAsync() {
        await super.onManagedStateInactiveAsync();
        this._pendingRenderCallback = undefined;
    }

    /** True if the cell is currently selected (based on `Select` and `Deselect` events) */
    @shadowObservable("_selected")
    get selected() { return this._selected }

    /** True if the cell is currently hovered over using the mouse cursor (based on `MouseEnter` and `MouseLeave` events) */
    @shadowObservable("_hovered")
    get hovered() { return this._hovered }

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
        if (this.managedState === ManagedState.CREATED) {
            // activate this component now to create the view
            this._pendingRenderCallback = callback;
            this.activateManagedAsync().catch(logUnhandledException);
        }
        else {
            if (this.cell) this.cell.render(callback);
            else this._pendingRenderCallback = callback;
        }
    }

    private _pendingRenderCallback?: UIRenderContext.RenderCallback;
    private _selected = false;
    private _hovered = false;
}
