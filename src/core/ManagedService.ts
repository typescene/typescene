import { ManagedMap } from "./ManagedMap";
import { ManagedObject } from "./ManagedObject";
import { managed, managedChild, ManagedReference } from "./ManagedReference";
import { shadowObservable } from "./observe";

/** Singleton container for all services as child components */
class ServiceContainer extends ManagedObject {
    /** Singleton instance */
    static readonly instance = new ServiceContainer();
    private constructor() { super() }

    /** All service references indexed by name (uppercased) */
    @managedChild
    readonly services = new ManagedMap<ManagedReference<ManagedService>>();
}

/**
 * Property decorator: turns the decorated property into a read-only reference to the last registered service with given name (case insensitive). See `ManagedService`.
 * 
 * The value of the decorated property becomes undefined when the service is destroyed, and changes immediately when a new service is registered with the same name.
 * 
 * @note If this property is on a managed object, changes to the service reference and events on the service object can be observed by an observer (see `@observe` decorator), but _only after_ the property has been read for the first time.
 * @decorator
 */
export function service(name: string): PropertyDecorator {
    return function (target, propertyKey) {
        let ucName = String(name).toUpperCase();
        let ref = ServiceContainer.instance.services.get(ucName);
        if (!ref) {
            // create new placeholder for this name
            ref = new ManagedReference().restrict(ManagedService).propagateEvents();
            ServiceContainer.instance.services.set(ucName, ref);
        }

        // define property but also use a hidden property as a managed reference
        let hiddenProperty = "*service:" + (propertyKey as string);
        Object.defineProperty(target, propertyKey, {
            configurable: false,
            get(this: any) {
                if (!this[hiddenProperty]) {
                    this[hiddenProperty] = ref;
                    Object.defineProperty(this, hiddenProperty, {
                        ... (Object.getOwnPropertyDescriptor(this, hiddenProperty) ||
                            { writable: true }),
                        enumerable: false
                    });
                }
                return ref!.target;
            },
            set(v) {
                if (v !== ref) throw Error();
            }
        });
        shadowObservable(hiddenProperty)(target, propertyKey);
        if (target instanceof ManagedObject) {
            managed(target, hiddenProperty as any);
        }
    };
}

/** Represents a named service that can be referenced by other classes using the `@service` decorator after registering the object with a well known name. */
export class ManagedService extends ManagedObject {
    /**
     * Retrieve the currently active service with given name (case insensitive).
     * @note Services may be registered and destroyed. To obtain a reference that is always up to date, use the `@service` decorator on a class property.
     */
    static find(name: string) {
        let ucName = String(name).toUpperCase();
        let ref = ServiceContainer.instance.services.get(ucName);
        return ref && ref.target;
    }

    /** Create a new instance of the service. The service is not available until it is registered using the `ManagedService.register` method. */
    constructor(name: string) {
        super();
        this.name = name;
    }

    /** The name of this service, set only once by the service constructor. The preferred format for service names is `Namespace.CamelCaseName`. */
    readonly name: string;

    /** Register this service, making it available through properties decorated with the `@service` decorator until the service object is destroyed (either directly, or when another service is registered with the same name) */
    register() {
        let ucName = String(this.name).toUpperCase();
        if (!ucName) throw Error("[Service] Service name cannot be blank");
        let ref = ServiceContainer.instance.services.get(ucName);
        if (ref) {
            // set new target on the existing reference (destroying the old service)
            ref.target = this;
        }
        else {
            ref = new ManagedReference(this).restrict(ManagedService).propagateEvents();
            ServiceContainer.instance.services.set(ucName, ref);
        }
    }
}
