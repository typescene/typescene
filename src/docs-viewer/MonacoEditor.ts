/// <reference path="../../node_modules/monaco-editor/monaco.d.ts" />
import { Async } from "@typescene/dom";

/** The relative path that refers to the Monaco Editor "vs" directory */
const VS_PATH = "/monaco-editor/min/vs";

/** Global variable defined by the Monaco editor loader.js script */
declare var AMDLoader: any;

/** Wrapper around the MS Monaco editor, configured for TypeScript code (es5) */
export class MonacoEditor {
    /** Load the editor script, returns promise that resolves when everything is loaded */
    static load() {
        // load the Monaco editor AMD loader script
        return this._isLoaded || (this._isLoaded = new Async.Promise((resolve) => {
            var script = document.createElement("script");
            script.src = VS_PATH + "/loader.js";
            script.async = false;
            document.body.appendChild(script);

            // poll to see if the script has run yet
            var intv = setInterval(() => {
                if (typeof AMDLoader !== "undefined") {
                    clearInterval(intv);
                    var r = (<any>window)["require"];
                    r.config({ paths: { vs: VS_PATH } });
                    r(["vs/editor/editor.main"], () => resolve(true));
                }
            }, 100);
        }));
    }

    /** Set to a promise once trying to load */
    private static _isLoaded: Async.Promise<boolean>;

    /** Load a .d.ts file into the typescript context */
    static loadDeclarations(fileName: string, source: string) {
        monaco.languages.typescript.typescriptDefaults.addExtraLib(
            source, fileName);
    }

    /** Create an instance of the editor, inside given HTML element */
    constructor(elt: HTMLElement, code = "") {
        this.element = elt;
        var editor = this._editor = monaco.editor.create(elt, {
            theme: "vs-dark",
            value: code,
            language: "typescript",
            folding: true,
            scrollBeyondLastLine: false,
            formatOnType: true,
            formatOnPaste: true,
            wordBasedSuggestions: false,
            minimap: { enabled: false }
        });
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ES5,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            allowNonTsExtensions: true,
            experimentalDecorators: true,
            strictNullChecks: true
        });
        editor.onDidChangeCursorPosition(() => {
            var pos = editor.getPosition();
            this.position = pos.lineNumber + ":" + pos.column;
        });
    }

    /** DOM element that this editor is inside of */
    public element: HTMLElement;

    /** Cursor position as a string (line:column) */
    @Async.observable
    public position = "1:1";

    /** Returns the current text contents of the editor */
    public getCode() {
        return this._editor.getValue();
    }

    /** Overwrites the current text contents of the editor, and focuses element */
    public setCode(source: string) {
        this._editor.setValue(source);
        this._editor.setPosition({ lineNumber: 1, column: 1 });
        this.position = "1:1";
        this._editor.focus();
    }

    /** Update layout and re-focus the editor */
    public focus() {
        this._editor.layout();
        this._editor.focus();
    }

    /** Dispose the editor */
    public destroy() {
        this._editor.dispose();
    }

    private _editor: monaco.editor.IStandaloneCodeEditor;
}
