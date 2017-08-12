import { App, Async, UI } from "@typescene/dom";
import { DocItem, DocumentService } from "./DocumentService";
import { MainActivity } from "./MainActivity";

@App.mapRoute("/doc/*glob")
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

        // TODO: do this in a more structural way...
        // save & restore scroll positions when moving back/forward
        let withScrollElt = (f: (elt: HTMLElement) => void) => () => {
            var page = UI.Page.getCurrentPage();
            if (page && (page.content[0] instanceof UI.LayoutContainer)) {
                page.content[0]!.getRenderedOutputAsync().then(out => {
                    var elt: HTMLElement = out && out.element && out.element.firstChild;
                    while (elt) {
                        if (String(elt.className).split(/\s+/)
                            .some(s => s === "UI-LayoutContainer_scroll")) {
                            return f(elt);
                        }
                        elt = <HTMLElement>elt.nextSibling;
                    }
                });
            }
        }
        this.Suspending.connect(withScrollElt(elt => {
            this._scrollTop = elt.scrollTop;
        }));
        this.Resumed.connect(withScrollElt(elt => {
            elt.scrollTop = 0;
            let reset = () => {
                if (App.Application.current.getTopActivity() === this)
                    elt.scrollTop = this._scrollTop;
            };
            Async.sleep(10).then(reset);
            Async.sleep(100).then(reset);
        }));
    }

    @App.injectService
    public documentService: DocumentService;

    public populate() {
        try {
            var item = this.documentService.getItemById(this.activation["glob"]);
            this.item = item;
            this.title = this.item.name;
        }
        catch (err) {
            App.startActivityAsync("/");
            return;
        }
    }

    @Async.observable_shallow
    public item?: DocItem;

    private _scrollTop = 0;
}
