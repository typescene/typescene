import { App, Async, UI } from "@typescene/typescene";
import { DocItem } from "./DocumentData";
import { MainActivity } from "./MainActivity";
import { DocArticle, TagLabelRow } from "./DocArticle";

@App.mapToResource("#/")
export class DocActivity extends App.ViewActivity {
    constructor(glob: string) {
        super();
        this.options.parentActivity = MainActivity;
        this.glob = glob;

        // find main activity and get data
        this.Displaying.connect(() => {
            var mainActivity = App.findActivity(MainActivity) !;
            if (mainActivity.loading) {
                // wait for data to be loaded
                var waiting = Async.observe(() => mainActivity.loading)
                    .subscribe(loading => {
                        if (!loading) {
                            this.populate(mainActivity.getItemData(glob));
                            waiting.clear();
                        }
                    });
            }
            else {
                // get the item and display immediately
                this.populate(mainActivity.getItemData(glob));
            }
        });
    }

    public populate(item?: DocItem) {
        if (!item) {
            App.startActivity("");
            return;
        }

        // display the item and set activity title
        this.item = item;
        this.title = this.item.name;
    }

    public glob: string;

    @Async.observable_shallow
    public item?: DocItem;
}

@App.mapToActivity<DocActivity, any>(DocActivity, "doc")
class DocView extends UI.Container {
    @UI.initializer
    static initializer = UI.Container.with({
        content: [
            // row that describes the (code) item, and a link to parent
            UI.Row.with({
                height: Async.observe(() =>
                    UI.Screen.dimensions.isSmall ? "auto" : "4.5rem"),
                spacing: ".5rem",
                verticalSpacing: "1rem",
                content: [
                    UI.Spacer.with({
                        width: "0",
                        shrinkwrap: true
                    }),
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
                ]
            }),

            // row with the item heading
            UI.Row.with({
                height: "3.25rem",
                content: [
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
                ]
            }),
            UI.Divider,

            // loading indicator (cast is needed...why??)
            <PromiseLike<UI.ComponentFactory<UI.CenterRow>>>
            Async.sleep(50).then(() => UI.CenterRow.with({
                hidden: UI.bind("item"),
                height: "10rem",
                content: [
                    UI.tl`Loading documentation...`
                ]
            })),

            // container with the article about this item
            UI.bind("item", item => item && new DocArticle(item))
        ],
        style: Async.observe(() => UI.Screen.dimensions.isSmall ?
            { padding: "0" } :
            { padding: "0 2.5rem 0 2.5rem" })
    });

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