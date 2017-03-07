import { App, Async, UI } from "@typescene/typescene";
import { DocItem } from "./DocumentData";
import { MainActivity } from "./MainActivity";
import { DocActivity } from "./DocActivity";

@App.mapToActivity<MainActivity, any>(MainActivity, "toc", 0)
export class TOCView extends UI.LayoutContainer {
    @UI.initializer
    static initializer = UI.LayoutContainer.with({
        // header with filter text field
        header: UI.Container.with({
            height: "4.5rem",
            vertAlign: "middle",
            style: { padding: "0 .5rem" },
            shadowEffect: UI.bind("scrolledToTop", atTop =>
                atTop ? 0 : .35),
            content: [UI.CloseRow.with({
                content: [
                    UI.TextField.with({
                        name: "filter",
                        value: UI.bind2("filterText"),
                        placeholderText: "Filter",
                        style_input: {
                            border: "0",
                            boxShadow: "none",
                            outline: "0"
                        },
                        immediateValueUpdate: true
                    }),
                    UI.TextButton.withIcon("fa-times", "resetFilter"),
                    UI.Spacer.with({
                        width: ".5rem",
                        shrinkwrap: true
                    })
                ],
                style: { border: "1px solid #eee" }
            })]
        }),

        // content has a scrollable list
        content: [
            UI.CloseRow.with({
                height: "2rem",
                content: [
                    UI.Icon.with({
                        icon: "fa-chevron-left",
                        width: "2rem",
                        style: { paddingLeft: ".75rem" }
                    }),
                    UI.TextButton.with({
                        label: UI.tl`All documentation`,
                        icon: "fa-sitemap",
                        remGutter: 1.5,
                        style_button: { fontSize: ".875rem" }
                    })
                ],
                style: { cursor: "pointer" },
                Clicked: new UI.ActionHandler(() => {
                    App.startActivity("../");
                })
            }),
            UI.CloseRow.with({
                height: "2rem",
                content: [
                    UI.Icon.with({
                        icon: "fa-chevron-down",
                        width: "2rem",
                        style: { paddingLeft: ".75rem" }
                    }),
                    UI.Label.with({
                        text: UI.bind("activity.title"),
                        icon: "fa-book",
                        remGutter: 1.5,
                        style: {
                            fontSize: ".875rem",
                            fontWeight: "bold"
                        }
                    })
                ]
            }),
            UI.Divider.with({ margin: ".25rem" }),
            UI.Container.with({
                hidden: UI.bind("!activity.loading"),
                content: [
                    UI.Spacer,
                    UI.tl`Loading...`
                ]
            }),
            UI.TreeList.with({
                id: "tocTreeList",
                items: UI.TreeListRow.arrayFromBinding("getTreeItems()", "fa-chevron-down", "fa-chevron-right",
                    1.5, "2rem", 10),
                focusMode: UI.Component.FocusMode.Items,
                selectionMode: UI.Component.SelectionMode.ItemFocus,
                style: UI.Style.withClass("toc_tree"),
                EnterKeyPressed: "showTocTopic",
                Click: "showTocTopic",
            })
        ],
        scrollable: true
    });

    @Async.observable
    public tocTreeList?: UI.TreeList<UI.TreeListRow>;

    @Async.observable
    public filterText = "";

    @Async.observable_shallow
    public filterTerms?: string[];

    constructor(public activity: MainActivity) {
        super();

        // observe top doc activity
        var count = 0;
        Async.observe(() => {
            if (this.tocTreeList && this.tocTreeList.items.length &&
                !this.filterTerms && !activity.loading) {
                var docActivity = App.findActivity(DocActivity);
                if (docActivity) return docActivity.item;
            }
            return undefined;
        }).subscribe(item => {
            if (item) {
                // select the currently shown document using the item ID
                Async.sleep(10).then(() => {
                    this.tocTreeList!.selectedKey = item.id;
                });
            }
        });

        // auto focus selected items to bring them into view
        this.Rendered.connectOnce(() => {
            this.tocTreeList!.SelectionChange.connect(data => {
                if (data.item && !this.filterTerms)
                    data.item.hasFocus = true;
            });
        });

        // observe search filter and update terms after a delay
        var timer: number;
        Async.observe(() => this.filterText).subscribe(() => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                timer = 0;
                this._updateFilter();
            }, 50);
        });
    }

    /** Returns a list of items for the TOC tree list */
    public getTreeItems() {
        var activity = this.activity;
        function makeItemData(tocItem: DocItem) {
            var subItems = activity.getTOCItems(tocItem.id);
            return <UI.TreeListRow.ItemData>{
                name: tocItem.textTopic || tocItem.name,
                key: tocItem.id,
                icon: tocItem.icon,
                items: subItems.length ?
                    subItems.map(makeItemData) : undefined
            }
        }
        var result = this.activity.getRootTOCItems().map(makeItemData);
        if (this.filterTerms && this.filterTerms.length) {
            let terms = this.filterTerms.map(s => s.toLowerCase());
            let f = (item: UI.TreeListRow.ItemData) => {
                if (!terms.some(s => item.name!.toLowerCase().indexOf(s) < 0))
                    return true;
                if (item.items) {
                    item.items = item.items.filter(f);
                    if (item.items.length) {
                        item.autoExpand = true;
                        return true;
                    }
                }
                return false;
            }
            result = result.filter(f);
        }
        return result;
    }

    /** Show newly selected TOC topic */
    public showTocTopic() {
        Async.sleep(10).then(() => {
            var id = this.tocTreeList!.selectedKey;
            var data = id && this.activity.getItemData(id);
            if (data) App.startActivity("#/" + (data.textSlug || data.id));
        });
    }

    /** Reset the search filter */
    public resetFilter() {
        this.filterText = "";
    }

    /** Take the current filter input value and apply the filter */
    private _updateFilter() {
        var terms = this.filterText
            .replace(/[^\w\s]+/, " ").trim()
            .split(/\s+/)
            .filter(s => !!s);

        // set terms only if any found
        this.filterTerms = terms.some(s => s.length > 2) ?
            terms : undefined;
    }
}

UI.DOM.applyStylesheet({
    ".toc_tree > .UI-Row": {
        cursor: "pointer"
    },
    ".toc_tree [selected]": {
        cursor: "default",
        background: "#555",
        color: "#fff"
    },
    ".toc_tree [selected]:focus": {
        background: "#333",
        color: "#fff",
        outline: "0"
    }
});
