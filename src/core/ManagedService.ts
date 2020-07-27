import { err, ERROR } from "../errors";
import { ManagedMap } from "./ManagedMap";
import { ManagedObject } from "./ManagedObject";
import { managedChild, ManagedReference } from "./ManagedReference";

/** Singleton container for all services as child components */
class ServiceContainer extends ManagedObject {
  /** Singleton instance */
  static readonly instance = new ServiceContainer();
  private constructor() {
    super();
  }

  /** All service references indexed by name (uppercased), i.e. all reference object that refer to the service instances themselves */
  @managedChild
  readonly services = new ManagedMap<ManagedReference<ManagedService>>();
}

/**
 * Property decorator: turns the decorated property of a managed object into a read-only reference to the last registered service with given name (case insensitive). See `ManagedService`.
 * The value of the decorated property becomes undefined when the service is destroyed, and updates immediately when a new service is registered with the same name.
 * Changes and events can be observed by an observer, but only after the property has been *read at least once*.
 * @decorator
 */
export function service(serviceName: string): PropertyDecorator {
  return (target, propertyKey) => {
    let ucName = String(serviceName).toUpperCase();
    let ref = ServiceContainer.instance.services.get(ucName);
    if (!ref) {
      // create new placeholder for this name
      ref = new ManagedReference().restrict(ManagedService as any).propagateEvents() as any;
      ServiceContainer.instance.services.set(ucName, ref);
    }

    // use a managed reference property with a fixed read-only reference object
    ManagedObject.createManagedReferenceProperty(
      target as any,
      propertyKey as string,
      false,
      false,
      undefined,
      undefined,
      ref
    );
  };
}

/** Managed service base class. Represents a service that can be referenced by other classes using the `@service` decorator (or `ManagedService.link` method) after registering the object with a known name. */
export abstract class ManagedService extends ManagedObject {
  /**
   * Retrieve the currently active service with given name (case insensitive).
   * @note Services may be registered and destroyed. To obtain a reference that is always up to date, use the `@service` decorator on a class property or the static `link` method.
   */
  static find(name: string) {
    let ucName = String(name).toUpperCase();
    let ref = ServiceContainer.instance.services.get(ucName);
    return ref && ref.get();
  }

  /**
   * Adds a property to the prototype of given class, so that the property always references the last registered service with given name (case insensitive).
   * The value of the target property becomes undefined when the service is destroyed, and updates immediately when a new service is registered with the same name.
   * @note Changes and events can be observed by an observer, but only after the property has been *read at least once*.
   */
  static link(serviceName: string, TargetClass: Function, propertyName: string) {
    if (!propertyName) throw err(ERROR.Service_NoName);
    service(serviceName)(TargetClass.prototype, propertyName);
  }

  /** Create a new instance of the service. This service is not available until it is registered using the `ManagedService.register` method */
  constructor(name?: string) {
    super();
    if (name) (this as any).name = name;
  }

  /** The name of this service, set only once by the service constructor. The preferred format for service names is `Namespace.CamelCaseName`. */
  abstract readonly name: string;

  /** Register this service, making it available through properties decorated with the `@service` decorator until the service object is destroyed (either directly using `.destroyManagedAsync()`, or when another service is registered with the same name) */
  register() {
    let ucName = String(this.name || "").toUpperCase();
    if (!ucName) throw err(ERROR.Service_BlankName);
    let ref = ServiceContainer.instance.services.get(ucName);
    if (ref) {
      // set new target on the existing reference (destroying the old service)
      ref.set(this);
    } else {
      ref = new ManagedReference(this)
        .restrict(ManagedService as any)
        .propagateEvents() as any;
      ServiceContainer.instance.services.set(ucName, ref);
    }
  }
}
