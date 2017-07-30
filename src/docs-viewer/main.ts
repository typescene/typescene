// Simple viewer for Typescene API documentation

import { App, Async, UI } from "@typescene/dom";
import "./DocumentService";
import "./MainActivity";
import "./MainView";
import "./DocActivity";
import "./DocView";
import "./TOCView";

new App.DOMApplication("Documentation");
UI.DOM.Styles.font.family = "\"Open Sans\", sans-serif";
UI.DOM.Styles.size.text = ".875rem";
UI.DOM.Styles.color.primary = "#fd3";
