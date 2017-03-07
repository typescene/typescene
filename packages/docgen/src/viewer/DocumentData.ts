import { Async } from "@typescene/typescene";

/** Promise that resolves to a singleton instance when data is loaded */
var instanceAsync: Async.Promise<DocumentData> | undefined;

/** Type definition of a declared code item */
export interface CodeDocItem {
    /** Declaration code (multiple lines in case of multiple declarations) */
    code?: string;
    /** Parsed JSDoc (HTML) */
    doc?: string;
    /** Declaration file name */
    file?: string;
    /** Line of declaration in file */
    line?: number;
    /** List of classes/interfaces (without type parameters) that this class/interface derives from */
    extends?: string[];
    /** List of IDs of inherited items */
    inherits?: string[];
    /** Type parameters (as declared) */
    typeParams?: string[];
    /** Value type or return type (as declared) */
    declType: string;
    // flags:
    isNamespace?: boolean;
    isClass?: boolean;
    isInterface?: boolean;
    hasParams?: boolean;
    isStatic?: boolean;
    isMethod?: boolean;
    isFunction?: boolean;
    isCtor?: boolean;
    isProperty?: boolean;
    isProtected?: boolean;
    isVar?: boolean;
    isReadOnly?: boolean;
    isConst?: boolean;
    isType?: boolean;
    isEnum?: boolean;
    isDecorator?: boolean;
    isSignal?: boolean;
    isAsync?: boolean;
}

/** Type definition of a documentation item */
export interface DocItem extends CodeDocItem {
    /** Parent item, if any (populated when parsed) */
    parentItem?: DocItem;
    /** Icon name (populated when parsed) */
    icon: string;
    /** Unique ID of this item */
    id: string;
    /** Common name of this item */
    name: string;
    /** List of sub items */
    items?: DocItem[];
    /** ID of the parent topic in the TOC */
    textParent?: string;
    /** Short title of this (text) item for the TOC */
    textTopic?: string;
    /** Alternative ID used as a URL slug (e.g. "intro/123") */
    textSlug?: string;
    /** Comma/semicolon/pipe separated list of IDs to include under "See also" */
    textSeeAlso?: string;
    /** Text sections */
    text?: Array<{
        /** Section title */
        title: string;
        /** Section type (e.g. "note") */
        type?: string;
        /** Text content (HTML) */
        content: string;
        /** Output identifier for examples */
        displayResult?: string;
        /** Set to "heading" if should show section as collapsed heading */
        collapse?: string;
    }>;
    /** List of sub item IDs for the TOC */
    toc?: string[];
};

export class DocumentData {
    /** Load the documentation JSON data (or make sure it has been loaded already); returns a promise that resolves with an instance when the data is loaded successfully */
    public static loadAsync() {
        if (!instanceAsync) {
            instanceAsync = new Async.Promise((resolve, reject) => {
                // use XHR to fetch documentation JSON file
                var xhr = new XMLHttpRequest();
                xhr.open("GET", "documentation.json", true);
                xhr.onerror = () => { reject(new Error("HTTP error")) };
                xhr.ontimeout = () => { reject(new Error("HTTP timeout")) };
                xhr.onload = () => {
                    try {
                        if (xhr.status != 200)
                            throw new Error("HTTP " + xhr.status);
                        var json = JSON.parse(xhr.responseText);
                        resolve(DocumentData.fromJSON(json));
                    }
                    catch (err) {
                        reject(err);
                    }
                };
                xhr.send();
            });
            instanceAsync.catch(() => {
                // on error, reset promise so can try again
                instanceAsync = undefined;
            });
        }
        return instanceAsync;
    }

    /** Create an instance with given JSON data */
    protected static fromJSON(jsonData: any) {
        var result = new DocumentData();
        result._data = jsonData;

        // go through all items and add them to the instance
        var itemsToIndex = result._data.items;
        var itemsWithTOC: DocItem[] = [];
        while (itemsToIndex.length) {
            var item = itemsToIndex.pop()!;
            result._itemsById[item.id] = item;

            // populate icon name (TODO: separate this out)
            if (item.isClass || item.isInterface || item.isNamespace)
                item.icon = "fa-cubes";
            else if (item.isCtor)
                item.icon = "fa-magic";
            else if (item.isSignal)
                item.icon = "fa-bolt";
            else if (item.isDecorator)
                item.icon = "fa-tag";
            else if (item.isMethod || item.isFunction)
                item.icon = "fa-dot-circle-o";
            else if (item.isType || item.isEnum)
                item.icon = "fa-square-o";
            else if (!item.code)
                item.icon = "fa-file-text-o";
            else
                item.icon = "fa-cube";

            // clean up slug's leading/trailing slashes
            if (item.textSlug) {
                var slug = item.textSlug;
                slug = slug.replace(/^\/|\/$/g, "");
                result._itemsById[slug] = item;
            }

            // recurse for child items
            if (item.items) {
                item.items.forEach(z => {
                    z.parentItem = item;
                    itemsToIndex.push(z)
                });
            }
            else if (item.toc) {
                // keep track of TOC parent items
                itemsWithTOC.push(item);
            }
        }

        // reference TOC parent items from child items too
        for (var item of itemsWithTOC) {
            item.toc!.forEach(subId => {
                var subItem = result._itemsById[subId];
                if (subItem && !subItem.parentItem)
                    subItem.parentItem = item;
            });
        }

        return result;
    }

    /** Returns the documentation title */
    public getTitle() {
        return this._data.title;
    }

    /** Return true if item with given ID exists */
    public exists(id: string) {
        return !!this._itemsById[id] && this._itemsById[id].id === id;
    }

    /** Find item data by unique ID or slug */
    public getItemById(id: string) {
        var result = this._itemsById[id];
        if (result) return result;
        throw new Error("Item does not exist: " + id);
    }

    /** Returns display text for cross-references and TOC */
    public getDisplayNameFor(id: string) {
        var item = this.getItemById(id);
        if (item.textTopic) return item.textTopic;

        // if no text topic defined, use code identifier
        var result = item.name;
        if (item.isMethod || item.isFunction || item.isCtor) {
            result += item.hasParams ? "(...)" : "()";
        }
        if (item.isDecorator) result = "@" + result;
        else if (item.isStatic) result = "." + result;
        return result;
    }

    /** Returns a list of items that make up the sub TOC below the item with given ID, or the root TOC if no ID is given */
    public getTOCItems(id?: string) {
        var item = id ? this.getItemById(id) : undefined;
        var toc = item ? item.toc : this._data.toc;
        if (toc) return toc.map(s => this.getItemById(s));
        return (item && item.items) ? item.items.slice() : [];
    }

    /** Private constructor, do not use directly */
    private constructor() { }

    /** The documentation data itself */
    private _data: {
        /** The document title */
        title: string;
        /** List of IDs that make up the root TOC */
        toc: string[];
        /** List of content items */
        items: Array<DocItem>;
    };

    /** All documentation items indexed by ID and slug */
    private _itemsById: { [id: string]: DocItem } = {};
}
