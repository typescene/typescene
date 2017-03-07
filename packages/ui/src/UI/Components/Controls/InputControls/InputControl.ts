import * as Async from "@typescene/async";
import { Style } from "../../../Style";
import { ActionHandler, ComponentSignal } from "../../ComponentSignal";
import { UIValueOrAsync } from "../../ComponentFactory";
import { TextLabelFactory } from "../../TextLabelFactory";
import { ControlElement } from "../ControlElement";

/** Input field control base class (abstract) */
export abstract class InputControl extends ControlElement {
    /** Input value (read/write) */
    public value: string;

    /** Form input property name, if any (observed) */
    @Async.observable_string
    public name: string;

    /** Label text (observed) */
    @Async.observable_string
    public label: string;

    /** Tooltip text (observed) */
    @Async.observable_string
    public tooltipText: string;

    /** True if input is disabled and read-only (observed) */
    @Async.observable
    public disabled: boolean;

    /** Encapsulation of label element style (observed) */
    @Async.observable_not_null
    public readonly style_label = new Style();

    /** Encapsulation of input element style (observed) */
    @Async.observable_not_null
    public readonly style_input = new Style();

    /** Signal emitted when the input value is committed (on change); captured from containers down to contained components, not consumed */
    @Async.unobservable_memoize_get
    public get ValueChange() {
        return this["@createEventSignal"]("ValueChange", ComponentSignal);
    }

    /** Signal emitted immediately before the input value changes (on input); captured from containers down to contained components, not consumed */
    @Async.unobservable_memoize_get
    public get ValueInput() {
        return this["@createEventSignal"]("ValueInput", ComponentSignal);
    }
}

export namespace InputControl {
    /** Initializer for .with({ ... }) */
    export interface Initializer extends ControlElement.Initializer {
        /** Property initializer: form input property name */
        name?: string;
        /** Property initializer: input value */
        value?: UIValueOrAsync<string>;
        /** Property initializer: label text */
        label?: UIValueOrAsync<string | undefined> | TextLabelFactory;
        /** Property initializer: tooltip text */
        tooltipText?: UIValueOrAsync<string | undefined> | TextLabelFactory;
        /** Property initializer: true to disable this input */
        disabled?: UIValueOrAsync<boolean>;
        /** Property initializer: label style */
        style_label?: UIValueOrAsync<Style | Style.StyleSet>;
        /** Property initializer: input style */
        style_input?: UIValueOrAsync<Style | Style.StyleSet>;
        /** Signal initializer: method name or handler */
        ValueChange?: string | ActionHandler;
        /** Signal initializer: method name or handler */
        ValueInput?: string | ActionHandler;
    }
}

