import { Component } from "../core";
import { UIRenderContext } from "../ui";
import { AppActivationContext } from "./AppActivationContext";
/** @internal Activation context binding, can be reused to avoid creating new bindings */
export declare let activationContextBinding: import("../core/Binding").Binding;
/** Specialized `Component` that propagates application properties (abstract) */
export declare abstract class AppComponent extends Component {
    static preset(presets: object, ...rest: unknown[]): Function;
    /** Application render context, propagated from the parent composite object */
    renderContext?: UIRenderContext;
    /** Activation context, propagated from the parent composite object */
    activationContext?: AppActivationContext;
}
