export declare class Binding {
    static isBinding(value: any): value is Binding;
    constructor(source?: string, defaultValue?: any);
    isComponentBinding(): true;
    readonly id: string;
    readonly propertyName?: string;
    readonly bindings?: ReadonlyArray<Binding>;
    parent?: Binding;
    addFilter(fmt: string): this;
    private _filter?;
    static readonly filters: {
        [id: string]: (v: any, ...args: any[]) => any;
    };
}
export declare class StringFormatBinding extends Binding {
    constructor(text: string);
    readonly bindings: ReadonlyArray<Binding>;
}
export declare namespace Binding {
}
export declare function bind(propertyName?: string, defaultValue?: any): Binding;
export declare function bindf(text: string): StringFormatBinding;
