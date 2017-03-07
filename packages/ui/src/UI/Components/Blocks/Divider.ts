import * as Async from "@typescene/async";
import { Component } from "../Component";
import { ComponentFactory, UIValueOrAsync } from "../ComponentFactory";
import { Block } from "./Block";

/** Represents a divider block element (horizontal line placed between blocks); */
export class Divider extends Block {
    /** Create a new divider with given (optional) properties */
    constructor(color?: string, thickness?: string, margin?: string,
        insetLeft?: string, insetRight?: string) {
        super();
        this.lineStyle = Divider.LINE_STYLE;
        this.color = color || Divider.COLOR;
        this.thickness = thickness || Divider.THICKNESS;
        this.margin = margin || Divider.MARGIN;
        if (insetLeft) this.insetLeft = insetLeft;
        if (insetRight) this.insetRight = insetRight;

        // make sure this component cannot be focused (e.g. in a List)
        this.focusMode = Component.FocusMode.None;
    }

    /** Initialize with given (observable) properties; returns this */
    public initializeWith: (values: Divider.Initializer) => this;

    /** Line style, e.g. dashed, dotted, double, solid (CSS value, observed) */
    @Async.observable
    public lineStyle: string;

    /** Divider color (observed) */
    @Async.observable
    public color: string;

    /** Divider thickness (CSS value, observed) */
    @Async.observable
    public thickness: string;

    /** Vertical whitespace around divider (CSS value, observed) */
    @Async.observable
    public margin: string;

    /** Horizontal inset on left side (CSS value, observed) */
    @Async.observable_string
    public insetLeft: string;

    /** Horizontal inset on right side (CSS value, observed) */
    @Async.observable_string
    public insetRight: string;

    /** Default line color (black, 90% transparency) */
    public static COLOR = "rgba(0,0,0,.125)";

    /** Default line thickness (1px) */
    public static THICKNESS = "1px";

    /** Default line style (solid) */
    public static LINE_STYLE = "solid";

    /** Default margin (1/2 rem) */
    public static MARGIN = ".5rem";
}

export namespace Divider {
    /** Initializer for .with({ ... }) */
    export interface Initializer extends Block.Initializer {
        /** Property initializer: line style (CSS property) */
        lineStyle?: UIValueOrAsync<string>;
        /** Property initializer: line color (CSS color) */
        color?: UIValueOrAsync<string>;
        /** Property initializer: line weight (CSS length) */
        thickness?: UIValueOrAsync<string>;
        /** Property initializer: space around line (CSS length) */
        margin?: UIValueOrAsync<string>;
        /** Property initializer: left side inset (CSS length) */
        insetLeft?: UIValueOrAsync<string>;
        /** Property initializer: right side inset (CSS length) */
        insetRight?: UIValueOrAsync<string>;
    }
}
