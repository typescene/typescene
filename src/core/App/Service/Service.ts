import Async from "../../Async";

const INSTANCE_PROTO_PROP = "@_service_instance";
const SERVICE_REG_ID_PREFIX = "+";

/** Service classes registered by ID, and others waiting to be mapped */
const registry: Async.ObservableObject & { [id: string]: typeof Service | undefined } =
    <any>new Async.ObservableObject();

/** Helper function to add an ID to the registry */
function register(serviceId: string,
    serviceClass?: typeof Service | Async.ObservableValue<typeof Service | undefined>) {
    var prop = SERVICE_REG_ID_PREFIX + serviceId;
    if (!registry.hasObservableProperty(prop)) {
        // add an observable property for this service
        registry.addObservableProperty(prop, serviceClass);
    }
    else if (serviceClass) {
        // (re)set the observable property
        registry[prop] = <any>serviceClass;
    }
}

/** Helper function to inject a service instance */
function doInject(classObj: Function, propertyId: string, serviceId: string) {
    // make sure a key in the registry exists
    var prop = SERVICE_REG_ID_PREFIX + serviceId;
    if (!registry.hasObservableProperty(prop)) {
        // add an observable property for this service
        registry.addObservableProperty(prop, undefined);
    }

    // inject the observable reference
    Async.inject(classObj, {
        [propertyId]: Async.observe(() => registry[prop])
            .map(serviceClass => serviceClass && serviceClass.getInstance())
    });
}

/** Service base class, to be extended to represent a service of which a singleton instance can be injected as a property of any other class (e.g. a view or activity class, or another service); service classes must be registered by ID, using the `mapService` decorator */
export class Service extends Async.ObservableObject {
    /** Get the singleton instance of this service class, can be overridden; by default returns a single instance, constructed without parameters only when needed, and never dereferenced */
    public static getInstance() {
        if (Object.prototype.hasOwnProperty.call(
            this.prototype, INSTANCE_PROTO_PROP)) {
            // already constructed
            return (<any>this.prototype)[INSTANCE_PROTO_PROP];
        }
        if (this === Service) throw new TypeError();
        return new this();
    }

    /** Singleton constructor; do not use directly, use `getInstance` instead */
    constructor() {
        super();
        if (Object.prototype.hasOwnProperty.call(
            this.constructor.prototype, INSTANCE_PROTO_PROP))
            throw new Error("Service has already been constructed");
        (<any>this.constructor.prototype)[INSTANCE_PROTO_PROP] = this;
    }
}

/** *Class decorator*, registers the decorated `Service` class using given UpperCamelCase ID(s), so that injected properties (see `injectService`) decorated with a matching service ID automatically contain a reference to a singleton instance of the decorated `Service` [decorator] */
export function mapService(...id: string[]) {
    return (target: typeof Service) => {
        for (var s of id) register(s, target);
    };
}

/** Add an alias for the given service by ID, so that the aliased service *also* becomes available using the given alias; the aliased service does not need to have been mapped yet */
export function addServiceAlias(newId: string, serviceId: string) {
    var serviceRefProp = SERVICE_REG_ID_PREFIX + serviceId;
    if (!registry.hasObservableProperty(serviceRefProp)) {
        // add an observable property for this service
        registry.addObservableProperty(serviceRefProp, undefined);
    }
    register(newId, Async.observe(() => registry[serviceRefProp]));
}

/** *Property decorator*, injects an instance of the `Service` class that is registered with the same ID as the name of the decorated propety (lowerCamelCase is converted to UpperCamelCase) into this property as and when it becomes available [decorator] */
export function injectService(target: object, propertyKey: string): void;

/** *Property decorator*, injects an instance of the `Service` class that is registered with given ID (must be UpperCamelCase) into this property as and when it becomes available [decorator] */
export function injectService(id: string): PropertyDecorator;

export function injectService(idOrTarget: string | object, key?: string,
    desc?: PropertyDescriptor) {
    if (typeof idOrTarget === "string") {
        return (target: object, propertyKey: string, desc?: PropertyDescriptor) => {
            // create an injectable property first
            var result = Async.injectable(target, propertyKey, desc);
            Object.defineProperty(target, propertyKey, result);

            // register the service if needed, and create an observable reference
            doInject(target.constructor, propertyKey, idOrTarget);
            return result;
        };
    }
    else if (typeof idOrTarget === "object" &&
        typeof idOrTarget.constructor === "function" &&
        typeof key === "string") {
        // create an injectable property first
        var result = Async.injectable(idOrTarget, key, desc);
        Object.defineProperty(idOrTarget, key, result);

        // register the service if needed, and create an observable reference
        let id = String(key);
        id = id[0].toUpperCase() + id.slice(1);
        doInject(idOrTarget.constructor, key, id);
        return result;
    }
}
