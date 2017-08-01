import * as Async from "@typescene/core/Async";
import { Stylesheet } from "../Stylesheet";
import { Styles } from "../Styles";

export default new Stylesheet("", {
    ".__page_wrapper": {
        fontFamily: Async.observe(() => Styles.font.family),
        fontSize: Async.observe(() => Styles.size.text)
    },
    "h1,h2,h3,h4,h5,h6": {
        fontFamily: "inherit",
        fontWeight: "500",
        lineHeight: "1.1em"
    },
    "h1": { fontSize: "2.5rem" },
    "h2": { fontSize: "2rem" },
    "h3": { fontSize: "1.75rem" },
    "h4": { fontSize: "1.5rem" },
    "h5": { fontSize: "1.25rem" },
    "h6": { fontSize: "1rem" },
    "button,input,select,textarea,label": {
        fontFamily: "inherit",
        fontSize: "1em",
        color: "inherit",
        lineHeight: "normal",
        margin: "0",
        padding: "0",
        border: "none",
        outline: "0",
        background: "transparent",
        overflow: "auto",
        touchAction: "manipulation"
    },
    "button": { overflow: "visible" },
    "input": { overflow: "visible" },
    "textarea": { resize: "vertical" },
    "a": {
        backgroundColor: "transparent",
        cursor: "pointer",
        touchAction: "manipulation",
        textDecoration: "none"
    },
    "a:hover": {
        outlineWidth: "0",
        textDecoration: "underline"
    },
    "a:active": { outlineWidth: "0" },
    "img": { borderStyle: "none" }
});
