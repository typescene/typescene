import { DrawerContainer, OppositeDrawerContainer } from "../../../Components/Containers/DrawerContainer";
import { Style } from "../../../Style";
import { DOM } from "../../DOM";
import { DOMAnimation } from "../../DOMAnimation";

/** Base class name used for CSS style sheet */
const CSS_CLASS = "UI-DrawerContainer";

// set default animations
DrawerContainer.APPEAR_ANIMATION =
    DOMAnimation.basic.in.fadeRight.withTiming(300);
DrawerContainer.DISAPPEAR_ANIMATION =
    DOMAnimation.basic.out.fadeLeft.withTiming(300);
OppositeDrawerContainer.APPEAR_ANIMATION =
    DOMAnimation.basic.in.fadeLeft.withTiming(300);
OppositeDrawerContainer.DISAPPEAR_ANIMATION =
    DOMAnimation.basic.out.fadeRight.withTiming(300);

// Add style override and apply style sheet
DrawerContainer.addStyleOverride(Style.withClass(CSS_CLASS));
DOM.CSS.define("UI-Container " + CSS_CLASS, {
    ".~~": new Style()
        .addShadowEffect(1)
        .set({ background: "#fff", height: "100vh" })
});
