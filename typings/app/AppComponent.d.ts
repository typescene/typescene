import { Component } from "../core";
import { UIRenderContext } from "../ui";
import { AppActivationContext } from "./AppActivationContext";
export declare abstract class AppComponent extends Component {
    static preset(presets: object, ...rest: unknown[]): Function;
    renderContext?: UIRenderContext;
    activationContext?: AppActivationContext;
}
