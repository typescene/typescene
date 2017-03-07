import * as Async from "@typescene/async";
import { Style } from "../../../Style";
import { Image } from "../../../Components/Controls/Image";
import { mapComponentRenderer } from "../../../Components/ComponentRenderer";
import { DOM } from "../../DOM";
import { Renderer as ControlRenderer } from "./ControlElement";

/** Base class name used for CSS style sheet */
const CSS_CLASS = "UI-Image";

/** @internal DOM-specific component renderer */
@mapComponentRenderer(Image)
export class Renderer<T extends Image> extends ControlRenderer<T> {
    /** Instantiate the renderer for given component */
    constructor(component: T) {
        super(component);

        // create image element
        var img = this.img = document.createElement("img");
        this.element.appendChild(img);

        // add style watcher
        this.watch(() => DOM.applyStyleTo(component.style_img, img));
    }

    /** Generate rendered component output */
    protected render() {
        // get or create the current output object
        var out = super.render();
        out.liveElement = this.img;
        var component = this.component;

        // create a new promise if needed
        if (!component.resolveReady) {
            component.ready = new Async.Promise<void>(resolve => {
                component.resolveReady = <any>resolve;
            });
        }

        // set image event handlers and then set (new) URL
        this.img.onload = () => {
            component.hasError = false;
            component.resolveReady && component.resolveReady();
            component.resolveReady = undefined;
        };
        this.img.onerror = () => {
            component.hasError = true;
            component.resolveReady && component.resolveReady();
            component.resolveReady = undefined;
        };
        this.img.src = component.imageUrl;

        // set tooltip text
        if (component.tooltipText !== undefined)
            this.img.title = component.tooltipText;

        return out;
    }

    /** The image DOM element */
    protected img: HTMLImageElement;
}

// Add style override and apply style sheet
Image.addStyleOverride(Style.withClass(CSS_CLASS));
DOM.CSS.define("UI-Control " + CSS_CLASS, {
    ".~~ > img": {
        margin: "0",
        outline: "0",
        maxWidth: "100%",
        height: "auto"
    }
});
