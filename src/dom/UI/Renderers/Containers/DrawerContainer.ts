import { DrawerContainer, OppositeDrawerContainer, Style } from "@typescene/core/UI";
import * as DOM from "../../DOM";
import { DOMAnimation } from "../../DOM/DOMAnimation";

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
DOM.Styles.define("UI-Container " + CSS_CLASS, {
    ".~~": new Style()
        .addShadowEffect(1)
        .set({ height: "100vh" })
});
