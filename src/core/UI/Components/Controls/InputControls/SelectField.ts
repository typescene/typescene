import Async from "../../../../Async";
import { Style } from "../../../Style";
import { Component } from "../../Component";
import { ComponentFactory, UIValueOrAsync } from "../../ComponentFactory";
import { TextLabelFactory } from "../../TextLabelFactory";
import { InputControl } from "./InputControl";

/** Represents a native dropdown selection field control */
export class SelectField extends InputControl {
    /** Create a select field element */
    constructor(name = "select", label?: string | TextLabelFactory,
        options?: SelectField.Option[]) {
        super();
        this.label = <any>label;
        this.options = options || [];
        this.name = name;
    }

    /** Initialize a select field control factory with given name, label, and options */
    public static withOptions<T extends typeof SelectField>(this: T,
        name: string, label?: string | TextLabelFactory,
        options: UIValueOrAsync<SelectField.Option[]> = []) {
        return this.with({ name, label, options });
    }

    /** Initialize with given (observable) values; returns this */
    public initializeWith: (values: SelectField.Initializer) => this;

    /** List of options and their values (observed) */
    @Async.observable_not_null
    public options: Array<SelectField.Option | undefined>;

    /** Currently selected value (read/write observable) */
    @Async.observable
    public value: string;

    /** Returns an object containing all current values of input elements (observable) */
    public getFormValues(result: any = {}) {
        if (this.name) result[this.name] = this.value;
        return result;
    }

    /** Sets all input values by element name */
    public setFormValues(values: any) {
        if (this.name && values &&
            Object.prototype.hasOwnProperty.call(values, this.name))
            this.value = values[this.name];
    }
}

export namespace SelectField {
    /** Represents a select field option */
    export interface Option {
        /** Selection value */
        value?: string,
        /** Text label */
        text: string | TextLabelFactory
    }

    /** Initializer for .with({ ... }) */
    export interface Initializer extends InputControl.Initializer {
        /** Property initializer: options with text labels and (optional) values */
        options?: UIValueOrAsync<SelectField.Option[]>;
    }
}
