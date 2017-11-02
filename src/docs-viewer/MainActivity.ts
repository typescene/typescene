import { Async, App } from "@typescene/dom";
import { DocumentService, DocItem } from "./DocumentService";

/** Activity that should be on the stack before all others */
export class MainActivity extends App.SupportActivity {
    constructor(activation: App.Activation) {
        super(activation);
        this.title = "Typescene";
        this.Starting.connect(() => {
            this.documentService.loadAsync().then(() => {
                this.loading = false;
                this.error = false;
                this.title = this.documentService.getTitle();
            }, err => {
                this.error = true;
            });
        });
    }

    @App.injectService
    public documentService: DocumentService;

    /** True if documentation is loading (observable) */
    @Async.observable
    public loading = true;

    /** True if an error occurred while loading documentation (observable) */
    @Async.observable
    public error = false;
}

/** Activity that is mapped to root URLs and forwards to first article */
@App.mapRoute("/")
@App.mapRoute("/doc/")
@App.mapParentActivity(MainActivity)
export class HomeActivity extends App.Activity {
    constructor() {
        super();
        this.Starting.connect(() => {
            this.documentService.loadAsync().then(() => {
                var first = this.documentService.getTOCItems()[0];
                if (first) {
                    App.Application.current.startActivityAsync(
                        "/doc/" + (first.textSlug || first.id), true);
                }
            });
        });
    }

    @App.injectService
    public documentService: DocumentService;
}
