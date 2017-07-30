import Async from "../Async";
import { Component, Page } from "./";

/** Methods for managing the available (fixed) screen space in the application viewport */
export namespace Screen {
    /** Display given view in the foreground, replacing the current page or adding to it (or to a new blank page, if none was displayed); returns a promise that is fulfilled after the component is rendered */
    export function displayAsync(view: Component | Page) {
        if (view instanceof Page) {
            // display given page
            return view.displayAsync();
        }
        else {
            // create blank page if none displayed
            var page = Page.getCurrentPage() || new Page();

            // remember the current page, to be able to remove this component
            // (and remove component from another page if needed)
            var result = view.getRenderedOutputAsync().then(out => {
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

            return page.displayAsync().then(() => result);
        }
    }

    /** Returns true if given Page is currently displayed, or given Component is displayed _directly_ on the current page (i.e. not as a child component) */
    export function isDisplayed(view: Component | Page) {
        if (view instanceof Page) {
            return Page.getCurrentPage() === view;
        }
        else {
            var page = Page.getCurrentPage();
            return page && page.contains(view);
        }
    }

    /** Remove given component from the page (i.e. the page it was _last displayed_ on using the `.display(...)` method) */
    export function remove(view: Component): void;

    /** Remove given page from the screen, if it is currently displayed */
    export function remove(view: Page): void;

    export function remove(view: Component | Page) {
        if (view instanceof Page) {
            // remove given page
            if (Page.getCurrentPage() === view) view.remove();
        }
        else {
            // remove given component from the page it belongs to
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

    /** Default flow direction for all pages upon rendering (if not overridden at page or component level); this value is set asynchronously by the `App` sub module when the current `App.CultureService` changes */
    export var defaultFlowDirection: "ltr" | "rtl" | undefined;

    /** Viewport dimensions (sealed observable object) */
    export const dimensions: Dimensions & Async.ObservableObject =
        Async.observe(Object.seal({
            width: NaN,
            height: NaN,
            get isLandscape(this: Dimensions) {
                return this.width > this.height;
            },
            get isNarrow(this: Dimensions) {
                return this.width < NARROW_WIDTH
            },
            get isSmall(this: Dimensions) {
                return this.width < SMALL_WIDTH
            },
            get isWide(this: Dimensions) {
                return this.width > WIDE_WIDTH
            },
            get isExtraWide(this: Dimensions) {
                return this.width > EXTRAWIDE_WIDTH
            }
        }));

    /** Type definition for the `Screen.dimensions` observable object */
    export interface Dimensions extends Async.ObservableObject {
        /** Number of logical pixels available on horizontal axis (observable) */
        readonly width: number;

        /** Number of logical pixels available on vertical axis (observable) */
        readonly height: number;

        /** True if the width of the viewport is greater than its height */
        readonly isLandscape: boolean;

        /** True if viewport width is less than NARROW_WIDTH; implies that .isSmall is also true (observable) */
        readonly isNarrow: boolean;

        /** True if viewport width is less than SMALL_WIDTH (observable) */
        readonly isSmall: boolean;

        /** True if viewport width is WIDE_WIDTH or above (observable) */
        readonly isWide: boolean;

        /** True if viewport width is EXTRAWIDE_WIDTH or above; implies that .isWide is also true (observable) */
        readonly isExtraWide: boolean;
    }

    /** "Narrow" horizontal root width in logical pixels, default 550 */
    export var NARROW_WIDTH = 550;

    /** "Small" horizontal root width in logical pixels, default 720 */
    export var SMALL_WIDTH = 720;

    /** "Wide" horizontal root width in logical pixels, default 960 */
    export var WIDE_WIDTH = 960;

    /** "Extra wide" horizontal root width in logical pixels, default 1200 */
    export var EXTRAWIDE_WIDTH = 1200;
}

