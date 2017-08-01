import Async from "../../../Async";
import { Container, LayoutContainer } from "../";
import { Component } from "../Component";
import { ComponentFactory, UIValueOrAsync } from "../ComponentFactory";
import { Block } from "./Block";

/** Represents a block with an embedded sub container within its margins/padding */
@ComponentFactory.appendChildComponents(ComponentFactory.CLevel.Container)
export class ContainerBlock<ContainerT extends Container> extends Block {
    /** Create a component factory for this class */
    static with: ComponentFactory.WithMethod<ContainerBlock.Initializer<Container>>;
    /** Initialize this component with given properties; returns this */
    public initializeWith: ComponentFactory.InitializeWithMethod<ContainerBlock.Initializer<ContainerT>>;

    /** Create a container block component with given container, if any */
    constructor(container?: ContainerT) {
        super();
        if (container) this.container = container;

        // apply automatic height to start with
        this.style.set("height", Async.observe(() => this.height));
    }

    /** Container element (created if not set, never undefined; observed) */
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

    /** Set the container for this component (overwrites existing value, if any); returns this */
    public appendChild(c?: ContainerT) {
        this.container = c!;
        return this;
    }

    /** Returns an array of directly contained components (observable) */
    public getChildren(): Component[] {
        return [this.container];
    }
}

export namespace ContainerBlock {
    /** Initializer for .with({ ... }) */
    export interface Initializer<ContainerT extends Container> extends Block.Initializer {
        /** Property initializer: container component or initializer */
        container?: UIValueOrAsync<ComponentFactory<ContainerT> | ContainerT>
        | ComponentFactory.SpecList2;
    }
}
