import * as Async from "@typescene/core/Async";
import { DOM, Style, Container, ComponentFactory } from "../UI";
import { AppViewLayout, HubViewLayout, AppBarLayout, MessageBoxLayout } from "@typescene/core/App";

// override MessageBox appearance
MessageBoxLayout.TitleRow.override({
    height: "2.4rem",
    style: {
        background: Async.observe(() => DOM.Styles.color.titleBarBackground),
        color: Async.observe(() => DOM.Styles.color.titleBarText)
    }
});
MessageBoxLayout.ButtonRow.override({
    height: "4rem",
    horzAlign: "end"
});
MessageBoxLayout.FirstMessageRow.override({
    verticalSpacing: "1.5rem"
});

// override AppLayout colors
(<any>AppViewLayout as ComponentFactory<Container>).override({
    background: Async.observe(() => DOM.Styles.color.background),
    color: Async.observe(() => DOM.Styles.color.text)
});

// override AppBar appearance
AppBarLayout.override({
    height: "3.5rem",
    shadowEffect: .3,
});
AppBarLayout.addStyleOverride(Style.withClass("App-Layout-AppBar"));
DOM.applyStylesheet(new DOM.Stylesheet("App-Layout-AppBar", {
    ".~~": {
        backgroundColor: Async.observe(() => DOM.Styles.color.primary),
        color: Async.observe(() => DOM.Styles.color.primaryText)
    },
    ".~~ .UI-Button a": {
        color: Async.observe(() => DOM.Styles.color.primaryText)
    }
}), true);

// override HubView sidebar width
HubViewLayout.override({
    leftGutterWidth: "19rem"
});
