import * as Async from "@typescene/async";
import { Block } from "../";
import { Component } from "../Component";
import { ComponentFactory } from "../ComponentFactory";

/** Represents a card block containing a header, content, and a footer */
export class Card extends Block {
    /** Create a card block with given content, if any */
    constructor(content: Block[] = []) {
        super();
        this.content = content;
    }

    /** Initialize a card block factory with given content */
    public static withContent<T extends Card>(
        this: { new (): T, with: typeof Card.with },
        content: ComponentFactory.SpecList2) {
        return this.with({ content });
    }

    /** Initialize with given (observable) properties; returns this */
    public initializeWith: (values: Card.Initializer) => this;

    /** Block to be displayed as a header, may be undefined (observed) */
    @ComponentFactory.applyComponentRef(ComponentFactory.CLevel.Block)
    @Async.observable
    public header?: Block;

    /** Block to be displayed as a footer, may be undefined (observed) */
    @ComponentFactory.applyComponentRef(ComponentFactory.CLevel.Block)
    @Async.observable
    public footer?: Block;

    /** Array of main content blocks, stacked top to bottom (observed) */
    @ComponentFactory.applyComponentsArray(ComponentFactory.CLevel.Block)
    @Async.observable_not_null
    public content: Array<Block | undefined>;

    /** Returns an array of directly contained components (observable) */
    public getChildren(): Component[] {
        var result = <Component[]>this.content.filter(c => (c instanceof Component));
        if (this.header instanceof Component) result.unshift(this.header);
        if (this.footer instanceof Component) result.push(this.footer);
        return result;
    }
}

export namespace Card {
    /** Initializer for .with({ ... }) */
    export interface Initializer extends Block.Initializer {
        /** Property initializer: content blocks */
        content?: ComponentFactory.SpecList2;
        /** Property initializer: header block */
        header?: ComponentFactory.SpecEltOrList;
        /** Property initializer: footer block */
        footer?: ComponentFactory.SpecEltOrList;
    }
}
