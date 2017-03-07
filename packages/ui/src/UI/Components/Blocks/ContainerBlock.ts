import * as Async from "@typescene/async";
import { Container, LayoutContainer } from "../";
import { Component } from "../Component";
import { ComponentFactory, UIValueOrAsync } from "../ComponentFactory";
import { Block } from "./Block";

/** Represents a block with an embedded sub container within its margins/padding */
export class ContainerBlock<ContainerT extends Container> extends Block {
    /** Create a container block component with given container, if any */
    constructor(container?: ContainerT | Container) {
        super();
        this.container = container || <any>new Container();

        // apply automatic height to start with
        this.style.set("height", Async.observe(() => this.height));
    }

    /** Initialize with given (observable) properties; returns this */
    public initializeWith: (values: ContainerBlock.Initializer<ContainerT>) => this;

    /** Container element (created by constructor, but may be modified, may be undefined, defaults to a plain `Container` instance; observed) */
    @ComponentFactory.applyComponentRef(ComponentFactory.CLevel.Container)
    @Async.observable
    public container?: ContainerT;

    /** Overall target height of this component (CSS length; observable, directly modifies `.style` property, does _not_ retrieve actual component height, may be "auto"); if a height has not been set explicitly, or is set to "auto", then the value is taken from the height of the container; for `LayoutContainer`, a value of "100%" is used if the container's height is also "auto" */
    @Async.observable
    public get height(): string {
        var result = this.height;
        if (!result) {
            // while no height set, observe container height and type
            result = this.container &&
                this.container.height || "auto";
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

    /** Returns an array of directly contained components (observable) */
    public getChildren(): Component[] {
        return this.container ? [this.container] : [];
    }
}

export namespace ContainerBlock {
    /** Initializer for .with({ ... }) */
    export interface Initializer<ContainerT extends Container> extends Block.Initializer {
        /** Property initializer: container component or initializer */
        container: UIValueOrAsync<ComponentFactory<Container> | Container>
        | ComponentFactory.SpecList2;
    }
}
