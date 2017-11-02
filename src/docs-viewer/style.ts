import { UI } from "@typescene/dom";

// apply style directly to the body element
UI.Screen.ready.then(() => {
    document.body.style.background = "#fff";
    document.body.style.height = "100%";
    document.body.style.margin = "0";
});    

// Apply style sheet (copied from CSS... TODO: make this less messy)
UI.DOM.applyStylesheet({
    "h1": {
        fontSize: "3.8rem",
        fontWeight: "600"
    },
    "h2": {
        fontSize: "2.25rem",
        fontWeight: "600"
    },
    "h3": {
        fontSize: "1.5rem",
        fontWeight: "600",
        fontStyle: "normal",
        padding: "0",
        margin: "2.5rem 0 1rem"
    },
    "h4": {
        fontSize: "1.125rem",
        fontWeight: "600",
        fontStyle: "normal",
        padding: "0",
        margin: "1.5rem 0 .5rem"
    },
    "h5": {
        fontSize: ".85rem",
        fontWeight: "600",
        fontStyle: "normal",
        textTransform: "uppercase",
        margin: "1.75rem 0 .75rem"
    },
    ".fa": {
        fontSize: "14px"
    },
    ".fa.fa-2x": {
        fontSize: "28px"
    },
    "code": {
        fontFamily: "Menlo,Monaco,Consolas,\"Liberation Mono\",\"Courier New\",monospace",
        fontSize: ".8em"
    },
    ".doc-code": {
        color: "#63e"
    },
    ".doc-code > code": {
        lineHeight: "1.5em",
    },
    ".doc-text-article .fa:first-child": {
        paddingRight: ".5rem"
    },
    ".doc-text-article .doc-text-example-output .fa:first-child": {
        paddingRight: "0"
    },
    ".doc-text-article a, .doc-text-article a:visited": {
        color: "#39e"
    },
    ".doc-text-article a > .fa": {
        color: "#333 !important",
        textDecoration: "none"
    },
    ".doc-text-article code": {
        background: "rgba(0,64,128,.05)",
        padding: ".125rem",
        borderRadius: "2px"
    },
    ".doc-text-article pre": {
        fontSize: "1rem",
        background: "rgba(0,64,128,.05)",
        borderTop: "2px solid rgba(0,64,128,.2)",
        padding: ".75rem .5rem",
        margin: "1rem 0",
        color: "#555",
        overflow: "auto"
    },
    ".doc-text-article pre > code": {
        lineHeight: "1.5em",
        background: "transparent",
        whiteSpace: "pre !important"
    },
    ".doc-text-article blockquote": {
        fontSize: "inherit",
        borderColor: "#e80"
    },
    ".doc-text-article p, .doc-text-article li, .doc-text-article dl": {
        lineHeight: "1.65em",
        margin: "0 0 1rem",
        padding: "0"
    },
    ".doc-text-article dt": {
        margin: "1rem 0 0",
        padding: "0",
        fontSize: "1.2rem",
        fontWeight: "300"
    },
    ".doc-text-article dt code": {
        background: "transparent"
    },
    ".doc-text-article dt .fa": {
        fontSize: "14px"
    },
    ".doc-text-article dd": {
        margin: ".25rem 0 .75rem",
        padding: "0 0 .5rem 2.8rem"
    },
    ".doc-text-article li": {
        margin: ".25rem 0"
    },
    ".doc-text-article h3.doc-heading-section": {
        padding: ".75rem 0",
        borderTop: "1px solid rgba(0,0,0,.15)"
    },
    ".doc-text-article hr": {
        border: "0",
        borderBottom: "1px solid rgba(0,0,0,.2)",
        padding: "0",
        margin: "2rem -1rem"
    },
    ".doc-text-type-intro": {
        fontSize: "1.25rem",
        fontWeight: "300"
    },
    ".doc-text-type-note": {
        background: "rgba(220,160,64,.08)",
        borderTop: "2px solid rgba(0,0,0,.2)",
        padding: ".5rem 1rem",
        margin: "1.5rem 0"
    },
    ".doc-text-type-note > :first-child": {
        marginTop: ".5rem"
    },
    ".doc-text-type-note pre": {
        background: "transparent",
        border: "0",
        padding: "0"
    },
    ".doc-text-type-example": {
        background: "rgba(0,64,128,.05)",
        padding: ".5rem 1rem",
        margin: "1.5rem 0"
    },
    ".doc-text-type-example pre": {
        background: "transparent",
        border: "0"
    },
    ".doc-text-type-example > h3": {
        background: "#666",
        color: "#fff",
        textTransform: "uppercase",
        fontSize: ".8em",
        lineHeight: "1.75em",
        padding: ".25rem 1rem",
        margin: "-.5rem -1rem 1rem -1rem"
    },
    ".doc-text-type-example > h3:last-child": {
        marginBottom: "-.5rem"
    },
    ".doc-text-type-example > pre": {
        marginLeft: "-.65rem",
        marginRight: "-.65rem"
    },
    ".doc-text-type-example > h3 + pre": {
        margin: "-1rem -1rem 1rem",
        borderRadius: "0",
        paddingLeft: ".75rem"
    },
    ".doc-text-type-example > pre:first-child": {
        borderTop: "2px solid rgba(0,64,128,.2)",
        margin: "-.5rem -1rem 1rem",
        borderRadius: "0",
        paddingLeft: ".75rem"
    },
    ".doc-text-type-example > pre:first-child + .doc-text-example-output": {
        marginTop: "-1rem !important"
    },
    ".doc-text-example-output": {
        display: "block !important",
        overflow: "auto !important",
        width: "auto !important",
        margin: "0 -1rem -.5rem !important",
        background: "#fff"
    },
    ".doc-text-type-example > h3 + pre + .doc-text-example-output": {
        marginTop: "-1rem !important"
    },
    ".doc-text-example-byline, .doc-text-example-byline button": {
        fontSize: ".75rem",
        textTransform: "uppercase !important",
        fontWeight: "600",
        borderBottom: "1px dotted #ccc"
    },
    ".toc_tree": {
        color: "#444"
    },
    ".toc_tree div": {
        outline: "0"
    }
});
