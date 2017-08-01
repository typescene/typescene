import { Animation } from "../../Animation";
import { Block } from "../";
import { DialogContainer } from "./DialogContainer";

/** Represents a modal container displayed on the side of the screen */
export class DrawerContainer extends DialogContainer {
    /** Create a drawer component with given content, if any */
    constructor(content?: Block[], width?: string) {
        super(content);
        if (width) this.width = width;

        // amend alignment and margin
        this.displayOptions.modalHorzAlign = "left";
        this.displayOptions.outerMargin = "1.5rem";

        // amend default animations
        if (!this.animations) this.animations = {};
        this.animations.appear = DrawerContainer.APPEAR_ANIMATION;
        this.animations.disappear = DrawerContainer.DISAPPEAR_ANIMATION;
    }

    /** Default "appear" animation, added to every new `DrawerContainer` instance by the constructor */
    public static APPEAR_ANIMATION?: Animation;

    /** Default "disappear" animation, added to every new `DrawerContainer` instance by the constructor */
    public static DISAPPEAR_ANIMATION?: Animation;
}

/** Represents a modal container displayed on the right hand side of the screen (i.e. DrawerContainer with different alignment and animations) */
export class OppositeDrawerContainer extends DrawerContainer {
    /** Create a drawer component with given content, if any */
    constructor(content?: Block[], width?: string) {
        super(content, width);

        // amend alignment
        this.displayOptions.modalHorzAlign = "right";

        // amend default animations
        if (!this.animations) this.animations = {};
        this.animations.appear = OppositeDrawerContainer.APPEAR_ANIMATION;
        this.animations.disappear = OppositeDrawerContainer.DISAPPEAR_ANIMATION;
    }

    /** Default "appear" animation, added to every new `OppositeDrawerContainer` instance by the constructor */
    public static APPEAR_ANIMATION?: Animation;

    /** Default "disappear" animation, added to every new `OppositeDrawerContainer` instance by the constructor */
    public static DISAPPEAR_ANIMATION?: Animation;
}
