import Async, { Signal } from "../Async";
import { Component, KeyboardEvent } from "./";
import { Screen } from "./Screen";

/** Next page UID */
var _nextUID = 1;

/** References the currently displayed page */
const current = new Async.ObservableValue<Page | undefined>();

/** Represents a page to be displayed on screen */
export class Page {
    /** Returns the page currently displayed on screen, if any (observable) */
    public static getCurrentPage() {
        return current.value;
    }

    /** Returns a new Page class with a constructor that creates instances of given component classes and appends them to the page content array */
    public static withContent(...componentClasses: Array<{ new (): Component }>):
        { new (): Page } {
        return class PageWithContent extends Page {
            constructor() {
                super();
                componentClasses.forEach(c => {
                    this.content.push(new c());
                });
            }
        }
    }

    /** Create a page with given content, if any */
    constructor(content: Array<Component | undefined> = []) {
        this.content = content;
    }

    /** Globally unique page identifier */
    public readonly uid = "PG" + _nextUID++;

    /** Components that are displayed on this page, each component stacked on top of the previous one along the z-axis (observed) */
    @Async.observable_not_null
    public content: Array<Component | undefined>;

    /** Returns the nearest matching child element with given ID, if any (observable) */
    public getComponentById(id: string): Component | undefined;

    /** Returns the nearest matching child element with given ID _and_ that is an instance of given class, if any (observable) */
    public getComponentById<C extends Component>(id: string,
        componentClass: typeof Component & { new (...p: any[]): C }): C | undefined;

    public getComponentById(id: string, componentClass?: any) {
        for (var c of this.content) {
            var match = c && c.getComponentById(id, componentClass);
            if (match) return match;
        }
        return undefined;
    }

    /** Returns all (recursive) child elements that are an instance of given class (observable) */
    public getComponentsByType<C extends Component>(
        componentClass: typeof Component & { new (...p: any[]): C }) {
        var result: C[] = [];
        this.content.forEach(c => {
            if (c instanceof componentClass) result.push(<C>c);
            c && c.getComponentsByType<C>(componentClass)
                .forEach(r => result.push(r));
        });
        return result;
    }

    /** Returns true if given component is a child component of this page or any of its child components (observable, but triggers re-evaluation upon every change in child [sub] components) */
    public contains(component: Component) {
        return this.content.some(c => !!c && c.contains(component));
    }

    /** Invoke the `onEsc` handler of the component closest to the foreground that defines it (usually a modal dialog container in the foreground); returns true if handler was called, otherwise does nothing and returns false */
    public handleEsc() {
        for (var i = this.content.length - 1; i >= 0; i--) {
            var component = this.content[i];
            if (component) {
                var options = component.displayOptions;
                if (options && (typeof options.onEsc === "function")) {
                    options.onEsc.call(undefined);
                    return true;
                }
            }
        }
        return false;
    }

    /** Scroll the page and all parent components of given component, such that the entire component becomes visible */
    public scrollTo(component: Component) {
        this._renderer.scrollTo(component);
    }

    /** Display this page on screen; also re-enables the page if input was blocked; replaces the currently displaying page on screen, which is removed automatically, but the result may be an empty screen if this page has no content; always waits for `Screen.ready`; returns a promise that is fulfilled when the components on this page have been rendered */
    public displayAsync(): PromiseLike<void> {
        return new Async.Promise<any>(resolve => {
            var displayed = current.value;
            if (this === displayed) {
                // this page is already displayed (or now displaying)
                resolve(undefined);
                return;
            }

            // remove current page and unblock input if needed
            displayed && displayed.remove();
            if (this._disabled) {
                this._renderer.enableInput();
                this._disabled = false;
            }
            current.value = this;

            // subscribe to an observable that depends on all page content
            var screenIsReady = Async.observe(Screen.ready);
            var resolved = false;
            this._sub = Async.observe(() => {
                if (screenIsReady.value) {
                    this._renderer.updateAsync().then(() => {
                        // resolve and emit if rendered for the first time
                        if (!resolved) {
                            resolve(undefined);
                            this.Displayed();
                        }
                    });
                }
            }).subscribe();
        });
     }

    /** Remove this page from the screen, if currently displayed; returns this */
    public remove() {
        if (this._sub) {
            // unsubscribe from content components (deferred, to allow
            // re-connection by another page immediately)
            var sub = this._sub;
            Async.defer(() => sub.clear());
            this._sub = undefined;
        }
        if (current.value === this) {
            current.value = undefined;
            this._renderer.remove();
            this.Removed();
        }

        return this;
    }

    /** Block all input events on this page, until given promise is resolved, or until page is re-displayed */
    public disable(promise?: PromiseLike<any>) {
        if (this._disabled || !this._sub) return;
        this._renderer.disableInput();
        this._disabled = true;
        if (promise) {
            promise.then(() => {
                if (this._disabled && this._sub)
                    this._renderer.enableInput();
            });
        }
    }

    /** Signal that is emitted after this page is displayed on screen */
    public readonly Displayed = Signal.create();

    /** Signal that is emitted after this page has been removed from the screen */
    public readonly Removed = Signal.create();

    /** Signal that is emitted after the content of this page has been (re-) rendered, e.g. when a component is added or removed (but not when one of the components itself is re-rendered due to changes in its own sub content, use the `Component#Rendered` signal for that) */
    // NOTE: emitted by page renderer after updating content, not here!
    public readonly Rendered = Signal.create();

    /** Signal that is emitted when a key is being pressed on the keyboard, while this page is displayed in the foreground */
    public readonly KeyDown = Signal.create<KeyboardEvent>();

    /** Layout/text flow direction for switching between left-to-right and right-to-left languages */
    @Async.observable
    public flowDirection?: "ltr" | "rtl";

    /** @internal Page renderer class, to be injected by platform dependent rendering code */
    @Async.injectable
    public Renderer: typeof PageRenderer;

    /** @internal The current page renderer instance */
    @Async.unobservable_memoize_get
    private get _renderer() {
        // create renderer (once) and forward KeyDown signal
        var result: PageRenderer = new (<any>this.Renderer)(this);
        result.KeyDown.connect(this.KeyDown);
        return result;
    }

    /** @internal Subscribed observable value, if any */
    private _sub?: Async.ObservableValue<any>;

    /** @Internal disabled state */
    private _disabled?: boolean;
}

export namespace Page {
    /** Options to be set on the `.displayOptions` object property of a component, if any, to define its positioning and behavior when displayed directly on a page */
    export interface DisplayOptions {
        /** Set to true to add a backdrop behind this component */
        shade?: boolean;

        /** Set to true to float this component on top of previous components on the page, and block input to components below */
        modal?: boolean;

        /** Set to true to keep this component on top of all other components; only relevant if `.modal` is also true */
        stayOnTop?: boolean

        /** Vertical alignment of this component relative to the page; only relevant if `.modal` is also true */
        modalVertAlign?: "top" | "middle" | "bottom";

        /** Horizontal alignment of this component relative to the page; only relevant if `.modal` is also true */
        modalHorzAlign?: "start" | "end" | "left" | "center" | "right";

        /** Margin around the side(s) of this component that are aligned to the side(s) of the screen (CSS length value, defaults to 0) */
        alignMargin?: string;

        /** Margin around the side(s) of this component that are away from the side(s) of the screen (CSS length value, defaults to 0) */
        outerMargin?: string;

        /** Flow direction: `ltr` or `rtl`, defaults to `ltr` if not set */
        flowDirection?: "ltr" | "rtl";

        /** Callback invoked when the user clicks or touches outside of this component, presses a modal-close button, or presses the escape key */
        onEsc?: () => void;
    }
}

/** @internal Platform dependent page rendering/display implementation */
export abstract class PageRenderer {
    /** Create the renderer for given page */
    constructor(page: Page) {
        this.page = page;
    }

    /** The page to be rendered */
    public readonly page: Page;

    /** Called first to display the rendered page, and then asynchronously whenever page content has changed, or to re-display the page after removing it; run within an observable getter to record dependencies, so this function must be a pure function (or run code that creates or modifies other observables wrapped inside `unobserved`) */
    public abstract updateAsync(): PromiseLike<void>;

    /** Called synchronously when the rendered page should be removed from the screen; afterwards, `.update` may be called _again_ to re-display the page */
    public abstract remove(): void;

    /** Called synchronously when input events on the rendered page should be disabled */
    public abstract disableInput(): void;

    /** Called synchronously when input events on the rendered page should be (re-) enabled */
    public abstract enableInput(): void;

    /** Implementation of the `scrollTo` method */
    public abstract scrollTo(component: Component): void;

    /** Signal that should be emitted when a key is being pressed on the keyboard, while the rendered page is displayed in the foreground */
    public readonly KeyDown = Signal.create<KeyboardEvent>();
}
