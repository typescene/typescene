import Async from "../../../Async";
import { Component } from "../Component";
import { ComponentFactory, UIValueOrAsync } from "../ComponentFactory";

/** UI control element base class */
export abstract class ControlElement extends Component {
    /** Create a component factory for this class */
    static with: ComponentFactory.WithMethodNoContent<ControlElement.Initializer>;
    /** Initialize this component with given properties; returns this */
    public initializeWith: ComponentFactory.InitializeWithMethod<ControlElement.Initializer>;

    /** Width (CSS length), default "auto" (observed) */
    @Async.observable_string
    public width = "auto";

    /** Set to true to shrink this element to use as little horizontal space as possible in a row; set to false to expand (observed) */
    @Async.observable
    public shrinkwrap = false;

    /** Set to true to automatically break text across lines (observed) */
    @Async.observable
    public wrapText = false;
}

export namespace ControlElement {
    /** Initializer for .with({ ... }) */
    export interface Initializer extends Component.Initializer {
        /** Property initializer: target width of this component (CSS length) */
        width?: UIValueOrAsync<string>;
        /** Property initializer: true to occupy as little horizontal space as possible */
        shrinkwrap?: UIValueOrAsync<boolean>;
        /** Property initializer: true to focus this component */
        hasFocus?: UIValueOrAsync<boolean>;
    }
}
