import * as Async from "@typescene/async";
import { bind } from "../../Binding";
import { TextLabelFactory, tl } from "../TextLabelFactory";
import { ComponentFactory, initializer } from "../ComponentFactory";
import { ComponentSignal } from "../ComponentSignal";
import { DialogContainer, Row, WideLabel, Paragraph, Spacer, ControlStack, PrimaryButton, LinkButton } from "../";

/** Represents a generic confirmation dialog with Confirm and Cancel options, contains either a single Paragraph component, or a stack initialized with given texts; emits Confirmed signal when confirm button is clicked */
export class ConfirmationDialog extends DialogContainer {
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
                LinkButton.with({
                    label: bind("cancelButtonLabel"),
                    hasFocus: true,
                    Click: "close"
                }),
                PrimaryButton.with({
                    label: bind("confirmButtonLabel"),
                    Click: "Confirmed"
                })
            ]
        ]
    });

    /** Create a confirmation dialog with given text */
    constructor(headerText: string | TextLabelFactory,
        messageText: string | TextLabelFactory,
        confirmButtonLabel?: string | TextLabelFactory,
        cancelButtonLabel?: string | TextLabelFactory);
    /** Create a confirmation dialog with given texts stacked vertically */
    constructor(headerText: string | TextLabelFactory,
        messageTexts: Array<string | TextLabelFactory>,
        confirmButtonLabel?: string | TextLabelFactory,
        cancelButtonLabel?: string | TextLabelFactory);
    constructor(headerText: any, messageText: any,
        confirmButtonLabel = "Confirm", cancelButtonLabel = "Cancel") {
        super();
        this.headerText = headerText;
        this.messageText = messageText;
        this.confirmButtonLabel = confirmButtonLabel;
        this.cancelButtonLabel = cancelButtonLabel;
        this.Confirmed.connect(() => this.close());
    }

    /** Dialog header text, if any */
    @Async.observable
    public headerText?: string | TextLabelFactory;

    /** One or more lines of text to be displayed as main content */
    @Async.observable
    public messageText: string | TextLabelFactory | Array<string | TextLabelFactory>;

    /** The confirmation button label (defaults to Confirm) */
    @Async.observable
    public confirmButtonLabel: string | TextLabelFactory;

    /** The cancellation button label (defaults to Cancel) */
    @Async.observable
    public cancelButtonLabel: string | TextLabelFactory;

    /** Signal that is emitted when the confirm button has been clicked */
    public readonly Confirmed = this.defineComponentSignal();
}


