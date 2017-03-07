import * as Async from "@typescene/async";
import { Style } from "../../../Style";
import { ComponentFactory, UIValueOrAsync } from "../../ComponentFactory";
import { TextLabelFactory } from "../../TextLabelFactory";
import { InputControl } from "./InputControl";

/** Represents a single checkbox or radio button control */
export class Checkbox extends InputControl {
    /** Create a checkbox element */
    constructor(name = "checkbox", label?: string | TextLabelFactory,
        type = Checkbox.Type.Checkbox, checked = false) {
        super();
        this.label = <any>label;
        this.name = name;
        this.type = type;
        this.checked = checked;
    }

    /** Initialize a checkbox control factory with given values */
    public static withName<T extends Checkbox>(
        this: { new (): T, with: typeof Checkbox.with },
        name: string, label?: string | TextLabelFactory,
        checked?: boolean, value?: string) {
        return this.with({ name, label, checked, value });
    }

    /** Initialize a radio button control factory with given values */
    public static withRadioName<T extends Checkbox>(
        this: typeof Checkbox & { new (): T },
        name: string, label?: string | TextLabelFactory,
        checked?: boolean, value?: string) {
        return this.with({
            name, label, checked, value,
            type: Checkbox.Type.Radio
        });
    }

    /** Initialize with given (observable) values; returns this */
    public initializeWith: (values: Checkbox.Initializer) => this;

    /** Type: checkbox or radio button (observed), defaults to checkbox */
    @Async.observable
    public type: Checkbox.Type;

    /** Text value used when selected (observed), defaults to "checked" */
    @Async.observable
    public value = "checked";

    /** Current selection status (observable) */
    @Async.observable
    public checked: boolean;

    /** Set to false to expand horizontally within row (observed) */
    public shrinkwrap = true;

    /** Returns an object containing all current values of input elements (observable) */
    public getFormValues(result = {}) {
        if (this.name && (this.checked || !this.type))
            result[this.name] = this.checked ?
                (this.value !== undefined ? this.value : "checked") :
                undefined;
        return result;
    }

    /** Sets all input values by element name */
    public setFormValues(values: any) {
        if (this.name && values &&
            Object.prototype.hasOwnProperty.call(values, this.name))
            this.checked = this.type ?
                (this.value !== undefined ?
                    values[this.name] === this.value :
                    !!values[this.name]) :
                !!values[this.name];
    }

    /** Encapsulation of inner text element style (observed) */
    @Async.observable_not_null
    public readonly style_text = new Style();
}

export namespace Checkbox {
    export enum Type {
        Checkbox, Radio
    };

    /** Initializer for .with({ ... }) */
    export interface Initializer extends InputControl.Initializer {
        /** Property initializer: true to check checkbox/radio */
        checked?: UIValueOrAsync<boolean | undefined>;
        /** Property initializer: checkbox or radio */
        type?: UIValueOrAsync<Checkbox.Type>;
        /** Property initializer: text element style */
        style_text?: UIValueOrAsync<Style | Style.StyleSet>;
    }
}
