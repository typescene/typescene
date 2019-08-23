import {
  Binding,
  Component,
  ComponentConstructor,
  ComponentPresetArgType,
  ComponentPresetRestType,
  ComponentPresetType,
  StringFormatBinding,
  tt,
  UIRenderable,
  UIRenderableConstructor,
  ViewComponent,
} from "../../dist";
import * as intrinsics from "./intrinsics";

/** JSX support for Typescene UI components */
export function JSX(
  f: any,
  presets: any,
  ...rest: any[]
): typeof Component & ComponentConstructor<UIRenderable> {
  rest = flatten(rest);

  // use string content as 'text' property, if any
  let fmt = "";
  let bindings: Binding[] | undefined;
  let components: any[] = [];
  for (let r of rest) {
    if (typeof r === "string") {
      fmt += r;
    } else if (r instanceof Binding) {
      if (!bindings) bindings = [];
      fmt += "${%" + bindings.push(r) + "}";
    } else {
      components.push(r);
    }
  }

  // merge different types of content
  let merged = presets ? { ...presets } : {};
  if (fmt) {
    if (!bindings) {
      // content is only text
      merged.text = tt(fmt);
    } else {
      if (bindings.length === 1) {
        // content is only one binding
        merged.text = bindings[0];
      } else {
        // content is mixed text and bindings
        merged.text = new StringFormatBinding(fmt, ...bindings).addFilter("tt");
      }
    }
  }
  if (typeof f === "string") {
    let C = JSX.intrinsicTags[f];
    if (!C) throw Error("[JSX] Invalid tag: " + f);
    return C.with(merged, ...components);
  }
  return f.prototype instanceof Component
    ? (f as typeof Component).with(merged, ...components)
    : f(merged, ...components);
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
  export interface FactoryType<
    T extends typeof Component & UIRenderableConstructor,
    TPreset
  > {
    (
      presets: { [P in keyof TPreset]?: TPreset[P] | Binding.Type } &
        Exclude<
          {
            [other: string]: any;
          },
          {
            with: any;
          }
        >,
      ...rest: ComponentPresetRestType<T>
    ): T;
  }

  /** Helper to describe a JSX component factory for a standard UI component */
  export interface DefaultFactoryType<T extends typeof Component & UIRenderableConstructor>
    extends FactoryType<T, ComponentPresetType<T>> {
    // nothing here... this is a trick to simplify output types
  }

  /** Type definition for the automatic component preset type of `ViewComponent` classes */
  export type ViewComponentPresetArgType<
    TComponent extends typeof ViewComponent,
    K extends keyof InstanceType<TComponent> = Exclude<
      {
        [P in keyof InstanceType<TComponent>]: InstanceType<TComponent>[P] extends Function
          ? never
          : P
      }[keyof InstanceType<TComponent>],
      keyof ViewComponent
    >
  > = Pick<InstanceType<TComponent>, K>;

  /** Returns JSX-enabled factory function for given component class */
  export function ify<T extends typeof Component & UIRenderableConstructor>(
    C: T
  ): FactoryType<T, ComponentPresetArgType<T>> & {
    with: FactoryType<T, ComponentPresetArgType<T>>;
  } {
    function F(this: any) {
      if (this instanceof F) return new C();
      return C.with.apply(C, arguments as any);
    }
    F.prototype = C.prototype;
    F.with = F;
    return F as any;
  }
}

/** Helper function to flatten component arrays */
function flatten(a: any[]): any {
  let result: any[] = [];
  a.forEach(it => {
    Array.isArray(it) ? result.push(...flatten(it)) : result.push(it);
  });
  return result;
}
