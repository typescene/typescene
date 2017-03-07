import * as Async from "@typescene/async";
import { ControlElement } from "../";
import { Component } from "../Component";
import { ComponentFactory,  UIValueOrAsync } from "../ComponentFactory";
import { Block } from "./Block";

/** Represents a row containing control elements placed horizontally */
export class Row extends Block {
    /** Create a row block with given content, if any */
    constructor(content: ControlElement[] = []) {
        super();
        this.content = content;
    }

    /** Initialize a row factory with given content */
    public static withContent<T extends Row>(
        this: { new (): T, with: typeof Row.with },
        content: ComponentFactory.SpecList) {
        return this.with({ content });
    }

    /** Initialize with given (observable) properties; returns this */
    public initializeWith: (values: Row.Initializer) => this;

    /** Default control component spacing (CSS length) */
    public static CONTROL_SPACING = "1rem";

    /** Array of elements that go into this row (observed) */
    @ComponentFactory.applyComponentsArray(ComponentFactory.CLevel.ControlElement)
    @Async.observable_not_null
    public content: Array<ControlElement | undefined>;

    /** Spacing between elements (CSS value, observed), defaults to `.CONTROL_SPACING` */
    @Async.observable_string
    public spacing = Row.CONTROL_SPACING;

    /** Vertical spacing (margin) for this row (CSS value, observed), defaults to `.spacing` if undefined/blank; not applicable if `.height` is set */
    @Async.observable
    public verticalSpacing?: string;

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

/** Represents a row containing control elements placed horizontally, with spacing set to 0 (no margin) */
export class CloseRow extends Row {
    public spacing = "0";
    public verticalSpacing = "0";
}

/** A row element with components aligned to the right */
export class OppositeRow extends Row {
    // implemented by platform dependent renderer
}

/** A row element with components aligned in the center */
export class CenterRow extends Row {
    // implemented by platform dependent renderer
}
