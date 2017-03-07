import { App, Async, UI } from "@typescene/typescene";
import { DocumentData } from "./DocumentData";

// WHYYYY is this necessary? What is webpack/lerna doing here??
const LayoutContainer: any = UI.LayoutContainer;

@App.mapToPath("#/")
export class MainActivity extends App.SingletonViewActivity {
    constructor() {
        super();
        this.title = "Typescene";
        this.options.isBackgroundActivity = true;
        this.Activating.connect(() => {
            DocumentData.loadAsync().then(
                doc => {
                    this.loading = false;
                    this.error = false;
                    this._doc = doc;
                    this.title = doc.getTitle();
                    if (App.Application.current.activities.top === this) {
                        var first = doc.getTOCItems()[0];
                        if (first)
                            App.Application.current.startActivity(
                                "#/" + (first.textSlug || first.id), true);
                    }
                },
                err => {
                    this.error = true;
                });
        });
    }

    /** True if documentation is loading (observable) */
    @Async.observable
    public loading = true;

    /** True if an error occurred while loading documentation (observable) */
    @Async.observable
    public error = false;

    /** Returns a list of root TOC items (observable) */
    public getRootTOCItems() {
        if (this.loading) return [];
        else return this._doc.getTOCItems();
    }

    /** Returns a list of child TOC items for given ID */
    public getTOCItems(id: string) {
        if (this.loading) return [];
        else return this._doc.getTOCItems(id);
    }

    /** Returns the display name for the item with given ID */
    public getDisplayNameForItem(id: string) {
        if (this.loading) return id;
        else return this._doc.getDisplayNameFor(id);
    }

    /** Returns the raw documentation data for the item with given ID (observable) */
    public getItemData(id: string) {
        if (this.loading) return undefined;
        else return this._doc.getItemById(id);
    }

    /** Returns true if the item with given ID exists */
    public itemExists(id: string) {
        if (this.loading) return undefined;
        else return this._doc.exists(id);
    }

    /** Documentation data model */
    private _doc: DocumentData;
}

window["MainActivity"] = MainActivity;

@App.mapToActivity<MainActivity, any>(MainActivity)
export class MainView extends UI.LayoutContainer {
    @UI.initializer
    static initializer = LayoutContainer.with({
        // header with top nav bar
        header: UI.Container.with({
            height: "3.5rem",
            style: {
                background: "#fd3",
                color: "#333",
                willChange: "transform"
            },
            shadowEffect: .4,
            animations: {
                appear: UI.DOMAnimation.basic.in.fadeDown
            },
            content: [
                UI.Row.with({
                    height: "3.5rem",
                    content: [
                        UI.TextButton.with({
                            hidden: UI.bind("!collapseTOC"),
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
                            hidden: Async.observe(() =>
                                UI.Screen.dimensions.isSmall),
                            label: "Typescene home",
                            target: "http://typescene.org",
                            style_button: { color: "#333" }
                        }),
                        UI.LinkButton.with({
                            hidden: Async.observe(() =>
                                UI.Screen.dimensions.isSmall),
                            label: "Github",
                            target: "https://www.github.com/typescene/typescene",
                            style_button: { color: "#333" }
                        })
                    ]
                })
            ]
        }),

        leftGutter: UI.Container.with({
            hidden: UI.bind("collapseTOC"),
            width: "19rem",
            content: [
                Async.observe(() => <UI.Container><any>App.Application.current
                    .getViewComponent("toc") !)
            ],
            style: {
                background: "#fff",
                borderRight: "1px solid #eee"
            }
        }),

        horzAlign: "center",
        maxContentWidth: "55rem",
        content: [
            Async.observe(() =>
                App.Application.current.getViewComponent("doc") !)
        ]
    });

    constructor(public activity: MainActivity) {
        super();
    }

    @Async.observable
    public get collapseTOC() {
        return UI.Screen.dimensions.width < (66 * 16);
    }

    /** Show the TOC drawer (on small screens) */
    public showDrawer() {
        var drawer = new UI.DrawerContainer().initializeWith({
            content: [
                UI.ContainerBlock.with({
                    container: LayoutContainer.with({
                        header: UI.Container.with({
                            height: "7rem",
                            style: { background: "#38e", color: "#fff" },
                            vertAlign: "bottom",
                            content: [
                                UI.tl`{h4}Table of Contents`
                            ]
                        }),
                        content: [
                            App.Application.current.getViewComponent("toc")!
                        ]
                    })
                })
            ]
        });
        drawer.display();
        App.Application.current.activities.Transition.connectOnce(() => {
            drawer.close();
        });
    }
}