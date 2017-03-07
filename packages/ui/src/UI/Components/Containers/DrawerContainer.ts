import * as Async from "@typescene/async";
import { Animation } from "../../Animation";
import { Screen } from "../../Screen";
import { Style } from "../../Style";
import { Block } from "../";
import { Component } from "../Component";
import { ComponentFactory, UIValueOrAsync } from "../ComponentFactory";
import { Container } from "./Container";
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

    /** Initialize a drawer factory with given properties */
    public static with: (values: DialogContainer.Initializer) => ComponentFactory<DrawerContainer>;

    /** Initialize with given (observable) properties; returns this */
    public initializeWith: (values: DialogContainer.Initializer) => this;
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

