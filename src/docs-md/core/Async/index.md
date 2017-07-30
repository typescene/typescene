# Async
<!-- id: Async -->
<!-- typings: ../../../../dist/core/typings/Async -->

This sub module exports generic classes and functions that implement common 'async' patterns, such as promises, signals, and observables.

## Structure
The included functions and classes build on one another, in the following order:

* `defer` function --- provides a basic queueing mechanism to schedule code asynchronously.
* **Signals** --- defined using `Signal.create`, which creates a *class* that derives from `Signal`, of which instances can be emitted along with a single value. Signals can be used like events in other GUI toolkits.
* **Promises** --- the `Promise` class provides a <a href="http://promisesaplus.com/" target="_blank">Promises/A+</a> compliant promise implementation, along with some additional convenience methods.
* **Observable values** --- these are objects wrapped around a single value (in the `.value` property of an `ObservableValue` object), which can be subscribed to for capturing changes to this value. In addition, observables can be defined using a getter function, which may use other observable values in turn (making changes cascade asynchronously down a dependency tree when subscribed to; this can be employed to implement composite UIs efficiently).
* **Observable arrays** --- arrays of observable values, hiding the `ObservableValue` instances in getters and setters for all array indices of an `ObservableArray` object.
* **Observable objects** --- loosely defined objects for which some or all of the properties are made observable (using getters and setters) as properties of an `ObservableObject`, which also defines a `PropertyChange` signal to listen for changes without having to subscribe to observable values directly.
* **Injection** --- this mechanism can be used to inject default (observable) values into a property on _all instances_ of a class.
