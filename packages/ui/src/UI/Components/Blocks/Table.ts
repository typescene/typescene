import * as Async from "@typescene/async";
import { ControlElement } from "../";
import { Component } from "../Component";
import { ComponentFactory } from "../ComponentFactory";
import { Block } from "./Block";
import { TableRow, TableHeader } from "./TableRow";

/** Represents a table block component */
export class Table<TableRowT extends TableRow> extends Block {
    /** Create a table with given header and rows, if any */
    constructor(headerColumns?: Array<string | ControlElement | Block>,
        widths?: string[],
        rows: TableRowT[] | Async.ObservableArray<TableRowT> = []) {
        super();
        this.header = new TableHeader(headerColumns, widths);
        this.rows = rows;
    }

    /** Initialize a table factory with given rows */
    public static withRows<T extends Table<any>>(
        this: { new (): T, with: typeof Table.with },
        rows: ComponentFactory.SpecList2TCol) {
        return this.with({ rows });
    }

    /** Initialize with given (observable) properties; returns this */
    public initializeWith: (values: Table.Initializer) => this;

    /** Header row; not rendered if undefined, or does not contain columns, OR if table itself has no rows (observed) */
    @ComponentFactory.applyComponentRef(ComponentFactory.CLevel.TableHeader)
    @Async.observable
    public header?: TableHeader;

    /** List of rows; each row should have the same number of columns (observed) */
    @ComponentFactory.applyComponentsArray(ComponentFactory.CLevel.TableRow)
    @Async.observable_not_null
    public rows: Array<TableRowT | undefined>;

    /** Set to a string value to have getFormValues add an ObservableArray with form values of table rows */
    @Async.observable
    public name?: string;

    /** Returns an array of directly contained components (observable) */
    public getChildren(): Component[] {
        var results = <Component[]>this.rows.filter(c => (c instanceof Component));
        if (this.header) results.unshift(this.header);
        return results;
    }

    /** Returns an object containing all current values of input elements (observable) */
    public getFormValues(result = {}) {
        if (this.name)
            result[this.name] = (<Async.ObservableArray<TableRowT>>this.rows)
                .mapAsyncValues(item => Async.observe(() => item.getFormValues()));
        else
            super.getFormValues(result);
        return result;
    }

    /** Set all input values by element name */
    public setFormValues(values: any) {
        if (this.name && values && values[this.name]) {
            this.rows.forEach((row, i) => {
                row && row.setFormValues(values[this.name!][i]);
            });
        }
        else
            super.setFormValues(values);
    }
}

export namespace Table {
    /** Initializer for .with({ ... }) */
    export interface Initializer extends Block.Initializer {
        /** Property initializer: list of rows */
        rows: ComponentFactory.SpecList2TCol;
        /** Property initializer: header row */
        header?: ComponentFactory.SpecEltOrListTCol;
        /** Property initializer: form values list name */
        name?: string;
    }
}
