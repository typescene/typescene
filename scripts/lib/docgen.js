// Documentation generator that combines JSDoc from .d.ts files with markdown
// ===

// Debug options
const LOG_FILES = false;
const LOG_FILES_AND_IDS = false;

// Default document title if none is specified in markdown files:
const DEFAULT_DOC_TITLE = "Documentation";

// main function is exported as generateAsync(...folders)
module.exports = { generateAsync };

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Main

"use strict";
const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const md = require("markdown-it")({
    html: true,
    typographer: true
});
md.use(require("markdown-it-deflist"));

// helper functions:
const flatten = array => array.reduce((r, a) =>
    r.concat((a instanceof Array) ? flatten(a) : a),
    []);
const getSortIdForItem = (item) => {
    var result = item.id.replace(/^(.*[^\w_])?([\w_]+)$/, "$2");
    if (item.textSort) result = item.textSort;
    else if (item.isStatic) result = " " + result; // on top
    else if (item.isCtor) result = "___"; // after static props
    else if (item.isProtected) result = "| "; // down
    else if (item.isDecorator) result = "|~" + result; // down
    else if (item.isSignal) result = "~" + result; // bottom
    if (item.isType || item.isEnum) result = "\\" + result;
    return result;
}
const byIdSorter = (a, b) => {
    var a_id = getSortIdForItem(a);
    var b_id = getSortIdForItem(b);
    if (a_id === b_id) return a.sourceIdx - b.sourceIdx;
    return a_id > b_id ? 1 : -1;
}

// main function:
function generateAsync(sourceDir, version) {
    /** List of of all declaration items by ID */
    const declItems = {};

    /** List of of all text items by ID */
    const textItems = {};

    /** List of all items, merged after parsing both declarations and text */
    const allItems = {};

    // scan source directory
    return recurseDir(sourceDir)
        .then(itemList => flatten(itemList)
            .map((item, i) => ((item.sourceIdx = i), item))  // mark position
            .sort(byIdSorter)  // sort by ID and then position
            .map(item => {
                // merge text and declaration items
                var declItem = declItems[item.id];
                if (!declItem || declItem === item) {
                    // this is the main item, keep it in the list
                    allItems[item.id] = item;
                    return item;
                }
                else {
                    // merge texts and properties for this item
                    if (declItem.text && item.text)
                        declItem.text = declItem.text.concat(item.text);
                    for (var prop in item)
                        declItem[prop] = declItem[prop] || item[prop];
                }
            })
            .filter(item => !!item))
        .then(result => {
            populateInheritance();
            var toc = makeTOC(result);
            var title = findDocTitle(toc) || DEFAULT_DOC_TITLE;
            return { version, title, toc, items: result };
        });


    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    /** Helper function that parses files recursively, and returns a promise for lists (of lists...) of items */
    function recurseDir(pathName, idPrefix) {
        if (pathName.slice(-1) === "/") pathName = pathName.slice(0, -1);
        pathName = path.join("./", pathName);
        return new Promise((resolve, reject) => {
            fs.readdir(pathName, (err, list) => {
                if (err) return reject(err);

                // make a promise for each file, and wait for all together
                resolve(Promise.all(list.sort().map(fileName => {
                    fileName = path.join(pathName, fileName);
                    return new Promise((resolve, reject) => {
                        fs.stat(fileName, (err, stat) => {
                            if (err) return reject(err);

                            // process file/directory recursively
                            if (stat.isDirectory()) {
                                // recurse into directory
                                resolve(recurseDir(fileName, idPrefix));
                            }
                            else if (fileName.endsWith(".d.ts")) {
                                // process declaration file
                                resolve(processDeclarationFile(fileName, idPrefix));
                            }
                            else if (fileName.endsWith(".md")) {
                                // process text file
                                resolve(processTextFile(fileName));
                            }
                            else {
                                // this is some other file... do nothing
                                resolve([]);
                            }
                        });
                    });
                })));
            });
        });
    }

    /** Helper function to make a root table of contents for given (sorted) items */
    function makeTOC(items) {
        // helper to sort all sub items by ID (or textSort property)
        function sortSubItems(item) {
            if (item.items) {
                item.items = item.items.sort(byIdSorter);
                item.items.forEach(sortSubItems);
            }
        }

        // list all items under their TOC parents
        items.forEach(item => {
            // find TOC parent
            var parentID = item.textParent;
            if (!parentID) {
                var match = item.id.match(/(.*)\/[^\/]+$/);
                if (match && allItems[match[1]])
                    item.textParent = parentID = match[1];
                else if (item.code && !item.toc)
                    console.warn(`*** WARNING: orphan item ${item.id}`);
            }
            var parent = allItems[parentID];

            // add item to TOC list
            if (parent) {
                if (!parent.toc) parent.toc = [];
                parent.toc.push(item.id);
            }

            // sort sub items
            sortSubItems(item);
        });

        // find root items (i.e. has children OR no code, but no parent)
        return items.filter(item => (!item.textParent && (!item.code || item.toc)))
            .map(item => item.id);
    }

    /** Helper function to make a root table of contents for given (sorted) items */
    function findDocTitle(toc) {
        for (var i = 0; i < toc.length; i++) {
            var item = allItems[toc[i]];
            if (item.textDocTitle)
                return item.textDocTitle;
            if (item.toc) {
                var result = findDocTitle(item.toc);
                if (result) return result;
            }
        }
    }

    /** Helper function to find inherited (static/property) members for all items */
    function populateInheritance() {
        for (var id in declItems) {
            var item = declItems[id];
            if (!item.extends) continue;

            // find absolute ID for relative extends clause
            function makeAbsId(id) {
                var base = item.id;
                while (base) {
                    base = base.replace(/[^\/\.]*$/, "").slice(0, -1);
                    if (declItems[base + "." + id]) return base + "." + id;
                }
                return id;
            }
            item.extends = item.extends.map(makeAbsId);

            // get rid of _base const types (Typescript generated)
            if (item.isClass &&
                item.extends.length === 1 &&
                item.extends[0].endsWith("_base")) {
                var sup = declItems[item.extends[0]];
                var parentId = item.id.replace(/\.[^\.]*$/, "");
                var parent = allItems[parentId] || declItems[parentId];
                if (sup && !sup.isClass && sup.declType) {
                    if (parent && parent.items)
                        parent.items = parent.items.filter(v => v !== sup);
                    item.code += "\n" + sup.code;
                    item.extends = sup.declType.split(/\s\&\s/)
                        .map(s => s.trim().replace(/\<.*/, ""))
                        .filter(s => s.startsWith("typeof "))
                        .map(s => s.slice(7))
                        .map(makeAbsId);
                }
            }
        }
        for (var id in declItems) {
            var item = declItems[id];
            if (!item.extends || !item.items) continue;

            // track static inheritance, instance inheritance, and constructors
            var staticInh = [], instanceInh = [], ctorInh = [];

            // find all overridden items first (use name, not ID)
            var seen = {}, hasCtor = false;
            item.items.forEach(sub => {
                seen[(sub.isStatic ? "static~" : "") + sub.name] = true;
                if (sub.isCtor) hasCtor = true;
            });

            // recurse bottom-up for all derived classes
            function recurseFindInherits(ids) {
                ids && ids.forEach(id => {
                    if (!declItems[id]) return;
                    var sup = declItems[id];

                    // find inherited constructor(s) from this class
                    if (!hasCtor && !ctorInh.length) {
                        sup.items && sup.items.forEach(sub => {
                            if (sub.isCtor) ctorInh.push(sub.id);
                        });
                    }

                    // add inherited static methods (not members!), and inherited
                    // all non-static items from this class
                    sup.items && sup.items.forEach(inhItem => {
                        if (inhItem.isStatic && inhItem.isMethod &&
                            !seen["static~" + inhItem.name]) {
                            staticInh.push(inhItem.id);
                            seen["static~" + inhItem.name] = true;
                        }
                        else if (!inhItem.isStatic && !inhItem.isCtor &&
                            !seen[inhItem.name]) {
                            instanceInh.push(inhItem.id);
                            seen[inhItem.name] = true;
                        }
                    });

                    // recurse bottom-up
                    recurseFindInherits(sup.extends);
                });
            }
            recurseFindInherits(item.extends);

            // merge everything together
            var inherited = [].concat(staticInh, ctorInh, instanceInh);
            if (inherited.length) {
                item.inherits = inherited.sort((a, b) =>
                    byIdSorter(declItems[a], declItems[b]));
            }
        }
    }


    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // Text file parser (*.md)

    function processTextFile(fileName) {
        if (LOG_FILES) console.log(fileName);
        return new Promise((resolve, reject) => {
            fs.readFile(fileName, (err, buf) => {
                if (err) return reject(err);

                // split this file on level 1 headings
                var str = String(buf);
                var chapters = str.split(/(?:\n|^)#\s*(?!#)/).slice(1);

                // keep track of promises for nested definitions
                var p = [];

                // create an item for each chapter
                var items = chapters.map(part => {
                    var lines = part.split(/\r\n|\n\r|\r|\n/);
                    var item = {};

                    // determine name and ID from heading (or comments below)
                    item.id = (item.name = lines.shift().trim())
                        .replace(/\s+/g, "-");

                    // split into running named sections
                    var sections = [], section;
                    lines.forEach(l => {
                        var commentMatch = l.match(/^\s*<!--\s*(.*)-->\s*$/);
                        var tagMatch = commentMatch && commentMatch[1].match(/^([\w_]+):(.*)/);
                        if ((!section || !section.lines.length) && tagMatch) {
                            // found a tag comment
                            var tag = tagMatch[1];
                            var content = tagMatch[2].trim();
                            if (!section) {
                                // process top level tag
                                if (tag.toLowerCase() === "id") {
                                    // set ID
                                    item.id = content;
                                }
                                else if (tag.toLowerCase() === "typings") {
                                    // recurse for given typings directory
                                    item.items = [];
                                    p.push(recurseDir(path.join(
                                        fileName.replace(/[^\\\/]+$/, ""),
                                        content), item.id)
                                        .then((items) => {
                                            items = flatten(items);
                                            item.items.push.apply(item.items, items);
                                            item.isNamespace = true;
                                        }));
                                }
                                else {
                                    // add to item as text*
                                    item["text" + tag.charAt(0).toUpperCase() +
                                        tag.slice(1)] = content;
                                }
                            }
                            else {
                                // section-level tag: add to section object
                                section[tag] = content;
                            }
                        }
                        else if (l[0] === "#" ||
                            commentMatch && commentMatch[1][0] === "#") {
                            // start a new section with this heading
                            // (ignore empty headings and those starting with -)
                            var title = (commentMatch ? commentMatch[1] : l)
                            .replace(/^#+\s*/, "").replace(/^\-.*/, "");
                            section = { lines: [] };
                            if (title) section.title = title;
                            sections.push(section);
                            if (l[1] === "#" && l[2] === "#")
                                section.subHeading = true;
                        }
                        else if (!commentMatch && (/\S/.test(l) || section)) {
                            // add this line to current section
                            if (!section) {
                                // intialize a section without a title
                                section = { lines: [] };
                                sections.push(section);
                            }
                            section.lines.push(l);
                        }
                    });

                    // concatenate lines and parse markdown
                    item.text = sections;
                    sections.forEach(section => {
                        var content = section.lines.join("\n")
                            .replace(/\{icon::(\w+)(\-[\w\s\-]+)\}/g,
                            "<i class=\"$1 $1$2\"></i>");
                        section.content = md.render(content);
                        delete section.lines;
                    })

                    // add item to global list and return it
                    textItems[item.id] = item;
                    return item;
                });

                resolve(Promise.all(p).then(() => items));
            });
        });
    }


    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // Declaration file parser (*.d.ts)

    function processDeclarationFile(fileName, idPrefix) {
        if (LOG_FILES) console.log(fileName);
        return new Promise((resolve, reject) => {
            fs.readFile(fileName, (err, buf) => {
                if (err) return reject(err);

                // parse file using the TypeScript compiler
                var sourceFile = ts.createSourceFile(fileName, String(buf),
                    ts.ScriptTarget.ES5, true);

                // helper function to convert JSDoc documentation to HTML
                var lastJSDocComment = null;
                function getJSDocHtml(node) {
                    var comment = "No description";
                    var firstChild = node.getChildCount() > 1 ?
                        node.getChildAt(0) : null;
                    if (firstChild && firstChild.comment)
                        comment = String(firstChild.comment).trim();
                    else if (lastJSDocComment)
                        comment = String(lastJSDocComment.comment).trim();
                    if (!comment.endsWith(".") && comment.split(" ").length > 2)
                        comment += ".";
                    var html = md.render(comment.replace(/\n(?!\*)/g, "  \n"));
                    lastJSDocComment = null
                    return html;
                }

                // helper function to check for given modifier keyword
                function hasModifier(node, keywordID) {
                    return (node.modifiers && node.modifiers.some(mod =>
                        mod.kind === keywordID));
                }

                // helper function to get the code for a class-like node
                function getClassCode(node) {
                    return node.name.getText() +
                        (node.typeParameters ? "<" +
                            node.typeParameters.map(p => p.getText())
                                .join(", ") + ">" :
                            "") +
                        (node.heritageClauses ?
                            node.heritageClauses.map(h => " " + h.getText())
                                .join("") :
                            "");
                }

                // recursive function to parse declarations, returns a list of items
                function getChildItems(parentNode, parent) {
                    var items = [];
                    ts.forEachChild(parentNode, child => {
                        var item, code;
                        var name = ((child.name && child.name.getText) ?
                            child.name.getText() : child.name) ||
                            "<undefined>";
                        var idParts = (parent && parent.id) ?
                            [parent.id, name] : [name];
                        var id = idParts.join(".");
                        switch (child.kind) {
                            case ts.SyntaxKind.ModuleDeclaration:
                                // create namespace item (unless already known)
                                item = { id, name, isNamespace: true };
                                code = "namespace " + name;
                                break;
                            case ts.SyntaxKind.ClassDeclaration:
                                // create class item
                                item = { id, name, isClass: true };
                                code = "class " + getClassCode(child);
                                break;
                            case ts.SyntaxKind.InterfaceDeclaration:
                                // create interface item
                                item = { id, name, isInterface: true };
                                code = "interface " + getClassCode(child);
                                break;
                            case ts.SyntaxKind.Constructor:
                            case ts.SyntaxKind.MethodDeclaration:
                            case ts.SyntaxKind.FunctionDeclaration:
                            case ts.SyntaxKind.ConstructSignature:
                            case ts.SyntaxKind.MethodSignature:
                            case ts.SyntaxKind.CallSignature:
                                // determine if this item is static
                                var staticMethod = !!(parent && parent.isNamespace ||
                                    hasModifier(child, ts.SyntaxKind.StaticKeyword));

                                // create function/method item
                                id = idParts.join(staticMethod ? "." : "/");
                                var hasParams = !!(child.parameters &&
                                    child.parameters.length);
                                item = { id, name, hasParams };
                                if (staticMethod) item.isStatic = true;
                                if (parent) item.isMethod = true;
                                else item.isFunction = true;

                                // use "new ..." for constructor names
                                if ((child.kind === ts.SyntaxKind.Constructor ||
                                    child.kind === ts.SyntaxKind.ConstructSignature) &&
                                    parent) {
                                    item.isCtor = true;
                                    delete item.isMethod;
                                    item.name = name = (child.kind === ts.SyntaxKind.Constructor) ?
                                        "new " + parent.name : "new";
                                    item.id = idParts[0] + ".constructor";
                                }

                                // use "<call>" for call signature names
                                if (child.kind === ts.SyntaxKind.CallSignature &&
                                    parent) {
                                    item.name = name = "<call>";
                                    item.id = idParts[0] + ".-call";
                                }
                                break;
                            case ts.SyntaxKind.VariableDeclaration:
                            case ts.SyntaxKind.PropertyDeclaration:
                            case ts.SyntaxKind.PropertySignature:
                            case ts.SyntaxKind.IndexSignature:
                                // determine if this item is static
                                var staticProp = !!(parent && parent.isNamespace ||
                                    hasModifier(child, ts.SyntaxKind.StaticKeyword));

                                // create variable/property item
                                id = idParts.join(staticProp ? "." : "/");
                                item = { id, name };
                                if (staticProp) item.isStatic = true;
                                if (parent) item.isProperty = true;
                                else item.isVar = true;

                                // determine readonly/const modifier
                                if (hasModifier(child, ts.SyntaxKind.ReadonlyKeyword))
                                    item.isReadOnly = true;
                                if (hasModifier(child, ts.SyntaxKind.ConstKeyword))
                                    item.isConst = true;

                                // use "[type]" for index signatures
                                if (child.kind === ts.SyntaxKind.IndexSignature) {
                                    let match = child.getText().match(
                                        /\[[^:]+\:\s*([^\]\s]+)\]/);
                                    var indexType = (match && match[1]) || "any";
                                    item.name = name = "[" + indexType + "]";
                                    item.id = idParts[0] + ".-index-" + indexType;
                                }
                                break;
                            case ts.SyntaxKind.TypeAliasDeclaration:
                                // create type item
                                item = { id, name, isType: true };
                                break;
                            case ts.SyntaxKind.EnumDeclaration:
                                // create enum item
                                item = { id, name, isEnum: true };
                                code = "enum " + name;
                                break;
                            case ts.SyntaxKind.EnumMember:
                                // create enum member (const) item
                                item = { id, name, isStatic: true, isConst: true };
                                code = "enum " + parent.name +
                                    " { ..." + name + " }";
                                break;
                            default:
                                // recurse if anything else
                                var swallowedJSDoc = null;
                                if (child.jsDoc && child.jsDoc.length) {
                                    // remember (undocumented) JSDoc if it was
                                    // swallowed by the compiler in a parent node
                                    swallowedJSDoc = lastJSDocComment =
                                        child.jsDoc[0];
                                }
                                getChildItems(child, parent)
                                    .forEach(z => items.push(z));

                                // on the way out, reset JSDoc comment
                                if (swallowedJSDoc === lastJSDocComment)
                                    lastJSDocComment = null;
                                return;
                        }

                        // add common properties, read JSDoc comment
                        if (idPrefix && !parent) item.id = idPrefix + "." + item.id;
                        item.file = fileName.replace(/\\/g, "/");
                        item.line = ts.getLineAndCharacterOfPosition(sourceFile, child.pos).line;
                        item.code = code || child.getText()
                            .replace(/^(?:\s*(?:export|declare|public)\s+)+/, "")
                            .replace(/\s+/g, " ");
                        item.doc = getJSDocHtml(child);

                        // mark protected items, skip private items
                        if (hasModifier(child, ts.SyntaxKind.ProtectedKeyword))
                            item.isProtected = true;
                        if ((/\@internal|\[implementation\]/i.test(item.doc)) ||
                            (name || "").charAt(0) === "_" ||
                            (child.modifiers && child.modifiers.some(mod =>
                                mod.getText() === "private")))
                            return;

                        // everything in a namespace is static
                        if (parent && parent.isNamespace) item.isStatic = true;

                        // add "extends" clauses (leave out type parameters)
                        if (child.heritageClauses) {
                            var names = child.heritageClauses
                                .map(clause => clause.getText().replace(/\<.*/, ""))
                                .filter(s => s.startsWith("extends"))
                                .map(s => s.replace(/^extends\s*/, ""));
                            if (names.length)
                                item.extends = names;
                        }

                        // add type parameters and type
                        if (child.typeParameters && child.typeParameters.length)
                            item.typeParams = child.typeParameters.map(t => t.getText());
                        if (child.type && child.type.getText) {
                            var type = child.type.getText();
                            if (type !== "any") item.declType = type;
                            if (!item.isMethod && !item.isFunction &&
                                /^[\w_\.]*Signal\.(Void)?Emittable/.test(type))
                                item.isSignal = true;
                            if (/^(I)?Promise(Like|_Thenable)?\</.test(type))
                                item.isAsync = true;
                        }
                        if (item.isFunction && /\[decorator\]/.test(item.doc)) {
                            item.isDecorator = true;
                            item.doc = item.doc.replace(
                                /\s*\[decorator\]((?:[\s\.]+|\<[^>]+\>)*)$/, "$1");
                        }

                        // merge with existing item, if any
                        var existing = declItems[item.id];
                        if (existing) {
                            // enumerate declarations for same IDs
                            if (!item.isNamespace) {
                                existing.code += "\n" + item.code;
                                if (existing.doc !== item.doc) {
                                    if (!existing.count) {
                                        existing.count = 1;
                                        existing.doc = existing.doc
                                            .replace(/\>/, ">[1]. ");
                                    }
                                    var n = ++existing.count;
                                    item.doc = item.doc
                                        .replace(/\>/, ">[" + n + "]. ");
                                    existing.doc += item.doc;
                                }
                                if (existing.declType && item.declType) {
                                    existing.declType += " | " + item.declType;
                                }
                            }

                            // copy `isNamespace` onto class item as well
                            // (to mark members as static in this context)
                            if (item.isNamespace) existing.isNamespace = true;

                            // use existing instance for recursion below
                            item = existing;
                            if (LOG_FILES_AND_IDS) console.log(fileName, "=>*", item.id);
                        }
                        else {
                            // no existing item, add to list of items
                            declItems[item.id] = item;
                            items.push(item);
                            if (LOG_FILES_AND_IDS) console.log(fileName, "=>+", item.id);
                        }

                        // recurse for items containing sub items
                        if (item.isClass || item.isInterface ||
                            item.isNamespace || item.isEnum) {
                            if (!item.items) item.items = [];
                            getChildItems(child, item).forEach(z => item.items.push(z));
                        }
                    });
                    return items;
                }

                // do this for all declarations recursively
                resolve(getChildItems(sourceFile, null));
            });
        });
    }
}
