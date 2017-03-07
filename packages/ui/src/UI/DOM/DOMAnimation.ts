import * as Async from "@typescene/async";
import { Animation } from "../Animation";
import { Style } from "../Style";
import { Component } from "../Components/Component"
import { DOM } from "./DOM";

/** Represents a CSS keyframe animation */
export class DOMAnimation extends Animation {
    /** Create a combined animation out of given key frame animations */
    public static together(...animations: DOMAnimation[]): Animation {
        // find maximum duration from given animations, combine CSS
        var duration = 0, cssTexts: string[] = [];
        animations.forEach(a => {
            cssTexts.push(a._playingCSSText);
            if (a.duration > duration)
                duration = a.duration;
        });
        var combinedCSSText = cssTexts.join(", ");

        // create a combined Animation class
        var CombinedAnimation = class extends Animation {
            constructor(name: string) {
                super(name);
                this.duration = duration;

                // define CSS class with combined CSS
                var s = new DOM.Stylesheet(this.id, {
                    ".~_playing": {
                        animation: combinedCSSText,
                        webkitAnimation: combinedCSSText
                    }
                });
                DOM.applyStylesheet(s);
            }
            public play(c: Component): any {
                // reuse keyframe animation play method
                return DOMAnimation.prototype.play.call(this, c);
            }
        };

        // return a singleton instance
        return new CombinedAnimation(
            animations.map(a => (a && a.name)).join("_and_"));
    }

    /** Get an animation with given keyframes and given playback options ready for use */
    constructor(name: string, keyframes: DOMAnimation.Keyframe[] = [],
        options: DOMAnimation.Options = {}) {
        super(name);
        this._options = options;

        // declare all keyframes in the animation
        this._keyframesID = options._keyframes || this.id;
        if (!options._keyframes) {
            // get style sheet with all keyframes
            var sheet = new DOM.Stylesheet();
            keyframes.forEach((frame, i) => {
                var t = frame.t;
                if (t === undefined) t = i / (keyframes.length - 1 || 1);
                var perc = (Math.round(t * 1000) / 10) + "%";
                var style = (frame.style instanceof Style) ?
                    frame.style : new Style(frame.style);
                sheet.define("@keyframes " + this.id + "{" + perc + "}", style);
            });
            DOM.applyStylesheet(sheet);
        }

        // declare the animation itself
        var duration = 350, delay = 0, count = "1";
        if (options.duration! >= 0) duration = options.duration!;
        if (options.delay! >= 0) delay = options.delay!;
        if (options.count === Infinity) count = "infinite";
        else if (options.count !== undefined) count = String(options.count);
        var cssText = this._keyframesID + " " +
            (options.specDuration! >= 0 ? options.specDuration : duration) + "ms " +
            delay + "ms " +
            count + " " +
            (options.direction || "normal") +
            (options.ease ? " ease" : "") + " forwards";
        DOM.applyStylesheet(new DOM.Stylesheet(this.id, {
            ".~_playing": {
                animation: cssText,
                webkitAnimation: cssText
            }
        }));
        this.duration = duration + delay;
        this._playingCSSText = cssText;
    }

    /** Clone the animation with the same keyframes but with extra options */
    public clone(options: DOMAnimation.Options) {
        var clonedOptions = {
            duration: options.duration! >= 0 ?
                options.duration : this._options.duration,
            delay: options.delay! >= 0 ?
                options.delay : this._options.delay,
            count: options.count! >= 0 ?
                options.count : this._options.count,
            direction: options.direction ?
                options.direction : this._options.direction,
            ease: options.ease !== undefined ?
                options.ease : this._options.ease,
            _keyframes: this._keyframesID
        }
        return new DOMAnimation(this.name, undefined, clonedOptions);
    }

    /** Combine this animation with given key frame animations; this does *not* work for animations that use the same CSS property, such as `transform` (rotate, scale, translate...) */
    public togetherWith(...animations: DOMAnimation[]): Animation {
        return DOMAnimation.together.apply(DOMAnimation,
            [<DOMAnimation>this].concat(animations));
    }

    /** Clone this animation and override timings */
    public withTiming(msDuration: number, msDelay?: number) {
        return this.clone({ duration: msDuration, delay: msDelay });
    }

    /** Clone this animation and specify to be played in reverse */
    public reverse() {
        return this.clone({
            direction: (this._options.direction &&
                this._options.direction === "reverse") ?
                "normal" : "reverse"
        });
    }

    /** Play the animation once on given component */
    public play(component: Component): Animation.AnimationControl<DOMAnimation> {
        var control: any = { animation: this };
        if (!Animation.isEnabled) {
            // do not start, return bogus object
            control.done = Async.Promise.resolve(control);
            control.stop = () => { };
        }
        else {
            // start the animation
            component.style.addClass(this.id + "_playing");

            // this is technically not correct but good enough in most cases
            // where the animation is triggered on an existing element, and
            // avoids complicated event setup:
            control.done = Async.sleep(this.duration, control);
            control.stop = () => {
                component.style.removeClass(this.id + "_playing");
            };
        }
        return control;
    }

    /** @internal Keyframes reference ID */
    private _keyframesID: string;

    /** @internal CSS text for _playing class */
    private _playingCSSText: string;

    /** @internal Options used to construct this animation */
    private _options: any;
}

export namespace DOMAnimation {
    /** Represents a single keyframe in an animation */
    export interface Keyframe {
        /** Keyframe position (fraction, 0-1), defaults to the relative position of this keyframe from 0 to 1 (i.e. first keyframe to 0, second in a set of three keyframes to 0.5, second in a set of four keyframes to 0.25, etc) */
        t?: number;
        /** Keyframe style properties */
        style: Style.StyleSet | Style;
    }

    /** Keyframe animation options */
    export interface Options {
        /** Duration in milliseconds (default 500) */
        duration?: number;
        /** Duration specified in CSS (copied from duration if unspecified) */
        specDuration?: number;
        /** Delay in milliseconds before starting the animation (default 0) */
        delay?: number;
        /** Number of iterations to play (default 1; can be Infinity) */
        count?: number;
        /** Direction to play the keyframes in (normal, reverse, alternate, or alternate-reverse; default normal) */
        direction?: "normal" | "reverse" | "alternate" | "alternate-reverse";
        /** Set to true to ease the animation timing */
        ease?: boolean;
        /** @internal Reference to another set of keyframes by ID */
        _keyframes?: string;
    }

    var fadeIn = new DOMAnimation("fadeIn", [
        { style: { opacity: "0" } },
        { style: { opacity: "1" } }
    ]);
    var fadeOut = fadeIn.reverse();

    var slideInUp = new DOMAnimation("slideInUp", [
        { style: { transform: "translateY(100%)" } },
        { style: { transform: "translateY(0)" } }
    ]);
    var fadeInUp = new DOMAnimation("fadeInUp", [
        { style: { opacity: "0", transform: "translateY(50%)" } },
        { style: { opacity: "1", transform: "translateY(0)" } }
    ]);
    var slideOutDown = slideInUp.reverse();
    var fadeOutDown = fadeInUp.reverse();

    var slideInDown = new DOMAnimation("slideInDown", [
        { style: { transform: "translateY(-100%)" } },
        { style: { transform: "translateY(0)" } }
    ]);
    var fadeInDown = new DOMAnimation("fadeInDown", [
        { style: { opacity: "0", transform: "translateY(-50%)" } },
        { style: { opacity: "1", transform: "translateY(0)" } }
    ]);
    var slideOutUp = slideInDown.reverse();
    var fadeOutUp = fadeInDown.reverse();

    var slideInLeft = new DOMAnimation("slideInLeft", [
        { style: { transform: "translateX(100%)" } },
        { style: { transform: "translateX(0)" } }
    ]);
    var fadeInLeft = new DOMAnimation("fadeInLeft", [
        { style: { opacity: "0", transform: "translateX(50%)" } },
        { style: { opacity: "1", transform: "translateX(0)" } }
    ]);
    var slideOutRight = slideInLeft.reverse();
    var fadeOutRight = fadeInLeft.reverse();

    var slideInRight = new DOMAnimation("slideInRight", [
        { style: { transform: "translateX(-100%)" } },
        { style: { transform: "translateX(0)" } }
    ]);
    var fadeInRight = new DOMAnimation("fadeInRight", [
        { style: { opacity: "0", transform: "translateX(-50%)" } },
        { style: { opacity: "1", transform: "translateX(0)" } }
    ]);
    var slideOutLeft = slideInRight.reverse();
    var fadeOutLeft = fadeInRight.reverse();

    var scaleIn = new DOMAnimation("scaleIn", [
        { style: { transform: "scale(0)" } },
        { style: { transform: "scale(1)" } }
    ]);
    var scaleOut = scaleIn.reverse();

    var scaleInOver = new DOMAnimation("scaleInOver", [
        { style: { transform: "scale(0)" } },
        { style: { transform: "scale(1.15)" }, t: .5 },
        { style: { transform: "scale(.95)" }, t: .8 },
        { style: { transform: "scale(1)"} }
    ]);
    var scaleOutOver = scaleInOver.reverse();

    var turnInX = new DOMAnimation("turnInX", [
        { style: { transform: "perspective(1000px) rotateX(90deg)" } },
        { style: { transform: "perspective(1000px)" } }
    ]);
    var turnOutX = new DOMAnimation("turnOutX", [
        { style: { transform: "perspective(1000px)" } },
        { style: { transform: "perspective(1000px) rotateX(90deg)" } }
    ]);

    var turnInY = new DOMAnimation("turnInY", [
        { style: { transform: "perspective(1000px) rotateY(90deg)" } },
        { style: { transform: "perspective(1000px)" } }
    ]);
    var turnOutY = new DOMAnimation("turnOutY", [
        { style: { transform: "perspective(1000px)" } },
        { style: { transform: "perspective(1000px) rotateY(90deg)" } }
    ]);

    var growMaxHeight = new DOMAnimation("growMaxHeight", [
        { style: { maxHeight: "0", animationTimingFunction: "cubic-bezier(0.5, 0, 1, 0.5)" } },
        { style: { maxHeight: "5000px", animationTimingFunction: "cubic-bezier(0.5, 0, 1, 0.5)" } }
    ], { duration: 800 });
    var shrinkMaxHeight = new DOMAnimation("shrinkMaxHeight", [
        { style: { maxHeight: "5000px", animationTimingFunction: "cubic-bezier(0, 0.5, 0.5, 1)" } },
        { style: { maxHeight: "0", animationTimingFunction: "cubic-bezier(0, 0.5, 0.5, 1)" } },
    ], { duration: 800 });

    var growMaxWidth = new DOMAnimation("growMaxWidth", [
        { style: { maxWidth: "0", animationTimingFunction: "cubic-bezier(0.5, 0, 1, 0.5)" } },
        { style: { maxWidth: "5000px", animationTimingFunction: "cubic-bezier(0.5, 0, 1, 0.5)" } }
    ], { duration: 800 });
    var shrinkMaxWidth = new DOMAnimation("shrinkMaxWidth", [
        { style: { maxWidth: "5000px", animationTimingFunction: "cubic-bezier(0, 0.5, 0.5, 1)" } },
        { style: { maxWidth: "0", animationTimingFunction: "cubic-bezier(0, 0.5, 0.5, 1)" } },
    ], { duration: 800 });

    var highlightYellow = new DOMAnimation("highlightYellow", [
        { style: { background: "#ffc" } },
        { style: { background: "#ffa" } },
        { style: { background: "transparent" } }
    ]);

    var jumpOut = new DOMAnimation("jumpOut", [
        { style: { transform: "scale(.9)" } },
        { style: { transform: "scale(1.2)" } },
        { style: { transform: "scale(.9)" }, t: .9 },
        { style: { transform: "scale(1)" } }
    ]);
    var jumpIn = new DOMAnimation("jumpIn", [
        { style: { transform: "scale(1.05)" } },
        { style: { transform: "scale(.9)" } },
        { style: { transform: "scale(1.05)" }, t: .9 },
        { style: { transform: "scale(1)" } }
    ]);

    /** List of basic animations [implementation] */
    export var basic = {
        in: {
            fade: fadeIn,
            fadeUp: fadeInUp,
            fadeDown: fadeInDown,
            fadeLeft: fadeInLeft,
            fadeRight: fadeInRight,
            slideUp: slideInUp,
            slideDown: slideInDown,
            slideLeft: slideInLeft,
            slideRight: slideInRight,
            scale: scaleIn,
            scaleOver: scaleInOver,
            turnX: turnInX,
            turnY: turnInY,
            maxHeight: growMaxHeight,
            maxWidth: growMaxWidth
        },
        out: {
            fade: fadeOut,
            fadeUp: fadeOutUp,
            fadeDown: fadeOutDown,
            fadeLeft: fadeOutLeft,
            fadeRight: fadeOutRight,
            slideUp: slideOutUp,
            slideDown: slideOutDown,
            slideLeft: slideOutLeft,
            slideRight: slideOutRight,
            scale: scaleOut,
            scaleOver: scaleOutOver,
            turnX: turnOutX,
            turnY: turnOutY,
            maxHeight: shrinkMaxHeight,
            maxWidth: shrinkMaxWidth,
        },
        highlight: {
            yellow: highlightYellow,
            jumpOut, jumpIn
        }
    }
}

