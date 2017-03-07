import * as Async from "@typescene/async";
import { Style } from "../../../Style";
import { ComponentFactory, UIValueOrAsync } from "../../ComponentFactory";
import { TextLabelFactory } from "../../TextLabelFactory";
import { InputControl } from "./InputControl";

/** Represents a single- or multi-line text input field control */
export class TextField extends InputControl {
    /** Create a text field */
    constructor(name = "text", label?: string | TextLabelFactory, textareaLines = 0) {
        super();
        this.label = <any>label;
        this.name = name;
        this.textareaLines = textareaLines;
    }

    /** Initialize a text field control factory with given name, label, and placeholder */
    public static withName<T extends TextField>(
        this: { new (): T, with: typeof TextField.with },
        name: string, label?: string | TextLabelFactory,
        placeholderText?: string | TextLabelFactory) {
        return this.with({ name, label, placeholderText });
    }

    /** Initialize with given (observable) values; returns this */
    public initializeWith: (values: TextField.Initializer) => this;

    /** Number of rows for a multiline text field, default 0 (NOT observed) */
    public textareaLines: number;

    /** Text field type (text, password, number, etc.; observed) */
    @Async.observable
    public type: TextField.Type = TextField.Type.Text;

    /** Current input value (read/write observable) value changes only on blur or enter press unless `.immediateValueUpdate` is set */
    @Async.observable_string
    public value: string;

    /** Placeholder text (observed) */
    @Async.observable_string
    public placeholderText: string;

    /** Set to true to update `.value` immediately after the input field text has changed, instead of only on blur or enter press (observed) */
    @Async.observable_string
    public immediateValueUpdate: boolean;

    /** Select (a part of) the text in this text field, returns this */
    @Async.injectable
    public selectText(start?: number, end?: number) { return this }

    /** Returns an object containing all current values of input elements (observable) */
    public getFormValues(result = {}) {
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

export namespace TextField {
    /** Text field type options (e.g. Text, Password, Email etc.) */
    export enum Type {
        Text, Password, DateTime, Date, Month, Time, Week,
        Number, Email, Url, Search, Tel, Color
    };

    /** Initializer for .with({ ... }) */
    export interface Initializer extends InputControl.Initializer {
        /** Property initializer: number of text area lines */
        textareaLines?: UIValueOrAsync<number>;
        /** Property initializer: text field type */
        type?: UIValueOrAsync<TextField.Type>;
        /** Property initializer: placeholder text */
        placeholderText?: UIValueOrAsync<string | TextLabelFactory>;
        /** Property initializer: true to update value immediately on input */
        immediateValueUpdate?: UIValueOrAsync<boolean>;
    }
}
