import { App, Async, UI } from "@typescene/dom";
import { MainActivity } from "./MainActivity";
import { DocItem, DocumentService } from "./DocumentService";
import { CodeOutputContainer } from "./CodeOutput";
declare var hljs: any;

const TAG_BG_CLASSTYPE = "#333";
const TAG_BG_INTFTYPE = "#888";
const TAG_BG_CTOR = "#c3e";
const TAG_BG_MEMBERTYPE = "#38e";
const TAG_BG_ASYNC = "#ac6";
const TAG_BG_DECORATOR = "#555";
const TAG_BG_OTHRTYPE = "#aaa";
const TAG_BG_STATIC = "#eb6";
const TAG_BG_ACCESS = "#c63";

/** Helper function to replace code tags with links if applicable */
function linkifyCode(root: HTMLElement, svc: DocumentService, base?: DocItem) {
    var aElts = root.querySelectorAll("a");
    for (var i = 0; i < aElts.length; i++) {
        let elt = aElts[i];
        let href = elt.href;
        if (href.indexOf("~/") >= 0) {
            // change href from ~/foo to /doc/foo
            href = href.replace(/.*~\//, "/doc/");
            elt.href = href;
            elt.onclick = () => {
                App.startActivityAsync(href);
                return false;
            };
        }
    }

    var codeElts = root.querySelectorAll("code");
    for (var i = 0; i < codeElts.length; i++) {
        let elt = codeElts[i];
        if (elt.parentNode!.nodeName.toUpperCase() === "A") continue;
        let text = elt.innerText;
        text = text.replace(/\(\.*\)$/, "").replace(/\#(\w+)$/, "/$1");
        if (base && (text[0] === "." || text[0] === "/")) {
            // use relative ID
            text = base.id + (svc.exists(base.id + text) ?
                text : text.replace(/\./g, "/"));
        }
        var id = svc.find(text, base);
        if (id) {
            // wrap <code> element into <a> element
            var item = svc.getItemById(id);
            var a = document.createElement("a");
            let href = "/doc/" + (item.textSlug || item.id);
            a.href = href;
            elt.parentNode!.insertBefore(a, elt);
            a.appendChild(elt);
            a.onclick = () => {
                App.startActivityAsync(href);
                return false;
            };
        }
    }
}

/** Helper function to perform syntax highlighting */
function highlightCode(elt: HTMLElement) {
    var preElts = elt.querySelectorAll("pre code");
    for (var i = 0; i < preElts.length; i++) {
        let elt = preElts[i];
        if (typeof hljs !== "undefined")
            hljs.highlightBlock(elt);
    }
}

/** Container with a full article about a documentation item/topic */
export class DocArticle extends UI.Container {
    constructor(public item: DocItem) {
        super();
        this.style.set("fontSize", "1.125rem");

        // add row with the item heading, and a divider
        if (!item.textSkipTitle) {
            this.content.push(
                new (UI.Row.with(
                    { verticalSpacing: ".5rem" },
                    UI.Heading2.with({
                        text: item.name,
                        shrinkwrap: false,
                        style: {
                            whiteSpace: "pre-wrap",
                            fontSize: "2rem",
                            fontWeight: "300",
                            lineHeight: "1.4em"
                        }
                    })
                )),
                new UI.Divider(undefined, undefined, "0")
            );
        }

        // build up the article with HTML elements,
        // starting from a code declaration if any
        if (item.code) {
            var codeElt = document.createElement("code");
            codeElt.innerText = item.code;
            var codeBlock = new UI.DOM.DOMBlock(codeElt);
            codeBlock.style.addClass("doc-code");
            codeBlock.style.set({ margin: "1rem" });
            this.content.push(codeBlock);
        }

        // append JSDoc text
        if (item.doc) {
            var docElt = document.createElement("div");
            docElt.innerHTML = item.doc;
            linkifyCode(docElt, this.documentService, item.parentItem);
            var docBlock = new UI.DOM.DOMBlock(docElt);
            docBlock.style.addClass("doc-text-article");
            docBlock.style.set({ margin: "1rem" });
            this.content.push(docBlock);
        }

        // append more text
        var frag = document.createDocumentFragment();
        item.text && item.text.forEach((textItem, i) => {
            var textElt = document.createElement("div");

            if (textItem.type)
                textElt.className = "doc-text-type-" + textItem.type;

            // populate text content
            textElt.innerHTML = textItem.content;
            linkifyCode(textElt, this.documentService,
                (item.isClass || item.isInterface || item.isNamespace) ?item : item.parentItem);
            highlightCode(textElt);

            // show examples with code output
            if (textItem.type === "example" || textItem.type === "playground") {
                var code = "", outID = textItem.displayResult;
                for (var elt of <any>textElt.querySelectorAll("pre"))
                    code += (code ? "\n" : "") + elt.textContent;
                var outElt: Node = document.createComment("output");
                textElt.appendChild(outElt);

                // use the result of the first expression in the example if
                // displayResult is "*"
                if (outID === "*") {
                    outID = "result";
                    code = "var result = " + code;
                }

                // add observable to watch code output while block
                // is displayed, but show output as an element inside
                // of the text element itself
                var exampleID = item.id + "|ex" + i;
                var c = new CodeOutputContainer(exampleID, code, outID,
                    textItem.type !== "playground");
                this.content.push(<any>Async.observe(() => {
                    var out = c.out;
                    if (out) {
                        outElt.parentNode!.replaceChild(out.element, outElt);
                        outElt = out.element;
                    }
                }));

                // for playground "example", show a separate button to open the editor
                if (textItem.type === "playground") {
                    textElt.className += " doc-text-type-example";
                    var row = new (UI.Row.with(
                        { verticalSpacing: "1rem", spacing: "0" },
                        UI.PrimaryButton.with({
                            hidden: Async.observe(() => UI.Screen.dimensions.isSmall),
                            icon: "fa-pencil",
                            remGutter: 2,
                            label: UI.tl`Open code editor`,
                            Clicked: new UI.ActionHandler(() => {
                                c.showEditor();
                                for (var elt of <any>textElt.querySelectorAll("pre"))
                                    textElt.removeChild(elt);
                            }),
                            shrinkwrap: false
                        }),
                        UI.Label.with({
                            hidden: Async.observe(() => !UI.Screen.dimensions.isSmall),
                            text: "(Not available on mobile devices)",
                            shrinkwrap: false,
                            style: { textAlign: "center" }
                        })
                    ));
                    var playgroundButtonRowElt: Node = document.createComment("");
                    textElt.insertBefore(playgroundButtonRowElt, textElt.firstChild);
                    this.content.push(<any>Async.observe(() => {
                        var out = row.out;
                        if (out) {
                            playgroundButtonRowElt.parentNode!
                                .replaceChild(out.element, playgroundButtonRowElt);
                            playgroundButtonRowElt = out.element;
                        }
                    }));
                }    
            }

            // show title, collapsed or normal
            if (textItem.title && textItem.title[0] !== "_") {
                var headingElt = document.createElement(
                    textItem.subHeading ? "h4" : "h3");
                headingElt.className = "doc-heading doc-heading-" +
                    (textItem.type ? textItem.type : "section");
                headingElt.textContent = textItem.title;
                if (textItem.type === "task") {
                    // insert "task" icon in heading
                    var iconElt = document.createElement("i");
                    iconElt.className = "fa fa-arrow-circle-right";
                    headingElt.insertBefore(iconElt, headingElt.firstChild);
                }
                if (textItem.collapse === "heading") {
                    // insert icon in heading, and set event handler
                    var iconElt = document.createElement("i");
                    headingElt.insertBefore(iconElt, headingElt.firstChild);
                    headingElt.style.cursor = "pointer";
                    let setIconClass = (open?: boolean) => {
                        iconElt.className = open ?
                            "fa fa-chevron-down fa-fw" :
                            "fa fa-chevron-right fa-fw";
                    }
                    setIconClass();
                    var wrapper = document.createElement("div");
                    while (textElt.firstChild)
                        wrapper.appendChild(textElt.removeChild(textElt.firstChild));
                    var open = false;
                    headingElt.onclick = () => {
                        open = !open;
                        setIconClass(open);
                        if (open) textElt.appendChild(wrapper);
                        else textElt.removeChild(wrapper);
                    };
                }
                textElt.insertBefore(headingElt, textElt.firstChild);
            }
            
            frag.appendChild(textElt);
        });
        if (frag.firstChild || item.doc || item.code) {
            var textBlock = new UI.DOM.DOMBlock(frag);
            textBlock.style.addClass("doc-text-article");
            textBlock.style.set({ margin: "1rem 1rem 2rem" });
            this.content.push(textBlock);
        }

        // append lists of sub items, if any, including inherited ones
        if (item.toc && !item.textSkipTOC) {
            this.content.push(new UI.Row([new UI.Heading3("In this section")]));
            this.content.push(new ItemListPanel("", item.toc.map(id => {
                return this.documentService.getItemById(id);
            })));
        }
        if (item.items && item.items.length ||
            item.extends && item.extends.length) {
            var staticPanel = new ItemListPanel(
                item.isEnum ? "Enum members" : "Static members",
                item.items && item.items.filter(z => z.isStatic),
                item.inherits && item.inherits.filter(id =>
                    /\.[^\/]+$/.test(id) && !/\.constructor/.test(id)));
            var constrPanel = new ItemListPanel("Constructors",
                item.items && item.items.filter(z => z.isCtor),
                item.inherits && item.inherits.filter(id =>
                    /\.constructor/.test(id)));
            var membersPanel = new ItemListPanel("Instance members",
                item.items && item.items.filter(z => !z.isCtor && !z.isStatic),
                item.inherits && item.inherits.filter(id =>
                    !/\.[^\/]+$/.test(id)));
            if (staticPanel.docItems.length || constrPanel.docItems.length ||
                membersPanel.docItems.length) {
                this.content.push(new UI.Row([new UI.Heading3("Members")]),
                    staticPanel, constrPanel, membersPanel);
            }
        }
        if (item.declType) {
            var valueTypes: DocItem[] = [];
            item.declType.split(/\s*[&|,\<\>]\s*/).forEach(typeName => {
                typeName = typeName.replace(/^\s*typeof /, "").trim();
                var typeId = this.documentService.find(typeName, item);
                if (typeId) {
                    var typeItem = this.documentService.getItemById(typeId);
                    if (!valueTypes.some(z => z.id === typeItem.id))
                        valueTypes.push(typeItem);
                }
            });
            if (valueTypes.length) {
                // link (return) type(s)
                this.content.push(new UI.Row([new UI.Heading3(
                    (item.isFunction || item.isMethod) ?
                        "Return type" : "Value type")]));
                this.content.push(new ItemListPanel("", valueTypes));
            }
        }
        if (item.textSeeAlso) {
            // show a "See also" section
            this.content.push(new UI.Row([new UI.Heading3("See also")]));
            this.content.push(new ItemListPanel("References",
                item.textSeeAlso.split(/,|;|\|/).map((id): DocItem => {
                    id = this.documentService.find(id.trim(), item)!;
                    return id ? this.documentService.getItemById(id) :
                        <any>undefined;
                }).filter(z => !!z)));
        }
        if (item.parentItem && item.parentItem.items) {
            // link parent item
            this.content.push(new UI.Row([new UI.Heading3("Declared on")]));
            this.content.push(new ItemListPanel("", [item.parentItem]));

            // show a list of related/sibling/instance items
            if (item.isStatic) {
                let heading = new UI.Row(
                    [new UI.Heading3("Related members")]);
                let panel = new ItemListPanel("Members (static)",
                    item.parentItem.items.filter(z =>
                        z.isStatic && z.id !== item.id),
                    item.parentItem.inherits &&
                    item.parentItem.inherits.filter(id =>
                        /\.[^\/]+$/.test(id) && !/\.constructor/.test(id)));
                if (panel.itemRows.length)
                    this.content.push(heading, panel);
            }
            else {
                let heading = new UI.Row(
                    [new UI.Heading3(item.isCtor ?
                        "Instance members" : "Related members")]);
                let panel = new ItemListPanel("Instance members",
                    item.parentItem.items.filter(z =>
                        !z.isCtor && !z.isStatic && z.id !== item.id),
                    item.parentItem.inherits && item.parentItem.inherits.filter(
                        id => !/\.[^\/]+$/.test(id)));
                if (panel.itemRows.length)
                    this.content.push(heading, panel);
            }
        }

        // add final space below all content
        var bottomSpacer = new UI.Block();
        bottomSpacer.height = "5rem";
        this.content.push(bottomSpacer);
    }

    @App.injectService
    public documentService: DocumentService;
}

/** Spacer that is always exactly .5rem wide */
class HalfSpacer extends UI.Spacer {
    constructor() {
        super();
        this.width = ".5rem";
        this.shrinkwrap = true;
    }
}

/** A row with labels that describe a code documentation item */
export class TagLabelRow extends UI.CloseRow {
    constructor(item: DocItem, isInherited?: boolean, omitIcon?: boolean) {
        super();
        this.icon = item.icon;

        if (isInherited) {
            // dim all tags
            this.style.set({ opacity: ".5" });

            // add an icon and the inherited label
            var inheritedIcon = new UI.Icon();
            inheritedIcon.icon = "fa-clone";
            inheritedIcon.tooltipText = "Inherited";
            inheritedIcon.style.set({
                color: "#888"
            });
            this.content.push(inheritedIcon, new HalfSpacer());
        }
        if (item.code) {
            // add the icon and a small space
            if (!omitIcon)
                this.content.push(new UI.Icon(this.icon), new HalfSpacer());

            // add all appropriate tags
            let add = (text: string, bg: string, italic?: boolean) => {
                var label = new UI.Label(text);
                label.style.set({
                    background: bg,
                    color: "#fff",
                    borderRadius: ".5rem",
                    padding: "0 .5rem",
                    lineHeight: "1.5em",
                    fontSize: ".75rem",
                    fontStyle: italic ? "italic" : "normal"
                });
                this.content.push(label, new HalfSpacer());
            }
            if (item.isClass) add("class", TAG_BG_CLASSTYPE);
            else if (item.isNamespace) add("namespace", TAG_BG_CLASSTYPE);
            else if (item.isInterface) add("interface", TAG_BG_INTFTYPE);
            else if (item.isCtor) add("constructor", TAG_BG_CTOR);
            else if (item.isMethod) add("method", TAG_BG_MEMBERTYPE);
            else if (item.isSignal) add("signal", TAG_BG_ASYNC);
            else if (item.isProperty) add("property", TAG_BG_MEMBERTYPE);
            else if (item.isDecorator) add("decorator", TAG_BG_DECORATOR);
            else if (item.isFunction) add("function", TAG_BG_OTHRTYPE);
            else if (item.isConst) add("const", TAG_BG_OTHRTYPE);
            else if (item.isVar) add("var", TAG_BG_OTHRTYPE);
            else if (item.isEnum) add("enum", TAG_BG_OTHRTYPE);
            else if (item.isType) add("type", TAG_BG_OTHRTYPE);
            if (item.isProtected) add("protected", TAG_BG_ACCESS, true);
            if (item.isReadOnly) add("read-only", TAG_BG_ACCESS, true);
            if (item.isStatic) add("static", TAG_BG_STATIC, true);
            if (item.isAsync) add("async", TAG_BG_ASYNC, true);
        }
    }

    public icon: string;
}

/** A list of annotated item links */
class ItemListPanel extends UI.ContainerBlock.with(
    {
        style: {
            margin: "0 0 1.5rem",
            borderTop: "2px solid " + UI.DOM.Styles.color.divider,
            borderBottom: "1px solid " + UI.DOM.Styles.color.divider
        }
    },
    UI.Container.with(
        { hidden: UI.bind("!itemRows.length") },
        UI.Row.with({
            hidden: UI.bind("!title"),
            height: "1.75rem",
            content: [UI.Heading5.withText(UI.bind("title"))],
            style: {
                background: "#eee",
                color: "#333"
            }
        }),
        UI.List.with({
            items: UI.bind("itemRows"),
            divider: { margin: "0" }
        })
    ),
) {
    constructor(public title: string, public items: DocItem[] = [],
        public inherited?: string[]) {
        super();

        // concatenate all given items
        var allItems = items.slice();
        if (inherited) {
            inherited.forEach(s => {
                allItems.push(this.documentService.getItemById(s))
            });
        }
        this.docItems = allItems = allItems.filter(item => !!item);
        if (!allItems.length) this.hidden = true;

        // populate item rows
        var p = Async.Promise.resolve(true);
        allItems.forEach((item, i) => {
            if (i % 4 === 0) p = p.then(() => Async.sleep(0));
            p.then(() => {
                // collect properties
                var isInherited = !items.some(z => z.id === item.id);
                var displayName = this.documentService.getDisplayNameFor(item.id);
                var labelRow = new TagLabelRow(item, isInherited, true);

                // pull JSDoc as text from a live DOM element
                var docText = item.textSummary || "";
                if (!docText && item.doc) {
                    var tempDiv = document.createElement("div");
                    tempDiv.innerHTML = item.doc;
                    docText = tempDiv.innerText.replace(/\r|\n/g, " ");
                }

                // create a new row factory for this item
                this.itemRows.push(UI.Row.with({
                    spacing: ".5rem",
                    content: [
                        // adjust left alignment
                        UI.Spacer.with({ width: "0", shrinkwrap: true }),

                        // label with icon in front
                        UI.Label.with({
                            text: displayName,
                            icon: labelRow.icon + " fa-fw",
                            style: { fontWeight: isInherited ? "400" : "600" }
                        }),

                        // label row (shrinkwrapped) and JSDoc start
                        UI.BlockControl.with({
                            block: labelRow,
                            shrinkwrap: true
                        }),
                        UI.tl`{w|#aaa|300}${docText}`
                    ],
                    style: {
                        fontSize: "1rem",
                        cursor: "pointer"
                    },
                    Click: new UI.ActionHandler(() => {
                        App.startActivityAsync("/doc/" +
                            (item.textSlug || item.id));
                    })
                }));
            });
        });
    }

    @App.injectService
    public documentService: DocumentService;

    /** Document items included in this block */
    public docItems: DocItem[];

    /** Factories used to populate this block */
    @Async.observable
    public itemRows: UI.ComponentFactory<UI.Row>[] = [];
}
