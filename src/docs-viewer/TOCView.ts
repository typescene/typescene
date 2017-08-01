import { App, Async, UI } from "@typescene/dom";
import { DocumentService, DocItem } from "./DocumentService";
import { MainActivity } from "./MainActivity";
import { MainView } from "./MainView";
import { DocActivity } from "./DocActivity";

@App.mapViewActivity(MainActivity)
export class TOCView extends MainView.TOCView.with(
    // add header with search field
    MainView.TOCView.Header.with(
        {
            height: "4.5rem",
            vertAlign: "middle",
            style: { padding: "0 .5rem" },
            shadowEffect: UI.bind("scrolledToTop", atTop =>
                atTop ? 0 : .35)
        },
        UI.CloseRow.with(
            { style: { border: "2px solid #eee" } },
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
        )
    ),

    // add a label for this documentation file
    UI.CloseRow.with(
        { height: "2rem", style: { marginTop: "1rem" } },
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
    ),

    // add a divider and loading indicator
    UI.Divider.with({ margin: ".25rem" }),
    UI.Container.with(
        { hidden: UI.bind("!activity.loading") },
        UI.Spacer,
        UI.tl`Loading...`
    ),

    // add the actual TOC tree list
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
) {
    @App.injectService
    public documentService: DocumentService;

    @Async.observable
    public tocTreeList?: UI.TreeList<UI.TreeListRow>;

    @Async.observable
    public filterText = "";

    @Async.observable_shallow
    public filterTerms?: string[];

    constructor(public activity: MainActivity) {
        super();

        // observe top doc activity
        this.Rendered.connectOnce(() => {
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
            this.tocTreeList!.SelectionChange.connect(data => {
                if (data.item && !this.filterTerms)
                    data.item.hasFocus = true;
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
        });
    }

    /** Returns a list of items for the TOC tree list */
    public getTreeItems() {
        if (!this.documentService || !this.documentService.isLoaded) return [];
        let makeItemData = (tocItem: DocItem): UI.TreeListRow.ItemData => {
            var subItems = this.documentService.getTOCItems(tocItem.id);
            return {
                name: tocItem.textTopic || tocItem.name,
                key: tocItem.id,
                icon: tocItem.icon,
                autoExpand: !!tocItem.textAutoOpen,
                items: subItems.length ?
                    subItems.map(makeItemData) : undefined
            }
        }
        var result = this.documentService.getTOCItems().map(makeItemData);
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
            var data = id && this.documentService.getItemById(id);
            if (data) App.startActivityAsync("#/" + (data.textSlug || data.id));
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
        cursor: "default"
    }
});
