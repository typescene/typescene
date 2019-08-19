import { Binding, Component, ComponentConstructor, ComponentPresetArgType, ComponentPresetRestType, ComponentPresetType, StringFormatBinding, tt, UIControl, UIRenderable, UIRenderableConstructor, ViewComponent } from "../../dist";
import * as intrinsics from "./intrinsics";

/** JSX support for Typescene UI components */
export function JSX(f: any, presets: any, ...rest: any[]):
    typeof Component & ComponentConstructor<UIRenderable> {
    if (typeof f === "string") {
        let C = JSX.intrinsicTags[f];
        if (!C) throw Error("[JSX] Invalid tag: " + f);
        if ((C as any).prototype instanceof UIControl) {
            // use single piece of content as control 'text'
            let text = presets && presets.text || rest[0];
            let bindings: Binding[] = [];
            if (rest.length > 1) {
                let fmt = "";
                for (let r of rest) {
                    if (typeof r === "string") {
                        fmt += r;
                    }
                    else if (r instanceof Binding) {
                        fmt += "${%" + (bindings.push(r)) + "}";
                    }
                    else {
                        throw Error("[JSX] Invalid control content");
                    }
                }
                text = new StringFormatBinding(fmt, ...bindings);
            }
            return C.with(typeof text === "string" ?
                { ...(presets || {}), text: tt(text) } :
                    text ? { ...(presets || {}), text } :
                        (presets || {}));
        }
        return C.with(presets || {}, ...flatten(rest));
    }
    return (f.prototype instanceof Component) ?
        (f as typeof Component).with(presets || {}, ...flatten(rest)) :
        f(presets || {}, ...flatten(rest));
}

export namespace JSX {
    /** TypeScript JSX typing information */
    export namespace JSX {
        export type IntrinsicElements = intrinsics.Elements;
        export type Element = typeof Component & ComponentConstructor<UIRenderable>;
    }

    /** References to JSX factory functions for all intrinsic tags */
    export const intrinsicTags: { [tag: string]: { with: Function } } = intrinsics.tags;

    /** Helper type to describe a JSX component factory */
    export interface FactoryType<T extends typeof Component & UIRenderableConstructor, TPreset> {
        (presets: {
            [P in keyof TPreset]?: TPreset[P] | Binding.Type;
        } & Exclude<{
            [other: string]: any;
        }, {
            with: any;
        }>, ...rest: ComponentPresetRestType<T>): T;
    }

    /** Helper to describe a JSX component factory for a standard UI component */
    export interface DefaultFactoryType<T extends typeof Component & UIRenderableConstructor> extends FactoryType<T, ComponentPresetType<T>> {
        // nothing here... this is a trick to simplify output types
    }

    /** Type definition for the automatic component preset type of `ViewComponent` classes */
    export type ViewComponentPresetArgType<TComponent extends typeof ViewComponent, K extends keyof InstanceType<TComponent> = Exclude<{
        [P in keyof InstanceType<TComponent>]: InstanceType<TComponent>[P] extends Function ? never : P;
    }[keyof InstanceType<TComponent>], keyof ViewComponent>> = Pick<InstanceType<TComponent>, K>;

    /** Returns JSX-enabled factory function for given component class */
    export function ify<T extends typeof Component & UIRenderableConstructor>
        (C: T): FactoryType<T, ComponentPresetArgType<T>> {
        return C.with.bind(C) as any;
    }
}

/** Helper function to flatten component arrays */
function flatten(a: any[]): any {
    let result: any[] = [];
    a.forEach(it => { Array.isArray(it) ? result.push(...flatten(it)) : result.push(it) });
    return result;
}
