import Async from "../../../Async";
import { Page } from "../../Page";
import { Screen } from "../../Screen";
import { Block, List, ComponentSignal } from "../";
import { Component } from "../Component";
import { ComponentFactory, UIValueOrAsync } from "../ComponentFactory";

/** Represents a container with vertically stacked blocks */
@ComponentFactory.appendChildComponents(ComponentFactory.CLevel.Block)
export class Container extends Component {
    /** Create a container with given content, if any */
    constructor(content: Block[] = []) {
        super();
        this.content = content;

        // containers are not focusable by default:
        this.focusMode = Component.FocusMode.None;
    }

    /** Initialize with given (observable) properties; returns this */
    public initializeWith: (values: Container.Initializer) => this;

    /** Array of main content blocks, stacked top to bottom (observed) */
    @ComponentFactory.applyComponentsArray(ComponentFactory.CLevel.Block)
    @Async.observable_not_null
    public content: Array<Block | undefined>;

    /** Vertical positioning of main content area within the outer boundaries of the container (observed), defaults to "top" if not defined */
    @Async.observable
    public vertAlign?: "top" | "middle" | "bottom";

    /** Horizontal positioning of main content area within the outer boundaries of the container (observed), defaults to "center" if not defined; may lead to unexpected results if the contained blocks are of different widths */
    @Async.observable
    public horzAlign?: "start" | "end" | "left" | "center" | "right";

    /** Max width of main content (observed); leave this blank to remove content width limitations */
    @Async.observable_string
    public maxContentWidth: string;

    /** Set to true to make content within container scrollable; defaults to false (observed) */
    @Async.observable
    public scrollable?: boolean;

    /** Flag that becomes true when the container content is scrolled all the way to the top (observable); scroll position is continuously monitored after this value is read once */
    @Async.observable
    public get scrolledToTop(): boolean | undefined {
        if (!this._scrolledToTop) this._monitorPlatformScroll();
        return this._scrolledToTop!.value;
    }
    private _scrolledToTop?: Async.ObservableValue<boolean>;

    /** Flag that becomes true when the container content is scrolled all the way to the bottom, or to the threshold defined by `.scrollBottomThreshold` (observable); scroll position is continuously monitored after this value is read once */
    @Async.observable
    public get scrolledToBottom(): boolean | undefined {
        if (!this._scrolledToBottom) this._monitorPlatformScroll();
        return this._scrolledToBottom!.value;
    }
    private _scrolledToBottom?: Async.ObservableValue<boolean>;

    /** Flag that becomes true when the container content is scrolled all the way to the left (observable); scroll position is continuously monitored after this value is read once */
    @Async.observable
    public get scrolledToLeft(): boolean | undefined {
        if (!this._scrolledToLeft) this._monitorPlatformScroll();
        return this._scrolledToLeft!.value;
    }
    private _scrolledToLeft?: Async.ObservableValue<boolean>;

    /** Flag that becomes true when the container content is scrolled all the way to the right (observable); scroll position is continuously monitored after this value is read once */
    @Async.observable
    public get scrolledToRight(): boolean | undefined {
        if (!this._scrolledToRight) this._monitorPlatformScroll();
        return this._scrolledToRight!.value;
    }
    private _scrolledToRight?: Async.ObservableValue<boolean>;

    /** Bottom scroll threshold in pixels away from the bottom of this container: when reached this position, the `.scrolledToBottom` property is set (observed, but does not directly influence current property values); can be used e.g. to trigger lazy loading of list items or trigger footer display */
    @Async.observable
    public scrollBottomThreshold?: number;

    /** Top scroll threshold in pixels away from the top of this container: when reached this position, the `.scrolledToTop` property is set (observed, but does not directly influence current property values); can be used e.g. to trigger lazy loading of list items or trigger header display */
    @Async.observable
    public scrollTopThreshold?: number;

    /** Signal emitted when the container content is scrolled up (i.e. content moves down relative to the viewable area of the container), only once on first scroll or after changing direction; scroll position is continuously monitored only after this signal is connected to */
    @Async.unobservable_memoize_get
    public get ScrolledUp(): ComponentSignal.Emittable<any> {
        if (!this._scrolledToTop) this._monitorPlatformScroll();
        return this.createComponentSignal();
    }

    /** Signal emitted when the container content is scrolled down (i.e. content moves up relative to the viewable area of the container), only once on first scroll or after changing direction; scroll position is continuously monitored only after this signal is connected to */
    @Async.unobservable_memoize_get
    public get ScrolledDown(): ComponentSignal.Emittable<any> {
        if (!this._scrolledToTop) this._monitorPlatformScroll();
        return this.createComponentSignal();
    }

    /** Object with options to be used when displaying this container as a page component, initially undefined (observed) */
    @Async.observable
    public displayOptions?: Page.DisplayOptions;

    /** @internal True if initialized with `.focusFirst` flag, to focus the first focusable element within this container when rendered */
    public focusFirst?: boolean;

    /** Returns true if this container contains a List component without items, optionally of given type (observable if used in getter); useful as a shortcut in a getter for .hidden on a "blank-slate" block */
    public hasEmptyList(listComponentClass: typeof List = List) {
        return this.getComponentsByType(listComponentClass)
            .some(l => !(l.items && l.items.length));
    }

    /** Append a block to this container; returns this */
    public appendChild(block?: Block) {
        this.content.push(block);
        return this;
    }

    /** Returns an array of directly contained components (observable) */
    public getChildren(): Component[] {
        return <Component[]>this.content.filter(c => (c instanceof Component));
    }

    /** @internal Monitor scroll position to keep _scrolledToTop and _scrolledToBottom updated */
    private _monitorPlatformScroll() {
        Async.unobserved(() => {
            this._scrolledToTop = new Async.ObservableValue<boolean>();
            this._scrolledToBottom = new Async.ObservableValue<boolean>();
            this._scrolledToLeft = new Async.ObservableValue<boolean>();
            this._scrolledToRight = new Async.ObservableValue<boolean>();
            var oldTop: number | undefined, wasUp = false, wasDown = false;
            var atTop: boolean, atBottom: boolean;
            var atLeft: boolean, atRight: boolean;
            this["@monitorPlatformScroll"]((t, b, l, r) => {
                // emit signal for scroll direction if needed
                if (t > oldTop! && !wasDown) {
                    wasDown = true, wasUp = false;
                    this.ScrolledDown();
                }
                else if (t < oldTop! && !wasUp) {
                    wasUp = true, wasDown = false;
                    this.ScrolledUp();
                }
                oldTop = t;

                // set observable top flag only if changed
                var tThr = this.scrollTopThreshold || 0;
                if (t <= tThr && !atTop)
                    this._scrolledToTop!.value = atTop = true;
                else if (t > tThr && atTop !== false)
                    this._scrolledToTop!.value = atTop = false;

                // set observable bottom flag only if changed
                var bThr = this.scrollBottomThreshold || 0;
                if (b <= bThr && !atBottom)
                    this._scrolledToBottom!.value = atBottom = true;
                else if (b > bThr && atBottom !== false)
                    this._scrolledToBottom!.value = atBottom = false;

                // set observable left flag only if changed
                if (l <= 0 && !atLeft)
                    this._scrolledToLeft!.value = atLeft = true;
                else if (l > 0 && atLeft !== false)
                    this._scrolledToLeft!.value = atLeft = false;

                // set observable right flag only if changed
                if (r <= 0 && !atRight)
                    this._scrolledToRight!.value = atRight = true;
                else if (r > 0 && atRight !== false)
                    this._scrolledToRight!.value = atRight = false;
            });
        });
    }

    /** @internal Register callback to be called with current and following vertical scroll positions; injected by platform renderer */
    @Async.injectable
    public ["@monitorPlatformScroll"](
        callback: (t: number, b: number, l: number, r: number) => void) {
        // do nothing if not injected
    }
}

/** Represents a container with blocks that are laid out horizontally (just like text), automatically spanning multiple rows if necessary */
export class FlowContainer extends Container {
    // nothing else here
}

export namespace Container {
    /** Initializer for .with({ ... }) */
    export interface Initializer extends Component.Initializer {
        /** Property initializer: content blocks */
        content?: ComponentFactory.SpecList2;
        /** Property initializer: vertical positioning of main content area ("top", "middle", "bottom") */
        vertAlign?: UIValueOrAsync<string>;
        /** Property initializer: horizontal positioning of main content area ("start", "end", "left", "center", "right") */
        horzAlign?: UIValueOrAsync<string>;
        /** Property initializer: maximum content width */
        maxContentWidth?: UIValueOrAsync<string>;
        /** Property initializer: true for scrollable content area */
        scrollable?: UIValueOrAsync<boolean>;
        /** Property initializer: scroll-top threshold distance in pixels */
        scrollTopThreshold?: UIValueOrAsync<number>;
        /** Property initializer: scroll-bottom threshold distance in pixels */
        scrollBottomThreshold?: UIValueOrAsync<number>;
        /** Property initializer: display options (for use when displayed directly on the page) */
        displayOptions?: Page.DisplayOptions;
        /** Property initializer: true to focus first component on render */
        focusFirst?: UIValueOrAsync<boolean>;
    }
}
