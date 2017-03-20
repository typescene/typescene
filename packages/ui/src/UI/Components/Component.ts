import * as Async from "@typescene/async";
import { Animation } from "../Animation";
import { Style } from "../Style";
import { ActionHandler, ComponentSignal, DragEvent, DragEventSignal, DragHandler, KeyEventSignal, KeyHandler, KeyboardEvent, PointerEvent, PointerEventSignal, PointerHandler, defineComponentSignal } from "./ComponentSignal";
import { ComponentFactory, _ComponentFactory, UIValueOrAsync, makeFactory } from "./ComponentFactory";
import { ComponentRenderHandler, ComponentRenderSignal, ComponentRenderer } from "./ComponentRenderer";

/** Next component UID */
var _nextUID = 1;

/** Next selection order number (incremented when an element is selected) */
var _selectionOrder = 1;

/** Component base class for every part of the user interface */
export abstract class Component extends Async.ObservableObject {
    /** Abstract constructor with any number of arguments */
    constructor(...args: any[]) { super() }

    /** Returns a component factory for this component type, with given (observable) property values; the result is an instance of `ComponentFactory`, which doubles as a pre-initialized component constructor; this method is only available on component classes that provide a parameterless constructor */
    public static with: <T extends Component, InitializerT>(
        this: { new (): { initializeWith(initializer: InitializerT): T } },
        values: InitializerT) => ComponentFactory<T> = makeFactory;

    /** Initializes this instance with given properties; returns this */
    public initializeWith: (values: Component.Initializer) => this = (values) =>
        (<ComponentFactory<any>>(<any>this).constructor.with(values))
            .applyTo(this);

    /** Force one-time initialization of this component, e.g. apply properties from the static property marked with the `@initializer` decorator, if any; called automatically just before rendering (unobserved), but can also be invoked manually if the initialized properties are required earlier, e.g. at the end of a constructor; only returns true if this instance was not already initialized */
    @Async.injectable
    public initialize() {
        return this._initialized ? false : (this._initialized = true);
    }

    /** True if this component has been initialized (synchronous) */
    private _initialized?: boolean;

    /** Returns a new component signal class specific to this component, with optional signal base class which must derive from ComponentSignal; can be used to define custom signals in a component constructor or public property initializer (or memoized get-accessor for lazy initialization); sets static property `ComponentSignal.component` of the derived signal class to the component instance, as well as any other static properties given */
    protected defineComponentSignal<DataT, SignalT extends typeof ComponentSignal>(base?: SignalT & (new (data: DataT) => ComponentSignal<DataT>),
        properties = {}):
        ComponentSignal.Emittable<DataT, SignalT> {
        return defineComponentSignal(base || ComponentSignal, this, properties);
    }

    /** Identifier string (optional), may be set by component factory constructor, and used with .getComponentById(...) */
    public id: string;

    /** Globally unique component identifier */
    public readonly uid = "C" + _nextUID++;

    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // HIERARCHY METHODS

    /** Returns an array of directly contained components (observable) */
    public getChildren(): Component[] {
        return [];
    }

    /** Returns a list of currently selected directly contained components, in order of selection (observable) */
    public getSelectedChildren() {
        return this.getChildren().filter(c => c.selected)
            .sort((a, b) => a._selectionOrder - b._selectionOrder);
    }

    /** Returns the last selected directly contained component (observable); evaluated asynchronously if automatic selection management mode is `ItemClick` or `ItemFocus`, otherwise evaluated synchronously from current selection status of child components */
    public getLastSelectedChild() {
        return this._lastSelectionAsync ? this._lastSelectionAsync.value :
            this.getSelectedChildren().pop();
    }

    /** Returns the nearest matching child element with given ID, if any (observable) */
    public getComponentById(id: string): Component | undefined;

    /** Returns the nearest matching child element with given ID _and_ that is an instance of given class, if any (observable) */
    public getComponentById<C extends Component>(id: string,
        componentClass: typeof Component & { new (...p: any[]): C }): C | undefined;

    public getComponentById(id: string, componentClass?: Function) {
        var queue = this.getChildren();
        while (queue.length) {
            var c = queue.shift();
            if (c && c.id === id &&
                (!componentClass || c instanceof componentClass))
                return c;
            c && c.getChildren().forEach(d => queue.push(d));
        }
        return undefined;
    }

    /** Returns all (recursive) child components that are an instance of given class (observable) */
    public getComponentsByType<C extends Component>(
        componentClass: { new (...p: any[]): C }) {
        var result: C[] = [];
        this.getChildren().forEach(c => {
            if (c instanceof componentClass) result.push(<C>c);
            c && c.getComponentsByType(componentClass).forEach(r => result.push(r));
        });
        return result;
    }

    /** Returns an object containing all current values of input elements (observable) */
    public getFormValues(result = {}): any {
        this.getChildren().forEach(v => { v.getFormValues(result) });
        return result;
    }

    /** Set all input values by element name */
    public setFormValues(values: any) {
        this.getChildren().forEach(v => { v.setFormValues(values) });
    }

    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // ANIMATIONS

    /** Animation(s) to be played during the lifetime of this component on screen; initially undefined */
    public animations?: Component.Animations;

    /** Play given animation on this component; returns the animation control instance, which can be used to stop the animation manually; given callback is called asynchronously after the animation completes */
    public animate<AnimationT extends Animation>(
        animation: AnimationT, continuous?: boolean, after?: () => void):
        Animation.AnimationControl<AnimationT>;

    /** Play animation on this component (from `.animations`, by identifier); if found, returns the animation control instance, which can be used to stop the animation manually; given callback is called asynchronously after the animation completes */
    public animate(animation: string, continuous?: boolean, after?: () => void):
        Animation.AnimationControl<Animation> | undefined;

    public animate(animation: Animation | string,
        continuous?: boolean, after?: () => void) {
        var anim = (typeof animation === "string") ?
            this.animations && this.animations[animation] :
            animation;
        var control = anim ?
            continuous ? anim.play(this) : anim.playOnce(this) :
            undefined;
        if (after)
            control ? control.done.then(after) : Async.defer(after);
        return control;
    }

    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // COMPONENT RENDERING
    // Note: actual implementation is injected by platform dependent code
    // (see Renderer)

    /** Options for rendering this component (not observable); initially undefined */
    @Async.observable
    public renderOptions?: ComponentRenderer.RenderOptions;

    /** Primary renderer class for this component; injected globally on the component (sub) class, but can be overwritten by assigning to this property (observable) */
    @Async.injectable
    protected Renderer: typeof ComponentRenderer;

    /** Wait for this component to be rendered and return a promise for its output (value of `.out`), unless the component is already rendered, in which case this method returns a resolved promise for the last rendered output; never forces the component to be rendered */
    public getRenderedOutputAsync():
        PromiseLike<ComponentRenderer.Output<this, any>> {
        // use output property on current renderer
        var result = this._renderer.output.getLastValue();
        if (result) {
            // return value as-is (not undefined)
            return Async.Promise.resolve(result);
        }
        else {
            // return a promise for the first non-undefined value
            return new Async.Promise<ComponentRenderer.Output<this, any>>(r => {
                var c = this._renderer.Rendered.connect(out => {
                    if (out) r(out), c.disconnect();
                });
            });
        }
    }

    /** Returns the last rendered output for this component, if any (value of `.out`); does not trigger a render */
    public getLastRenderedOutput() {
        return this._renderer.output.getLastValue();
    }

    /** Rendered output for this component (observable); retrieving this value triggers a render operation, if it was not already subscribed to, e.g. if the component is displayed on screen; the renderer is lazily constructed from the class reference injected into the `.Renderer` property */
    public get out() {
        return this._renderer.output.value;
    }

    /** Render this component synchronously, always updating any existing rendered output; this method should _not_ be used unless changes may have occurred outside of the observable context, otherwise read the value from `.out`, include it on a `Page`, or use the `.display()` method where available */
    public render() {
        this._renderer.output.update();
        return this._renderer.output.getLastValue();
    }

    /** Signal emitted after updating DOM (render) */
    public readonly Rendered = this.defineComponentSignal(ComponentRenderSignal);

    /** Current renderer instance, created upon access */
    @Async.unobservable_memoize_get
    private get _renderer() {
        if (typeof this.Renderer !== "function")
            throw new TypeError("No renderer defined");

        // initialize this instance
        this.initialize();

        // construct the renderer, forward its signal
        var renderer: ComponentRenderer<this, any> =
            new (<any>this.Renderer)(this);
        renderer.Rendered.connect(this.Rendered);
        (<typeof ComponentRenderSignal><any>this.Rendered).renderer = renderer;
        this.beforeFirstRender(renderer);
        return renderer;
    }

    /** Method that is called immediately after the renderer for this component is constructed; override this method (and invoke `super.beforeFirstRender`) to be able to call or inject renderer methods before this component is first rendered */
    protected beforeFirstRender(renderer: ComponentRenderer<this, any>) {
        this._watchFocusMode(renderer);
        this._watchSelectionMode(renderer);
    }

    /** Helper method to watch and apply list focus mode on renderer instance */
    private _watchFocusMode(renderer: ComponentRenderer<this, any>) {
        var childConnections: { [id: string]: Async.SignalConnection[] };
        var subscribed: Async.ObservableValue<any> | false | undefined;
        var links: {
            [uid: string]: {
                c: Component,
                nx?: Component,
                pv?: Component
            }
        } | undefined;
        renderer.watch(() => (this.focusMode === Component.FocusMode.Items), t => {
            if (!t && !childConnections) return;

            // remember old links, and connections to unsubscribe from
            var oldChildConnections = childConnections;
            var oldSubscribed = subscribed;
            links = {};

            // manage focus mode for all child components
            subscribed = t && Async.observe(() => {
                var oldConnections = childConnections;
                childConnections = {};
                var oldLinks = links;
                var focusable: Component | undefined;
                var noAutoFocusChild = true;
                var children = this.getChildren();

                // helper function to set one child to auto focus, rest to click
                let setSingleAutoFocus = (c: Component) => {
                    c.focusMode = Component.FocusMode.Auto;

                    // set siblings back to click
                    children.forEach(sibling => {
                        if (sibling !== c &&
                            sibling.focusMode ===
                            Component.FocusMode.Auto)
                            sibling.focusMode =
                                Component.FocusMode.Click;
                    });
                }

                // keep track of all children (re-eval when list changes)
                var prevLink: { c: Component, nx?: Component } | undefined;
                children.forEach(c => {
                    Async.unobserved(() => {
                        // skip unfocusable components, remember first focusable,
                        // set click as default
                        if (c.focusMode === Component.FocusMode.None) return;
                        if (c.focusMode === Component.FocusMode.Auto)
                            noAutoFocusChild = false;
                        else if ((!focusable ||
                            !(focusable._selectionOrder > c._selectionOrder)) &&
                            c.focusMode !== Component.FocusMode.Items)
                            focusable = c;
                        if (c.focusMode === undefined)
                            c.focusMode = Component.FocusMode.Click;

                        // maintain chain of components for moving up/down
                        var link = oldLinks && oldLinks[c.uid] || { c };
                        links![c.uid] = link;
                        if (prevLink) {
                            link.pv = prevLink.c;
                            prevLink.nx = c;
                        }
                        prevLink = link;

                        // keep connections for this component, if any
                        if (oldConnections && oldConnections[c.uid]) {
                            childConnections[c.uid] = oldConnections[c.uid];
                            delete oldConnections[c.uid];
                        }
                        else {
                            // connect to this child component's signals
                            childConnections[c.uid] = [];
                            childConnections[c.uid].push(
                                c.FocusGained.connect(() => {
                                    // set to auto focus to enable tabbing
                                    setSingleAutoFocus(c);
                                }),
                                c.ArrowUpKeyPressed.connect(event => {
                                    // if possible, focus previous child
                                    if (link.pv) {
                                        link.pv.hasFocus = true;
                                        if (event.preventDefault)
                                            event.preventDefault();
                                    }
                                }),
                                c.ArrowDownKeyPressed.connect(event => {
                                    // if possible, focus next child
                                    if (link.nx) {
                                        link.nx.hasFocus = true;
                                        if (event.preventDefault)
                                            event.preventDefault();
                                    }
                                }));
                        }
                    });
                });

                // watch single selected item and change its focus mode to auto
                // wrap in static observable value to observe but not reevaluate
                // (this is to catch situations where selection changed in code,
                // not on focus/click, and user expects to tab (back) to newly
                // selected item, not last one focused)
                if (this.selectionMode === Component.SelectionMode.ItemClick ||
                    this.selectionMode === Component.SelectionMode.ItemFocus) {
                    Async.unobserved(() =>
                        Async.observe(() => this.getLastSelectedChild())
                            .map(sel => sel && setSingleAutoFocus(sel))).value;
                }

                // set first focusable component to auto if needed
                focusable && noAutoFocusChild && Async.unobserved(() => {
                    focusable!.focusMode = Component.FocusMode.Auto;
                });

                // disconnect from old components
                for (var id in oldConnections) {
                    oldConnections[id].forEach(c => c.disconnect());
                }
            }).subscribe();

            // disconnect old connections (after connecting new ones, to prevent
            // unnecessary event connected state flip flopping)
            oldSubscribed && oldSubscribed.clear();
            for (var id in oldChildConnections)
                oldChildConnections[id].forEach(c => c.disconnect());
        });
    }

    /** Helper method to watch and apply selection mode on renderer instance */
    private _watchSelectionMode(renderer: ComponentRenderer<this, any>) {
        var connections: Async.SignalConnection[] = [];
        var subscribed: Async.ObservableValue<any> | undefined;
        renderer.watch(() => this.selectionMode, selectionMode => {
            // remember connections to unsubscribe from
            this._lastSelectionAsync = undefined;
            var oldConnections = connections.splice(0);
            var oldSubscribed = subscribed;

            // check what needs to be managed here (click/toggle/focus/items)
            switch (selectionMode) {
                // manual selection using click/touch or space bar:
                case Component.SelectionMode.Click:
                    let clickSelect = () => { this.selected = true };
                    connections.push(
                        this.Clicked.connect(clickSelect),
                        this.SpaceBarPressed.connect(clickSelect));
                    subscribed = undefined;
                    break;

                // manual toggle selection using click/touch or space bar:
                case Component.SelectionMode.Toggle:
                    let toggle = () => { this.selected = !this.selected };
                    connections.push(
                        this.Clicked.connect(toggle),
                        this.SpaceBarPressed.connect(event => {
                            toggle();
                            event.preventDefault && event.preventDefault();
                        }));
                    subscribed = undefined;
                    break;

                // automatic selection on focus:
                case Component.SelectionMode.Focus:
                    let focusSelect = () => { this.selected = true };
                    connections.push(this.FocusGained.connect(focusSelect));
                    subscribed = undefined;
                    break;

                // select one child element only, on click or focus
                case Component.SelectionMode.ItemClick:
                    var isClick: boolean | undefined = true;
                case Component.SelectionMode.ItemFocus:
                    subscribed = this._observeSingleSelection(
                        isClick ? Component.SelectionMode.Click :
                            Component.SelectionMode.Focus)
                        .subscribe(component => {
                            if (this._lastSelectionAsync)
                                this._lastSelectionAsync.value = component;
                        });

                    // initialize observable value with current selection
                    this._lastSelectionAsync =
                        Async.ObservableValue.fromValue(subscribed.value);
                    break;

                // make child elements toggleable
                case Component.SelectionMode.ItemToggle:
                    subscribed = Async.observe(() => {
                        // set selection mode to toggle for new components
                        this.getChildren().forEach(c => {
                            if (c.selectionMode === undefined) {
                                Async.unobserved(() => {
                                    c.selectionMode = Component.SelectionMode.Toggle;
                                });
                            }
                        });
                    }).subscribe();
                    break;
            }

            // disconnect old connections (after connecting new ones, to prevent
            // unnecessary event connected state flip flopping)
            oldConnections.forEach(c => c.disconnect());
            if (oldSubscribed) oldSubscribed.clear();
        });
    }

    /** Helper method to observe selected child component(s), and deselect all except component selected latest; also overrides selection mode for components where this property is undefined; returns an observable for the single (last) selected component */
    private _observeSingleSelection(setSelectionMode: Component.SelectionMode) {
        return Async.observe(() => {
            var lastSelection: Component | undefined;
            var lastSelectedNumber: number | undefined;
            this.getChildren().forEach(c => {
                var isSelected = c.selected;
                Async.unobserved(() => {
                    if (c.selectionMode === undefined)
                        c.selectionMode = setSelectionMode;
                    if (isSelected) {
                        // deselect component if selected earlier
                        if (c._selectionOrder < lastSelectedNumber!) {
                            c.selected = false;
                        }
                        else {
                            if (lastSelection) {
                                // deselect component found earlier
                                lastSelection.selected = false;
                            }
                            lastSelection = c;
                            lastSelectedNumber = c._selectionOrder;
                        }
                    }
                });
            });

            // return last selected component
            return lastSelection;
        });
    }

    /** Observable value containing the last selected component, either computed or set asynchronously if automatic selection management mode is `ItemClick` or `ItemFocus` */
    private _lastSelectionAsync?: Async.ObservableValue<Component | undefined>;

    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // DIMENSIONS & STYLE

    /** Add a new style override to this component class (and derived classes); does not have any effect on existing component instances, but changes to previously added style overrides are always observed; returns given style instance */
    public static addStyleOverride(style: Style) {
        var chain = Async.inject(this, {
            "@overrideStyle": (prev: Style) =>
                chain["@overrideStyle"](prev).override(style)
        });
        return style;
    }

    /** @internal Adds overrides to the current base style for this component (injected using `addStyleOverride`, DO NOT use or override directly) */
    @Async.injectable
    protected ["@overrideStyle"](style: Style) { return style }

    /** Read-only reference to an instance of `Style`, encapsulating CSS styles and classes for this component; for extensible component classes, do not override this property but use static method `.addStyleOverride(...)` instead */
    public readonly style = this["@overrideStyle"](Style.withClass("UI"));

    /** Returns the current dimensions for this component, in logical (CSS) pixel units; may return 0x0 if this component is not yet displayed on screen (i.e. use the `.Rendered` signal and/or a timeout to obtain accurate results) */
    @Async.injectable
    public getActualDimensions(): { width: number, height: number } {
        // implemented by platform dependent code
        return { width: 0, height: 0 };
    }

    /** Overall target height of this component (CSS length; observable, directly modifies `.style` property, does _not_ retrieve actual component height, may be "auto") */
    @Async.observable
    public get height(): string { return this.height || "auto" }
    public set height(h) {
        if (h === "auto") h = "";
        this.style.set("height", this.height = h);
    }

    /** Overall target width of this component (CSS length; observable, directly modifies `.style` property, does _not_ retrieve actual component width, may be "auto") */
    @Async.observable
    public get width(): string { return this.width || "auto" }
    public set width(w) {
        if (w === "auto") w = "";
        this.style.set("width", this.width = w);
    }

    /** Set to a number between 0 and 1 to add a drop shadow to this component (shadow "depth" of 1 creates the illusion of a component lifted off the canvas the furthest, 0 means no shadow at all; observable, directly adds shadow effect to `.style`) */
    @Async.observable
    public get shadowEffect(): number { return this.shadowEffect || 0 }
    public set shadowEffect(d) {
        this.style.addShadowEffect(this.shadowEffect = d);
    }

    /** Override the drop shadow "depth" value while mouse cursor is hovering over this component, with given number between 0 and 1 */
    @ComponentFactory.setterFor("shadowEffectOnHover")
    public addShadowEffectOnHover(d: number) {
        // add an overriding observable for the shadow effect depth
        let override = new Style().addShadowEffect(d);
        this.style.override(Async.observe(() =>
            this.hoverState ? override : undefined));
    }

    /** Override the drop shadow "depth" value while this component or a child component has input focus, with given number between 0 and 1 */
    @ComponentFactory.setterFor("shadowEffectOnFocus")
    public addShadowEffectOnFocus(d: number) {
        // add an overriding observable for the shadow effect depth
        let override = new Style().addShadowEffect(d);
        this.style.override(Async.observe(() =>
            this.hasFocus ? override : undefined));
    }

    /** Set to true to hide this component (observable, directly modifies hidden state of `.style` and plays show/hide animations) */
    @Async.observable
    public get hidden(): boolean { return this.hidden }
    public set hidden(yesno) {
        // complexity here is due to animation: the element is hidden only
        // after the animation completes; while the Style object should still
        // observe the source observable indirectly as well
        var o: Async.ObservableValue<boolean> | undefined;
        let doHide = (hide?: boolean) => {
            if (!this.getLastRenderedOutput()) {
                // if not rendered yet, do not animate
                if (o) o.value = hide;
                else this.style.hide(hide);
            }
            else if (hide && !this._hidden) {
                // animate, then hide
                this.animate("hide", false, () => {
                    if (this._hidden) {
                        if (o) o.value = true;
                        else this.style.hide();
                    }
                });
            }
            else if (!hide && this._hidden) {
                // show and animate
                if (o) o.value = false;
                else this.style.show();
                this.animate("show");
            }
            this._hidden = !!hide;
            return <any>o;
        }
        if (<any>yesno instanceof Async.ObservableValue) {
            // use shadow observable that changes after animation
            o = Async.ObservableValue.fromValue(this._hidden);
            this.style.hide(Async.observe(() => !!(<any>yesno).value)
                .map(doHide));
        }
        else {
            // modify style directly
            doHide(yesno);
        }
        this.hidden = yesno;
    }
    private _hidden: boolean;

    /** Set to true to display this component in a selected state (observable, directly modifies selected state of `.style` and plays select/deselect animations) */
    @Async.observable
    public get selected(): boolean { return this.selected }
    public set selected(yesno) {
        // complexity here is due to animation: the element is selected only
        // after the animation completes; while the Style object should still
        // observe the source observable indirectly as well
        var o: Async.ObservableValue<boolean> | undefined;
        let doSelect = (select?: boolean) => {
            // check selection mode first, update selection order
            if (select) {
                if (this.selectionMode === Component.SelectionMode.None)
                    throw new Error("This component cannot be selected");
                this._selectionOrder = _selectionOrder++;
            }

            if (!this.getLastRenderedOutput()) {
                // if not rendered yet, do not animate
                if (o) o.value = select;
                else this.style.select(select);
            }
            else if (!select && this._selected) {
                // animate, then deselect
                this.animate("deselect", false, () => {
                    if (!this._selected) {
                        if (o) o.value = false;
                        else this.style.deselect();
                    }
                });
            }
            else if (select && !this._selected) {
                // select and animate
                if (o) o.value = true;
                else this.style.select();
                this.animate("select");
            }
            this._selected = !!select;
            return <any>o;
        }
        if (<any>yesno instanceof Async.ObservableValue) {
            // use shadow observable that changes after animation
            o = Async.ObservableValue.fromValue(this._selected);
            this.style.select(Async.observe(() => !!(<any>yesno).value)
                .map(doSelect));
        }
        else {
            // modify style directly
            doSelect(yesno);
        }
        this.selected = yesno;
    }
    private _selected: boolean;

    /** Automatic selection management mode */
    @Async.observable
    public selectionMode?: Component.SelectionMode;

    /** Last selection order number, assigned when selected */
    private _selectionOrder: number;

    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // FOCUS AND HOVER

    /** Automatic focus management mode */
    @Async.observable
    public focusMode?: Component.FocusMode;

    /** True if this component _or_ a child component has input focus, false otherwise; set to true to focus the component itself, if and when available (throws an exception if this component is unable to receive input focus); set to false to remove focus from this component */
    @Async.observable
    public get hasFocus(): boolean {
        if (this._liveFocus === undefined)
            Async.unobserved(() => this._connectFocus());
        return this.hasFocus;
    }
    public set hasFocus(wantFocus) {
        // connect to platform focus events
        if (this._liveFocus === undefined)
            this._connectFocus();

        // blur or focus the component itself, if possible
        if (!((<any>wantFocus instanceof Async.ObservableValue) ?
            (<any>wantFocus).value : wantFocus))
            this["@blurLiveComponent"]();
        else if (!this._liveFocus) {
            if (this.focusMode === Component.FocusMode.None)
                throw new Error("This component cannot be focused")
            else
                this["@focusLiveComponent"]();
        }

        this.hasFocus = wantFocus;
    }

    /** @internal Method to retrieve the current focus state of a component (injected by platform specific code, if applicable) */
    @Async.injectable
    public ["@getLiveComponentFocusState"]() { return false }

    /** @internal Set input focus to this component (injected by platform specific code, if applicable) */
    @Async.injectable
    public ["@focusLiveComponent"]() { throw new TypeError() }

    /** @internal Remove input focus from this component (injected by platform specific code, if applicable) */
    @Async.injectable
    public ["@blurLiveComponent"]() { /* ignore if not defined */ }

    /** Connect Focus and Blur signal handlers to maintain `_liveFocus` and `hasFocus` */
    private _connectFocus() {
        this.hasFocus = this._liveFocus = this["@getLiveComponentFocusState"]();
        this.Focus.connect(() => {
            this._liveFocus = true;
            this.hasFocus = true;
        });
        this.Blur.connect(() => {
            this._liveFocus = false;
            this.hasFocus = false;
        });
    }

    /** True if the mouse cursor is hovering over this component, false otherwise; evaluated lazily using `.MouseEnter` and `.MouseLeave`, value is `false` initially until first signal is emitted after this property has been read once */
    @Async.observable
    public get hoverState(): boolean {
        if (!this._liveHover) {
            Async.unobserved(() => {
                this._liveHover = Async.ObservableValue.fromValue(false);
                this.MouseEnter.connect(() => { this._liveHover!.value = true });
                this.MouseLeave.connect(() => { this._liveHover!.value = false });
            });
        }
        return this._liveHover!.value!;
    }

    /** Platform focus state, set by Focus/Blur signal handlers */
    private _liveFocus: boolean;

    /** Platform hover state, set by MouseEnter/Leave signal handlers */
    private _liveHover?: Async.ObservableValue<boolean>;

    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // EVENT SIGNALS
    // Note: actual implementation is injected by platform dependent code
    // (see createEventSignal)

    /** @internal Method to create event signal for this component (injected by platform specific code) */
    @Async.injectable
    public ["@createEventSignal"]<T, S extends typeof ComponentSignal>(
        id: string, signalClass: S & { new (data: T): any }, opt?: any):
        ComponentSignal.Emittable<T, S> {
        throw new TypeError();
    }

    /** Signal emitted when this component _or_ a child component is clicked, touched, or otherwise activated; captured from containers down to contained components, not consumed */
    @Async.unobservable_memoize_get
    public get Click() {
        return this["@createEventSignal"]("Click", PointerEventSignal);
    }

    /** Signal emitted asynchronously after this component _or_ a child component is clicked, touched, or otherwise activated; propagates from child components to parents, until a component consumes the event by connecting to this signal */
    @Async.unobservable_memoize_get
    public get Clicked() {
        return this["@createEventSignal"]("Clicked", PointerEventSignal);
    }

    /** Signal emitted when this component _or_ a child component is double-clicked; captured from containers down to contained components, not consumed */
    @Async.unobservable_memoize_get
    public get DoubleClick() {
        return this["@createEventSignal"]("DoubleClick", PointerEventSignal);
    }

    /** Signal emitted asynchronously after this component _or_ a child component is double-clicked; propagates from child components to parents, until a component consumes the event by connecting to this signal */
    @Async.unobservable_memoize_get
    public get DoubleClicked() {
        return this["@createEventSignal"]("DoubleClicked", PointerEventSignal);
    }

    /** Signal emitted when a mouse button is pressed down, or a touch occurs, on this component _or_ a child component; captured from containers down to contained components, not consumed */
    @Async.unobservable_memoize_get
    public get Press() {
        return this["@createEventSignal"]("Press", PointerEventSignal);
    }

    /** Signal emitted asynchronously after a mouse button is pressed down, or a touch occurs, on this component _or_ a child component; propagates from child components to parents, until a component consumes the event by connecting to this signal */
    @Async.unobservable_memoize_get
    public get Pressed() {
        return this["@createEventSignal"]("Pressed", PointerEventSignal);
    }

    /** Signal emitted when the cursor begins to hover over this component; captured from containers down to contained components, not consumed */
    @Async.unobservable_memoize_get
    public get MouseEnter() {
        return this["@createEventSignal"]("MouseEnter", PointerEventSignal);
    }

    /** Signal emitted when the cursor has left this component; captured from containers down to contained components, not consumed */
    @Async.unobservable_memoize_get
    public get MouseLeave() {
        return this["@createEventSignal"]("MouseLeave", PointerEventSignal);
    }

    /** Signal emitted when a context menu is requested for this component or a child component (usually by right-clicking); captured from containers down to contained components, not consumed */
    @Async.unobservable_memoize_get
    public get MouseContextMenu() {
        return this["@createEventSignal"]("MouseContextMenu", PointerEventSignal);
    }

    /** Signal emitted when a key is pressed down (while this component _or_ a child component is focused); captured from containers down to contained components, not consumed */
    @Async.unobservable_memoize_get
    public get KeyDown() {
        return this["@createEventSignal"]("KeyDown", KeyEventSignal);
    }

    /** Signal emitted after a key is pressed (while this component _or_ a child component is focused); captured from containers down to contained components, not consumed */
    @Async.unobservable_memoize_get
    public get KeyPress() {
        return this["@createEventSignal"]("KeyPress", KeyEventSignal);
    }

    /** Signal emitted when this component _or_ a child component receives focus; captured from containers down to contained components, not consumed */
    @Async.unobservable_memoize_get
    public get Focus() {
        return this["@createEventSignal"]("Focus", ComponentSignal);
    }

    /** Signal emitted when this component _or_ a child component loses focus; captured from containers down to contained components, not consumed */
    @Async.unobservable_memoize_get
    public get Blur() {
        return this["@createEventSignal"]("Blur", ComponentSignal);
    }

    /** Signal emitted asynchronously after this component receives focus; propagates from child components to parents, until a component consumes the event by connecting to this signal */
    @Async.unobservable_memoize_get
    public get FocusGained() {
        return this["@createEventSignal"]("FocusGained", ComponentSignal);
    }

    /** Signal emitted asynchronously after this component loses focus, and only if `.FocusGained` was emitted previously; propagates from child components to parents, not consumable */
    @Async.unobservable_memoize_get
    public get FocusLost() {
        return this["@createEventSignal"]("FocusLost", ComponentSignal);
    }

    /** Signal emitted when this component _or_ a child component commences a drag operation; captured from containers down to contained components, not consumed */
    @Async.unobservable_memoize_get
    public get DragStart() {
        return this["@createEventSignal"]("DragStart", DragEventSignal);
    }

    /** Signal emitted when a drag operation begins to hover over this component; captured from containers down to contained components, not consumable */
    @Async.unobservable_memoize_get
    public get DragEnter() {
        return this["@createEventSignal"]("DragEnter", DragEventSignal);
    }

    /** Signal emitted when a drag operation has left this component; captured from containers down to contained components, not consumable */
    @Async.unobservable_memoize_get
    public get DragLeave() {
        return this["@createEventSignal"]("DragLeave", DragEventSignal);
    }

    /** Signal emitted when this element or a child element is the target of a drop after a drag operation; captured from containers down to contained components, not consumed */
    @Async.unobservable_memoize_get
    public get DragDrop() {
        return this["@createEventSignal"]("DragDrop", DragEventSignal);
    }

    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // KEYPRESS EVENTS

    /** Helper function to create a key event signal */
    private _makeKeyEvent(key: number) {
        return this["@createEventSignal"]("FnKeyPressed", KeyEventSignal, key);
    }

    /** Signal emitted after the enter key is pressed (while focused); propagates from child components to parents, until a component consumes the event by connecting to this signal */
    @Async.unobservable_memoize_get
    public get EnterKeyPressed() { return this._makeKeyEvent(13) }

    /** Signal emitted after the space bar is pressed (while focused); propagates from child components to parents, until a component consumes the event by connecting to this signal */
    @Async.unobservable_memoize_get
    public get SpaceBarPressed() { return this._makeKeyEvent(32) }

    /** Signal emitted after the backspace key is pressed (while focused); propagates from child components to parents, until a component consumes the event by connecting to this signal */
    @Async.unobservable_memoize_get
    public get BackspaceKeyPressed() { return this._makeKeyEvent(8) }

    /** Signal emitted after the forward-delete key is pressed (while focused); propagates from child components to parents, until a component consumes the event by connecting to this signal */
    @Async.unobservable_memoize_get
    public get DeleteKeyPressed() { return this._makeKeyEvent(46) }

    /** Signal emitted after the escape key is pressed (while focused); propagates from child components to parents, until a component consumes the event by connecting to this signal */
    @Async.unobservable_memoize_get
    public get EscapeKeyPressed() { return this._makeKeyEvent(27) }

    /** Signal emitted after the left arrow/d-pad key is pressed (while focused); propagates from child components to parents, until a component consumes the event by connecting to this signal */
    @Async.unobservable_memoize_get
    public get ArrowLeftKeyPressed() { return this._makeKeyEvent(37) }

    /** Signal emitted after the up arrow/d-pad key is pressed (while focused); propagates from child components to parents, until a component consumes the event by connecting to this signal */
    @Async.unobservable_memoize_get
    public get ArrowUpKeyPressed() { return this._makeKeyEvent(38) }

    /** Signal emitted after the right arrow/d-pad key is pressed (while focused); propagates from child components to parents, until a component consumes the event by connecting to this signal */
    @Async.unobservable_memoize_get
    public get ArrowRightKeyPressed() { return this._makeKeyEvent(39) }

    /** Signal emitted after the down arrow/d-pad key is pressed (while focused); propagates from child components to parents, until a component consumes the event by connecting to this signal */
    @Async.unobservable_memoize_get
    public get ArrowDownKeyPressed() { return this._makeKeyEvent(40) }
}

export namespace Component {
    /** Specification of which animations to play during the lifetime of a component on screen (can be extended for sub component types) */
    export interface Animations {
        /** Played when component is displayed or added to a displayed parent component */
        appear?: Animation;
        /** Played when component is removed from the screen */
        disappear?: Animation;
        /** Played when component is shown (set `hidden` to false) */
        show?: Animation;
        /** Played when component is hidden (set `hidden` to true) */
        hide?: Animation;
        /** Played when component is selected (set `selected` to true) */
        select?: Animation;
        /** Played when component is deselected (set `selected` to false) */
        deselect?: Animation;
        [name: string]: Animation | undefined;
    }

    /** Options for automatic focus management */
    export enum FocusMode {
        /** Unable to focus this component */
        None,
        /** Click or touch to focus */
        Click,
        /** Click, touch, or use keyboard (tab key) to focus */
        Auto,
        /** Focus a child component on click, touch, or up/down arrow key press; child components with focus mode `None` are ignored */
        Items
    }

    /** Options for automatic selection management */
    export enum SelectionMode {
        /** Unable to select this component */
        None,
        /** Focus to select */
        Focus,
        /** Click or touch, or use space bar (while focused) to select */
        Click,
        /** Click or touch, or use space bar (while focused) to toggle selection */
        Toggle,
        /** Select _one_ child component on click or touch; set selection mode of child components to `Click` if undefined */
        ItemClick,
        /** Select _one_ child component on focus; set selection mode of child components to `Focus` if undefined; to be combined with focus mode `Items` for directional keyboard navigation */
        ItemFocus,
        /** Toggle selection on child components on click or touch, or space bar (while focused): set selection mode of child components to `Toggle` if undefined */
        ItemToggle
    }

    /** Initializer for .with({ ... }) */
    export interface Initializer {
        /** Identifier, used to add a component reference to the base component (on which .with(...) or .initializeWith(...) was called) as a property with given identifier */
        id?: string;
        /** Style initializer: object or `Style` instance */
        style?: UIValueOrAsync<Style | Style.StyleSet>;
        /** Property initializer: target height (CSS length) */
        height?: UIValueOrAsync<string>;
        /** Property initializer: target width (CSS length) */
        width?: UIValueOrAsync<string>;
        /** Property initializer: 0 (no shadow effect) - 1 (greatest effect) */
        shadowEffect?: UIValueOrAsync<number>;
        /** Shadow effect when hovered over: 0 (no shadow effect) - 1 (greatest effect) */
        shadowEffectOnHover?: number;
        /** Shadow effect when focused component or child: 0 (no shadow effect) - 1 (greatest effect) */
        shadowEffectOnFocus?: number;
        /** Property initializer: true if component should be hidden */
        hidden?: UIValueOrAsync<boolean>;
        /** Property initializer: true if component should be selected */
        selected?: UIValueOrAsync<boolean>;
        /** Property initializer: automatic selection management mode */
        selectionMode?: UIValueOrAsync<SelectionMode>;
        /** Property initializer: true if component should be focused for input */
        hasFocus?: UIValueOrAsync<boolean>;
        /** Property initializer: automatic focus management mode */
        focusMode?: UIValueOrAsync<FocusMode>;
        /** Animations list (not observable, will overwrite all existing ones) */
        animations?: Component.Animations;
        /** Options for rendering this component (not observable) */
        renderOptions?: ComponentRenderer.RenderOptions;
        /** Signal initializer: method name or handler */
        Rendered?: string | ComponentRenderHandler;
        /** Signal initializer: method name or handler */
        Click?: string | PointerHandler;
        /** Signal initializer: method name or handler */
        Clicked?: string | PointerHandler;
        /** Signal initializer: method name or handler */
        DoubleClick?: string | PointerHandler;
        /** Signal initializer: method name or handler */
        DoubleClicked?: string | PointerHandler;
        /** Signal initializer: method name or handler */
        Press?: string | PointerHandler;
        /** Signal initializer: method name or handler */
        Pressed?: string | PointerHandler;
        /** Signal initializer: method name or handler */
        MouseEnter?: string | PointerHandler;
        /** Signal initializer: method name or handler */
        MouseLeave?: string | PointerHandler;
        /** Signal initializer: method name or handler */
        MouseContextMenu?: string | PointerHandler;
        /** Signal initializer: method name or handler */
        KeyDown?: string | KeyHandler;
        /** Signal initializer: method name or handler */
        KeyPress?: string | KeyHandler;
        /** Signal initializer: method name or handler */
        Focus?: string | ActionHandler;
        /** Signal initializer: method name or handler */
        Blur?: string | ActionHandler;
        /** Signal initializer: method name or handler */
        FocusGained?: string | ActionHandler;
        /** Signal initializer: method name or handler */
        FocusLost?: string | ActionHandler;
        /** Signal initializer: method name or handler */
        DragStart?: string | DragHandler;
        /** Signal initializer: method name or handler */
        DragEnter?: string | DragHandler;
        /** Signal initializer: method name or handler */
        DragLeave?: string | DragHandler;
        /** Signal initializer: method name or handler */
        DragDrop?: string | DragHandler;
        /** Signal initializer: method name or handler */
        EnterKeyPressed?: string | KeyHandler;
        /** Signal initializer: method name or handler */
        SpaceBarPressed?: string | KeyHandler;
        /** Signal initializer: method name or handler */
        BackspaceKeyPressed?: string | KeyHandler;
        /** Signal initializer: method name or handler */
        DeleteKeyPressed?: string | KeyHandler;
        /** Signal initializer: method name or handler */
        EscapeKeyPressed?: string | KeyHandler;
        /** Signal initializer: method name or handler */
        ArrowLeftKeyPressed?: string | KeyHandler;
        /** Signal initializer: method name or handler */
        ArrowUpKeyPressed?: string | KeyHandler;
        /** Signal initializer: method name or handler */
        ArrowRightKeyPressed?: string | KeyHandler;
        /** Signal initializer: method name or handler */
        ArrowDownKeyPressed?: string | KeyHandler;
    }
}
