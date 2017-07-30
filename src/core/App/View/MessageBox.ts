import Async from "../../Async";
import { BaseDialogLayout } from "./Layout";
import { layoutFragment } from "./ViewLayout";
import { ComponentFactory, Row, Button, TextLabelFactory, DialogContainer, WideLabel, Paragraph } from "../../UI";

/** Modal dialog layout view used by `showMessageBox` that contains a title row fragment and a button row fragment, and all messages as separate rows in the main content area */
export class MessageBoxLayout extends BaseDialogLayout {
    /** Layout fragment for the message box title row, used by `showMessageBox` as the header of message box dialogs that contain a title; can be used to apply global style overrides */
    @layoutFragment
    static readonly TitleRow = Row.with();
    
    /** Layout fragment for the message box button row, used by `showMessageBox` as a footer row on message box dialogs; can be used to apply global style overrides */
    @layoutFragment
    static readonly ButtonRow = Row.with();

    /** Message row component factory (NOT a fragment), used by `showMessageBox` to construct the _first_ message row; can be used to apply global style overrides */
    static readonly FirstMessageRow = Row.with();

    /** Message row component factory (NOT a fragment), used by `showMessageBox` to construct the all message rows _other than the first row_; can be used to apply global style overrides */
    static readonly MessageRow = Row.with();

    /** Label used for the default "Dismiss" button when the arguments to `showMessageBox` do not include a single button; can be changed but must be a `UI.TextLabelFactory` (i.e. result of `UI.tl`) */
    static DISMISS_LABEL = new TextLabelFactory("Dismiss");

    /** Create a new message box (without content); use `showMessageBox` function instead, to initialize and display a message box with a title, message, and predefined buttons */
    constructor() {
        super();
        this.bindFragment("header", "TitleRow");
        this.bindFragment("footer", "ButtonRow");
    }
}

/** Show a modal message dialog box with given message(s) and a "Dismiss" button; returns a promise that is fulfilled when the dialog is closed */
export function showMessageBox(message: string | TextLabelFactory | Array<string | TextLabelFactory>): PromiseLike<number | undefined>;
/** Show a modal message dialog box with given title and message(s) and a "Dismiss" button; returns a promise that is fulfilled when the dialog is closed */
export function showMessageBox(title: string | TextLabelFactory, message: string | TextLabelFactory | Array<string | TextLabelFactory>): PromiseLike<number | undefined>;
/** Show a modal message dialog box with given message(s) and buttons (as result(s) of `Button.with(...)`); returns a promise that resolves to the index of the button that was clicked, or undefined if the dialog was dismissed otherwise (e.g. ESC key) */
export function showMessageBox(message: string | TextLabelFactory | Array<string | TextLabelFactory>, ...buttons: ComponentFactory<Button>[]): PromiseLike<number | undefined>;
/** Show a modal message dialog box with given title, message(s), and buttons (as result(s) of `Button.with(...)`); returns a promise that resolves to the index of the button that was clicked, or undefined if the dialog was dismissed otherwise (e.g. ESC key) */
export function showMessageBox(title: string | TextLabelFactory, message: string | TextLabelFactory | Array<string | TextLabelFactory>, ...buttons: ComponentFactory<Button>[]): PromiseLike<number | undefined>;

// implementation:
export function showMessageBox(...args: any[]): PromiseLike<number | undefined> {
    var layoutArgs: any[] = [];

    // check for title text
    if (args[1] && !(<ComponentFactory<Button>>args[1]).isComponentFactory) {
        // first argument is not the only text: it is the title text
        var titleArg = args.shift();
        if (typeof titleArg === "string") {
            // use a wide label by default
            titleArg = new TextLabelFactory("{}" + titleArg, undefined, false, WideLabel);
        }
        layoutArgs.push(MessageBoxLayout.TitleRow.with(
            titleArg, DialogContainer.TopCloseButton));
    }

    // append message text
    if (args.length) {
        var textArg = args.shift();
        if (!(textArg instanceof Array)) textArg = [textArg];
        (<Array<string | TextLabelFactory>>textArg).forEach((t, i) => {
            if (typeof t === "string") {
                // use a paragraph label by default
                t = new TextLabelFactory("{}" + (t || ""), undefined, false, Paragraph);
            }
            layoutArgs.push(i ?
                MessageBoxLayout.MessageRow.with(t) :
                MessageBoxLayout.FirstMessageRow.with(t));
        });
    }

    // if no button passed in, use a default "Dismiss" button
    if (!args.length) {
        args.push(Button.withLabel(MessageBoxLayout.DISMISS_LABEL));
    }

    // remaining args should be Button component factories at this point
    var buttons: Button[] = args.map(arg => new (<ComponentFactory<Button>>arg)());
    layoutArgs.push(new MessageBoxLayout.ButtonRow(buttons));

    // create and show the dialog
    var dialog = new (MessageBoxLayout.with.apply(MessageBoxLayout, layoutArgs))();
    dialog.openAsync();

    return new Async.Promise<number | undefined>(resolve => {
        // resolve with button index when clicked, and close dialog
        buttons.forEach((b, i) => {
            b.Click.connectOnce(() => {
                resolve(i);
                dialog.close();
            });
        });

        // resolve with undefined value if dismissed otherwise
        dialog.Closed.connectOnce(() => {
            resolve(undefined);
        });
    });
}
