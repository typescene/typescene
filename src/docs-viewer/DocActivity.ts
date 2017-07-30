import { App, Async } from "@typescene/dom";
import { DocItem, DocumentService } from "./DocumentService";
import { MainActivity } from "./MainActivity";

@App.mapRoute("#/*glob")
class DocActivation extends App.Activation {
    public glob: string;
}

@App.mapActivation(DocActivation)
@App.mapParentActivity(MainActivity)
export class DocActivity extends App.Activity {
    protected onCreateAsync() {
        // find main activity and get data
        var glob = this.activation["glob"];
        this.Started.connect(() => {
            this.documentService.loadAsync().then(() => {
                this.populate();
            });
        });
    }

    @App.injectService
    public documentService: DocumentService;

    public populate() {
        var item = this.documentService.getItemById(this.activation["glob"]);
        if (!item) {
            App.startActivityAsync("");
            return;
        }

        // display the item and set activity title
        this.item = item;
        this.title = this.item.name;
    }

    @Async.observable_shallow
    public item?: DocItem;
}
