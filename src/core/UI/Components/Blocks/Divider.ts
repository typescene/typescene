import Async from "../../../Async";
import { Component } from "../Component";
import { ComponentFactory, UIValueOrAsync } from "../ComponentFactory";
import { Block } from "./Block";

/** Represents a divider block element (horizontal line placed between blocks) */
export class Divider extends Block {
    /** Create a new divider with given (optional) properties */
    constructor(color?: string, thickness?: string, margin?: string,
        insetStart?: string, insetEnd?: string) {
        super();
        if (color) this.color = color;
        if (thickness) this.thickness = thickness;
        if (margin) this.margin = margin;
        if (insetStart) this.insetStart = insetStart;
        if (insetEnd) this.insetEnd = insetEnd;

        // make sure this component cannot be focused (e.g. in a List)
        this.focusMode = Component.FocusMode.None;
    }

    /** Initialize with given (observable) properties; returns this */
    public initializeWith: (values: Divider.Initializer) => this;

    /** Divider color (CSS value, platform default used if empty, observed) */
    @Async.observable_string
    public color: string;

    /** Divider thickness (CSS value, platform default used if empty, observed) */
    @Async.observable_string
    public thickness: string;

    /** Vertical whitespace around divider (CSS value, platform default used if empty, observed) */
    @Async.observable_string
    public margin: string;

    /** Horizontal inset on the inside, i.e. left margin in left-to-right flow direction mode (CSS value, none if empty, observed) */
    @Async.observable_string
    public insetStart: string;

    /** Horizontal inset on the outside, i.e. right margin in left-to-right flow direction mode (CSS value, none if empty, observed) */
    @Async.observable_string
    public insetEnd: string;
}

export namespace Divider {
    /** Initializer for .with({ ... }) */
    export interface Initializer extends Block.Initializer {
        /** Property initializer: line color (CSS color) */
        color?: UIValueOrAsync<string>;
        /** Property initializer: line weight (CSS length) */
        thickness?: UIValueOrAsync<string>;
        /** Property initializer: space around line (CSS length) */
        margin?: UIValueOrAsync<string>;
        /** Property initializer: inside inset (CSS length) */
        insetStart?: UIValueOrAsync<string>;
        /** Property initializer: outside inset (CSS length) */
        insetEnd?: UIValueOrAsync<string>;
    }
}
