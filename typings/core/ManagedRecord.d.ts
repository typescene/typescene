import { Component } from "./Component";
import { ManagedObject, ManagedObjectConstructor } from "./ManagedObject";
/** Type of error that can be thrown by the `ManagedRecord.validate` method, containing one or more validation errors */
export interface ManagedRecordValidationError extends Error {
    isValidationError: true;
    errors: Array<Error | {}>;
}
/**
 * Constructor for `ManagedRecordValidationError` errors, may be used by the `ManagedRecord.validate` method to encapsulate multiple errors.
 * @note Use localized error messages where available, to avoid having to parse and translate messages when displaying them.
 */
export declare let ManagedRecordValidationError: {
    new (...errors: Array<string | Error | {}>): ManagedRecordValidationError;
    (...errors: Array<string | Error | {}>): ManagedRecordValidationError;
};
/** Represents data that is managed as a single unit, with managed inward and outward references */
export declare class ManagedRecord extends Component {
    /** Create a new instance of `ManagedRecord` that contains given properties. All values are copied directly onto the new instance. */
    static create<T extends object>(properties?: T): ManagedRecord & { [p in keyof T]: T[p]; };
    /**
     * Validate the data represented by this record. To be overridden by specific record classes, which should also always call `super.validate()`. Multiple (nested) errors may be thrown using the `ManagedRecordValidationError` constructor.
     * @exception By default, throws an error if this record has already been destroyed.
     */
    validate(): void;
    /**
     * Returns an array of unique managed objects that contain managed references to this object (see `@managed`, `@managedChild`, `@managedDependency`, and `@compose` decorators)
     * @param skipCoreObjects
     *  Set to true to include _referrers_ of (nested) lists, maps, and reference instances (i.e. 'core' objects), not those objects themselves.
     * @param FilterByClass
     *  If specified, results will only include instances of given class. Other referrers are _not_ inspected recursively.
     */
    protected getManagedReferrers<TResult extends ManagedObject = ManagedObject>(skipCoreObjects?: boolean, FilterByClass?: ManagedObjectConstructor<TResult>): TResult[];
    /**
     * Returns an array of unique records that contain managed references to this object (see `@managed`, `@managedChild`, `@managedDependency`, and `@compose` decorators). This includes records that refer directly to this object, as well as those that refer to managed list(s) or map(s) that contain this record.
     * @param FilterByClass
     *  If specified, results will only include instances of given class. Other referrers are _not_ inspected recursively.
     */
    getReferrerRecords<TResult extends ManagedRecord = ManagedRecord>(FilterByClass?: ManagedObjectConstructor<TResult>): TResult[];
    /** Returns the current parent record. See `@managedChild` decorator. */
    getParentRecord(): ManagedRecord | undefined;
    /** Returns the current parent record. See `@managedChild` decorator. */
    getParentRecord<TParent extends ManagedRecord>(ParentClass: ManagedObjectConstructor<TParent>): TParent | undefined;
    /** Returns the next record in a parent list (i.e. a list that is a child object of another record) */
    getNextSibling(): ManagedRecord | undefined;
    /** Returns the previous record in a parent list (i.e. a list that is a child object of another record) */
    getPreviousSibling(): any;
}
