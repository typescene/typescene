import { Component } from "./Component";
import { ManagedList } from "./ManagedList";
import { ManagedMap } from "./ManagedMap";
import { ManagedObject } from "./ManagedObject";
import { ManagedReference } from "./ManagedReference";
import { ERROR, err } from "../errors";
import * as util from "./util";

/** Generic constructor type for ManagedRecord classes */
export type ManagedRecordConstructor<TObject extends ManagedRecord = ManagedRecord> = new (
  ...args: never[]
) => TObject;

/** Managed record base class. Represents data that is managed (as `ManagedObject`), with additional methods to managed inward references — especially useful for constructing the application model */
export class ManagedRecord extends Component {
  /** Create a new instance of this class (a sub class of `ManagedRecord`), and copy given properties. */
  static create<T extends object, TResult extends ManagedRecord>(
    this: { new (): TResult },
    properties?: T
  ) {
    let result: TResult & { [p in keyof T]: T[p] } = new this() as any;
    if (properties) {
      for (let p in properties) {
        result[p] = properties[p] as any;
      }
    }
    return result;
  }

  /** Serialize this record as a regular object, including all string, number, boolean, and undefined property values (except for properties that start with an underscore, and `managedId`). Also calls `serialize` on all _child_ records (including those within lists and maps, but not regular arrays or objects, nor managed objects that are not referenced as child records) */
  serialize() {
    let result = Object.create(null);
    const serializeValue = (p: string, v: any): any => {
      if (
        v === undefined ||
        v === null ||
        typeof v === "string" ||
        typeof v === "number" ||
        typeof v === "boolean"
      )
        return v;
      if (Array.isArray(v)) return v.map((x, i) => serializeValue(p + "." + i, x));
      if (v instanceof ManagedObject) {
        if (v instanceof ManagedRecord && v.getParentRecord() === this)
          return v.serialize();
        if (v instanceof ManagedReference) return serializeValue(p, v.get());
        if (v instanceof ManagedList) return v.map(x => serializeValue(p, x));
        if (v instanceof ManagedMap) {
          let result = Object.create(null);
          v.forEach((key, value) => {
            result[key] = serializeValue(p + "#" + key, value);
          });
          return result;
        }
        return undefined;
      }
      throw err(ERROR.Record_Serializable, p);
    };
    for (let p in this) {
      if (!this.hasOwnProperty(p) || p[0] === "_" || p === "managedId") continue;
      let v = serializeValue(p, this[p]);
      if (v !== undefined) result[p] = v;
    }
    return result;
  }

  /** Returns the parent record (or parent's parent, etc.). If a class reference is specified, finds the nearest parent of given type. See `@managedChild` decorator. */
  getParentRecord<TParent extends ManagedRecord = ManagedRecord>(
    ParentClass?: ManagedRecordConstructor<TParent>
  ) {
    return this.getManagedParent(ParentClass || ManagedRecord) as TParent | undefined;
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

  /**
   * Returns an array of unique records that contain managed references to this object (see `@managed`, `@managedChild`, and `@managedDependency`). This includes records that refer directly to this object, as well as those that refer to managed list(s) or map(s) that contain this record.
   * @param FilterByClass
   *  If specified, results will only include instances of given class. Other referrers are _not_ inspected recursively.
   */
  getReferrerRecords<TResult extends ManagedRecord = ManagedRecord>(
    FilterByClass?: ManagedRecordConstructor<TResult>
  ): TResult[] {
    let seen: boolean[] = Object.create(null);
    let result: TResult[] = [];
    let F = FilterByClass || ManagedRecord;

    // use a recursive function to add all referrers
    const addRefs = (ref: ManagedObject) => {
      ref[util.HIDDEN_REF_PROPERTY].forEach(reflink => {
        let object: ManagedObject = reflink.a;
        if (object.managedState && !seen[object.managedId]) {
          seen[object.managedId] = true;
          if (object instanceof F) {
            // add this referrer
            result.push(object as any);
          } else if (
            object instanceof ManagedList ||
            object instanceof ManagedMap ||
            object instanceof ManagedReference
          ) {
            // add referrers of this core object
            addRefs(object);
          }
        }
      });
    };
    addRefs(this);
    return result;
  }
}
