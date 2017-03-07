# Typescene UI Toolkit
Strongly typed UI toolkit, part of the [Typescene project](https://github.com/typescene/typescene/).

[Typescene UI Toolkit - API Reference](http://typescene.github.io/typescene-ui)

## Introduction

### Typescene :bulb: = Familiar OO + Flexible JS
* Object-oriented UI components, just like on the desktop.
* Convenient JavaScript-isms to keep things fast and DRY.
* TypeScript 2.0 for top-notch type checks and IDE autocomplete.
* CSS styling fully compatible with Bootstrap 3 / 4.
* A sensible opt-in multi-tier architecture.

### Philosophy
The Typescene UI toolkit was made to strike a delicate balance that so far no existing framework has struck, in our opinion:

* *The "view" or presentation layer should not determine how the rest of the application is structured*. Some applications need a completely different architecture than others at their core, even though they look alike from a user perspective. In other words, we don't need a "framework", but a progressive "**toolkit**".

* When writing an application, you need a set of solid components that you can use and recombine to form your UI. A window, an input field, a button, etc. *You shouldn't have to think about how these are drawn on screen*, nor about what HTML tags they represent, or how CSS is applied. Typescene provides a familiar set of **object-oriented UI components**.

* JavaScript is wonderful, and TypeScript is even more awesome. The compiler and editor can provide you with a ton of information about your code (or someone else's). That is, unless you have a `.js` file, an `.html` file, and a `.css` file for every component you create... With Typescene, just as with traditional desktop UI development, *code is everything, and everything is code*.

### Installation
This toolkit is hosted on GitHub and NPM. To use it in your project, type:

```
npm install --save typescene
```

Then use it as follows (e.g. with Webpack):

```typescript
import { Async, UI } from "typescene";
new UI.MessageDialog("Hi", "Hello, world!").display();
```

Configure Webpack to produce a `.js` file and include it in an otherwise blank HTML file, together with a `<link>` tag that loads a Bootstrap `.css` file (version 3 or 4). You can then start the application by opening your HTML file.

Alternatively, you can copy the `typescript.min.js` file from the `node_modules/typescene` folder to your own project, and use the `Async` and `UI` objects on `window` (or `window.typescene` if you prefer using a separate namespace).

### Project Status
While still very new, this toolkit provides a solid foundation for anyone writing a browser-based front end application (not a website, not a blog... but a real application that resembles a desktop UI more than an HTML page).

What is mostly lacking at this stage, is a solid framework of unit tests. Therefore, the top priority for this project is not expanding the toolkit but writing tests and fixing bugs, if any. Any help is greatly appreciated!

### Documentation
Rudimentary documentation for this project is available [here](http://typescene.github.io/typescene-ui). A single page with definitions and descriptions for all classes and methods is generated automatically from source code comments, combined with further documentation in Markdown format (in the `src/doc` folder). It is mostly lacking clear examples for now.

Reference documentation for the Typescene Async library, which provides all of the code for signals, promises, and observables, can be found here: [Typescene Async Library - API Reference](http://typescene.github.io/typescene-async).

### Prerequisites
This library assumes the use of [TypeScript](http://www.typescriptlang.org/) (although technically not required), compiled to a minimum target of "ES5" to make property decorators work.

For the best development experience use an editor that fully supports TypeScript, such as [Visual Studio Code](http://code.visualstudio.com).

## Overview
The exported classes and methods that make up the object-oriented UI toolkit can be roughly categorized as follows:

* **Control-level components.** These include e.g. `Button`, `Checkbox`, `Image`, `Label`, `TextField` (both single and multiple line), and `Stack` (to display control-level components vertically); as well as `BlockControl` (to wrap a block-level component) and `ContainerControl` (to wrap a container-level component).
* **Block-level components.** These include e.g. `Row` (to display control-level components horizontally), `Divider`, `Table` and `List`; as well as `ContainerBlock` (to wrap a container-level component).
* **Container-level components.** These include e.g. `Container` (to display block-level components vertically just like HTML does), `LayoutContainer` (with header, footer, and sidebars on left and right hand sides), `DialogContainer` and `DrawerContainer`.
* **Combined components** ready for use with a single line of code, e.g. `MessageDialog`, `ConfirmationDialog`, `Menu`, and `Notification`.
* **Component factory** construct, used through component *initializers* to quickly express a template for a part of the UI in a simple data structure. Also includes `TextLabelFactory` to initialize labels and icons, and a `bind` function to initialize bindings to view properties.
* **Events** and signals, to wrap all DOM events and more.
* **Animation** toolkit, optionally applies effects to show/hide transitions and special effects.
* **Activity** tier, which optionally manages application state and binds (partial) views to activities, activities to routes, and routes to the application. The `Application` object can be used to push and pop activities on and off of the activity stack.

Because of the progressive nature of the Typescene UI toolkit, you can start out using only the tiers you need, and add more as your application scales up. Start with simple components that you control manually, and then move to higher level concepts such as Activities, or the Animation toolkit.

> **Application** > **Activities** > **Views** > **Components** > Sub components > (Managed DOM)

No matter what, the UI toolkit doesn't tell you how to structure the rest of your application, specifically the transport and model layers. For small apps, just use a single class that references your model objects. For larger applications, you may want to include other libraries that manage these layers for you, or implement your own architecture based on e.g. Socket.IO to communicate with your server.

## Design and Layout
**Bootstrap** &mdash; The component rendering code creates and manages DOM elements that are styled using Bootstrap CSS classes, so a CSS file compatible with Bootstrap (version 3 or 4, or your custom version) always needs to be loaded on the HTML page.

**Table row layout** &mdash; As for laying out components themselves, Typescene heavily borrows from the HTML table layout engine. No, not in the way things were done in the 1990s, but tables still have interesting properties which make them work very well for UI layouts: they have special rules concerning margins and padding, which is very useful to *contain elements* that would otherwise interact with each other in unpredictable ways.

Secondly, it lets us define horizontal layout in terms of *filling up the available row space*, without hardcoding *all* of the required widths. Very useful when "shrinkwrapped" components (as small as possible) are mixed with e.g. text input elements that need to be expanded (to fill up horizontal space). Combined with a "spacer" element that takes up space but does not contain any elements (a blank table cell), this lets you define most common layouts very quickly without any explicit measurements.

Examples of row layouts:
* For a simple text field with a button to its right, you can use a row containing a `[ TextField, Button ]`, since textfields always auto-expand (shrinkwrap = false, by default), while buttons do not (shrinkwrap = true).
* For a row with one button on the left and one on the right, use `[ Button, Spacer, Button ]` components.
* For a row with one button in the middle, use `[ Spacer, Button, Spacer ]`. For two buttons, just add the button between the spacers, like `[ Spacer, Button, Button, Spacer ]`.
* For a two-column layout, use a row with two Stack components or two ContainerControl components (which can all have nested rows).

Components in a row are always vertically aligned to the middle of all other components, unless configured otherwise.

**Block layout** &mdash; Outside of rows, the normal rules of HTML layout apply. Blocks (such as Rows) stack on top of each other, and may or may not have an explicit height defined. `Table` and `List` components make it easy to create uniform grid and list layouts. `List` also provides logic for selecting list elements by clicking on them or using the arrow keys.

**Containers** &mdash; To wrap everything up, containers contain lists of blocks. These are usually displayed full-screen, or within other components, but e.g. `DialogContainer` and `DrawerContainer` can be used to display dialog and drawer (modal) overlays. The `LayoutContainer` component can be used to quickly define layouts in "NSEW" style, with 4 possible sub container slots surrounding its main content region.

### Object Orientation
Inspired by desktop UI toolkits since the dawn of time, the Typescene UI toolkit defines components as a hierarchy of classes. E.g. a `TextField` derives from `InputControl`, which derives from `ControlElement`, which derives from `Component`. This makes it easy to define structured layouts, e.g. the `Row` component has a `content` property with an array of `ControlElement` objects. The `Container` component's `content` property is an array of `Block` objects, which `Row` instances also derive from.

So you could implement your UI as follows:

```typescript
// do not do this.
var myTextField = new UI.TextField("text");
myTextField.placeholderText = "Your name";
var myRow = new UI.Row();
myRow.content.push(myTextField);
var myContainer = new UI.DialogContainer();
myContainer.content.push(myRow);
myContainer.display();
```

However, this quickly becomes tedious, and you may easily lose track of the overall component hierarchy. Enter initializers...

### Initializers
While all components fit into an object oriented architecture, we don't want to initialize them by `new`-ing every instance manually, and stringing them together by `push`-ing them into one another's content arrays.

Hence, Typescene includes a *component factory* concept. A component factory is basically a class that is created from a base class, along with a template data structure. There are multiple ways to do this, but a simple example looks like this:

```typescript
// create a factory
var MyFactory = UI.Container.with({
    maxContentWidth: "24rem",
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
        });
    ]
});

// instantiate using new
var myContainer = new MyFactory();
myContainer.display();
```

Note that most editors supporting TypeScript will provide you with syntax highlighting and autocomplete even within the initializer expression, e.g. for available properties on the object passed to `.with` for various component classes.

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

Notice the `@Async.observable` there...?

### Asynchronous Programming
The Typescene toolkit enforces developers to be explicit about most things. There is no "magic" happening in the background, nothing that is not explicitly expressed in the code. Except for one thing: Typescene components make heavy use of *observable values*.

This means that, for example, setting `.width` on a dialog component will have an effect on the appearance of the dialog without having to call an `update` or `render` function. In fact, the `render` function is there, but it is used to generate "observable" output &mdash; observed by the global `Screen` class while the component is displayed. The output then depends on a number of other observable properties (marked with the Async library's observable decorator). Once one or more of those properties change while observed by `Screen`, the `render` function is called again *asynchronously* (but not necessarily the render functions of nested components, if those didn't also change) to update the DOM.

You can also use asynchronous constructs in your UI code directly. The easiest method to achieve this is with bindings (one or two-way) in an initializer, which watch and/or update a property on the main view component, i.e. the one that the initializer was applied to.

Alternatively, you can use the Async library yourself to generate and consume observable values. For example:

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

Or, expressed as a proper class:

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

For more information on how the Typescene Async library works, see [`typescene-async`](https://github.com/typescene/typescene-async) on GitHub.

Much more is possible when combining initializers and asynchronous constructs. For example, an initializer could contain an observable value (result of `Async.observe`) instead of any component factory. The observable value can then take any value at runtime: a component instance (e.g. depending on the value of some other property), a component class, or *another component initializer*, with more observables and factories.

Stay tuned!
