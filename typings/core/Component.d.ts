import { Binding } from "./Binding";
import { ManagedEvent } from "./ManagedEvent";
import { ManagedObject } from "./ManagedObject";
export declare class ComponentEvent extends ManagedEvent {
    constructor(name: string, source: Component, inner?: ManagedEvent);
    source: Component;
    inner?: ManagedEvent;
}
export declare type ComponentConstructor<TComponent extends Component = Component> = (new (...args: any[]) => TComponent) | (new (a: never, b: never, c: never, d: never, e: never, f: never) => TComponent);
export declare type ComponentPresetType<TComponentCtor extends ComponentConstructor> = TComponentCtor extends {
    preset: (presets: infer TPreset) => void;
} ? TPreset : any;
export declare type ComponentPresetRestType<TComponentCtor extends ComponentConstructor> = TComponentCtor extends {
    preset: (presets: ComponentPresetType<TComponentCtor>, ...rest: infer TRest) => void;
} ? TRest : never;
export declare class Component extends ManagedObject {
    static with<TComponentCtor extends ComponentConstructor, TPreset extends ComponentPresetType<TComponentCtor>, TRest extends ComponentPresetRestType<TComponentCtor>>(this: TComponentCtor & {
        preset(presets: TPreset): Function;
    }, presets: {
        [P in keyof TPreset]?: TPreset[P] | {
            isComponentBinding(): true;
        };
    } & {
        [other: string]: any;
        with?: never;
    }, ...rest: TRest): TComponentCtor;
    static with<TComponentCtor extends ComponentConstructor, TRest extends ComponentPresetRestType<TComponentCtor>>(this: TComponentCtor & {
        preset: Function;
    }, ...rest: TRest): TComponentCtor;
    static with<TComponentCtor extends ComponentConstructor, TPreset extends ComponentPresetType<TComponentCtor>, TRest extends ComponentPresetRestType<TComponentCtor>>(this: TComponentCtor & {
        preset(presets: TPreset): Function;
    }, presets: {
        [P in keyof TPreset]?: TPreset[P] | {
            isComponentBinding(): true;
        };
    } & {
        with?: never;
    }, ...rest: TRest): TComponentCtor;
    static preset(presets: object, ...rest: unknown[]): Function;
    static presetBinding<TComponent extends Component>(this: ComponentConstructor<TComponent>, propertyName: string, binding: Binding, applyBoundValue?: (this: TComponent, boundValue: any) => any): void;
    static presetBindingsFrom(...constructors: Array<ComponentConstructor | undefined>): void;
    static presetActiveComponent(propertyName: string, constructor: ComponentConstructor & (new () => Component), ...include: ComponentConstructor[]): void;
    private static _components;
    constructor();
    protected isPresetComponent(): boolean;
    getParentComponent(): Component | undefined;
    getParentComponent<TParent extends Component>(ParentClass: ComponentConstructor<TParent>): TParent | undefined;
    getCompositeParent<TParent extends Component>(ParentClass?: ComponentConstructor<TParent>): TParent | undefined;
    private _compositeParent?;
    private _componentBindings?;
    private _getCompositeBindings;
    private readonly _compositeBindings?;
    propagateComponentEvent(name: string, inner?: ManagedEvent): void;
    private _applyPropertyValue;
    private static _makeEventHandler;
}
export declare function compose(constructor: ComponentConstructor & (new () => Component), ...include: ComponentConstructor[]): <T extends ManagedObject>(target: T, propertyKey: any) => void;
