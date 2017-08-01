import Async from "../../../Async";
import { Screen, Component, ControlElement, Container, Row, DrawerContainer, ComponentFactory } from "../../../UI";
import { layoutFragment } from "../ViewLayout";
import { VerticalLayout, ScrollableLayout } from "./Single";

/** Represents the top header row of an application page, contains only one Row instance; all content passed into the initializer is automatically added to this row, not the container itself */
@ComponentFactory.appendChildComponents(ComponentFactory.CLevel.ControlElement, true)
export class AppBarLayout extends Container.with(Row.with({ height: "100%" })) {
    public appendChild(child: Component) {
        // find (first) Row instance and append there if possible
        if (this.content.length && (child instanceof ControlElement)) {
            var row = this.getComponentsByType(Row)[0];
            if (row) row.appendChild(<any>child);
        }
        else if (child instanceof Row) {
            // add the Row itself
            super.appendChild(<any>child);
        }
        return this;
    }
}

/** Represents a full-page application layout that contains a header app bar fragment and a footer container fragment */
export class AppViewLayout extends VerticalLayout {
    /** Layout fragment for the application bar at the top of the screen, contains only one Row instance; all content passed into the initializer is automatically added to this row, not the container itself */
    @layoutFragment
    static Header: typeof AppBarLayout = AppBarLayout.with();

    /** Layout fragment for the application container's fixed footer */
    static Footer: typeof VerticalLayout.Footer;
}

/** Represents a full-page application layout that contains a header app bar fragment and a footer container fragment, as well as a scrollable navigation sidebar; the sidebar is automatically collapsed while `.sidebarCollapsed` is set (defaults to true on small screens, observable) but is also wrapped in a drawer container in the `.drawer` property, which can be opened using its `openAsync()` method (e.g. from a click handler on a button available in the `.AppBar` fragment) */
export class HubViewLayout extends AppViewLayout {
    /** Layout fragment for the application bar at the top of the screen, contains only one Row instance; all content passed into the initializer is automatically added to this row, not the container itself */
    static Header: typeof AppViewLayout.Header;

    /** Layout fragment for the application container's fixed footer */
    static Footer: typeof AppViewLayout.Footer;

    /** Layout fragment for sidebar content */
    @layoutFragment
    static Sidebar: typeof ScrollableLayout = ScrollableLayout.with({ height: "100%" });

    /** Create a view instance and initialize the sidebar/drawer combination */
    constructor() {
        super();

        // prepare a drawer factory in advance
        this._drawerIsOpen = new Async.ObservableValue<boolean>();
        this.drawer = new (DrawerContainer.with(
            Async.observe(() => this.fragments["Sidebar"])));
        this.drawer.Opening.connect(() => {
            // remove sidebar to avoid component redisplay
            this.insideGutter = undefined;
            this._drawerIsOpen.value = true;
        });
        this.drawer.Closed.connect(() => {
            // put sidebar back if (by now) supposed to
            this._drawerIsOpen.value = false;
        });

        // add the (inside, i.e. left by default) sidebar if not on a small screen
        this.bindFragment("insideGutter", "Sidebar", sidebar => {
            return (this.sidebarCollapsed || this._drawerIsOpen.value) ?
                undefined : sidebar;
        });
    }

    /** True if the sidebar should be hidden, normally only on small screens but can be overridden by defining a getter for this property (observed, readonly) */
    @Async.observable
    public get sidebarCollapsed() { return Screen.dimensions.isSmall }

    /** Drawer compononent containing only the sidebar, for small viewports */
    public readonly drawer: DrawerContainer;

    private readonly _drawerIsOpen: Async.ObservableValue<boolean>;
}
