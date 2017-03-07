import * as Async from "@typescene/async";
import { bind } from "../../Binding";
import { TextLabelFactory, tl } from "../TextLabelFactory";
import { ComponentFactory, initializer } from "../ComponentFactory";
import { DialogContainer, Row, WideLabel, Paragraph, Spacer, ControlStack, PrimaryButton } from "../";

/** Represents a generic message dialog with one button to dismiss, contains either a single Paragraph component, or a stack initialized with given texts */
export class MessageDialog extends DialogContainer {
    @initializer
    static initializer = DialogContainer.with({
        header: bind("headerText", header => (header ?
            [header instanceof TextLabelFactory ? header : tl(header, WideLabel),
                Spacer, DialogContainer.TopCloseButton] : undefined)),
        content: [
            Row.with({
                content: bind("messageText", message => ((<any>message).mapAsync ?
                    [ControlStack.withContent(message.mapAsync(m =>
                        (m instanceof TextLabelFactory) ? m : tl(m, Paragraph)))] :
                    [message instanceof TextLabelFactory ? message :
                        tl(message, Paragraph)])),
                verticalSpacing: "1.5rem"
            }),
            [
                Spacer,
                PrimaryButton.with({
                    label: bind("buttonLabel"),
                    hasFocus: true,
                    Click: "close"
                })
            ]
        ]
    });

    /** Create a message dialog with given text */
    constructor(headerText: string | TextLabelFactory,
        messageText: string | TextLabelFactory,
        buttonLabel?: string | TextLabelFactory);
    /** Create a message dialog with given texts stacked vertically */
    constructor(headerText: string | TextLabelFactory,
        messageTexts: Array<string | TextLabelFactory>,
        buttonLabel?: string | TextLabelFactory);
    constructor(headerText: any, messageText: any, buttonLabel = "Dismiss") {
        super();
        this.headerText = headerText;
        this.messageText = messageText;
        this.buttonLabel = buttonLabel;
    }

    /** Dialog header text, if any */
    @Async.observable
    public headerText?: string | TextLabelFactory;

    /** One or more lines of text to be displayed as main content */
    @Async.observable
    public messageText: string | TextLabelFactory | Array<string | TextLabelFactory>;

    /** The dismiss button label (defaults to Dismiss) */
    @Async.observable
    public buttonLabel: string | TextLabelFactory;
}

