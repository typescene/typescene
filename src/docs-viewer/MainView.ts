import { App, Async, UI } from "@typescene/dom";
import { MainActivity } from "./MainActivity";

@App.mapViewActivity(MainActivity)
export class MainView extends App.HubViewLayout.with(
    { horzAlign: "center", maxContentWidth: "55rem" },
    App.HubViewLayout.Header.with(
        UI.TextButton.with({
            hidden: UI.bind("!sidebarCollapsed"),
            label: "",
            icon: "fa-bars",
            Click: "showDrawer"
        }),
        UI.Image.with({
            imageUrl: "../logo.png",
            width: "1.5rem"
        }),
        UI.tl`{h1|1.5rem|500|letterSpacing=-1px}Documentation`,
        UI.Spacer,
        UI.LinkButton.with({
            hidden: UI.bind("sidebarCollapsed"),
            label: "Typescene home",
            target: "http://typescene.org"
        }),
        UI.LinkButton.with({
            hidden: UI.bind("sidebarCollapsed"),
            label: "Github",
            target: "https://www.github.com/typescene/typescene"
        })
    ),
    App.HubViewLayout.Sidebar.with(
        {
            style: {
                borderRight: "1px solid #eee",
                background: "#fff"
            },
            scrollable: false
        },
        App.HubViewLayout.Sidebar.Header.with(
            {
                hidden: UI.bind("!sidebarCollapsed"),
                height: "7rem",
                style: { background: "#38e", color: "#fff" },
                vertAlign: "bottom"
            },
            UI.tl`{h4}Table of Contents`
        ),
        UI.bind("fragments.TOCView")
    ),
    UI.bind("fragments.DocView")
) {
    @App.layoutFragment
    static TOCView = App.ScrollableLayout.with({ id: "toc", height: "100%" });

    @App.layoutFragment
    static DocView = UI.Container.with({ id: "doc" });

    constructor(public activity: MainActivity) {
        super();
    }

    /** Show the TOC drawer (on small screens) */
    public showDrawer() {
        this.drawer.openAsync();
        App.Application.current.activities.Transition.connectOnce(() => {
            this.drawer.close();
        });
    }
}
