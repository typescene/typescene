import { bind, Component, managed } from "../core";
import { renderContextBinding, UIRenderContext } from "../ui";
import { AppActivationContext } from "./AppActivationContext";

/** @internal Activation context binding, can be reused to avoid creating new bindings */
export let activationContextBinding = bind("activationContext");

/** Specialized `Component` that propagates application properties (abstract) */
export abstract class AppComponent extends Component {
    static preset(presets: object, ...rest: unknown[]): Function {
        (this as typeof Component).presetBinding("renderContext", renderContextBinding);
        (this as typeof Component).presetBinding("activationContext", activationContextBinding);
        return super.preset(presets, ...rest);
    }

    /** Application render context, propagated from the parent composite object */
    @managed
    renderContext?: UIRenderContext;

    /** Activation context, propagated from the parent composite object */
    @managed
    activationContext?: AppActivationContext;
}
