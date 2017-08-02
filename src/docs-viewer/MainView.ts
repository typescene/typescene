import { App, Async, UI } from "@typescene/dom";
import { MainActivity } from "./MainActivity";

@App.mapViewActivity(MainActivity)
export class MainView extends App.HubViewLayout.with(
    { horzAlign: "center", maxContentWidth: "46rem" },
    App.HubViewLayout.Header.with(
        { style: { background: "linear-gradient(120deg, #43a, #346) || #4ae" } },
        UI.TextButton.with({
            hidden: UI.bind("!sidebarCollapsed"),
            label: "",
            icon: "fa-bars",
            Click: "showDrawer"
        }),
        UI.Image.with({
            imageUrl: "/logo.png",
            width: "1.5rem"
        }),
        UI.tl`{h1|1.5rem|500|#fff|letterSpacing=-1px}Documentation`,
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
                background: "#f8f8f8"
            },
            scrollable: false
        },
        App.HubViewLayout.Sidebar.Header.with(
            {
                hidden: UI.bind("!sidebarCollapsed"),
                height: "7rem",
                style: { background: "#333", color: "#fff" },
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
