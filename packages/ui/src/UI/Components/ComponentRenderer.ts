import * as Async from "@typescene/async";
import { Component } from "./Component";
import { ComponentSignal, defineComponentSignal, ComponentSignalHandler } from "./ComponentSignal";

/** Class that contains the code necessary to render a component; to retrieve rendering output, Component methods only use the `.output` property, which is an ObservableValue instance that is populated using the (protected) `.render` method */
export abstract class ComponentRenderer<ComponentT extends Component, ElementT> {
    /** Create a new renderer instance for given component */
    constructor(component: ComponentT) {
        this.component = component;

        // define the Rendered signal with a back reference to this instance
        this.Rendered = defineComponentSignal(
            ComponentRenderSignal, component,
            { renderer: this });

        // create observable value with a getter for rendered output
        this.output = new Async.ObservableValue<any>(() => {
            var result = this.output.value = this.render();

            // add dependencies for all watchers
            if (this._watches) this._watches.forEach(f => f.value);

            // emit own signal, directly or asynchronously based on promise
            if (result !== undefined) {
                if (result.updated)
                    result.updated.then(() => { this.Rendered(result) });
                else
                    this.Rendered(result);
            }
        });
    }

    /** The component that this renderer renders */
    public readonly component: ComponentT;

    /** An observable value containing the rendered output, if any; used by the Component rendering methods to retrieve output; this property should *not* be overridden, override the protected `.render` method instead and/or use the `.watch` method to add partial rendering code */
    public readonly output: Async.ObservableValue<ComponentRenderer.Output<ComponentT, ElementT> | undefined>;

    /** Signal that is emitted after updating `.output` (but not if undefined) and/or when the `updated` promise on the rendered output is resolved */
    public readonly Rendered: ComponentSignal.Emittable<ComponentRenderer.Output<ComponentT, ElementT>, typeof ComponentRenderSignal>;

    /** Component renderer function; to be overridden, *must* be a pure function, based on the current `.component` and `.output` properties (otherwise *creating* or *setting* ObservableValue instances should be done within a function that is passed to `unobserved`) */
    protected render() { return this.output.value }

    /** Add a method that will be called (synchronously and asynchronously) from a new observable context, after previously added methods, immediately *after* the `.render` method has run once, along with an optional method that will be called (synchronously, unobserved) with the result of the first method; i.e. observable values used in the first method will be subscribed to while the output is subscribed to, but changes to these values will never trigger re-rendering the entire component -- instead, the second function is invoked; useful for partially updating existing output using a subset of component properties; should be called _before_ rendering takes place */
    public watch<T>(getter: (this: this) => T,
        map?: (this: this, value: T) => void) {
        if (!this._watches) this._watches = [];
        this._watches.push(map ?
            Async.observe(() => {
                // call getter (observed) and forward result (unobserved)
                Async.unobserved(map.bind(this,
                    getter.call(this)));
            }) :
            Async.observe(() => {
                // just call getter (observed), don't care about result
                getter.call(this);
            }));
    }

    /** @internal */
    private _watches: Async.ObservableValue<void>[];
}

export namespace ComponentRenderer {
    /** Encapsulates output for a rendered component; class type parameters indicate the type of component rendered, and the output type (e.g. HTMLElement) */
    export class Output<ComponentT extends Component, ElementT> {
        /** Create a new instance for given component, with given element (should not be undefined) */
        constructor(component: ComponentT, element: ElementT, context?: any) {
            this.component = component;
            this.element = element;
            this["@context"] = context;
        }

        /** The component that the output is generated for */
        public readonly component: ComponentT;

        /** Reference to the actual output (e.g. DOM element) */
        public readonly element: ElementT;

        /** Reference to an element that wraps around the output element, that should be included by the parent element instead (or undefined) */
        public wrapper?: ElementT;

        /** Reference to a (sub) element that should be used to register event handlers, if different from main element (otherwise undefined) */
        public liveElement?: ElementT;

        /** If defined, a promise that resolves the next time the content of the rendered output element is generated (drawn on screen _if_ the parent output element is also already on screen) */
        public updated?: PromiseLike<any>;

        /** Flag that can be used for duck typing */
        public isComponentOutput: true = true;

        /** @internal Platform update context */
        public ["@context"]: any;

        /** @internal Last page directly displayed on; managed by Screen */
        public ["@Screen.page"]: any;
    }

    /** Options for rendering (child) components */
    export interface RenderOptions {
        /** Set to true to force synchronous rendering for this component */
        synchronous?: boolean;

        /** Set to a value in milliseconds to animate _child component_ positioning for the given duration, if possible; only works with lists and tables, and may require synchronous rendering of child components (i.e. set `.synchronous` on list items) */
        animateListItems?: number;
    }
}

/** Signal that is emitted when a component updates its rendered output */
export class ComponentRenderSignal<ComponentT extends Component, ElementT>
    extends ComponentSignal<ComponentRenderer.Output<ComponentT, ElementT>> {
    public static renderer: ComponentRenderer<Component, any>;
}

/** Constructor for a component render event handler */
export class ComponentRenderHandler
    extends ComponentSignalHandler<ComponentRenderer.Output<Component, any>, typeof ComponentRenderSignal> { }

/** _Class decorator_, maps the decorated `ComponentRenderer` class to a `Component` class as its primary renderer; the renderer class constructor must have a single argument, being the component to be rendered; overrides previously mapped renderer entirely, to extend super class renderer functionality inject a class that extends the previous renderer class [decorator] */
export function mapComponentRenderer<ComponentT extends Component>(
    componentClass: typeof Component & { new (...args: any[]): ComponentT }) {
    return (target: typeof ComponentRenderer & { new (component: ComponentT): ComponentRenderer<ComponentT, any> }) => {
        Async.inject(componentClass, { Renderer: target });
    };
}
