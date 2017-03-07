import * as Async from "@typescene/async";
import { Component } from "../Component";
import { ComponentFactory,  UIValueOrAsync } from "../ComponentFactory";
import { ComponentRenderer } from "../ComponentRenderer";
import { Button } from "./Button";
import { ControlElement } from "./ControlElement";

/** Represents a button group (toggle, tab, or toolbar) control */
export class ButtonGroup extends ControlElement {
    /** Create a button group element */
    constructor(buttons: Button[] = []) {
        super();
        this.buttons = buttons;
    }

    /** Method that is called immediately after the renderer for this button group is constructed; adds observers for button activation */
    protected beforeFirstRender(renderer: ComponentRenderer<this, any>) {
        super.beforeFirstRender(renderer);

        renderer.watch(() => this.getLastSelectedChild(), button => {
            this.selectedIndex = button ?
                this.buttons.indexOf(<any>button) : -1;
        });

        renderer.watch(() => this.selectedIndex, i => {
            if (this.selectedIndex === i && this.buttons[i])
                this.buttons[i]!.selected = true;
            else
                this.buttons.forEach(b => b && (b.selected = false));
        });
    }

    /** Initialize a button group control factory with given buttons/button factories; provide selected button index to select (activate) one of the buttons, OR set `multiple` argument to true to allow multiple buttons to be active at once */
    public static withButtons<T extends ButtonGroup>(
        this: { new (): T, with: typeof ButtonGroup.with },
        buttons: Array<Button | ComponentFactory<Button>>,
        selectedIndex?: number, multiple?: boolean) {
        return this.with({
            buttons, selectedIndex,
            selectionMode: multiple ?
                Component.SelectionMode.ItemToggle :
                selectedIndex !== undefined ?
                    Component.SelectionMode.ItemClick :
                    undefined
        });
    }

    /** Initialize with given (observable) properties; returns this */
    public initializeWith: (values: ButtonGroup.Initializer) => this;

    /** Buttons to be displayed as part of the button group, in order (observed) */
    @ComponentFactory.applyComponentsArray(ComponentFactory.CLevel.ControlElement)
    @Async.observable_not_null
    public buttons: Array<Button | undefined>;

    /** Set to true to show buttons from top to bottom (observed) */
    @Async.observable
    public vertical: boolean;

    /** Set to false to expand horizontally within row (observed) */
    public shrinkwrap = true;

    /** Currently selected button index (base 0) or -1 if no selection (observed) */
    @ComponentFactory.applyAsync
    @Async.observable
    public get selectedIndex(): number {
        // return last selected index (manually, async from beforeFirstRender,
        // or return the observable value given to setter below)
        return this.selectedIndex;
    }
    public set selectedIndex(i) {
        var value: number;
        if ((<any>i instanceof Async.ObservableValue)) {
            this._observableSelectedIndex = <any>i;
            this.selectedIndex = i;
            value = (<any>i).value;
            if (value === undefined) return;
        }
        else {
            // update underlying value or set observable value
            if (this._observableSelectedIndex) {
                if (this._observableSelectedIndex.writable)
                    this._observableSelectedIndex.value = i;
            }
            else {
                // no observable bound, just set own value
                this.selectedIndex = i;
            }
            value = i;
        }

        // use -1 for any other invalid value
        if (value < 0 || value >= this.buttons.length || !this.buttons[value])
            value = -1;

        // select given button synchronously
        var button = value >= 0 ? this.buttons[value] : undefined;
        if (button) button.selected = true;

        // check if need to deselect others (do not wait for async)
        if (this.selectionMode === Component.SelectionMode.ItemClick ||
            this.selectionMode === Component.SelectionMode.ItemFocus) {
            for (var j = this.buttons.length - 1; j >= 0; j--)
                if (this.buttons[j] && this.buttons[j] !== button)
                    this.buttons[j]!.selected = false;
        }
    }
    private _observableSelectedIndex?: Async.ObservableValue<number>;

    /** Returns an array of directly contained components (observable) */
    public getChildren(): Component[] {
        return <Component[]>this.buttons.filter(b => (b instanceof Component));
    }
}

export namespace ButtonGroup {
    /** Initializer for .with({ ... }) */
    export interface Initializer extends ControlElement.Initializer {
        /** Property initializer: buttons to display */
        buttons?: ComponentFactory.SpecList;
        /** Property initializer: true to display buttons vertically */
        vertical?: UIValueOrAsync<boolean>;
        /** Property initializer: index of selected button (use with `.selectionMode` set to `ItemClick`) */
        selectedIndex?: UIValueOrAsync<number>;
    }
}
