import Async from "../../../Async";
import { Container } from "../";
import { Component } from "../Component";
import { ComponentFactory,  UIValueOrAsync } from "../ComponentFactory";
import { ComponentRenderer } from "../ComponentRenderer";
import { ComponentSignalHandler, ComponentSignal } from "../ComponentSignal";
import { TextLabelFactory } from "../TextLabelFactory";
import { Block } from "./Block";
import { ContainerBlock } from "./ContainerBlock";

/** Represents a list of tabs or links */
export class NavList extends Block {
    /** Create a component factory for this class */
    static with: ComponentFactory.WithMethodNoContent<NavList.Initializer>;
    /** Initialize this component with given properties; returns this */
    public initializeWith: ComponentFactory.InitializeWithMethod<NavList.Initializer>;

    /** Create a navigation list component */
    constructor(navItems: NavList.NavItem[] = [], type?: NavList.Type,
        selectedIndex = -1) {
        super();
        this.navItems = navItems;
        if (type !== undefined) this.type = type;
        this.selectedIndex = selectedIndex;
    }

    /** Method that is called immediately after the renderer for this component is constructed; adds observers for nav item selection */
    protected beforeFirstRender(renderer: ComponentRenderer<this, any>) {
        super.beforeFirstRender(renderer);

        // watch for changes to selected item
        renderer.watch(() => {
            var index = this.selectedIndex;
            var item = (index >= 0 && index < this.navItems.length) ?
                this.navItems[index!] : undefined;

            // find (or possibly create) container
            var container = item && item.container;
            if (container &&
                (<ComponentFactory<any>>container).isComponentFactory) {
                // keep current container if possible, otherwise create
                container =
                    ((<ComponentFactory<any>>container).componentFactoryId ===
                        this._factoryUID) ?
                        this._containerBlock.container :
                    Async.unobserved(() => new (<ComponentFactory<any>>container)());
                this._factoryUID =
                    (<ComponentFactory<any>>container).componentFactoryId;
            }
            else {
                // reset stored factory UID if not created from factory
                this._factoryUID = undefined;
            }

            return {
                index: item ? index! : -1,
                key: item && item.key,
                container: <Container>container
            };
        }, change => {
            // set current container as container block content
            this._containerBlock.container = change.container;

            // emit change signal
            this.NavChange(change);
        });

        // watch for targets activated externally (e.g. URL, activities)
        renderer.watch(() => {
            var selectedIndex = this.selectedIndex;
            this.navItems.forEach((item, index) => {
                if (index !== selectedIndex &&
                    this._activation.isActive(item.target)) {
                    // select item activated externally
                    Async.unobserved(() => {
                        this.selectedIndex = index;
                    });
                }
            });
        });
    }

    /** Nav labels, icons, and badges (observed) */
    @Async.observable_not_null
    public navItems: NavList.NavItem[];

    /** Space reserved for icons (rem units), if > 0 (observed) */
    @Async.observable
    public remGutter: number;

    /** Index of selected nav item (base 0), or -1 if no selection (observed); does not automatically activate nav item targets; to do so, use the `.activate(...)` function instead */
    @ComponentFactory.applyAsync
    @Async.observable
    public get selectedIndex(): number {
        // return last selected index (manually, async from beforeFirstRender,
        // or return the observable value given to setter below)
        return this.selectedIndex;
    }
    public set selectedIndex(i) {
        var value: number;
        if ((<any>i instanceof Async.ObservableValue)) {
            this._observableSelectedIndex = <any>i;
            this.selectedIndex = i;
        }
        else {
            // use -1 for any other invalid value
            if (i < 0 || i >= this.navItems.length || !this.navItems[i])
                i = -1;

            // update underlying value or set observable value
            if (this._observableSelectedIndex) {
                if (this._observableSelectedIndex.writable)
                    this._observableSelectedIndex.value = i;
            }
            else {
                // no observable bound, just set own value
                this.selectedIndex = i;
            }
            value = i;
        }
    }
    private _observableSelectedIndex?: Async.ObservableValue<number>;

    /** Key (string value) of selected item, if any (read-only, observable) */
    public get selectedKey() {
        // find selected item and return its key, if any
        var index = this.selectedIndex;
        var item = (index >= 0 && index < this.navItems.length) ?
            this.navItems[index!] : undefined;
        return item ? item.key : undefined;
    }

    /** Type of nav: tabs or pills, inline or stacked; default tabs (observed) */
    @Async.observable
    public type: NavList.Type = NavList.Type.Tabs;

    /** Set to true to fill all horizontal space */
    @Async.observable
    public justified: boolean;

    /** Select nav item by index or key, display associated container if any, and/or start associated activity if any; returns this */
    @ComponentFactory.applyAsync
    @ComponentFactory.setterFor("activate")
    public activate(selection: number | string) {
        var index: number = (typeof selection === "string") ?
            this.navItems.reduce((v, item, i) =>
                item.key == selection ? i : v, -1) :
            selection;
        var item = (index >= 0 && index < this.navItems.length) ?
            this.navItems[index] : undefined;
        if (!item) {
            // no active selection
            this.selectedIndex = -1;
        }
        else {
            // set selected index
            this.selectedIndex = index;

            // activate item using Application instance
            if (item.target) this._activation.activate(item.target);
        }
        return this;
    }

    /** Returns an array of directly contained components (observable) */
    public getChildren(): Component[] {
        return this._containerBlock.container ? [this._containerBlock] : [];
    }

    /** Signal emitted when the selected nav item changes, while displayed on screen */
    public readonly NavChange = this.createComponentSignal(NavList.SelectionSignal);

    /** Container block that contains the container for currently selected item, if any */
    private _containerBlock = new ContainerBlock();

    /** Factory UID of the factory that created the current container, or undefined if container was not created using a factory */
    private _factoryUID?: string;

    /** Activation instance, with injected methods */
    private _activation = new NavList.Activation();
}

export namespace NavList {
    /** Contains injectable methods for activating targets and querying activation state; instantiated by `NavList` */
    export class Activation {
        /** Injectable method to activate given target (e.g. URL, or Activity instance or class); default ony handles URLs, `Application` instance injects more functionality here */
        @Async.injectable
        public activate(target: any) { /* ignore */ }

        /** Injectable method that returns true (observable) if and when given target matches the current target, i.e. URL/path matches, or activity/class matches current activity or one of its parent activities; this method is called from within an observable context to be able to observe changes to target states */
        @Async.injectable
        public isActive(target: any) { return false }
    }

    /** Represents an item in a navigation list (tab or link) */
    export interface NavItem {
        /** Text label */
        label?: string | TextLabelFactory;
        /** Icon (see `Label` component) */
        icon?: string;
        /** Badge text */
        badge?: string;
        /** Key (identifier string) of the item, used to populate `NavList/selectedKey` */
        key?: string;
        /** Container to be displayed below tabs/links when this item is selected */
        container?: Container | ComponentFactory<Container>;
        /** URL/path string, or (App module) `Activity` instance or `Activity` class that will be activated when this item is selected; also, the item will be automatically selected if/when its target is active (i.e. URL/path matches, or activity/class matches current activity or one of its parent activities) */
        target?: any;
    };

    /** NavList display type */
    export enum Type {
        /** Display as a row of tabs */
        Tabs,
        /** Display as a row of pills */
        Pills,
        /** Display as a list of pills */
        StackedPills
    };

    /** Initializer for .with({ ... }) */
    export interface Initializer extends Block.Initializer {
        /** Property initializer: navlist items */
        navItems?: UIValueOrAsync<NavList.NavItem[]>;
        /** Property initializer: initial item index */
        selectedIndex?: UIValueOrAsync<number>;
        /** Initializer: activate item automatically, by index or key */
        activate?: number | string;
        /** Property initializer: nav display type */
        type?: UIValueOrAsync<NavList.Type>;
        /** Property initializer: true to fill all horizontal space */
        justified?: UIValueOrAsync<boolean>;
        /** Signal initializer: method name or handler */
        NavChange?: string | NavListSelectionHandler;
    }

    /** Data that is emitted when a navlist's selection changes */
    export interface SelectionEvent {
        /** The new selection index */
        index: number;
        /** The new selection key, if any */
        key?: string;
        /** The container to be displayed, if any */
        container?: Container;
    }

    /** Signal that is emitted when a navlist's selection changes */
    export class SelectionSignal
        extends ComponentSignal<SelectionEvent> { }
}

/** Constructor for a navlist selection event handler */
export class NavListSelectionHandler
    extends ComponentSignalHandler<NavList.SelectionEvent> { }
