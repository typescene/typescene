// Simple viewer for Typescene API documentation

import { App, Async, UI } from "@typescene/dom";
import "./DocumentService";
import "./MainActivity";
import "./MainView";
import "./DocActivity";
import "./DocView";
import "./TOCView";

new App.DOMApplication("Documentation");
UI.DOM.Styles.font.family = "\"Source Sans Pro\", sans-serif";

// Do not use predefined heading styles but take them from CSS
UI.DOM.Styles.rebootStyles.remove("h1,h2,h3,h4,h5,h6");
UI.DOM.Styles.rebootStyles.remove(/^h\d$/);
import "./style";
