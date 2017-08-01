import * as Async from "@typescene/core/Async";
import { Stylesheet } from "../Stylesheet";
import { Styles } from "../Styles";

export default new Stylesheet("", {
    // plain links:
    "a": { color: Async.observe(() => Styles.color.linkText) },
    "a:active": { color: Async.observe(() => Styles.color.linkVisitedText) },
    "a:visited": { color: Async.observe(() => Styles.color.linkVisitedText) },

    // form labels and checkboxes/radios:
    ".form-control-label": {
        display: "block",
        paddingBottom: ".25rem"
    },
    ".form-check-label": {
        marginRight: "-.5rem !important",
    },
    ".form-check-label > *": {
        display: "inline-block",
        cursor: "pointer",
        lineHeight: "1.4rem",
        marginRight: ".5rem"
    },
    ".form-check-input": {
        position: "relative",
        top: ".1em"
    },

    // text/select input:
    ".form-control": {
        borderWidth: Async.observe(() => Styles.size.controlBorderWidth),
        borderStyle: "solid",
        borderColor: Async.observe(() => Styles.color.controlBase),
        background: Async.observe(() => Styles.color.background),
        color: Async.observe(() => Styles.color.text),
        padding: "0 .6rem",
        height: "2.25rem",
        borderRadius: Async.observe(() => Styles.size.inputBorderRadius)
    },
    ".form-control:focus": {
        borderColor: Async.observe(() => Styles.color.controlFocus)
    },
    "textarea.form-control": {
        padding: ".6rem",
        height: "auto"
    },

    // buttons:
    ".btn": {
        padding: ".4rem .75rem",
        margin: "-.25rem 0",
        minWidth: "6rem",
        borderRadius: Async.observe(() => Styles.size.buttonBorderRadius),
        cursor: "pointer"
    },
    ".btn:focus": {
        outlineWidth: "0"
    },
    ".btn[disabled]": {
        cursor: "default",
        opacity: ".5"
    },
    ".btn-group .btn": {
        minWidth: "2rem"
    },
    ".btn-group-vertical .btn": {
        display: "block"
    },
    ".btn-group .btn:not(:first-child)": {
        borderTopLeftRadius: "0",
        borderBottomLeftRadius: "0"
    },
    ".btn-group .btn:not(:last-child)": {
        borderTopRightRadius: "0",
        borderBottomRightRadius: "0"
    },
    ".btn-group-vertical .btn:not(:first-child)": {
        borderTopLeftRadius: "0",
        borderTopRightRadius: "0",
        marginTop: "0"
    },
    ".btn-group-vertical .btn:not(:last-child)": {
        borderBottomLeftRadius: "0",
        borderBottomRightRadius: "0",
        marginBottom: "0"
    },

    // - primary button:
    ".btn-primary": {
        background: Async.observe(() => Styles.color.primary),
        color: Async.observe(() => Styles.color.primaryText),
        borderWidth: Async.observe(() => Styles.size.controlBorderWidth),
        borderStyle: "solid",
        borderColor: Async.observe(() => Styles.color.primary)
    },
    ".btn-primary:hover": { borderColor: Async.observe(() => Styles.color.primaryDark) },
    ".btn-primary:focus": { borderColor: Async.observe(() => Styles.color.primaryDark) },
    ".btn-primary:active,.btn-primary.active": {
        background: Async.observe(() => Styles.color.background),
        borderColor: Async.observe(() => Styles.color.primary),
        color: Async.observe(() => Styles.color.text)
    },

    // - secondary (default) button:
    ".btn-secondary": {
        background: Async.observe(() => Styles.color.controlBase),
        color: Async.observe(() => Styles.color.controlBaseText),
        borderWidth: Async.observe(() => Styles.size.controlBorderWidth),
        borderStyle: "solid",
        borderColor: Async.observe(() => Styles.color.controlBase)
    },
    ".btn-secondary:hover": { borderColor: Async.observe(() => Styles.color.controlFocus) },
    ".btn-secondary:focus": { borderColor: Async.observe(() => Styles.color.controlFocus) },
    ".btn-secondary:active,.btn-secondary.active": {
        background: Async.observe(() => Styles.color.controlFocus),
        borderColor: Async.observe(() => Styles.color.controlFocus),
        color: Async.observe(() => Styles.color.controlFocusText)
    },

    // - link button:
    ".btn-link": {
        color: Async.observe(() => Styles.color.linkText),
        borderWidth: Async.observe(() => Styles.size.controlBorderWidth),
        borderStyle: "solid",
        borderColor: "transparent"
    },
    ".btn-link:hover": {
        textDecoration: "underline"
    },
    ".btn-link:focus": {
        borderColor: Async.observe(() => Styles.color.controlBase)
    },
    ".btn-link:active,.btn-link.active": {
        borderColor: Async.observe(() => Styles.color.controlBase)
    },

    // tables:
    ".table": {
        borderCollapse: "collapse",
        background: Async.observe(() => Styles.color.background),
        color: Async.observe(() => Styles.color.text)
    },
    ".table thead th": {
        fontWeight: "bold",
        borderBottomWidth: "2px",
        borderBottomStyle: "solid",
        borderBottomColor: Async.observe(() => Styles.color.divider)
    },
    ".table th": {
        fontWeight: "bold",
        borderTopWidth: "1px",
        borderTopStyle: "solid",
        borderTopColor: Async.observe(() => Styles.color.divider)
    },
    ".table td": {
        borderTopWidth: "1px",
        borderTopStyle: "solid",
        borderTopColor: Async.observe(() => Styles.color.divider)
    },

    // badges:
    ".badge": {
        display: "inline-block",
        padding: ".25em .4em",
        fontSize: ".8em",
        lineHeight: "1",
        whiteSpace: "nowrap",
        verticalAlign: "baseline",
        borderRadius: Async.observe(() => Styles.size.badgeBorderRadius),
        background: Async.observe(() => Styles.color.text),
        color: Async.observe(() => Styles.color.background)
    },
    ".badge:empty": {
        display: "none"
    },

    // cards:
    ".card": {
        background: Async.observe(() => Styles.color.background),
        color: Async.observe(() => Styles.color.text),
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: Async.observe(() => Styles.color.divider),
        borderRadius: Async.observe(() => Styles.size.cardBorderRadius)
    },
    ".card-header": {
        background: Async.observe(() => Styles.color.primary),
        color: Async.observe(() => Styles.color.primaryText)
    },
    ".card-footer": {
        background: Async.observe(() => Styles.color.primary),
        color: Async.observe(() => Styles.color.primaryText)
    },

    // dropdowns (menus):
    ".dropdown-menu": {
        display: "block",
        listStyle: "none",
        padding: ".2rem 0",
        background: Async.observe(() => Styles.color.background),
        minWidth: "12rem",
        textAlign: "start || left"
    },
    ".dropdown-divider": {
        listStyle: "none",
        height: "1px",
        margin: ".5rem 0",
        padding: "0",
        background: Async.observe(() => Styles.color.divider)
    },
    ".dropdown-item": {
        display: "block",
        listStyle: "none",
        margin: "0",
        padding: "0 1rem",
        whiteSpace: "nowrap",
        lineHeight: "2.5em",
        color: Async.observe(() => Styles.color.text)
    },
    ".dropdown-item:hover": {
        background: Async.observe(() => Styles.color.text),
        color: Async.observe(() => Styles.color.background),
        textDecoration: "none",
    },
    ".dropdown-item:active": {
        background: Async.observe(() => Styles.color.text),
        color: Async.observe(() => Styles.color.background)
    },
    ".dropdown-item:focus": {
        outlineWidth: "2px",
        outlineStyle: "solid",
        outlineColor: Async.observe(() => Styles.color.text)
    },
    ".dropdown-item[disabled]": {
        opacity: ".5"
    },

    // nav:
    ".nav": {
        listStyle: "none",
        margin: "0",
        padding: "0"
    },
    ".nav-item": {
        display: "inline-block",
        listStyle: "none",
        margin: "0",
        marginRight: ".25rem",
        padding: "0"
    },

    // - pills:
    ".nav-pills .nav-link": {
        display: "block",
        padding: ".5rem 1rem",
        minWidth: "5rem",
        textAlign: "center",
        color: "inherit",
        borderRadius: Async.observe(() => Styles.size.buttonBorderRadius)
    },
    ".nav-pills .nav-link:hover": {
        textDecoration: "none",
        background: Async.observe(() => Styles.color.controlBase),
        color: Async.observe(() => Styles.color.controlBaseText)
    },
    ".nav-pills .nav-link.active": {
        background: Async.observe(() => Styles.color.primary),
        color: Async.observe(() => Styles.color.primaryText)
    },
    ".nav-pills.nav-stacked .nav-item": {
        display: "block",
        margin: "0"
    },

    // - tabs:
    ".nav-tabs": {
        borderBottomWidth: Async.observe(() => Styles.size.controlBorderWidth),
        borderBottomStyle: "solid",
        borderBottomColor: Async.observe(() => Styles.color.divider)
    },
    ".nav-tabs .nav-link": {
        display: "inline-block",
        padding: ".5rem",
        minWidth: "5rem",
        textAlign: "center",
        borderTopLeftRadius: Async.observe(() => Styles.size.buttonBorderRadius),
        borderTopRightRadius: Async.observe(() => Styles.size.buttonBorderRadius),
        textDecoration: "none"
    },
    ".nav-tabs .nav-link:hover": {
        textDecoration: "none",
        background: Async.observe(() => Styles.color.controlBase),
        color: Async.observe(() => Styles.color.controlBaseText)
    },
    ".nav-tabs .nav-link.active": {
        marginBottom: "-4px",
        borderBottomStyle: "solid",
        borderBottomWidth: "4px",
        borderBottomColor: Async.observe(() => Styles.color.primary)
    }
});
