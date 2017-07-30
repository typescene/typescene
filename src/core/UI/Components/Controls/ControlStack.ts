import Async from "../../../Async";
import { Row } from "../";
import { Component } from "../Component";
import { ComponentFactory,  UIValueOrAsync } from "../ComponentFactory";
import { ControlElement } from "./ControlElement";

/** Represents a stack control containing control elements with equal widths placed from top to bottom */
@ComponentFactory.appendChildComponents(ComponentFactory.CLevel.ControlElement)
export class ControlStack extends ControlElement {
    /** Create a stack element with given content, if any */
    constructor(content: ControlElement[] = []) {
        super();
        this.content = content;
    }

    /** Initialize with given (observable) properties; returns this */
    public initializeWith: (values: ControlStack.Initializer) => this;

    /** Controls to be displayed (observed) */
    @ComponentFactory.applyComponentsArray(ComponentFactory.CLevel.ControlElement)
    @Async.observable_not_null
    public content: Array<ControlElement | undefined>;

    /** Spacing between elements (CSS value, platform default used if empty, observed) */
    @Async.observable_string
    public spacing: string;

    /** Horizontal alignment of fixed-width elements within control stack area */
    @Async.observable
    public horzAlign: "start" | "end" | "left" | "center" | "right";

    /** Set to true to shrink this component horizontally such that it occupies as little space as possible; set to false to expand horizontally within row (observed); note that shrinkwrapping a control stack with non-shrinkwrapped controls may lead to unexpected results; by default, this component observes child components and is only shrinkwrapped if all child components are shrinkwrapped */
    public shrinkwrap: boolean = <any>Async.observe(() => this.getChildren()
        .every(c => ((c instanceof ControlElement) && c.shrinkwrap)));

    /** Append a control to this stack; returns this */
    public appendChild(control?: ControlElement) {
        this.content.push(control);
        return this;
    }

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
        /** Property initializer: horizontal alignment of controls ("start", "end", "left", "center", "right") */
        horzAlign?: UIValueOrAsync<string>;
    }
}

/** Represents a stack containing control elements with equal width placed from top to bottom, with spacing set to 0 (no margin) */
export class CloseControlStack extends ControlStack {
    public spacing = "0";
}
