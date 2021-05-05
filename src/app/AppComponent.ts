import { bind, Component, managed } from "../core";
import { renderContextBinding, UIRenderContext, viewportContextBinding } from "../ui";
import { AppActivationContext } from "./AppActivationContext";

/** @internal Activation context binding, can be reused to avoid creating new bindings */
export const activationContextBinding = bind("activationContext");

/** Specialized `Component` that propagates application properties (abstract) */
export abstract class AppComponent extends Component.with({
  renderContext: renderContextBinding,
  viewportContext: viewportContextBinding,
  activationContext: activationContextBinding,
}) {
  /** Application render context, propagated from the parent composite object */
  @managed
  renderContext?: UIRenderContext;

  /** Observable viewport context data, propagated from the parent composite object */
  @managed
  viewportContext?: any;

  /** Activation context, propagated from the parent composite object */
  @managed
  activationContext?: AppActivationContext;
}
