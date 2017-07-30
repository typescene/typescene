import Async from "../../../Async";
import { Style } from "../../Style";
import { ComponentFactory, UIValueOrAsync } from "../ComponentFactory";
import { TextLabelFactory } from "../TextLabelFactory";
import { ControlElement } from "./ControlElement";

/** Represents an image control */
export class Image extends ControlElement {
    /** Create an image element */
    constructor(imageUrl = "") {
        super();
        this.imageUrl = imageUrl;
    }

    /** Initialize an image control with given URL */
    public static withUrl<T extends typeof Image>(this: T,
        imageUrl: UIValueOrAsync<string>) {
        return this.with({ imageUrl });
    }

    /** Initialize with given (observable) properties; returns this */
    public initializeWith: (values: Image.Initializer) => this;

    /** Image URL (observed) */
    @Async.observable_string
    public imageUrl: string;

    /** Tooltip text (observed) */
    @Async.observable_string
    public tooltipText: string;

    /** Set to false to expand horizontally within row (observed) */
    public shrinkwrap = true;

    /** Encapsulation of image element style (observed) */
    @Async.observable_not_null
    public readonly style_img = new Style();

    /** True if a load error occurred (observable) */
    @Async.observable
    public hasError = false;

    /** Promise that resolves when the image is loaded, or if an error occurred (see .hasError) */
    public ready: PromiseLike<void> = new Async.Promise<void>(resolve => {
        this.resolveReady = <any>resolve;
    });

    /** @internal Resolve the `.ready` promise (to be used by platform dependent renderer); set to undefined when promise has been resolved */
    public resolveReady?: () => void;
}

export namespace Image {
    /** Initializer for .with({ ... }) */
    export interface Initializer extends ControlElement.Initializer {
        /** Property initializer: image URL */
        imageUrl?: UIValueOrAsync<string>;
        /** Property initializer: image element style */
        style_img?: UIValueOrAsync<Style | Style.StyleSet>;
        /** Property initializer: tooltip text */
        tooltipText?: UIValueOrAsync<string | TextLabelFactory>;
    }
}
