import { AppActivity } from '../../app';
import { Component, ComponentEventHandler, managed, ManagedRecord } from '../../core';
import { UIRenderableConstructor } from '../UIComponent';
import { UIFormContextController } from '../UIFormContextController';
import { UIStyle } from '../UIStyle';
import { UITheme } from '../UITheme';
import { UICell } from "./UICell";

/** Style mixin that is automatically applied on each instance */
const _mixin = UIStyle.create("UIForm", {
    dimensions: { grow: 0 }
});

/**
 * Represents a UI component that groups form controls and other content in a cell.
 * @note This component is optional and has the same effect as `UIFormContextController` which does not render its own cell.
 */
export class UIForm extends UICell {
    static preset(presets: UIForm.Presets,
        ...rest: Array<UIRenderableConstructor | undefined>): Function {
        return super.preset(presets, ...rest);
    }

    /**
     * Returns the closest parent form (or form context controller, see `UIFormContextController`) for given component; can be used by input components to find and observe the form context component before rendering.
     * Does not return components beyond the scope of the current `AppActivity` parent.
     */
    static find(component: Component) {
        let current: Component | undefined = component;
        while (current) {
            current = current.getParentComponent();
            if (current instanceof UIForm) return current;
            if (current instanceof UIFormContextController) return current;
            if (current instanceof AppActivity) break;
        }
    }

    style = UITheme.current.baseContainerStyle.mixin(_mixin);

    accessibleRole = "form";

    /** Form state context; defaults to an empty managed record */
    @managed
    formContext = new ManagedRecord();
}

// observe to emit event when form context changes
UIForm.observe(class {
    constructor(public controller: UIForm) { }
    onFormContextChange() {
        this.controller.propagateComponentEvent("FormContextChange");
    }
});

export namespace UIForm {
    /** UIForm presets type, for use with `Component.with` */
    export interface Presets extends UICell.Presets {
        /** Form state object; must be a (binding to a) managed record, see `ManagedRecord` */
        formContext?: ManagedRecord;
        /** Event handler for any change to the form state */
        onFormContextChange: ComponentEventHandler<UIForm>;
        /** Event handler for form submissions */
        onSubmit: ComponentEventHandler<UIForm>;
    }
}
