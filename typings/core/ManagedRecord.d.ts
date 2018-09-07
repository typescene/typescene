import { Component } from "./Component";
import { ManagedObject, ManagedObjectConstructor } from "./ManagedObject";
export interface ManagedRecordValidationError extends Error {
    isValidationError: true;
    errors: Array<Error | {}>;
}
export declare let ManagedRecordValidationError: {
    new (...errors: Array<string | Error | {}>): ManagedRecordValidationError;
    (...errors: Array<string | Error | {}>): ManagedRecordValidationError;
};
export declare class ManagedRecord extends Component {
    static create<T extends object>(properties?: T): ManagedRecord & { [p in keyof T]: T[p]; };
    validate(): void;
    protected getManagedReferrers<TResult extends ManagedObject = ManagedObject>(skipCoreObjects?: boolean, FilterByClass?: ManagedObjectConstructor<TResult>): TResult[];
    getReferrerRecords<TResult extends ManagedRecord = ManagedRecord>(FilterByClass?: ManagedObjectConstructor<TResult>): TResult[];
    getParentRecord(): ManagedRecord | undefined;
    getParentRecord<TParent extends ManagedRecord>(ParentClass: ManagedObjectConstructor<TParent>): TParent | undefined;
    getNextSibling(): ManagedRecord | undefined;
    getPreviousSibling(): any;
}
