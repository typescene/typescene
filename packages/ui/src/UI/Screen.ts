import * as Async from "@typescene/async";
import { Component, Page } from "./";

/** Methods for managing the available (fixed) screen space in the application viewport */
export namespace Screen {
    /** Display given view in the foreground, replacing the current page or adding to it (or to a new blank page, if none was displayed) */
    export function display(view: Component | Page) {
        if (view instanceof Page) {
            // display given page
            view.display();
        }
        else {
            // create blank page if none displayed
            var page = Page.getCurrentPage();
            if (!page) page = new Page().display();

            // remember the current page, to be able to remove this component
            // (and remove component from another page if needed)
            view.getRenderedOutputAsync().then(out => {
                var prev = out["@Screen.page"];
                if (prev && prev !== page) Screen.remove(view);
                out["@Screen.page"] = page;
            });

            // add component as content, move to back if already added
            var content = page.content;
            for (var i = 0; i < content.length; i++) {
                if (content[i] === view)
                    content.splice(i--, 1);
            }
            page.content.push(view);
        }
    }

    /** Remove given component from the page (i.e. the page it was _last displayed_ on using the `.display(...)` method) */
    export function remove(view: Component);

    /** Remove given page from the screen, if it is currently displayed */
    export function remove(view: Page);

    export function remove(view: Component | Page) {
        if (view instanceof Page) {
            // remove given page
            if (Page.getCurrentPage() === view) view.remove();
        }
        else {
            // remove given component if it belongs to the current page
            var out = view.getLastRenderedOutput();
            var page = out && out["@Screen.page"];
            if (page) {
                var content = page.content;
                for (var i = 0; i < content.length; i++) {
                    if (content[i] === view)
                        content.splice(i--, 1);
                }
                out!["@Screen.page"] = undefined;
            }
        }
    }

    /** Promise that resolves to true when ready to display the UI, after all static resources have been loaded */
    export const ready: PromiseLike<true> = new Async.Promise<true>(resolve => {
        resolveReady = resolve;
    });

    /** @internal Resolve the `.ready` promise (to be used by platform dependent code) */
    export var resolveReady: (ready: true) => void;

    /** Viewport dimensions (sealed observable object) */
    export const dimensions: Dimensions & Async.ObservableObject =
        Async.observe(Object.seal({
            width: NaN,
            height: NaN,
            get isExtraSmall(this: Dimensions) {
                return this.width < EXTRASMALL_WIDTH
            },
            get isSmall(this: Dimensions) {
                return this.width < SMALL_WIDTH
            },
            get isLarge(this: Dimensions) {
                return this.width > LARGE_WIDTH
            },
            get isExtraLarge(this: Dimensions) {
                return this.width > EXTRALARGE_WIDTH
            }
        }));

    /** Type definition for the `Screen.dimensions` observable object */
    export interface Dimensions extends Async.ObservableObject {
        /** Number of logical pixels available on horizontal axis (observable) */
        readonly width: number;

        /** Number of logical pixels available on vertical axis (observable) */
        readonly height: number;

        /** True if viewport width is less than EXTRASMALL_WIDTH; implies that .isSmall is also true (observable) */
        readonly isExtraSmall: boolean;

        /** True if viewport width is less than SMALL_WIDTH (observable) */
        readonly isSmall: boolean;

        /** True if viewport width is LARGE_WIDTH or above (observable) */
        readonly isLarge: boolean;

        /** True if viewport width is EXTRALARGE_WIDTH or above; implies that .isLarge is also true (observable) */
        readonly isExtraLarge: boolean;
    }

    /** "Extra small" horizontal root width in logical pixels, default 550 */
    export var EXTRASMALL_WIDTH = 550;

    /** "Small" horizontal root width in logical pixels, default 720 */
    export var SMALL_WIDTH = 720;

    /** "Large" horizontal root width in logical pixels, default 960 */
    export var LARGE_WIDTH = 960;

    /** "Extra large" horizontal root width in logical pixels, default 1200 */
    export var EXTRALARGE_WIDTH = 1200;
}

