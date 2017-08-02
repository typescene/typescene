import { UI } from "@typescene/dom";

// apply style directly to the body element
UI.Screen.ready.then(() => {
    document.body.style.background = "#fff";
    document.body.style.height = "100%";
});    

// Apply style sheet (copied from CSS... TODO: make this less messy)
UI.DOM.applyStylesheet({
    "h1": {
        fontSize: "3.8rem",
        fontWeight: "600",
        letterSpacing: "-2px"
    },
    "h2": {
        fontSize: "2rem",
        fontWeight: "600",
        letterSpacing: "-1px"
    },
    "h3": {
        fontSize: "inherit",
        fontWeight: "bold",
        fontStyle: "normal",
        padding: "0",
        margin: "1.5rem 0 .5rem",
        paddingTop: ".25rem !important"
    },
    "h5": {
        fontSize: ".85rem",
        fontWeight: "800",
        fontStyle: "normal",
        textTransform: "uppercase",
        margin: "1.75rem 0 .75rem"
    },
    "code": {
        fontFamily: "Menlo,Monaco,Consolas,\"Liberation Mono\",\"Courier New\",monospace",
        fontSize: ".8em"
    },
    ".doc-text-article a, .doc-text-article a:visited": {
        color: "#36a",
        textDecoration: "underline"
    },
    ".doc-text-article code": {
        background: "rgba(0,64,128,.1)",
        padding: ".125rem",
        borderRadius: "2px"
    },
    ".doc-text-article pre": {
        padding: ".5rem",
        border: "0",
        margin: "1rem 0",
        background: "#222",
        color: "#eee",
        borderRadius: "3px",
        overflow: "auto"
    },
    ".doc-text-article pre > code": {
        lineHeight: "1.5em",
        background: "#222",
        whiteSpace: "pre !important"
    },
    ".doc-text-article blockquote": {
        fontSize: "inherit",
        borderColor: "#e80"
    },
    ".doc-text-article p, li": {
        lineHeight: "1.5em",
        margin: "0 0 .75rem"
    },
    ".doc-text-article li": {
        margin: ".25rem 0"
    },
    ".doc-text-article hr": {
        border: "0",
        borderBottom: "1px solid rgba(0,0,0,.2)",
        padding: "0",
        margin: "2rem 0"
    },
    ".doc-text-type-note": {
        background: "rgba(0,0,0,.05)",
        border: "1px solid rgba(0,0,0,.2)",
        padding: ".5rem 1rem",
        margin: "1.5rem 0"
    },
    ".doc-text-type-note > :first-child": {
        marginTop: ".5rem"
    },
    ".doc-text-type-example": {
        background: "rgba(0,0,0,.1)",
        border: "1px solid rgba(0,0,0,.2)",
        padding: ".5rem 1rem",
        margin: "1.5rem 0"
    },
    ".doc-text-type-example > h3": {
        background: "#49a",
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
    ".doc-text-example-output": {
        display: "block !important",
        overflow: "auto !important",
        width: "auto !important",
        margin: "0 -1rem -.5rem !important",
        background: "#fff",
        borderTop: "1px solid #ccc"
    },
    ".doc-text-type-example > h3 + pre + .doc-text-example-output": {
        marginTop: "-1rem !important"
    },
    ".doc-text-example-byline, .doc-text-example-byline button": {
        fontSize: ".65rem",
        textTransform: "uppercase !important",
        fontWeight: "bold",
        borderBottom: "1px dotted #ccc"
    }
});
