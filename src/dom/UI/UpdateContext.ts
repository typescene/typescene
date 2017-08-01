import * as Async from "@typescene/core/Async";
import { Animation, Component, ComponentRenderer } from "@typescene/core/UI";
import * as DOM from "./DOM";

/** Time (ms) to wait before animating appearance of sub-subcomponents */
const SUBCOMPONENT_ANIM_CUTOFF_MS = 2000;

/** Max number of child components to animate */
const MAX_N_COMPONENT_ANIM = 100;

/** Shortcut type for component output instance */
type RenderedOutput = ComponentRenderer.Output<Component, HTMLElement>;

/** @internal Represents the DOM updater context; stored in the component render output object, or in the rendering context owning scope (e.g. page renderer) */
export class UpdateContext {
    /** @internal DOM attribute used to signal that an element is managed outside the update context, and should be left alone while updating the parent element (e.g. elements being removed, or the modal shade element) */
    public static readonly UNMANAGED_FLAG = "render-unmanaged";

    /** Create a new updater context for given HTML parent element */
    constructor(root: HTMLElement) {
        if (!root) throw new Error();
        this.root = root;
    }

    /** Root (parent) element for all content */
    public root: HTMLElement;

    /** Components currently associated with rendered content */
    public components: Array<Component | undefined>;

    /** DOM nodes currently associated with rendered content */
    public nodes: Array<Node | undefined>;

    /** Flow direction to be copied to child components before rendering (NOT observed, only used when actually rendering child components) */
    public flowDirection?: "ltr" | "rtl";

    /** Update the root element with given content (DOM nodes, render output, or components, which are rendered asynchronously); if the last argument is a string, it is used to select a different DOM node from the `elements` object of all render output instances (e.g. wrapper elements); returns a promise that is resolved when the DOM elements have actually been updated (although sub components may still not have been fully rendered) */
    public updateAsync(content: Array<Node | RenderedOutput | Component | undefined>,
        useWrapper?: boolean, animatePositionMS?: number): PromiseLike<void> {
        var components: Array<Component | undefined> = this.components = [];
        var nodes: Array<Node | undefined> = this.nodes = [];
        var id = ++this._updateID;
        this._nAnim = 0;

        // find Nodes for all given elements
        var deferRender: Array<() => void> | undefined;
        var seen: { [uid: string]: boolean } = {};
        for (var i = content.length - 1; i >= 0; i--) {
            var item = content[i];
            if (item) {
                if (item instanceof Component) {
                    // remember this component, and prepare async rendering
                    if (seen[item.uid]) continue;
                    components[i] = item;
                    seen[item.uid] = true;
                    let defer = this._renderComponent(item, nodes, i);
                    if (defer) {
                        if (!deferRender) deferRender = [];
                        deferRender.push(defer);
                    }
                }
                else if ((<RenderedOutput>item).isComponentOutput) {
                    // remember owning component, and store output element
                    var component = (<RenderedOutput>item).component;
                    if (seen[component.uid]) continue;
                    seen[component.uid] = true;
                    components[i] = component;
                    nodes[i] = useWrapper && (<RenderedOutput>item).wrapper ||
                        (<RenderedOutput>item).element;
                }
                else if (item instanceof Node) {
                    // store given DOM node directly
                    nodes[i] = item;
                }
            }
        }

        // schedule deferred rendering for components that are not rendered yet
        if (deferRender) {
            for (var deferIdx = deferRender.length - 1; deferIdx >= 0; deferIdx--) {
                Async.defer(deferRender[deferIdx]);
            }
        }

        // return a Promise that resolves when child nodes have been updated
        return new Async.Promise<void>(resolve => {
            Async.defer(() => {
                resolve(<any>true);

                // run update (i.e. add/change/remove child nodes), if no other
                // update was scheduled in the meantime
                if (this._updateID === id) this._updateChildNodes(animatePositionMS);
            });
        });
    }

    /** @internal Update sequence number */
    private _updateID = 0;

    /** @internal Timestamp (ms) of last update */
    private _timestamp: number;

    /** @internal Components previously associated with rendered content */
    private _oldComponents?: Array<Component | undefined>;

    /** @internal DOM nodes previously associated with rendered content */
    private _oldNodes?: Array<Node | undefined>;

    /** @internal X-positions previously associated with rendered content (if animating positions) */
    private _oldXPos?: { [uid: string]: number };

    /** @internal Y-positions previously associated with rendered content (if animating positions) */
    private _oldYPos?: { [uid: string]: number };

    /** @internal Number of components being animated in the current update */
    private _nAnim: number;

    /** @internal Acquire the rendered DOM node for given content, and place it in given array at given index; returns a function to be deferred if given component is not rendered yet */
    private _renderComponent(component: Component,
        nodes: Array<Node | undefined>, i: number) {
        if (component.getLastRenderedOutput() ||
            component.renderOptions &&
            component.renderOptions.synchronous) {
            // store existing output element right away, or force sync render
            var out = component.out;
            nodes[i] = out && out.element;
            return undefined;
        }
        else {
            // store placeholder first, then resolve asynchronously
            var placeholder = document.createComment("placeholder");
            nodes[i] = placeholder;

            // depend on a dummy observable, to make sure the original
            // .out depends on the nested component's .out eventually;
            // but do not re-render (because the value remains undefined)
            var o = Async.unobserved(() => new Async.ObservableValue<void>());
            o.value;

            // return a callback to render asynchronously
            return () => {
                // change getter to add dependencies to existing observable
                o.getter(() => {
                    var out = component.out;
                    var elt = out && out.element;
                    if (placeholder.parentNode) {
                        // placeholder is already in place
                        placeholder.parentNode.replaceChild(elt, placeholder);
                        Async.unobserved(() => { this._animateAppear(component) });
                    }
                    else {
                        // rendered before placeholder was added
                        nodes[i] = elt;
                    }
                }).update();
            };
        }
    }

    /** @internal Update child nodes */
    private _updateChildNodes(animatePositionMS?: number) {
        this._animateChildComponents(animatePositionMS);

        // replace existing elements first
        var nNodes = this.nodes.length;
        var root = this.root, current = root.firstChild;
        for (var i = 0; i < nNodes && current; i++) {
            // skip over unmanaged nodes
            if ((<HTMLElement>current).hasAttribute &&
                (<HTMLElement>current).hasAttribute(UpdateContext.UNMANAGED_FLAG)) {
                current = current.nextSibling;
                i--;
                continue;
            }

            // replace with target node
            var node = this.nodes[i];
            if (!node) node = document.createComment("placeholder");
            (<HTMLElement>node).removeAttribute &&
                (<HTMLElement>node).removeAttribute(UpdateContext.UNMANAGED_FLAG);
            var next = current.nextSibling;
            if (current !== node)
                root.replaceChild(node, current);
            if (next === node)
                next = next.nextSibling;
            current = next;
        }

        // delete trailing existing elements
        while (current) {
            var next = current.nextSibling;
            if (!(<HTMLElement>current).hasAttribute ||
                !(<HTMLElement>current).hasAttribute(UpdateContext.UNMANAGED_FLAG))
                root.removeChild(current);
            current = next;
        }

        // add new elements if needed
        for (; i < nNodes; i++) {
            var node = this.nodes[i];
            if (!node) node = document.createComment("placeholder");
            root.appendChild(node);
        }

        if (animatePositionMS! > 0)
            this._animateChildPositions(animatePositionMS!);
    }

    /** @internal Animate differences with last update (appear/disappear) */
    private _animateChildComponents(animatePositionMS?: number) {
        // find appearing and disappearing components using old arrays
        var oldComponents = this._oldComponents;
        var oldNodes = this._oldNodes;
        this._oldComponents = this.components;
        this._oldNodes = this.nodes;
        this._timestamp = Date.now();

        // if animating positions, get current coordinates first
        if (animatePositionMS! > 0) this._saveChildPositions();

        // animate appearances and disappearances
        if (Animation.isEnabled) {
            var cutoffTime = Date.now() - SUBCOMPONENT_ANIM_CUTOFF_MS;
            for (var c of this.components) {
                // animate all items that were not there before
                if (c && (!oldComponents ||
                    !oldComponents.some(oldc => oldc === c))) {
                    this._animateAppear(c);

                    // animate existing sub components, if added >2s ago
                    var nestedOut = c.getLastRenderedOutput();
                    if (nestedOut) {
                        if (nestedOut &&
                            (nestedOut["@context"] instanceof UpdateContext) &&
                            nestedOut["@context"]._timestamp < cutoffTime &&
                            nestedOut["@context"].components) {
                            nestedOut["@context"].components.forEach(
                                (nC: Component) => { this._animateAppear(nC) });
                        }
                    }
                }
                if (this._nAnim > MAX_N_COMPONENT_ANIM) break;
            }
            if (oldComponents) {
                for (var i = 0, len = oldComponents.length; i < len; i++) {
                    // animate and flag all items that are not there anymore
                    var c = oldComponents[i];
                    if (c && c.animations && c.animations.disappear) {
                        var removeElement = oldNodes && oldNodes[i];
                        if (removeElement && removeElement.nodeType === 1 &&
                            !this.components.some(newc => newc === c)) {
                            let elt: HTMLElement = <any>removeElement;
                            elt.setAttribute(UpdateContext.UNMANAGED_FLAG, "true");
                            this._nAnim++;
                            var playing = c.animations.disappear.playOnce(<any>c);

                            // apply component style manually here, since output
                            // is no longer watched!
                            var lastOut = c.getLastRenderedOutput();
                            var cElt = lastOut && lastOut.element;
                            cElt && DOM.applyStyleTo(c.style, cElt);

                            // when done, check if not re-appeared, and remove
                            playing.done.then(() => {
                                if (elt.parentNode === this.root &&
                                    elt.hasAttribute(UpdateContext.UNMANAGED_FLAG)) {
                                    if (animatePositionMS! > 0)
                                        this._saveChildPositions();
                                    this.root.removeChild(elt);
                                    if (animatePositionMS! > 0)
                                        this._animateChildPositions(
                                            animatePositionMS!);
                                }
                            });
                        }
                    }
                    if (this._nAnim > MAX_N_COMPONENT_ANIM) break;
                }
            }
        }
    }

    /** @internal Helper function that plays the "appear" animation for given component, if any */
    private _animateAppear(component?: Component) {
        this._nAnim++;
        if (Animation.isEnabled &&
            component && component.animations &&
            component.animations.appear)
            component.animations.appear.playOnce(component);
    }

    /** @internal Helper function to save current child positions, to be used by `_animateChildPositions` */
    private _saveChildPositions() {
        var oldXPos: { [uid: string]: number } = this._oldXPos = {};
        var oldYPos: { [uid: string]: number } = this._oldYPos = {};
        this.components.forEach((c, i) => {
            var elt: HTMLElement | undefined = <any>this.nodes[i];
            if (c && elt && elt.nodeType == 1) {
                var rect = elt.getBoundingClientRect();
                if (!rect || !rect.width || !rect.height) return;
                oldXPos[c.uid] = rect.left;
                oldYPos[c.uid] = rect.top;
            }
        });
    }

    /** @internal Animate position differences with last update (translate) */
    private _animateChildPositions(animatePositionsMS: number) {
        if (!this._oldXPos) return;
        var callbacks: any[] = [];
        this.components.forEach((c, i) => {
            var elt: HTMLElement | undefined = <any>this.nodes![i];
            if (c && elt && elt.nodeType == 1 &&
                this._oldXPos![c.uid] >= 0) {
                // calculate difference with old position before update
                var rect = elt.getBoundingClientRect();
                var diffX = this._oldXPos![c.uid] - rect.left;
                var diffY = this._oldYPos![c.uid] - rect.top;
                if (diffX || diffY) {
                    elt.style.transition = "";
                    elt.style.transform =
                        `translateX(${diffX}px) translateY(${diffY}px)`;
                    callbacks.push(() => {
                        elt!.style.transition = "transform " +
                            animatePositionsMS + "ms ease";
                        elt!.style.transform = "translateX(0) translateY(0)";
                    });
                }
            }
        });

        // animate transition now
        if (callbacks.length)
            setTimeout(() => callbacks.forEach(f => f()), 0);

        delete this._oldXPos;
        delete this._oldYPos;
    }
}
