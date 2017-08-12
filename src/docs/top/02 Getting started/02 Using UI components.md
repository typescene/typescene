# Using UI components
<!-- id: start/ui -->
<!-- sort: 01 -->
<!-- skipTOC: true -->

<!-- ## -->
<!-- type: intro -->
Learn how to create and combine UI components, and respond to user interactions through event handling and bindings.

## About UI components

At its core, Typescene is an object-oriented GUI toolkit for web applications. It provides a set of standard components that you can use to build your user interface (UI) such as buttons, text fields, and containers.

These components are made available as **classes** in the `UI` namespace -- such as `UI.Button` and `UI.Container`. You can extend these classes to build your own UI components, group components together, and respond to user input.

Typescene avoids the use of markup languages such as HTML or XAML, and instead provides the concept of component **factories** to define the structure of your pages, dialogs, and other components.

This means that you can use all components in different ways:

* `new UI.Button("OK")` creates a button component instance.
* `class MyButton extends UI.Button` defines a custom button class.
* `let ButtonFactory = UI.Button.with({ label: "OK" })` creates a button factory.
* `new ButtonFactory()` creates an instance using a button factory.

## Topics

[{icon::fa-file-text-o}UI components](~/start/ui/components)
: Learn how to use UI components -- the basic building blocks of your app's user interface.

[{icon::fa-file-text-o}Component factories](~/start/ui/factories)
: Streamline the creation of UI component structures with component factories.

[{icon::fa-file-text-o}Event handling](~/start/ui/events)
: Respond to user input by connecting to event signals.

[{icon::fa-file-text-o}Bindings](~/start/ui/bindings)
: Use value, array, and factory bindings to reflect your components' view state asynchronously.
