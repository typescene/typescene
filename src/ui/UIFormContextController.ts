import { ComponentEventHandler, managed, ManagedChangeEvent, ManagedRecord } from "../core";
import { UIRenderableController } from "./UIRenderableController";

export class UIFormContextChangeEvent extends ManagedChangeEvent {
    constructor() { super("FormContextChange") }
}

/** Renderable wrapper that injects a form context record, to be used by (nested) child input controls. */
export class UIFormContextController extends UIRenderableController {
    /** Form state context; defaults to an empty managed record */
    @managed
    formContext = new ManagedRecord();
}

// observe to emit event when form context changes
UIFormContextController.observe(class {
    constructor(public controller: UIFormContextController) { }
    onFormContextChange() {
        this.controller.emit(UIFormContextChangeEvent);
    }
});

export namespace UIFormContextController {
    /** UIFormStateController presets type, for use with `Component.with` */
    export interface Presets {
        /** Form state object; must be a (binding to a) managed record, see `ManagedRecord` */
        formContext?: ManagedRecord;
        /** Event handler for any change to the form state */
        onFormContextChange: ComponentEventHandler<UIFormContextController>;
        /** Event handler for Enter key presses (ignoring Enter key presses on multiline text fields and buttons, which do not emit the EnterKeyPress event) */
        onEnterKeyPress: ComponentEventHandler<UIFormContextController>;
    }
}
