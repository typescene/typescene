# Samples
<!-- id: samples -->
<!-- sort: 02 -->

## About the Examples
All examples are included here as if they are taken from the body of a sample application, which would import the Typescene async library as follows:

```typescript
import { Async } from "@typescene/typescene";
```

As a result, all exported members are prefixed with `Async.` in the examples.

# Defer
<!-- id: samples/defer -->
<!-- sort: 01 -->

The `defer` function provides a basic queueing mechanism for single-threaded asynchronous behavior.

Scheduling deferred execution of a piece of code:

## Example
<!-- type: example -->
```typescript
// outputs first line after second line
Async.defer(() => { console.log("Hello, future.") });
console.log("Wait for it...");
```

# Signals
<!-- id: samples/signals -->
<!-- sort: 02 -->

Signals are like event emitters, but they limit their events to a very specific type.

Creating a signal and subscribing to it:

```typescript
// define a signal with a payload of type `string`
var MySignal = Async.defineSignal<string>();

// connect to this signal
MySignal.connect(text => {
    // text is inferred to be of type `string` here
    console.log("Received: " + text);
    return text.toUpperCase();
});

// can connect more than once
MySignal.connect(text => text.toLowerCase());

// invoke all connected handlers:
MySignal("foo");

// => Received: foo

// advanced, capture return values with a Promise:
var sig = new MySignal("Text");
sig.emit().then(results => {
    console.log("Response: " + results.join(", "));
});

// => Received: Text
// => Response: TEXT, text
```

Using a custom signal base class:

```typescript
// define a static signal class
class FooSignal extends Async.Signal<string> {
    static foo: string;
}

// define signals that derive from FooSignal
var MySignal1 = Async.defineSignal(FooSignal, { foo: "bar" });
var MySignal2 = Async.defineSignal(FooSignal, { foo: "baz" });

console.log(new MySignal1("foo") instanceof FooSignal);
// => true

// connections can now access foo, too
function connectTo(s: Async.CustomSignalClass<string, typeof FooSignal>) {
    s.connect((value, src) => {
        // value is inferred to be of type `string` here
        console.log("Received: " + value);
        // src is inferred to be of type `typeof FooSignal` here
        console.log("  foo === " + src.foo);
    });
}
connectTo(MySignal1);
connectTo(MySignal2);
MySignal1("qux");
MySignal2("quux");

// output:
// Received: qux
//   foo === bar
// Received: quux
//   foo === baz
```

# Promises
<!-- id: samples/promises -->
<!-- sort: 03 -->

A `Promise` is a placeholder for a value that will be evaluated in the future (or for another Promise, and so on), which can be 'rejected' if the value can no longer be evaluated.

Creating a promise and waiting for it to be resolved:

```typescript
var p = new Async.Promise((resolve, reject) => {
    setTimeout(() => resolve("abc"), 1000);
});
p.then(v => { console.log("Value: ", v) });

// ... which is the same as:
var p2 = new Async.Promise(() =>
    Async.sleep(1000).then(() => "abc"));
p2.then(v => { /* ... */ });

// ... or even:
Async.sleep(1000, "abc").then(v => { /* ... */ });
```

## Async/await

Using TypeScript's `async/await` features, we can use `async` functions even in code that will be transpiled to ES5 code (i.e. for most browsers in use today, including Internet Explorer 9).

Async functions are transformed to series of `Promise.then` callbacks internally, but allow you to write code as if it is not asynchronous at all. Simply use the `await` keyword in front of an expression that returns a Promise, to wait for the promise to be resolved. An async function itself also returns a Promise, instead of the return value itself, which allows you to `await` your own async functions as well.

As a convention, async function names should end with "Async", e.g. `getProductsAsync(...)`.

TypeScript expects the return value of an async function to be created using a global `Promise` class. When transpiling to an ES5 target, the `Promise` class may not always be provided by the user's browser, and we can use Typescene's Promise class. This can be specified by explicitly setting the return type of the function to `Async.Promise<...>`. This is not possible when transpiling to an ES6 target, but should not be necessary anyway since the global `Promise` object provides the same API as Typescene's implementation.

## Example: async functions (ES5)
<!-- type: example -->

```typescript
async function helloAsync(): Async.Promise<string> {
    await Async.sleep(1000);
    return "Yawn... Hello, world!";
}

async function fancy(): Async.Promise<void> {
    var msg = await helloAsync();
    console.log(msg);
}

console.log("Wait for it...");
fancy();
```

# Observables
<!-- id: samples/observables -->
<!-- sort: 04 -->

Observable values are objects wrapped around a single value (in the `.value` property of an `ObservableValue` object), which can be subscribed to for capturing changes to this value. In addition, observables can be defined using a getter function, which may use other observable values in turn (making changes cascade asynchronously down a dependency tree when subscribed to.

Creating a class with observable properties (there are many ways to do this, but here is an elegant solution using decorators):

```typescript
// Example class with observable properties:
class MyClass extends Async.ObservableObject {
    // Observable string
    @Async.observable
    public text: string;

    // Observable string, never "undefined"
    @Async.observable_string
    public get stringified() { return this.text }

    // Observable array (automatically converts plain arrays)
    @Async.observable
    public list: string[] = [];
}

var c = new MyClass();
console.log(c.text);  // => "undefined"
console.log(c.stringified);  // => ""

// listen for changes:
Async.observe(() => c.stringified + " " + c.list.join(", "))
    .subscribe(v => console.log("Now: " + v));
    // => "Now:  "

// also track changed properties without subscribing:
c.PropertyChange.connect(p => {
    console.log("Updated: " + p)
});

// modify properties (does not output anything synchronously)
c.text = "Hi!";
c.list.push("a", "b", "c");

// asynchronously outputs: ...
// "Updated: text"
// "Hi! a, b, c"
// "Updated: stringified"
```

## Performance

A note on performance with `ObservableArray`: since all array elements are recursively treated and converted to observable versions of arrays and (plain) objects, this may incur a performance hit on larger data structures.

To alleviate this issue if you only need to observe object references, and not the entire data structure, use the following pattern:

```typescript
const MAX = 50000;

// instead of this, which makes `foo` and `bar` observable recursively:
var oa = new Async.ObservableArray();
for (var i = 0; i < MAX; i++)
    oa.push({ num: i, foo: true, bar: [] });

console.log(oa[0]);  // => { num: [getter/setter], ... }

// you may want to use this, if you do not need observable properties:
var oa2 = new Async.ObservableArray();
for (var i = 0; i < MAX; i++) {
    var ov = new Async.ObservableValue();
    ov.shallow = true;
    ov.value = { num: i, foo: true, bar: [] };
    oa2.push(ov);
}

console.log(oa2[0]);  // => { num: 0, foo: true, bar: [] }
```


# Injection
<!-- id: samples/injection -->
<!-- sort: 05 -->

The injection mechanism can be used to inject default (observable) values into an observable property on _all instances_ of a class.

Injecting a default value into a class:

```typescript
class Foo {
    @Async.injectable
    public value: number;
}

// inject a default value
Async.inject(Foo, { value: 1 });

// the value can be overridden on each instance
var a = new Foo(), b = new Foo();
console.log(a.value, b.value);  // => 1  1
b.value = 2;
console.log(a.value, b.value);  // => 1  2

// injecting another value only affects properties not overridden
Async.inject(Foo, { value: 3 });
var c = new Foo();
console.log(a.value, b.value, c.value);  // => 3 2 3
```

Creating a class with an injectable method:

```typescript
class Bar {
    @Async.injectable
    public getValue() { return 1 }
}

// use the method normally
var a = new Bar();
console.log(a.getValue());  // => 1

// inject overriding methods
var old1 = Async.inject(Bar, {
    getValue: () => {
        // call the overridden method first (old1.getValue),
        // i.e. the method defined in the class
        var value = old1.getValue.call(this);
        return value + 1;
    }
});
var old2 = Async.inject(Bar, {
    getValue: () => {
        // call the overridden method first (old2.getValue),
        // i.e. the method injected above
        var value = old2.getValue.call(this);
        return value * 10;
    }
});

// now getValue is chained for all old and new instances
var b = new Bar();
console.log(a.getValue(), b.getValue());  // => 20 20
```

Injection works as expected with derived classes, too:

```typescript
// define three classes with one injectable method
class A {
    @Async.injectable
    public foo() { return this._foo };
    private _foo = "foo";
}

class B extends A { }
class C extends B { }

// inject a chained method on the base class A
var a1 = Async.inject(A, {
    foo() { return a1.foo.call(this) + "bar" }
});
console.log(new A().foo(), new B().foo(), new C().foo());
// => foobar foobar foobar

// inject an overriding chained method on C
var c1 = Async.inject(C, {
    foo() { return c1.foo.call(this) + "baz" }
});
console.log(new A().foo(), new B().foo(), new C().foo());
// => foobar foobar foobarbaz

// inject more chained methods on A and B,
// note that c1.foo above is dynamic
var b1 = Async.inject(B, {
    foo() { return b1.foo.call(this) + "quux" }
});
var a2 = Async.inject(A, {
    foo() { return a2.foo.call(this) + "qux" }
});
console.log(new A().foo(), new B().foo(), new C().foo());
// => foobarqux foobarquxquux foobarquxquuxbaz
```
