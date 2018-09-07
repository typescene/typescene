import { ManagedObject, ManagedObjectConstructor } from "./ManagedObject";
export declare function observe<T extends ManagedObject>(Target: ManagedObjectConstructor<T>): (Observer: new (instance: T) => any) => void;
export declare function shadowObservable(shadowPropertyName: string, forceAsync?: boolean): PropertyDecorator;
export declare function onPropertyChange(...observedProperties: string[]): MethodDecorator;
export declare function onPropertyEvent(...observedProperties: string[]): MethodDecorator;
export declare function rateLimit(n: number): MethodDecorator;
