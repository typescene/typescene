# UI components
<!-- id: start/ui/components -->
<!-- sort: 01 -->

<!-- ## -->
<!-- type: intro -->
Learn how to use UI components -- the basic building blocks of your app's user interface.

## Component objects

At its core, Typescene is an object oriented UI toolkit. It provides you with all the parts you need to develop a user interface (UI) for your application, hiding most of the implementation details.

In other words, Typescene provides an _abstraction layer_ that neatly wraps up the presentation of common UI elements in component classes. It lets you create a button element using `new Button` and set its properties directly on a JavaScript object. Like so:

<!-- ## -->
<!-- type: example -->
<!-- displayResult: button -->
```typescript
var button = new UI.Button();
button.label = "Hello";
button.width = "15rem";
```

<!-- ## -cont'd -->
We call this `button` object an _instance_ of `UI.Button`, which is a _Component_ class. All UI component classes ultimately derive from `UI.Component`.

The `button` object wraps functionality around a `<button>` element in the browser -- or rather, an `HTMLButtonElement` in the browsers Document Object Model (DOM). You can get to this DOM element if you really need to, but usually the component itself provides more than enough control. At most, you'll want to tweak the appearance of your UI elements using basic CSS properties and classes, through the `style` and `style_*` (for controls) properties that exist on most component objects.

<!-- ## -->
<!-- type: example -->
<!-- displayResult: button -->
```typescript
var button = new UI.Button("Hello");
button.style_button.set({ background: "#e8a", border: "0" });
```

## Building a component hierarchy
Component classes can be grouped into three basic categories:

* **Control** components (such as buttons, text input fields, checkboxes, etc.)
* **Block** components, to group controls or other blocks together visually (e.g. horizontally in a row, or vertically in a list)
* **Container** components, to provide a space for block components on the page, or in a specific layout or modal arrangement.

These components allow you to create basic pages, dialogs and forms very intuitively.

### Combining UI components
<!-- type: task -->

The simplest way to use UI components, is to create objects with `new` and explicitly link them together in a hierarchy:

<!-- ## -->
<!-- type: example -->
<!-- displayResult: container -->
```typescript
var headingLabel = new UI.Heading4("Typescene is fun");
var headingRow = new UI.Row([headingLabel]);
var container = new UI.Container([headingRow]);

var textField = new UI.TextField();
textField.placeholderText = "Enter your name";
var button = new UI.Button("Say hello");
var row = new UI.Row([textField, button]);
container.content.push(row);

// event handling is intuitive, too:
button.Clicked.connect(() => {
    var name = textField.value || "there";
    App.showMessageBox(`Hello ${name}, nice to meet you!`);
});
```

### Rows
<!-- type: note -->

One of the components you'll use most frequently is the `UI.Row` component (or the derived `UI.CenterRow` and `UI.OppositeRow` components). A row contains one or more `UI.ControlElement` components, i.e. _controls_, which are placed in a single line, such as the text field and button above.

You can control the spacing around and between components both horizontally and vertically, and adjust the size and placement of all controls in a row -- but controls will always remain in a single line within the row itself.

Most interfaces can be easily broken up into containers (top/bottom/left/right regions) and rows, or perhaps lists of rows. Doing so is often the most important step in going from a design on paper to a prototype in code, and doing it consistently will help both your code structure and the usability of your application.

Read more about the `UI.Row` component on its reference page.
 
## Next step

While the example above is perfectly valid and easy to understand in terms of object oriented principles, you'll find that your code quickly gets difficult to manage when you use this pattern. If your code looks like a long string of variable assignments and constructor calls, it's difficult to keep track of the resulting visual hierarchy.

{icon::fa-play} To fix this, you can [use component factories](~/start/ui/factories).
