# Bindings
<!-- id: start/ui/bindings -->
<!-- sort: 04 -->
<!-- skipTOC: true -->

<!-- ## -->
<!-- type: intro -->
Use value, array, and factory bindings to reflect your components' view state asynchronously.

## About bindings
"One-way" bindings can be used for keeping your user interface up to date, as the data inside your (view) model changes. The updated data is read automatically, passed through one or more transformation functions, and displayed asynchronously by one of your UI components.

"Two-way" bindings work the other way around as well: they update your model data from values captured by UI components, e.g. text field input values.

When you provide bindings as part of the structure provided to the static `.with` functions, they are automatically connected and activated.

## Topics

[{icon::fa-file-text-o}Property bindings](~/start/ui/bindings/properties)
: Bind single values between components using the `bind` and `bind2` functions.

[{icon::fa-file-text-o}Array bindings](~/start/ui/bindings/arrays)
: Bind lists of values to asynchronous component arrays using the `bindComponents` function.

[{icon::fa-file-text-o}Factory bindings](~/start/ui/bindings/factories)
: Understand the recursive nature of component factories, and learn how to bind factories within component factories.
