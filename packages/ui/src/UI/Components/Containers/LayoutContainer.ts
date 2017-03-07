import * as Async from "@typescene/async";
import { Container } from "./Container";
import { ComponentFactory } from "../ComponentFactory";
import { Component } from "../Component";

/** Represents a container with sub containers on up to four sides, and a main area with vertically stacked blocks */
export class LayoutContainer extends Container {
    /** Initialize with given (observable) properties; returns this */
    public initializeWith: (values: LayoutContainer.Initializer) => this;

    /** Default left gutter width, used when left gutter container has no defined width (CSS value, initially 18rem) */
    public static LEFT_GUTTER_WIDTH = "18rem";

    /** Default right gutter width, used when right gutter container has no defined width (CSS value, initially 22rem) */
    public static RIGHT_GUTTER_WIDTH = "22rem";

    /** Default header height, used when header container has no defined height (CSS value, initially 4rem) */
    public static HEADER_HEIGHT = "4rem";

    /** Default footer height, used when footer container has no defined height (CSS value, initially 2rem) */
    public static FOOTER_HEIGHT = "2rem";

    /** Header container, if any (observed) */
    @ComponentFactory.applyComponentRef(ComponentFactory.CLevel.Container)
    @Async.observable
    public header?: Container;

    /** Footer container, if any (observed) */
    @ComponentFactory.applyComponentRef(ComponentFactory.CLevel.Container)
    @Async.observable
    public footer?: Container;

    /** Left gutter container, if any (observed) */
    @ComponentFactory.applyComponentRef(ComponentFactory.CLevel.Container)
    @Async.observable
    public leftGutter?: Container;

    /** Right gutter container, if any (observed) */
    @ComponentFactory.applyComponentRef(ComponentFactory.CLevel.Container)
    @Async.observable
    public rightGutter?: Container;

    /** Set to true to make content within container scrollable; defaults to true for `LayoutContainer` (observed) */
    @Async.observable
    public scrollable?: boolean = true;

    /** Returns an array of directly contained components (observable) */
    public getChildren(): Component[] {
        var result = super.getChildren();
        if (this.header instanceof Component)
            result.push(this.header);
        if (this.footer instanceof Component)
            result.push(this.footer);
        if (this.leftGutter instanceof Component)
            result.push(this.leftGutter);
        if (this.rightGutter instanceof Component)
            result.push(this.rightGutter);
        return result;
    }
}

export namespace LayoutContainer {
    /** Initializer for .with({ ... }) */
    export interface Initializer extends Container.Initializer {
        /** Property initializer: header container */
        header?: ComponentFactory.SpecEltOrList | null;
        /** Property initializer: footer container */
        footer?: ComponentFactory.SpecEltOrList | null;
        /** Property initializer: left side container */
        leftGutter?: ComponentFactory.SpecEltOrList | null;
        /** Property initializer: right side container */
        rightGutter?: ComponentFactory.SpecEltOrList | null;
    }
}
