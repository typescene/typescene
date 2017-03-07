import * as Async from "@typescene/async";
import { Row } from "../";
import { Component } from "../Component";
import { ComponentFactory,  UIValueOrAsync } from "../ComponentFactory";
import { ControlElement } from "./ControlElement";

/** Represents a stack control containing control elements with equal widths placed from top to bottom */
export class ControlStack extends ControlElement {
    /** Create a stack element with given content, if any */
    constructor(content: ControlElement[] = []) {
        super();
        this.content = content;
    }

    /** Initialize a control stack factory with given controls */
    public static withContent<T extends ControlStack>(
        this: { new (): T, with: typeof ControlStack.with },
        content: ComponentFactory.SpecList) {
        return this.with({ content });
    }

    /** Initialize with given (observable) properties; returns this */
    public initializeWith: (values: ControlStack.Initializer) => this;

    /** Controls to be displayed (observed) */
    @ComponentFactory.applyComponentsArray(ComponentFactory.CLevel.ControlElement)
    @Async.observable_not_null
    public content: Array<ControlElement | undefined>;

    /** Spacing between elements (CSS value, observed), defaults to `Row.CONTROL_SPACING` */
    @Async.observable_string
    public spacing = Row.CONTROL_SPACING;

    /** Horizontal alignment of fixed-width elements within control stack area */
    @Async.observable
    public horzAlign: "left" | "center" | "right";

    /** Set to true to shrink this component horizontally such that it occupies as little space as possible; set to false to expand horizontally within row (observed); note that shrinkwrapping a control stack with non-shrinkwrapped controls may lead to unexpected results; by default, this component observes child components and is only shrinkwrapped if all child components are shrinkwrapped */
    public shrinkwrap: boolean = <any>Async.observe(() => this.getChildren()
        .every(c => ((c instanceof ControlElement) && c.shrinkwrap)));

    /** Returns an array of directly contained components (observable) */
    public getChildren(): Component[] {
        return <Component[]>this.content.filter(c => (c instanceof Component));
    }
}

export namespace ControlStack {
    /** Initializer for .with({ ... }) */
    export interface Initializer extends ControlElement.Initializer {
        /** Property initializer: list of stacked controls */
        content?: ComponentFactory.SpecList;
        /** Property initializer: margin between controls (CSS value) */
        spacing?: UIValueOrAsync<string>;
        /** Property initializer: horizontal alignment of controls (e.g. "left", "center", "right") */
        horzAlign?: UIValueOrAsync<string>;
    }
}

/** Represents a stack containing control elements with equal width placed from top to bottom, with spacing set to 0 (no margin) */
export class CloseControlStack extends ControlStack {
    public spacing = "0";
}
