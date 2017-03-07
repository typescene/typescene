# Overview
<!-- docTitle: Typescene UI module -->
<!-- id: overview -->
<!-- sort: 01 -->

The UI module is mostly made up of Component classes, each of which represents a different type of on-screen component. These components can be put together in your application to lay out pages (or modal dialogs, drawers, etc.) to display your application state and invite interaction.


## What is Typescene?
<!-- type: note -->

This module is part of the Typescene toolkit, a strongly typed front-end toolkit for modern Web applications built with TypeScript. Read more about Typescene on the project's [website](http://typescene.org).


## Component Structure

Component classes all derive from the root `Component` class, which in itself already includes a lot of the overall functionality provided by all components--- but the `Component` class itself is an _abstract_ class, meaning that it cannot be constructed as-is.

Instead, a hierarchy of different kinds of components is exported by this module. These can either be used directly, or subclassed by your application.

* **Control-level components.** These include e.g. `Button`, `Checkbox`, `Image`, `Label`, `TextField` (both single and multiple line), and `Stack` (to display control-level components vertically); as well as `BlockControl` (to wrap a block-level component) and `ContainerControl` (to wrap a container-level component).
* **Block-level components.** These include e.g. `Row` (to display control-level components horizontally), `Divider`, `Table` and `List`; as well as `ContainerBlock` (to wrap a container-level component).
* **Container-level components.** These include e.g. `Container` (to display block-level components vertically just like HTML does), `LayoutContainer` (with header, footer, and sidebars on left and right hand sides), `DialogContainer` and `DrawerContainer`.
* **Combined components** ready for use with a single line of code, e.g. `MessageDialog`, `ConfirmationDialog`, `Menu`, and `Notification`.
* **Component factory** construct, used through component *initializers* to quickly express a template for a part of the UI in a simple data structure. Also includes `TextLabelFactory` to initialize labels and icons, and a `bind` function to initialize bindings to view properties.
* **Events** and signals, to wrap all DOM events and more.
* **Animation** toolkit, optionally applies effects to show/hide transitions and special effects.


# Getting started: UI module
<!-- id: overview/getting-started -->
<!-- topic: Getting Started -->
<!-- sort: 01 -->

## Design and Layout
**Bootstrap** --- The component rendering code creates and manages DOM elements that are styled using Bootstrap CSS classes, so a CSS file compatible with Bootstrap (version 3 or 4, or your custom version) should always be loaded on the HTML page first.

**Table row layout, or flexbox (soon)** --- For laying out components, Typescene primarily uses the HTML 'table' engine. Not in the way things were done in the 1990s, but in a much cleaner way. Tables still have interesting properties which make them work very well for UI layouts: they have special rules concerning margins and padding, which is very useful to *contain elements* that would otherwise interact with each other in unpredictable ways.

Secondly, it lets us define horizontal layout in terms of *filling up the available row space*, without hardcoding *all* of the required widths. Very useful when 'shrinkwrapped' components (as small as possible) are mixed with e.g. text input elements that need to be expanded (to fill up horizontal space). Combined with a 'spacer' element that takes up space but does not contain any elements (a blank table cell), this lets you define most common layouts very quickly without any explicit measurements.

The CSS 'flexbox' engine can also be used in the same way, but is not available on all supported browsers. Since the actual DOM rendering engine is separate from the Component classes themselves, a flexbox option can be developed independently (but is not ready yet).

Examples of row layouts:

* For a simple text field with a button to its right, you can use a row containing a `[ TextField, Button ]`, since textfields always auto-expand (shrinkwrap = false, by default), while buttons do not (shrinkwrap = true).
* For a row with one button on the left and one on the right, use `[ Button, Spacer, Button ]` components.
* For a row with one button in the middle, use `[ Spacer, Button, Spacer ]`. For two buttons, just add the button between the spacers, like `[ Spacer, Button, Button, Spacer ]`.
* For a two-column layout, use a row with two ControlStack components or two ContainerControl components (which can all have nested rows).

Components in a row are always vertically aligned to the middle of all other components, unless configured otherwise.

**Block layout** --- Outside of rows, the normal rules of HTML layout apply. Blocks (such as Rows themselves) stack on top of each other, and may or may not have an explicit height defined. `Table`, `List`, and `TreeList` components make it easy to create uniform grid and list layouts. They also provide logic for selecting list elements by clicking on them or using the arrow keys.

**Containers** --- To wrap everything up, containers contain lists of blocks. These are usually displayed full-screen, or within other components. There are also `DialogContainer` and `DrawerContainer` classes that can be used to display dialog and drawer (modal) overlays. The `LayoutContainer` component can be used to quickly define layouts in "NSEW" style, with 4 possible sub container slots surrounding its main content region.


### Object Orientation

Inspired by desktop UI toolkits, the Typescene UI module defines components through a hierarchy of classes. For example, a `TextField` derives properties and methods from `InputControl`, which derives from `ControlElement`, which derives from `Component`. This makes it easy to define structured layouts, e.g. the `Row` component has a `content` property with an array of `ControlElement` objects. The `Container` component's `content` property is an array of `Block` objects (such as `Row` instances).

With this object oriented structure you _could_ implement your UI as follows, in the style of Java Spring UI components:

## Primitive Example: Not Recommended
<!-- type: example -->
<!-- displayResult: myButton -->
```typescript
var myTextField = new UI.TextField("text");
myTextField.placeholderText = "Your name";
myTextField.hasFocus = true;
var myRow = new UI.Row();
myRow.content.push(myTextField);
var myContainer = new UI.DialogContainer();
myContainer.content.push(myRow);
let hide = () => { myContainer.close() };
var hideButton = new UI.Button("Hide");
hideButton.Clicked.connect(hide);
myContainer.content.push(new UI.Row([hideButton]));
let show = () => { myContainer.display() };
var myButton = new UI.Button("Click me");
myButton.Clicked.connect(show);
```

##
However, this quickly becomes tedious, and you may easily lose track of the overall component hierarchy. Just look at the long list of 'var' statements above, the resulting structure is not obvious from this code at all. Enter initializers...

### Initializers
While all components fit into an object oriented architecture, we don't want to initialize them by `new`-ing every instance manually, and stringing them together by `push`-ing them into one another's content arrays.

Hence, Typescene includes a *component factory* concept. A component factory is basically a derived class, created from a base class, along with a template data structure. There are several ways to create a factory, but a simple example looks like this:

## Example: component factories
<!-- type: example -->
<!-- displayResult: myButton -->
```typescript
// create a factory
var MyFactory = UI.Container.with({
    maxContentWidth: "24rem",
    vertAlign: "middle",
    content: [
        // a row with a full-width label, with centered text:
        [ UI.tl("{center}Hello, world!") ],

        // a 4rem-tall row with a text field and a button:
        UI.Row.with({
            height: "4rem",
            content: [
                UI.TextField.withName("text"),
                UI.PrimaryButton.withLabel("Button")
            ]
        }),

        // a big button, automatically wrapped in a row
        UI.Button.with({
            label: "Go back",
            icon: "fa-arrow-left fa-fw",
            shrinkwrap: false,
            Clicked: new UI.ActionHandler(() => {
                UI.Screen.remove(myContainer);
            })
        })
    ],
    style: { background: "#fff" }
});

// instantiate using new
var myContainer = new MyFactory();
var myButton = UI.Button.withLabel("Click me", new UI.ActionHandler(() => {
    myContainer.display();
});
```

##
Note that most editors supporting TypeScript (including the embedded editor on this page) will provide you with syntax highlighting and autocomplete even within the initializer expression, e.g. for available properties on the object passed to `.with` for various component classes.

(Note: for properties within an object passed to `.with`, press the ctrl+space keys _before_ starting to type the property name, then type a few letters and select the property using tab or enter).

You can also apply initializers to existing instances:

```typescript
// create an instance first, then initialize
var myDialog = new UI.DialogContainer();
myDialog.initializeWith({
    width: "24rem",
    content: [
        // a single full-width text field (leave out the array brackets
        // to upgrade to a single Row automatically)
        UI.TextField.withName("text"),

        // a row with a right-aligned button
        [
            UI.Spacer,
            UI.Button.withLabel("OK", new UI.MouseHandler(() => {
                alert(myDialog.getFormValues().text);
                myDialog.close();
            }))
        ]
    ]
});
```

And finally, you can use the `@initializer` decorator on a static property to set the default initializer structure for a component (view) class:

```typescript
// custom dialog container class
class MyDialog extends UI.DialogContainer {
    @UI.initializer
    static initializer = UI.DialogContainer.with({
        content: [
            // a single label bound to the .message property
            UI.WideLabel.withText(UI.bind("message")),

            // a single left-aligned button
            UI.Button.with({
                hasFocus: true,
                label: "OK",
                Press: "okPressed"
            })
        ]
    });

    @Async.observable
    public message: string;

    public okPressed() {
        /* ... do something ... */
        this.close();
    }
}

// instantiate using new
var myDialog = new MyDialog();
myDialog.message = "Hello, world!";
myDialog.display();
```

Notice the `@Async.observable` there? More on that below.

### Asynchronous Programming
The Typescene toolkit enforces developers to be explicit about most things. There is no "magic" happening in the background, nothing that is not explicitly expressed in the code. Except in the case of *observable values* (or observable properties), which most properties on Component instances are.

This means that, for example, setting `.width` on a dialog component will have an effect on the appearance of the dialog without having to call an `update` or `render` function. In fact, the `render` function is there, but it is used to generate "observable" output --- observed by parent components and finally the `Page` class while the component is displayed. The output then depends on a number of other observable properties (marked with the Async library's observable decorator). Once one or more of those properties change while observed by a visible `Page`, the `render` function is called again *asynchronously* (but not necessarily the render functions of nested components, if those didn't also change) to update the DOM.

You can also use asynchronous constructs in your UI code directly. The easiest method to achieve this is with bindings (one or two-way) in an initializer, which watch and/or update a property on the main view component, i.e. the one that the initializer was applied to.

Alternatively, you can use the Async library yourself to generate and consume observable values. For more information on asynchronous constructs, see the [Async module documentation](../Async). As an example:

```typescript
// create a dialog instance
var myDialog = new UI.DialogContainer();

// create an observable value that combines field values
var fullNameObservable = Async.observe(() => {
    var fields = myDialog.getComponentsByType(UI.TextField);
    var values = fields.map(f => f.value);
    var name = values.filter(v => !!v).join(" ");
    return name;
});

// initialize the dialog, using the observable value
myDialog.initializeWithContent([
    [
        // two text fields
        UI.TextField.withName("first", "", "First name"),
        UI.TextField.withName("last", "", "Last name"),
    ],
    [
        // combined name label, and OK button
        UI.WideLabel.withText(fullNameObservable),
        UI.Button.withLabel("OK", "close")
    ]
]);
myDialog.display();
```

Or, expressed as a proper class that uses a one-way binding:

```typescript
// custom dialog class using an observable property
class MyDialog extends UI.DialogContainer {
    @UI.initializer
    static initializer = UI.DialogContainer.withContent([
        [
            UI.TextField.withName("first", "", "First name"),
            UI.TextField.withName("last", "", "Last name"),
        ],
        [
            UI.WideLabel.withText(UI.bind("fullName")),
            UI.Button.withLabel("OK", "close")
        ]
    ]);

    @Async.observable
    public get fullName() {
        return this.getComponentsByType(UI.TextField)
            .map(f => f.value).filter(v => !!v).join(" ");
    }
}
```

And finally using a two-way binding:

## Two-way binding example
<!-- type: example -->
<!-- displayResult: myButton -->

```typescript
// custom dialog class using an observable property
class MyDialog extends UI.DialogContainer {
    @UI.initializer
    static initializer = UI.DialogContainer.withContent([
        UI.Heading3.withText("Bind this:"),
        [
            UI.TextField.with({
                name: "name",
                placeholderText: "Full name",
                value: UI.bind2("fullName"),
                immediateValueUpdate: true,
                hasFocus: true
            }),
        ],
        [
            UI.WideLabel.withText(UI.bind("fullName")),
            UI.Button.withLabel("OK", "close")
        ]
    ]);

    @Async.observable
    public fullName: string;
}

var myButton = new UI.Button("Click");
myButton.Clicked.connect(() => new MyDialog().display());
```

## Asynchronous functional style

Much more is possible when combining initializers and asynchronous constructs. For example, an initializer could contain an observable value (result of `Async.observe`) instead of any component factory. The observable value can then take any value at runtime: a component instance (e.g. depending on the value of some other property), a component class, or *another component initializer*, with more observables and factories.

This enables a more functional style of programming, where changes in state (or initial values) 'bubble up' through a hierarchy of asynchronous transformation functions encapsulated in observable values. The final step would be the component factory initializer transformation, to create a Component instance and render it as part of its parent.

With this functional style, an application's UI code base could be greatly simplified. However in some cases this also makes the flow of data harder to understand--- which is why Typescene always provides the option to update your UI using a more 'imperative' style. Signals and Promises can simply trigger callback functions, which can in turn update the content of containers and rows to include updated data. Which style you choose for your application is up to you.
