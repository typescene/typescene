# Async.observable
<!-- seeAlso: Async.unobservable -->
**Note:** properties that are decorated with `@observable` will _not_ be enumerable on the instance object, because getters and setters are defined on the prototype object. If you need properties to be enumerable, call `makePropertyObservable(...)` from the constructor instead.

**Note:** values assigned to properties decorated with `@observable` will be treated specially, if they are arrays or objects created with an object literal:

1. Arrays are replaced with instances of `ObservableArray`; by nature of this class, the array elements are _also_ treated recursively;
2. Objects that derive directly from `Object` are replaced with instances of `ObservableObject` through `makeObjectObservable(...)`. By nature of this function, all enumerable properties of the original object will _also_ be treated recursively.

This recursive behavior makes it easy to implement observable state objects where all properties of the state are observable, but it may lead to performance issues with large data structures. If you only need to observe the object reference itself, use `observable_shallow`.

## Example
<!-- type: example -->
```typescript
/** An example class with an observable property */
class MyWrapper {
    @Async.observable
    value = 0;

    // this method uses the observable value
    hasValue() {
        console.log("Checking... ", this.value);
        return this.value > 0
    }
}

// now, subscribe to changes
var wrapper = new MyWrapper();
var observable = Async.observe(() => wrapper.hasValue());
observable.subscribe(yesno => {
    if (yesno) console.log("Value is set");
    else console.log("No value set");
});

// A bit later, make some changes...
Async.sleep(500)
    .then(() => { wrapper.value = 2 })
    .then(() => Async.sleep(500))
    .then(() => { wrapper.value = 3 })
    .then(() => Async.sleep(500))
    .then(() => { wrapper.value = 0 });
```


# Async.observable_shallow
<!-- seeAlso: Async.observable, Async.ObservableValue/shallow -->
Use this decorator for properties that may contain larger data structures, where you only want to observe the property itself and not any of the structure's properties.


# Async.observable_freeze
<!-- seeAlso: Async.observable -->
# Async.observable_not_null
<!-- seeAlso: Async.observable -->
# Async.observable_number
<!-- seeAlso: Async.observable -->
# Async.observable_string
<!-- seeAlso: Async.observable -->
# Async.observable_seal
<!-- seeAlso: Async.observable -->


# Async.unobservable
<!-- seeAlso: Async.observable -->
**Note:** properties that are decorated with `@unobservable` will _not_ be enumerable on the instance object, because the getter wrapper is defined on the prototype object.


# Async.unobservable_memoize_get
<!-- seeAlso: Async.observable, Async.unobservable -->
**Note:** properties that are decorated with `@unobservable_memoize_get` will _not_ be enumerable on the instance object **until they are evaluated once**, because the getter wrapper is defined on the prototype object.

Only when the getter has run once for a given instance, that instance will receive a read-only property that masks the prototype getter.


# Async.unobserved
## Usage
This function is particularly useful if an observable value getter executes methods or constructors that are not in the scope of the current module, and may or may not create/evaluate further observable values. Since an observable value getter cannot have any side effects, you will need to wrap the code in a call to `unobserved`.

E.g. if you are caching an instance of another module's class on first access of an observable value, you need to use `unobserved`. See the example below:

```typescript
// this is defined elsewhere: ...
class Label {
    constructor(text: string) { /* ... side effects? ... */ }
    setText(text: string) { /* ... */ }
}

// cache a Label instance for an observable value
var text = Async.ObservableValue.fromValue("Hello, world!");
var _label: Label;
var label = Async.observe(() => {
    var t = text;
    if (!t) {
        // forget the cached Label instance, if any
        _label = undefined;
    }
    else if (!_label) {
        // create a Label, unobserved
        _label = Async.unobserved(() => new Label(t));
    }
    else {
        // use the existing instance
        Async.unobserved(() => _label.setText(t));
    }
    return _label;
});
```

However, usually such constructs are better expressed using the [`.map`](~/Async.ObservableValue/map) method, since the callback given to this method is always run within `unobserved` while still depending on the input observable:

```typescript
var _label: Label;
var label = Async.observe(() => text)  // or just "text".
    .map(t => {
        if (!t) _label = undefined;
        else if (!_label) _label = new Label(t);
        else _label.setText(t);
        return _label;
    });
```


# Async.observe
<!-- seeAlso: Async.unobserved, Async.observable, Async.unobservable -->


# Async.observeArray
## Example
```typescript
// define a class with a property that *may* be a list of strings
class Foo {
    @Async.observable
    public bar?: string[];
}
var myFoo = new Foo();

// this becomes an empty array if the `bar` property was undefined:
var myObservableArray = Async.observeArray(() => myFoo.bar);

// so this is always a valid list of uppercase strings:
var myMap = myObservableArray.mapObservable(v => v.toUpperCase());
```
