import { App, Async, UI } from "@typescene/dom";
import { DocItem } from "./DocumentService";
import { DocActivity } from "./DocActivity";
import { MainView } from "./MainView";
import { DocArticle, TagLabelRow } from "./DocArticle";

@App.mapViewActivity(DocActivity)
class DocView extends MainView.DocView.with(
    {
        style: Async.observe(() => UI.Screen.dimensions.isSmall ?
            { padding: "0" } :
            { padding: "0 2.5rem 0 2.5rem" })
    },

    // row that describes the (code) item, and a link to parent
    UI.Row.with(
        {
            height: Async.observe(() =>
                UI.Screen.dimensions.isSmall ? "auto" : "4rem"),
            spacing: ".5rem",
            verticalSpacing: "1rem"
        },
        UI.Spacer.with({ width: "0", shrinkwrap: true }),
        UI.TextButton.with({
            hidden: UI.bind("!parentItem"),
            label: UI.bind("parentItem", (parent: DocItem) =>
                (parent && (parent.textTopic || parent.name) || "")),
            iconAfter: "fa-caret-right",
            remGutter: 1.75,
            target: UI.bind("parentItem.id", id => "#/" + id),
            style_button: {
                color: "#666",
                fontWeight: "800"
            }
        }),
        UI.bind("item", item => item && new TagLabelRow(item))
    ),

    // row with the item heading
    UI.Row.with(
        { height: "3.25rem" },
        UI.Heading2.with({
            text: UI.bind("item.name"),
            shrinkwrap: false,
            style: {
                whiteSpace: "pre-wrap",
                fontSize: "2rem",
                fontWeight: "300",
                lineHeight: "1.25em"
            }
        })
    ),
    UI.Divider,

    // loading indicator
    Async.sleep(50).then(() => UI.CenterRow.with({
        hidden: UI.bind("item"),
        height: "10rem",
        content: [ UI.tl`Loading documentation...` ]
    })),

    // container with the article itself
    UI.bind("item", item => item && new DocArticle(item))
) {
    constructor(public activity: DocActivity) {
        super();
    }

    @Async.observable
    public get item() { return this.activity.item }

    @Async.observable
    public get parentItem() {
        return this.item && this.item.parentItem;
    }
}
