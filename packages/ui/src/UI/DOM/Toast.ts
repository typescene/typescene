import { Toast } from "../Components/Composite/Toast";
import { Style } from "../Style";
import { DOM } from "./DOM";
import { DOMAnimation } from "./DOMAnimation";

/** Base class name used for CSS style sheet */
const CSS_CLASS = "UI-Toast";

// set default animation style
Toast.APPEAR_ANIMATION = DOMAnimation.basic.in.fadeRight;
Toast.DISAPPEAR_ANIMATION = DOMAnimation.basic.out.fade.withTiming(200);

// Add style override and apply style sheet
Toast.addStyleOverride(Style.withClass(CSS_CLASS).addShadowEffect(.25));
DOM.CSS.define("UI-Block " + CSS_CLASS, {
    ".~~": {
        background: "rgba(64,64,64,.8)",
        color: "#fff",
        transition: "margin .1s ease",
        borderRadius: ".25rem",
        overflow: "hidden"
    }
});
