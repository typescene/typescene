import * as Async from "@typescene/core/Async";
import { Stylesheet } from "../Stylesheet";
import { Styles } from "../Styles";

export default new Stylesheet("", {
    ".__page_wrapper": {
        fontFamily: Async.observe(() => Styles.font.family),
        fontSize: Async.observe(() => Styles.size.text)
    },
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
