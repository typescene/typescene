import Async from "../../../Async";
import { Block } from "../";
import { ControlElement } from "./ControlElement";
import { Component } from "../Component";
import { ComponentFactory } from "../ComponentFactory";

/** Represents a control element that contains a block */
@ComponentFactory.appendChildComponents(ComponentFactory.CLevel.Block)
export class BlockControl<BlockT extends Block> extends ControlElement {
    /** Create a component factory for this class */
    static with: ComponentFactory.WithMethod<BlockControl.Initializer>;
    /** Initialize this component with given properties; returns this */
    public initializeWith: ComponentFactory.InitializeWithMethod<BlockControl.Initializer>;

    /** Create a new block control element containing the given block, if any */
    constructor(block?: BlockT) {
        super();
        this.block = block;

        // apply automatic width to start with
        this.style.set("width", Async.observe(() => this.width));
    }

    /** Block element, if any (observed) */
    @ComponentFactory.applyComponentRef(ComponentFactory.CLevel.Block)
    @Async.observable
    public block?: BlockT;

    /** Overall target width of this component (CSS length; observable, directly modifies `.style` property, does _not_ retrieve actual component height, may be "auto"); if a width has not been set explicitly, or is set to "auto", then the value is taken from the width of the container */
    @Async.observable
    public get width(): string {
        // while no width set, observe container width
        return this.width ||
            this.block && this.block.width ||
            "auto";
    }
    public set width(w) {
        if (w === "auto") w = "";
        this.style.set("width", w ? w : Async.observe(() => this.width));
        this.width = w;
    }

    /** Set the block for this component (overwrites existing value, if any); returns this */
    public appendChild(c?: BlockT) {
        this.block = c;
        return this;
    }

    /** Returns an array of directly contained components (observable) */
    public getChildren(): Component[] {
        return (this.block instanceof Component) ?
            [this.block] : [];
    }
}

export namespace BlockControl {
    /** initializer for .with({ ... }) */
    export interface Initializer extends ControlElement.Initializer {
        /** Property initializer: content block */
        block?: ComponentFactory.SpecEltOrList;
    }
}
