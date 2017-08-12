import { App, Async, UI } from "@typescene/dom";
import { MainActivity } from "./MainActivity";

@App.mapViewActivity(MainActivity)
export class MainView extends App.HubViewLayout.with(
    { horzAlign: "center", maxContentWidth: "calc(40vw + 20rem)" },
    App.HubViewLayout.Header.with(
        { style: { background: "linear-gradient(284deg, #2bf 0%, #509 100%) || #4ae" } },
        UI.TextButton.with({
            hidden: UI.bind("!sidebarCollapsed"),
            label: "",
            icon: "fa-bars",
            Click: "showDrawer"
        }),
        UI.Image.with({
            imageUrl: "/logo.png",
            width: "1.5rem",
            style_img: { verticalAlign: "middle" }
        }),
        UI.tl`{h1|1.5rem|600}Documentation`,
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
