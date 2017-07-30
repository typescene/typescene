import Async from "../../../Async";
import { ComponentFactory, UIValueOrAsync } from "../ComponentFactory";
import { TextLabelFactory } from "../TextLabelFactory";
import { ControlElement } from "./ControlElement";

/** Represents an icon control (horizontally centered) */
export class Icon extends ControlElement {
    /** Create an icon element */
    constructor(icon?: string) {
        super();
        this.icon = icon || "";
    }

    /** Initialize an icon control with given icon name */
    public static withIcon<T extends typeof Icon>(this: T,
        icon: UIValueOrAsync<string>) {
        return this.with({ icon });
    }

    /** Initialize with given (observable) properties; returns this */
    public initializeWith: (values: Icon.Initializer) => this;

    /** Icon name as CSS class(es), e.g. "glyphicon-edit" or "fa-edit fa-2x" or "material-icons:file_download"; first part is repeated Bootstrap-style automatically, e.g. "fa-edit" becomes "fa fa-edit"; observed); style properties can be appended like "fa-edit color=#ccc fontSize=200%" (or font-size); use quotes to wrap values with spaces, e.g. 'fa-edit border="1px solid #ccc"' */
    @Async.observable_string
    public icon: string;

    /** Tooltip text (observed) */
    @Async.observable_string
    public tooltipText: string;

    /** Set to false to expand horizontally within row (observed) */
    public shrinkwrap = true;
}

export namespace Icon {
    /** Initializer for .with({ ... }) */
    export interface Initializer extends ControlElement.Initializer {
        /** Property initializer: icon to display */
        icon?: UIValueOrAsync<string>;
        /** Property initializer: tooltip text */
        tooltipText?: UIValueOrAsync<string | TextLabelFactory>;
    }
}
