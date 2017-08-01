import { ComponentFactory, UIValueOrAsync } from "../ComponentFactory";
import { ControlElement } from "./ControlElement";

/** Represents an empty control element to take up horizontal space within a row */
export class Spacer extends ControlElement {
    /** Create a component factory for this class */
    static with: ComponentFactory.WithMethodNoContent<Spacer.Initializer>;

    /** Initialize a spacer control factory with given size (CSS lengths); also sets `.shrinkwrap` to true if a width is given */
    public static withSize<T extends typeof Spacer>(this: T,
        width?: UIValueOrAsync<string>,
        height?: UIValueOrAsync<string>) {
        return this.with(width ?
            { width, height, shrinkwrap: true } :
            { height });
    }
    
    /** Initialize this component with given properties; returns this */
    public initializeWith: ComponentFactory.InitializeWithMethod<Spacer.Initializer>;

    /** Create a spacer element with given height (default 1px) */
    constructor(height = "1px") {
        super();
        this.height = height;
    }
}

export namespace Spacer {
    /** Initializer for .with({ ... }) */
    export interface Initializer extends ControlElement.Initializer {
        // nothing here
    }
}
