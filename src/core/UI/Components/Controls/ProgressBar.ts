import Async from "../../../Async";
import { Style } from "../../Style";
import { ComponentFactory, UIValueOrAsync } from "../ComponentFactory";
import { TextLabelFactory } from "../TextLabelFactory";
import { ControlElement } from "./ControlElement";

/** Represents a progress bar control (full width by default) */
export class ProgressBar extends ControlElement {
    /** Create a progress bar control element */
    constructor(progress = 0) {
        super();
        this.progress = progress;
    }

    /** Initialize a progress bar control factory with given progress value (0-1) */
    public static withProgress<T extends typeof ProgressBar>(this: T,
        progress: UIValueOrAsync<number>) {
        return this.with({ progress });
    }

    /** Initialize with given (observable) properties; returns this */
    public initializeWith: (values: ProgressBar.Initializer) => this;

    /** Current progress value, between 0 and 1, inclusive (observed) */
    @Async.observable_number
    public progress: number;

    /** Tooltip text (observed) */
    @Async.observable_string
    public tooltipText: string;

    /** Encapsulation of inner bar style (observed) */
    @Async.observable_not_null
    public readonly style_bar = new Style();
}

export namespace ProgressBar {
    /** Initializer for .with({ ... }) */
    export interface Initializer extends ControlElement.Initializer {
        /** Property initializer: progress value (0-1) */
        progress?: UIValueOrAsync<number>;
        /** Property initializer: tooltip text */
        tooltipText?: UIValueOrAsync<string | TextLabelFactory>;
        /** Property initializer: inner bar element style */
        style_bar?: UIValueOrAsync<Style | Style.StyleSet>;
    }
}
