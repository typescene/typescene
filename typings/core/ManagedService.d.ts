import { ManagedObject } from "./ManagedObject";
/**
 * Property decorator: turns the decorated property into a read-only reference to the last registered service with given name (case insensitive). See `ManagedService`.
 *
 * The value of the decorated property becomes undefined when the service is destroyed, and changes immediately when a new service is registered with the same name.
 *
 * @note If this property is on a managed object, changes to the service reference and events on the service object can be observed by an observer (see `@observe` decorator), but _only after_ the property has been read for the first time.
 * @decorator
 */
export declare function service(name: string): PropertyDecorator;
/** Represents a named service that can be referenced by other classes using the `@service` decorator after registering the object with a well known name. */
export declare class ManagedService extends ManagedObject {
    /**
     * Retrieve the currently active service with given name (case insensitive).
     * @note Services may be registered and destroyed. To obtain a reference that is always up to date, use the `@service` decorator on a class property.
     */
    static find(name: string): ManagedService | undefined;
    /** Create a new instance of the service. The service is not available until it is registered using the `ManagedService.register` method. */
    constructor(name: string);
    /** The name of this service, set only once by the service constructor. The preferred format for service names is `Namespace.CamelCaseName`. */
    readonly name: string;
    /** Register this service, making it available through properties decorated with the `@service` decorator until the service object is destroyed (either directly, or when another service is registered with the same name) */
    register(): void;
}
