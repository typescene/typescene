import { err, ERROR } from "../errors";
import { Component } from "./Component";
import { ManagedList } from "./ManagedList";
import { ManagedMap } from "./ManagedMap";
import { ManagedObject, ManagedObjectConstructor } from "./ManagedObject";
import { ManagedReference } from "./ManagedReference";
import * as util from "./util";

/**
 * @interface _Also usable as a type:_ Type of error that can be thrown by the `ManagedRecord.validate` method, containing one or more validation errors
 */
export interface ManagedRecordValidationError extends Error {
  /** Validation error flag, always set to true */
  isValidationError: true;

  /** List of encapsulated errors */
  errors: Array<Error | {}>;
}

/**
 * Constructor for `ManagedRecordValidationError` errors, may be used by the `ManagedRecord.validate` method to encapsulate multiple errors.
 * If the arguments list includes another validation error, its encapsulated errors are added to the list instead of the `ManagedRecordValidationError` object itself.
 * @note Use localized error messages where available, to avoid having to parse and translate messages when displaying them.
 */
export let ManagedRecordValidationError: {
  new (...errors: Array<string | Error | {}>): ManagedRecordValidationError;
  (...errors: Array<string | Error | {}>): ManagedRecordValidationError;
} = function(...errors: any[]) {
  let result: ManagedRecordValidationError = err(ERROR.Record_Validation) as any;
  result.isValidationError = true;
  result.errors = [];
  errors.forEach(e => {
    if (ManagedRecord.isValidationError(e)) {
      // add all encapsulated errors
      result.errors.push(...e.errors);
    } else {
      // add only this error
      result.errors.push(typeof e !== "object" ? Error(e) : e);
    }
  });
  return result;
} as any;

/** Managed record base class. Represents data that is managed (as `ManagedObject`), with additional methods to managed inward references — especially useful for constructing the application model */
export class ManagedRecord extends Component {
  /**
   * Validate the data represented by this record. To be overridden by specific record classes, which should also always call `super.validate()`. Multiple (nested) errors may be thrown using the `ManagedRecordValidationError` constructor.
   * @exception By default, throws an error if this record has already been destroyed.
   */
  validate() {
    if (!this.managedState) {
      throw err(ERROR.Record_Destroyed);
    }
  }

  /**
   * Returns an array of unique managed objects that contain managed references to this object (see `@managed`, `@managedChild`, `@managedDependency`, and `@compose` decorators)
   * @param skipCoreObjects
   *  Set to true to include _referrers_ of (nested) lists, maps, and reference instances (i.e. 'core' objects), not those objects themselves.
   * @param FilterByClass
   *  If specified, results will only include instances of given class. Other referrers are _not_ inspected recursively.
   */
  protected getManagedReferrers<TResult extends ManagedObject = ManagedObject>(
    skipCoreObjects?: boolean,
    FilterByClass?: ManagedObjectConstructor<TResult>
  ) {
    let seen: boolean[] = {} as any;
    let result: TResult[] = [];

    // use a recursive function to add all referrers
    let addRefs = (ref: ManagedObject) => {
      ref[util.HIDDEN_REF_PROPERTY].forEach(reflink => {
        let object: ManagedObject = reflink.a;
        if (object.managedState && !seen[object.managedId]) {
          seen[object.managedId] = true;
          if (
            skipCoreObjects &&
            (object instanceof ManagedList ||
              object instanceof ManagedMap ||
              object instanceof ManagedReference)
          ) {
            // add referrers of this core object instead
            addRefs(object);
          } else if (!FilterByClass || object instanceof FilterByClass) {
            // add this referrer itself
            result.push(object as any);
          }
        }
      });
    };
    addRefs(this);
    return result;
  }

  /**
   * Returns an array of unique records that contain managed references to this object (see `@managed`, `@managedChild`, `@managedDependency`, and `@compose` decorators). This includes records that refer directly to this object, as well as those that refer to managed list(s) or map(s) that contain this record.
   * @param FilterByClass
   *  If specified, results will only include instances of given class. Other referrers are _not_ inspected recursively.
   */
  getReferrerRecords<TResult extends ManagedRecord = ManagedRecord>(
    FilterByClass?: ManagedObjectConstructor<TResult>
  ): TResult[] {
    return this.getManagedReferrers(true, FilterByClass || (ManagedRecord as any));
  }

  /** Returns the current parent record. See `@managedChild` decorator. */
  getParentRecord(): ManagedRecord | undefined;
  /** Returns the parent record (or parent's parent, etc.) of given type. See `@managedChild` decorator. */
  getParentRecord<TParent extends ManagedRecord>(
    ParentClass: ManagedObjectConstructor<TParent>
  ): TParent | undefined;
  getParentRecord(ParentClass: any = ManagedRecord) {
    return this.getManagedParent(ParentClass);
  }

  /** Returns the next record in a parent list (i.e. a list that is a child object of another record) */
  getNextSibling<TResult = this>(): TResult | undefined {
    let parent = this.getManagedParent();
    if (parent instanceof ManagedList) {
      let sibling = parent.take(2, this)[1];
      if (sibling instanceof ManagedRecord) {
        return sibling as any;
      }
    }
  }

  /** Returns the previous record in a parent list (i.e. a list that is a child object of another record) */
  getPreviousSibling<TResult = this>(): TResult | undefined {
    let parent = this.getManagedParent();
    if (parent instanceof ManagedList) {
      let s = parent.takeLast(2, this);
      if (s.length > 1 && s[0] instanceof ManagedRecord) {
        return s[0] as any;
      }
    }
  }
}

export namespace ManagedRecord {
  /** Create a new instance of `ManagedRecord` that contains given properties. All values are copied directly onto the new instance. */
  export function create<T extends object>(properties?: T) {
    let result: ManagedRecord & { [p in keyof T]: T[p] } = new ManagedRecord() as any;
    if (properties) {
      for (let p in properties) {
        result[p] = properties[p] as any;
      }
    }
    return result;
  }

  /** Checks if given error is a `ManagedRecordValidationError` object */
  export function isValidationError(err: any): err is ManagedRecordValidationError {
    return err instanceof Error && (err as ManagedRecordValidationError).isValidationError;
  }
}
