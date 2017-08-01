import Async from "../../../Async";
import { Style } from "../../Style";
import { ControlElement } from "../";
import { Component } from "../Component";
import { ComponentFactory,  UIValueOrAsync } from "../ComponentFactory";
import { Block } from "./Block";

/** Represents a row within a `Table` component */
export class TableRow extends Block {
    /** Create a component factory for this class */
    static with: ComponentFactory.WithMethod<TableRow.Initializer>;
    /** Initialize this component with given properties; returns this */
    public initializeWith: ComponentFactory.InitializeWithMethod<TableRow.Initializer>;

    /** Create a table row with given columns, if any */
    constructor(columns: Array<string | ControlElement | Block> = [], widths: string[] = [],
        styles: Array<Style | Style.StyleSet> = []) {
        super();
        this.columns = columns;
        this.widths = widths;
        this.styles = styles;
    }

    /** Column content as strings, control elements, or blocks (observed) */
    @ComponentFactory.applyComponentsArray(ComponentFactory.CLevel.ControlElement)
    @Async.observable_not_null
    public columns: Array<string | ControlElement | Block | undefined>;

    /** Column widths for all columns (CSS values, observed) */
    @Async.observable_not_null
    public widths: Array<string | undefined>;

    /** Additional styles for all columns (observed) */
    @Async.observable_not_null
    public styles: Array<Style | Style.StyleSet | undefined>;

    /** Row index (base 0) the last time this row was rendered, or -1 (observable) */
    @Async.observable
    public rowIndex = -1;

    /** Append a table cell to this row */
    public appendChild(cell?: string | ControlElement | Block) {
        this.columns.push(cell);
        return this;
    }

    /** Returns an array of directly contained components */
    public getChildren(): Component[] {
        return <Component[]>this.columns.filter(v => (v instanceof Component));
    }
}

export namespace TableRow {
    /** Initializer for .with({ ... }) */
    export interface Initializer extends Block.Initializer {
        /** Property initializer: content of all columns, as strings, control elements, or blocks */
        columns?: ComponentFactory.SpecListTCol;
        /** Property initializer: widths of all columns */
        widths?: UIValueOrAsync<Array<string | undefined>>;
        /** Property initializer: additional styles for all columns */
        styles?: UIValueOrAsync<Array<Style | Style.StyleSet | undefined>>;
    }
}

/** A table header at the top of a table */
export class TableHeader extends TableRow {
    /** Automatic selection management mode: table header rows are not selectable */
    public selectionMode = Component.SelectionMode.None;

    /** Automatic focus management mode: table header rows are not focusable */
    public focusMode = Component.FocusMode.None;

    // implemented by platform specific renderer
}
