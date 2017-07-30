import { Async, App } from "@typescene/dom";
import { DocumentService, DocItem } from "./DocumentService";

@App.mapRoute("#/")
export class MainActivity extends App.Activity {
    constructor(activation: App.Activation) {
        super(activation);
        this.title = "Typescene";
        this.Starting.connect(() => {
            this.documentService.loadAsync().then(() => {
                this.loading = false;
                this.error = false;
                this.title = this.documentService.getTitle();
                if (App.Application.current.activities.top === this) {
                    var first = this.documentService.getTOCItems()[0];
                    if (first)
                        App.Application.current.startActivityAsync(
                            "#/" + (first.textSlug || first.id), true);
                }
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
