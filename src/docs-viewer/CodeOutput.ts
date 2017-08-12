import { Async, UI, App } from "@typescene/dom";
import { MonacoEditor } from "./MonacoEditor";
import { DocumentService } from "./DocumentService";
declare var VERSION: string;

/** Global TypeScript compiler instance */
var ts: any;

/** Modules by ID */
var typescene: any = (<any>window).typescene;
const modules: { [id: string]: any } = {
    "@typescene/core": typescene.core,
    "@typescene/core/Async": typescene.core.Async,
    "@typescene/core/UI": typescene.core.UI,
    "@typescene/core/App": typescene.core.App,
    "@typescene/dom": typescene,
    "@typescene/dom/Async": typescene.Async,
    "@typescene/dom/UI": typescene.UI,
    "@typescene/dom/App": typescene.App
};

/** Code modified by user, by example ID */
const modifiedCode: { [exampleID: string]: string } = {};

/** Last opened example code ID */
var lastEditedExampleID: string | undefined;

/** Last open editor (should be destroyed when opening a new editor */
var lastEditor: MonacoEditor | undefined;

// start with a fresh hidden editor to load typescript
var _loaded = UI.Screen.ready.then(() => {
    return MonacoEditor.load().then(() => {
        new MonacoEditor(document.createElement("div"));
        var svc: DocumentService = DocumentService.getInstance();
        return svc.loadAsync().then(() => {
            return App.Http.getTextAsync("/" + VERSION + "/typescene.d.ts.txt")
        }).then(defs => {
            MonacoEditor.loadDeclarations("typescene.d.ts", defs);
            MonacoEditor.loadDeclarations("editor.d.ts",
                "declare var displayResult: (value: any) => void");
            let doPollTypescript = (): any =>
                Async.sleep(100).then(() => {
                    ts = (<any>window)["ts"];
                    if (ts) return true;
                    else return doPollTypescript();
                });
            return doPollTypescript();
        });
    });
});

export class CodeOutputContainer extends UI.Container {
    constructor(public cID: string, public code: string, outputIdentifier?: string,
        public hasEditButton = true) {
        super();
        this.appendChild(new (UI.CloseRow.with(
            UI.tl("{i|#555}Starting TypeScript environment...")
        )));

        // wrap code in a full program
        this.code =
            (/^import/.test(code) ? "" :
                "import { Async, UI, App } from \"@typescene/dom\";\n\n") +
            code;
        if (outputIdentifier)
            this.code += "\ndisplayResult(" + outputIdentifier + ");";
        else if (!/console\.log/.test(code))
            this.code += "\nconsole.log(\"OK\")";

        // wait for Typescript environment to be loaded
        _loaded.then(() => {
            this.style.addClass("doc-text-example-output")
                .addShadowEffect(.2);
            this.updateOutput();
        });
    }

    /** Number of times updated */
    public count = 0;

    /** Revert changes and update output */
    public revertChanges() {
        delete modifiedCode[this.cID];
        this.updateOutput();
    }

    /** Show editor for current example code */
    public showEditor() {
        new CodeEditor(this).openAsync();
    }

    /** Update the output within this container, for current example code */
    public updateOutput() {
        // make the factory that creates the byline and buttons on top
        var isModified = !!(modifiedCode[this.cID]);
        var dd = new Date();
        var ddMins = dd.getMinutes();
        var ddSecs = dd.getSeconds();
        var ddStr = "Updated " + dd.getHours() + ":" +
            (ddMins < 10 ? "0" + ddMins : ddMins) + ":" +
            (ddSecs < 10 ? "0" + ddSecs : ddSecs);
        var byline = UI.Row.with({
            content: [
                UI.tl((this.count++ ? ddStr : "Output")
                    + (isModified ? " (modified)" : "")),
                UI.Spacer,
                UI.TextButton.with({
                    label: "Edit this example",
                    Clicked: "showEditor",
                    hidden: Async.observe(() =>
                        !this.hasEditButton || UI.Screen.dimensions.isSmall)
                }),
                isModified ?
                    UI.TextButton.withLabel("Revert changes", "revertChanges") :
                    undefined,
            ],
            height: "1.75rem",
            style: UI.Style.withClass("doc-text-example-byline"),
            animations: { appear: UI.DOM.DOMAnimation.basic.in.slideDown }
        });

        // transpile the program
        try {
            var code = modifiedCode[this.cID] || this.code;
            var t = ts.transpileModule(code, {
                reportDiagnostics: true,
                compilerOptions: {
                    target: "es5",
                    module: "commonjs",
                    experimentalDecorators: true,
                    strictNullChecks: true,
                    lib: ["es2015", "dom"]
                }
            });
            var mockConsole = {
                log: (...args: any[]) => {
                    Async.unobserved(() => {
                        // try to convert all output to text
                        var output: string[] = args.map(v => {
                            try {
                                if (typeof v === "string") return v;
                                if (v === undefined) return "undefined";
                                else return JSON.stringify(v);
                            }
                            catch (all) {
                                try { return String(v) }
                                catch (err) { return String(err) }
                            }
                        });
                        if (!this.content.length) {
                            this.initializeWith({ content: [byline] });
                            this.getComponentsByType(UI.Row)[0].content
                                .unshift(new UI.Icon(
                                    "fa-terminal color=green fontSize=1rem"));
                        }

                        // add all logged text in a row with a single label
                        var label = new UI.Label(output.join(" "));
                        label.wrapText = true;
                        label.shrinkwrap = false;
                        this.content.push(new UI.Row([label]));
                    });
                }
            };
            try { (<any>Object).setPrototypeOf(mockConsole, console) }
            catch (all) { }

            // run the (modified) program with function parameters
            this.content.length = 0;
            (new Function("exports", "require", "displayResult", "console", t.outputText))
                .call(void 0,
                // exports (ignored)
                {},
                // require function:
                (name: string) => {
                    if (modules[name]) return modules[name];
                    throw new Error("Cannot find module: " + name);
                },
                // displayResult function:
                (value: any) => {
                    this.initializeWith({ content: [byline, value] });
                    if (isModified) {
                        this.getComponentsByType(UI.Row)[0]
                            .content.unshift(new UI.Icon("fa-check color=green"));
                    }
                },
                // console with own `log` method
                mockConsole
            );
            Async.sleep(1000).then(() => {
                // force display of empty result after 1s
                if (this.content.length === 0) mockConsole.log();
            });
        }
        catch (err) {
            // display error instead
            console.error(err);
            var label = UI.tl("{i|#c30}" + String(err));
            this.initializeWith({ content: [byline, label] });
        }
    }
}

class CodeEditor extends UI.DialogContainer.with(
    {
        height: "100vh",
        width: "55vw",
        scrollable: false,
        style: {
            overflow: "visible",
            minWidth: "45rem",
            background: "#333"
        },
        shadowEffect: 1,
        animations: {
            appear: UI.DOM.DOMAnimation.basic.in.slideRight
        }
    },

    // toolbar row
    UI.Row.with(
        {
            height: "2rem",
            overlayPosition: UI.Row.OverlayPosition.Top,
            style: {
                marginTop: "3.5rem",
                background: "#333", color: "#ccc"
            }
        },
        UI.TextButton.with({
            label: "Save and run",
            icon: "fa-play",
            remGutter: 2,
            style: { cursor: "pointer" },
            style_button: { color: "" },
            Clicked: "closeAndRun"
        }),
        UI.Spacer,
        UI.tl(UI.bind("editor.position", s => (s || "")))
    ),

    // top row with back button:
    UI.Row.with(
        {
            height: "3.5rem",
            overlayPosition: UI.Row.OverlayPosition.Top,
            style: { background: "#555", color: "#fff" },
            shadowEffect: .5
        },
        UI.RoundButton.withIcon("fa-arrow-left", "close"),
        UI.tl`{1rem}Live code editor`
    ),

    // "Play" button to close and run code
    UI.CenterRow.with(
        {
            width: "3.5rem",
            height: "3.5rem",
            style: {
                cursor: "pointer",
                position: "absolute",
                top: "40%",
                right: "-1.75rem",
                background: "#fd3",
                color: "#333",
                borderRadius: "1.75rem",
                zIndex: "1"
            },
            shadowEffect: 1,
            Clicked: "closeAndRun"
        },
        UI.Icon.with({
            icon: "fa-play fa-2x",
            tooltipText: "Close & run",
            style: {
                // optically center the triangle:
                paddingLeft: ".2rem"
            }
        })
    )
) {
    constructor(public codeOutput: CodeOutputContainer) {
        super();
        this.displayOptions.modalHorzAlign = "left";
        var code = modifiedCode[codeOutput.cID] || codeOutput.code;

        // create the editor, or use last editor
        if (lastEditedExampleID === codeOutput.cID) {
            // re-use
            this.editor = lastEditor!;
            if (!modifiedCode[this.codeOutput.cID])
                this.editor.setCode(this.codeOutput.code);
        }
        else {
            // dispose of old editor
            lastEditor && lastEditor.destroy();

            // create new editor
            var elt = document.createElement("div");
            elt.style.height = "100%";
            this.editor = new MonacoEditor(elt, code);
            lastEditedExampleID = codeOutput.cID;
            lastEditor = this.editor;
        }

        // add the editor inside of a DOM block component
        var domBlock = new UI.DOM.DOMBlock(this.editor.element);
        domBlock.height = "100vh";
        domBlock.style.set("paddingTop", "5.5rem");
        this.initialize();
        this.content.unshift(domBlock);

        // ignore ESC presses within editor
        domBlock.EscapeKeyPressed.connect(() => { });

        // focus the editor when rendering finishes
        this.Rendered.connect(out => {
            out.updated && out.updated.then(() => this.editor.focus());
        });

        // save the code when user closes this dialog (e.g. clicking outside)
        this.Closed.connect(() => {
            modifiedCode[this.codeOutput.cID] = this.editor.getCode();
        });
    }

    /** The Monaco editor instance in use */
    @Async.observable
    public editor: MonacoEditor;

    /** Close the dialog and update original output */
    public closeAndRun() {
        this.close();
        modifiedCode[this.codeOutput.cID] = this.editor.getCode();
        Async.sleep(10).then(() => {
            this.codeOutput.updateOutput();
        });    
    }
}
