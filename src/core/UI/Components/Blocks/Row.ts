import Async from "../../../Async";
import { ControlElement } from "../";
import { Component } from "../Component";
import { ComponentFactory,  UIValueOrAsync } from "../ComponentFactory";
import { Block } from "./Block";

/** Represents a row containing control elements placed horizontally */
@ComponentFactory.appendChildComponents(ComponentFactory.CLevel.ControlElement)
export class Row extends Block {
    /** Create a row block with given content, if any */
    constructor(content: ControlElement[] = []) {
        super();
        this.content = content;
    }

    /** Initialize with given (observable) properties; returns this */
    public initializeWith: (values: Row.Initializer) => this;

    /** Array of elements that go into this row (observed) */
    @ComponentFactory.applyComponentsArray(ComponentFactory.CLevel.ControlElement)
    @Async.observable_not_null
    public content: Array<ControlElement | undefined>;

    /** Spacing between elements (CSS value, platform default used if empty, observed) */
    @Async.observable_string
    public spacing: string;

    /** Vertical spacing (margin) for this row (CSS value, value of `.spacing` used if empty, observed); not applicable if `.height` is set */
    @Async.observable_string
    public verticalSpacing: string;

    /** Horizontal positioning of content within the outer boundaries of the row (observed), defaults to "start" if not defined */
    @Async.observable
    public horzAlign?: "start" | "end" | "left" | "center" | "right";

    /** Append a control element to this row */
    public appendChild(controlElement?: ControlElement) {
        this.content.push(controlElement);
        return this;
    }

    /** Returns an array of directly contained components (observable) */
    public getChildren(): Component[] {
        return <Component[]>this.content.filter(c => (c instanceof Component));
    }
}

export namespace Row {
    /** Initializer for .with({ ... }) */
    export interface Initializer extends Block.Initializer {
        /** Property initializer: list of control elements */
        content?: ComponentFactory.SpecList;
        /** Property initializer: spacing around controls */
        spacing?: UIValueOrAsync<string>;
        /** Property initializer: vertical spacing above and below controls */
        verticalSpacing?: UIValueOrAsync<string>;
    }
}

/** Represents a row containing control elements placed horizontally, with spacing set to `0` (no margin) */
export class CloseRow extends Row {
    public spacing = "0";
    public verticalSpacing = "0";
}

/** A row element with components aligned to the opposite side ("end" alignment, i.e. right-aligned for left-to-right languages) */
export class OppositeRow extends Row {
    /** Horizontal positioning of content within the outer boundaries of the row (observed), set to "end" for `OppositeRow` instances */
    public horzAlign?: "start" | "end" | "left" | "center" | "right" = "end";
}

/** A row element with components aligned in the center */
export class CenterRow extends Row {
    /** Horizontal positioning of content within the outer boundaries of the row (observed), set to "center" for `CenterRow` instances */
    public horzAlign?: "start" | "end" | "left" | "center" | "right" = "center";
}
