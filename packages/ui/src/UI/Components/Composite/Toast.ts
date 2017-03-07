import * as Async from "@typescene/async";
import { Animation } from "../../Animation";
import { Screen } from "../../Screen";
import { Style } from "../../Style";
import { Block, Paragraph, Row } from "../";
import { ComponentFactory } from "../ComponentFactory";
import { TextLabelFactory } from "../TextLabelFactory";

/** All toasts currently displayed on screen */
var toasts: Toast[] = [];

/** Previous adjustment promise */
var adjWait: PromiseLike<any> | undefined;

/** Represents a toast message that is displayed in the corner of the page */
export class Toast extends Row {
    /** Close all toasts currently displayed on the page */
    public static closeAll() {
        for (var i = toasts.length - 1; i >= 0; i--)
            toasts[i].close();
    }

    /** Global positioning setting (do not change after first display) */
    public static POSITION: Block.OverlayPosition = Block.OverlayPosition.BottomLeft;

    /** Global margin setting, in pixels (do not change after first display) */
    public static HORZ_OUTER_MARGIN_PX = 16;

    /** Global margin setting, in pixels (do not change after first display) */
    public static VERT_OUTER_MARGIN_PX = 12;

    /** Global margin setting, in pixels (do not change after first display) */
    public static VERT_INNER_MARGIN_PX = 8;

    /** Default timeout for new toast messages, in milliseconds (defaults to 4000) */
    public static TIMEOUT = 4000;

    /** Maximum width for toast messages (CSS length) */
    public static MAX_WIDTH = "20rem";

    /** Default "appear" animation, added to every new `Toast` instance by the constructor */
    public static APPEAR_ANIMATION?: Animation;

    /** Default "disappear" animation, added to every new `Toast` instance by the constructor */
    public static DISAPPEAR_ANIMATION?: Animation;

    /** Create a toast message with given content, and optional timeout in ms (default 4000) */
    constructor(content: string | TextLabelFactory | ComponentFactory.SpecElt[],
        public timeout = Toast.TIMEOUT) {
        super();
        this.initializeWith({
            content: (content instanceof Array) ? content :
                (content instanceof TextLabelFactory) ? [content] :
                [ new TextLabelFactory(content, Paragraph) ],
            Clicked: "close",
            animations: {
                appear: Toast.APPEAR_ANIMATION,
                disappear: Toast.DISAPPEAR_ANIMATION
            },
            overlayPosition: Toast.POSITION,
            displayOptions: {
                stayOnTop: true
            }
        });
        this._override = new Style({
            marginTop: Toast.VERT_OUTER_MARGIN_PX + "px",
            marginBottom: Toast.VERT_OUTER_MARGIN_PX + "px",
            marginLeft: Toast.HORZ_OUTER_MARGIN_PX + "px",
            marginRight: Toast.HORZ_OUTER_MARGIN_PX + "px",
            maxWidth: Toast.MAX_WIDTH
        });
        this.Rendered.connect(() => {
            this.style.override(this._override);
        });
    }

    /** Display this toast message on the page */
    public display() {
        if (toasts.some(n => n === this)) return;
        Screen.display(this);

        // move previous toasts up, or this one down
        var previous = toasts.slice(0);
        toasts.push(this);
        var prevAdjWait = adjWait || Async.Promise.resolve(true);
        adjWait = Async.sleep(30).then(() => {
            prevAdjWait.then(() => {
                var dim = this.getActualDimensions();
                if (!dim.height && !dim.width) return;
                switch (this.overlayPosition) {
                    // top positioning:
                    case Block.OverlayPosition.Top:
                    case Block.OverlayPosition.TopLeft:
                    case Block.OverlayPosition.TopRight:
                        // move this toast down, below current toasts
                        var h = Toast.VERT_OUTER_MARGIN_PX;
                        previous.forEach(c => {
                            h += c.getActualDimensions().height +
                                Toast.VERT_INNER_MARGIN_PX;
                        });
                        this._override.set("marginTop", h + "px");
                        break;

                    // bottom positioning:
                    default:
                        // move other toasts up above current
                        var h = dim.height + Toast.VERT_INNER_MARGIN_PX;
                        previous.forEach(c => {
                            if (toasts.some(other => other === c)) {
                                var oldBottom = c.style.get("marginBottom");
                                var oldPx = parseInt(oldBottom) || 0;
                                c._override.set("marginBottom", (oldPx + h) + "px");
                            }
                        });
                }
            });
        });

        // close after timeout
        Async.Promise.sleep(this.timeout).then(() => {
            this.close();
        });
        return this;
    }

    /** Remove this toast from the page */
    public close() {
        var dim = this.getActualDimensions();
        if (!dim.height && !dim.width) {
            toasts = toasts.filter(n => n !== this);
            return;
        }

        // move other toasts
        var index = toasts.indexOf(this);
        if (index >= 0) {
            toasts.splice(index, 1);
            var h = dim.height + Toast.VERT_INNER_MARGIN_PX;
            var toMove: Toast[];
            var marginProp: string;
            switch (this.overlayPosition) {
                // top positioning:
                case Block.OverlayPosition.Top:
                case Block.OverlayPosition.TopLeft:
                case Block.OverlayPosition.TopRight:
                    // move next toasts up to cover current
                    toMove = toasts.slice(index);
                    marginProp = "marginTop";
                    break;

                // bottom positioning:
                default:
                    // move previous toasts down to cover current
                    toMove = toasts.slice(0, index);
                    marginProp = "marginBottom";
            }
            if (toMove.length) {
                Async.sleep(100).then(() => {
                    toMove.forEach(c => {
                        var oldProp = c._override.get(marginProp);
                        var oldPx = parseInt(oldProp) || 0;
                        c._override.set(marginProp, (oldPx - h) + "px");
                    });
                });
            }
        }

        // remove toast itself (i.e. show disappear animation)
        Screen.remove(this);
    }

    private _override: Style;
}
