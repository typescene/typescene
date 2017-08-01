import Async from "../../../Async";
import { Container } from "./Container";
import { ComponentFactory } from "../ComponentFactory";
import { Component } from "../Component";

/** Represents a container with sub containers on up to four sides, and a main area with vertically stacked blocks */
export class LayoutContainer extends Container {
    /** Create a component factory for this class */
    static with: ComponentFactory.WithMethod<LayoutContainer.Initializer>;
    /** Initialize this component with given properties; returns this */
    public initializeWith: ComponentFactory.InitializeWithMethod<LayoutContainer.Initializer>;

    /** Default inside gutter width, used when inside gutter container has no defined width (CSS value, initially 18rem) */
    public static INSIDE_GUTTER_WIDTH = "18rem";

    /** Default outside gutter width, used when outside gutter container has no defined width (CSS value, initially 22rem) */
    public static OUTSIDE_GUTTER_WIDTH = "22rem";

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

    /** Inside gutter container, i.e. default on left side for left-to-right flow direction, if any (observed) */
    @ComponentFactory.applyComponentRef(ComponentFactory.CLevel.Container)
    @Async.observable
    public insideGutter?: Container;

    /** Outside gutter container, i.e. default on right side for left-to-right flow direction, if any (observed) */
    @ComponentFactory.applyComponentRef(ComponentFactory.CLevel.Container)
    @Async.observable
    public outsideGutter?: Container;

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
        if (this.insideGutter instanceof Component)
            result.push(this.insideGutter);
        if (this.outsideGutter instanceof Component)
            result.push(this.outsideGutter);
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
        /** Property initializer: inside gutter container (i.e. on the left for default ltr mode) */
        insideGutter?: ComponentFactory.SpecEltOrList | null;
        /** Property initializer: outside gutter container (i.e. on the right for default ltr mode) */
        outsideGutter?: ComponentFactory.SpecEltOrList | null;
    }
}
