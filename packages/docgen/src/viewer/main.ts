// Simple viewer for Typescene API documentation

import { App, Async, UI } from "@typescene/typescene";
import "./MainActivity";
import "./DocActivity";
import "./TOCView";

new App.Application("Documentation");
UI.DOM.CSS.variables["baseFontSize"].value = ".875rem";

window["UI"] = UI;
window["Async"] = Async;
window["App"] = App;