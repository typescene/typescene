import Async from "../../../Async";
import { Component } from "../Component";
import { Page } from "../../Page";
import { Style } from "../../Style";
import { ComponentFactory, UIValueOrAsync } from "../ComponentFactory";

/** Block base class: full-width block component */
export class Block extends Component {
    /** Create a new empty block component */
    constructor() {
        super();
        // nothing here
    }

    /** Initialize with given (observable) properties; returns this */
    public initializeWith: (values: Block.Initializer) => this;

    /** Overlay position (observed); set to one of the `OverlayPosition` enum's values to take this block out of the top-down component flow, and position it relative to its _parent_ container (or to the screen, if displayed directly); note that this block will still move up/down along with the content of the parent container if its `scrollable` property is true */
    @Async.observable
    public overlayPosition?: Block.OverlayPosition;
}

export namespace Block {
    /** Initializer for .with({...}) */
    export interface Initializer extends Component.Initializer {
        /** Property initializer: overlay positioning option (to display block as an overlay within its parent container) */
        overlayPosition?: OverlayPosition;
        /** Property initializer: display options (for use when displayed directly on the page) */
        displayOptions?: Page.DisplayOptions;
    }

    /** Overlay positioning options */
    export enum OverlayPosition {
        /** Top (full width) */
        Top,
        /** Top left corner */
        TopLeft,
        /** Top right corner */
        TopRight,
        /** Top inside corner (left for default ltr mode) */
        TopStart,
        /** Top outside corner (right for default ltr mode) */
        TopEnd,
        /** Bottom (full width) */
        Bottom,
        /** Bottom left corner */
        BottomLeft,
        /** Bottom right corner */
        BottomRight,
        /** Bottom inside corner (left for default ltr mode) */
        BottomStart,
        /** Bottom outside corner (right for default ltr mode) */
        BottomEnd
    };
}
