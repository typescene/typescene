import { ManagedObject } from "./ManagedObject";
export declare function service(name: string): PropertyDecorator;
export declare class ManagedService extends ManagedObject {
    static find(name: string): ManagedService | undefined;
    constructor(name: string);
    readonly name: string;
    register(): void;
}
