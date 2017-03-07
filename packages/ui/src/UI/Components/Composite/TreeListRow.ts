import * as Async from "@typescene/async";
import { ArrayBinding, _getBatchTransformer } from "../../Binding";
import { ActionHandler } from "../ComponentSignal";
import { Component, CloseRow, TreeList, ControlElement, Spacer, Icon, WideLabel } from "../";
import { ComponentFactory } from "../ComponentFactory";

/** Represents a tree list row, with an optional list of sub rows; implements the `TreeList.BlockItem` interface */
export class TreeListRow extends CloseRow implements TreeList.BlockItem {
    /** Create an _array_ of tree list row components from the given array of tree item data objects, with given icons and measurements */
    public static arrayFromItems(itemData: TreeListRow.ItemData[],
        openIcon: string, closedIcon: string, remGutter?: number, height?: string) {
        return itemData.map(item =>
            new TreeListRow(item, openIcon, closedIcon, remGutter, height));
    }

    /** Create a new `ArrayBinding` for given property name/path on the base component, which should contain an array of unique tree item data objects; the binding resolves to an observable array of `TreeListRow` instances; for use in a component initializer; set the `batchSize` argument to a value greater than 0 to create rows in batches for faster initial rendering */
    public static arrayFromBinding(sourcePath: string,
        openIcon: string, closedIcon: string, remGutter?: number, height?: string,
        batchSize?: number) {
        var f = v => new TreeListRow(v,
            openIcon, closedIcon, remGutter, height, batchSize);
        return new ArrayBinding(sourcePath, undefined,
            _getBatchTransformer(f, batchSize), true);
    }

    /** Creates a new tree list row for given item data, with given open/closed icon names and measurements; set the `batchSize` argument to a value greater than 0 to create child rows in batches for faster initial rendering */
    constructor(itemData: TreeListRow.ItemData,
        openIcon: string, closedIcon: string,
        remGutter = TreeListRow.REM_GUTTER, height = TreeListRow.HEIGHT,
        batchSize?: number) {
        super();
        if (!itemData) throw new Error();
        this.itemData = itemData;
        this.openIcon = openIcon;
        this.closedIcon = closedIcon;
        this.remGutter = remGutter;
        this.height = height;
        if (itemData.autoExpand) this.collapsed = false;

        // populate list and content with observables
        this.treeListItems = this._getTreeListItems(batchSize);
        this.initializeWith({
            content: Async.observe(() => this._getContentSpec())
        });

        // add event handlers
        this.Clicked.connect(() => {
            // open on click (outside toggle icon)
            if (this.collapsed && this.itemData && this.itemData.items)
                this.collapsed = false;
        });
        this.ArrowLeftKeyPressed.connect(() => {
            // on left arrow press, close and then move up
            if (this.collapsed && this.treeListRowParent &&
                this.treeListRowParent.focusMode !== Component.FocusMode.None)
                this.treeListRowParent.hasFocus = true;
            else
                this.collapsed = true;
        });
        this.ArrowRightKeyPressed.connect(() => {
            // on right arrow press, open and then move down
            if (this.collapsed) {
                if (this.itemData && this.itemData.items)
                    this.collapsed = false;
            }
            else if (this.treeListItems.length > 0 &&
                this.treeListItems[0].focusMode !== Component.FocusMode.None) {
                this.treeListItems[0].hasFocus = true;
            }
        });
    }

    /** Default height for new instances (CSS length, initially 1.75em) */
    public static HEIGHT = "1.75em";

    /** Default gutter width for new instances (CSS length in rem units, initially 1.5) */
    public static REM_GUTTER = 1.5;

    /** Item data for this row (observed as a shallow reference, i.e. item data properties are not automatically observed, but the reference to the object itself is) */
    @Async.observable_shallow
    public itemData: TreeListRow.ItemData;

    /** Item key for this row (read-only, taken directly from the `itemData` object; observable) */
    public get key() {
        return this.itemData ? this.itemData.key : undefined;
    }

    /** Indent width, i.e. width of space before nested row content, and icon width (CSS length in rem units; observed) */
    @Async.observable
    public remGutter: number;

    /** Name of the icon that is used in front of rows that have a `treeListItems` array and are not collapsed (see `Icon/icon` property on `Icon`; observed) */
    @Async.observable_string
    public openIcon: string;

    /** Name of the icon that is used in front of rows that have a `treeListItems` array and are currently collapsed (see `Icon/icon` property on `Icon`; observed) */
    @Async.observable_string
    public closedIcon: string;

    /** Reference to the `TreeListRow` instance that created this row, if any, i.e. the parent row in the visual hierarchy; this property is set automatically by a parent constructor, and by the static methods `arrayFromItems`, and `arrayFromBinding`; otherwise it _must_ be set before rendering */
    public treeListRowParent?: TreeListRow;

    /** True if this row is collapsed (defaults to true; observable) */
    @Async.observable
    public collapsed: boolean = true;

    /** List of rows displayed below this row in the hierarchical structure of a `TreeList` component; automatically generated based on `itemData` and its properties */
    public readonly treeListItems: TreeListRow[];

    /** Tree list row content; automatically generated based on `itemData` and its properties */
    public readonly content: ControlElement[];

    /** Generate the content factory initializer spec for this row (used as an observable getter) */
    private _getContentSpec() {
        if (!this.itemData) return [];

        // figure out the indentation of this row
        if (!this._indent) {
            this._indent = 1;
            var parent = this.treeListRowParent;
            while (parent) {
                if (parent._indent) {
                    this._indent += parent._indent;
                    break;
                }
                this._indent++;
                parent = parent.treeListRowParent;
            }
        }

        // get all observable values first
        var items = this.itemData.items;
        var remGutter = this.remGutter;
        var icon = this.itemData.icon, name = this.itemData.name;
        var content = this.itemData.content;

        // return a full factory initializer spec
        return Async.unobserved(() => {
            // insert a spacer of the correct width, and the icons
            var result: any[] = this._contentSpec || (this._contentSpec = []);
            result.length = 0;
            var indent = this._indent || 1;
            indent = indent - (indent * .5) + (items ? 0 : 1);
            var spacer = this._contentSpecSpacer || new Spacer();
            spacer.width = (indent * remGutter).toFixed(4) + "rem";
            spacer.shrinkwrap = true;
            result.push(spacer);
            this._contentSpecSpacer = spacer;

            if (items) {
                var toggle = this._contentSpecToggleIcon || new Icon();
                toggle.icon = <any>Async.observe(() =>
                    (this.collapsed ? this.closedIcon : this.openIcon));
                toggle.width = remGutter + "rem";
                result.push(toggle);
                if (!this._contentSpecToggleIcon) {
                    this._contentSpecToggleIcon = toggle;
                    toggle.Clicked.connect(() => {
                        this.collapsed = !this.collapsed;
                    });
                }
            }
            if (icon) {
                result.push(Icon.with({ icon, width: remGutter + "rem" }));
            }

            // add further content, or just a label with the item name
            if (content) {
                // join with content initializer spec array
                result.push.apply(result, content);
            }
            else if (name !== undefined) {
                // use a WideLabel instance
                var label = this._contentSpecLabel || new WideLabel();
                label.text = name;
                result.push(label);
                this._contentSpecLabel = label;
            }

            return result;
        });
    }

    /** Generate the observable array that contains `TreeListRow` instances for child items */
    private _getTreeListItems(batchSize?: number) {
        var f: (item: any) => TreeListRow = <any>_getBatchTransformer(item => {
            var row = new TreeListRow(item,
                this.openIcon, this.closedIcon,
                this.remGutter, this.height, batchSize);
            row.treeListRowParent = this;
            return row;
        }, batchSize);
        return Async.observeArray(() => this.itemData && this.itemData.items)
            .mapAsyncValues(v => {
                // transform item data to a row (or observe the resulting promise)
                var row = f(<any>v);
                return (<any>row).then ? Async.observe(row) : row;
            });
    }

    /** Cached indent position 1-n */
    private _indent: number | undefined;

    /** Cached content spec */
    private _contentSpec: any;

    /** Cached spacer instance */
    private _contentSpecSpacer: any;

    /** Cached toggle icon instance */
    private _contentSpecToggleIcon: any;

    /** Cached label instance */
    private _contentSpecLabel: any;
}

export namespace TreeListRow {
    /** Interface definition of the source data that can be used to construct a `TreeListRow` instance and its children; actual objects may contain more state information such as an instance of a linked (view) model, however either a `content` array or a `name` property is required */
    export interface ItemData {
        /** Optional key (identifier string) of the item */
        key?: string;

        /** Row content to be displayed for this item, as a factory initializer spec: an array containing strings, `TextLabelFactory` instances, `Icon` instances or factories, etc */
        content?: ComponentFactory.SpecList;

        /** Item display name, displayed in a `WideLabel` component if `content` is undefined */
        name?: string;

        /** Name of the icon displayed at the start of the row (after the open/closed icon, if any) */
        icon?: string;

        /** (Observable) array of sub items to be displayed; child instances of `TreeListRow` are automatically created for these items upon initialization; if this property is undefined, the tree list row will be displayed as a leaf item; if this array is not observable, the list of sub items will not be updated automatically */
        items?: TreeListRow.ItemData[];

        /** True if the created tree list row should be automatically expanded to reveal sub items when rendered */
        autoExpand?: boolean;
    }
}
