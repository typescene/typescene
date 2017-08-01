import Async from "../../../Async";
import { Container, LayoutContainer } from "../";
import { Component } from "../Component";
import { UIValueOrAsync,  ComponentFactory } from "../ComponentFactory";
import { ControlElement } from "./ControlElement";

/** Represents a control element that contains a container */
@ComponentFactory.appendChildComponents(ComponentFactory.CLevel.Container)
export class ContainerControl<ContainerT extends Container> extends ControlElement {
    /** Create a component factory for this class */
    static with: ComponentFactory.WithMethod<ContainerControl.Initializer>;
    /** Initialize this component with given properties; returns this */
    public initializeWith: ComponentFactory.InitializeWithMethod<ContainerControl.Initializer>;

    /** Create a container control element that contains the given container, if any */
    constructor(container?: ContainerT) {
        super();
        if (container) this.container = container;

        // apply automatic height and width to start with
        this.style.set("height", Async.observe(() => this.height));
        this.style.set("width", Async.observe(() => this.width));
    }

    /** Container element (created if not set, never undefined; observed); if set to a container (other than LayoutContainer) with maxContentWidth other than auto, and this control's width is set to auto, this control will shrinkwrap to the same width as the container */
    @ComponentFactory.applyComponentRef(ComponentFactory.CLevel.Container)
    @Async.observable
    public get container(): ContainerT {
        // get underlying property or create a new container
        return this.container || (this.container = Async.unobserved(
            () => <any>new Container()));
    }
    public set container(c: ContainerT) {
        // set underlying property
        this.container = c;
    }

    /** Overall target height of this component (CSS length; observable, directly modifies `.style` property, does _not_ retrieve actual component height, may be "auto"); if a height has not been set explicitly, or is set to "auto", then the value is taken from the height of the container; for `LayoutContainer`, a value of "100%" is used if the container's height is also "auto" */
    @Async.observable
    public get height(): string {
        var result = this.height;
        if (!result) {
            // while no height set, observe container height and type
            result = this.container && this.container.height || "auto";
            if ((this.container instanceof LayoutContainer) &&
                result === "auto")
                result = "100%";
        }
        return result;
    }
    public set height(h) {
        if (h === "auto") h = "";
        this.style.set("height", h ? h : Async.observe(() => this.height));
        this.height = h;
    }

    /** Overall target width of this component (CSS length; observable, directly modifies `.style` property, does _not_ retrieve actual component height, may be "auto"); if a width has not been set explicitly, or is set to "auto", then the value is taken from the width of the container */
    @Async.observable
    public get width(): string {
        // while no width set, observe container width
        return this.width ||
            this.container && this.container.width ||
            "auto";
    }
    public set width(w) {
        if (w === "auto") w = "";
        this.style.set("width", w ? w : Async.observe(() => this.width));
        this.width = w;
    }

    /** Set the container for this component (overwrites existing value, if any); returns this */
    public appendChild(c?: ContainerT) {
        this.container = c!;
        return this;
    }

    /** Returns an array of directly contained components (observable) */
    public getChildren(): Component[] {
        return (this.container instanceof Component) ?
            [this.container] : [];
    }
}

export namespace ContainerControl {
    /** Initializer for .with({ ... }) */
    export interface Initializer extends ControlElement.Initializer {
        /** Property initializer: wrapped container */
        container?: UIValueOrAsync<ComponentFactory<Container> | Container>
        | ComponentFactory.SpecList2;
    }
}
