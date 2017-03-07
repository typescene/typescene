import * as Async from "@typescene/async";
import { Style } from "../../Style";
import { Component } from "../Component";
import { ComponentFactory, UIValueOrAsync } from "../ComponentFactory";
import { TextLabelFactory } from "../TextLabelFactory";
import { ControlElement } from "./ControlElement";

/** Represents a minimal text control with icon and badge */
export class Label extends ControlElement {
    /** Create a label element */
    constructor(text: string | TextLabelFactory = "", icon?: string,
        remGutter?: number, badge?: string | TextLabelFactory) {
        super();
        this.text = <any>text;
        this.icon = icon;
        this.badge = <any>badge;
        if (remGutter !== undefined) this.remGutter = remGutter;

        // set focus mode so label is not focusable by default
        this.focusMode = Component.FocusMode.None;
    }

    /** Initialize a text control factory with given text and style */
    public static withText<T extends Label>(
        this: { new (): T, with: typeof Label.with },
        text: UIValueOrAsync<string | TextLabelFactory>,
        style?: UIValueOrAsync<Style | Style.StyleSet>) {
        return this.with({ text, style });
    }

    /** Initialize with given (observable) properties; returns this */
    public initializeWith: (values: Label.Initializer) => this;

    /** Set to false to expand horizontally within row (default true; observed) */
    public shrinkwrap = true;

    /** Text to display (observed) */
    @Async.observable_string
    public text: string;

    /** Icon to be placed in front of the label text (CSS class(es), e.g. "glyphicon-edit" or "fa-edit fa-2x" or "material-icons:file_download"; first part is repeated Bootstrap-style automatically, e.g. "fa-edit" becomes "fa fa-edit"; observed); style properties can be appended like "fa-edit color=#ccc fontSize=200%" (or font-size); use quotes to wrap values with spaces, e.g. 'fa-edit border="1px solid #ccc"' */
    @Async.observable
    public icon?: string;

    /** Space reserved for icon (rem units), if > 0 (observed) */
    @Async.observable
    public remGutter: number;

    /** Badge text, if any (observed) */
    @Async.observable_string
    public badge: string;

    /** Tooltip text (observed) */
    @Async.observable_string
    public tooltipText: string;
}

export namespace Label {
    /** Initializer for .with({ ... }) */
    export interface Initializer extends ControlElement.Initializer {
        /** Property initializer: text to display */
        text?: UIValueOrAsync<string | TextLabelFactory>;
        /** Property initializer: icon to display */
        icon?: UIValueOrAsync<string>;
        /** Property initializer: space reserved for icon, in rem units */
        remGutter?: UIValueOrAsync<number>;
        /** Property initializer: badge text to display */
        badge?: UIValueOrAsync<string | TextLabelFactory>;
        /** Property initializer: tooltip text */
        tooltipText?: UIValueOrAsync<string | TextLabelFactory>;
    }
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

/** Stretched label control: a label that expands horizontally, while not breaking across lines (uses ellipsis if available) */
export class WideLabel extends Label {
    /** Set to true to shrink horizontally (default false; observed) */
    public shrinkwrap = false;
}

/** Paragraph control: a label that expands horizontally, with text that breaks automatically across lines, and added line spacing for enhanced readability */
export class Paragraph extends Label {
    /** Set to true to shrink horizontally (default false; observed) */
    public shrinkwrap = false;

    /** Automatically break text across lines (default true, observed) */
    public wrapText = true;
}

/** H1 label control */
export class Heading1 extends Label {
    // implemented by platform specific renderer
}

/** H2 label control */
export class Heading2 extends Label {
    // implemented by platform specific renderer
}

/** H3 label control */
export class Heading3 extends Label {
    // implemented by platform specific renderer
}

/** H4 label control */
export class Heading4 extends Label {
    // implemented by platform specific renderer
}

/** H5 label control */
export class Heading5 extends Label {
    // implemented by platform specific renderer
}

/** H6 label control */
export class Heading6 extends Label {
    // implemented by platform specific renderer
}
