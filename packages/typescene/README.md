# Typescene
Typescene is a strongly typed GUI toolkit for Web applications written in TypeScript.

Learn more about Typescene at [typescene.org](http://typescene.org), and follow [@typescene](https://twitter.com/typescene) on twitter.

The docs can be found at [docs.typescene.org](http://docs.typescene.org/).


## Philosophy

Why another front-end framework/toolkit/library? What sets Typescene apart?

_These are the primary goals for this project:_

* Single-source development: no need to switch among HTML, CSS and JS files.
* An intuitive object-oriented architecture, modeled after proven desktop GUI technology, mixed with convenient Javascript-isms where possible to keep things DRY.
* Transparent use of async programming concepts with predictable results: avoid &lsquo;magic&rsquo; shared states, and don&rsquo;t favor functional paradigms over imperative logic.
* Strong typing with TypeScript 2+ for top-notch static type checks and IDE auto-complete for total API discoverability.
* Support for IE9+ and all modern browsers.

The result is a toolkit that encourages developers to write readable, coherent code in a single code base, while still taking advantage of the benefits that the modern browser JS environment offers.

Don&rsquo;t believe that this is possible? See how easy it is to get started with the examples in the [Async](http://docs.typescene.org/async/#/samples) module documentation, then move on to [UI components](http://docs.typescene.org/ui/#/overview/getting-started), and finally refer to best practices for putting everything together in a full [application](http://docs.typescene.org/app).


## Installation

To begin using Typescene in your projects, you will need Node.js and npm. The use of TypeScript is optional, but highly recommended.

The Typescene toolkit is available from npm: [@typescene/typescene](https://www.npmjs.com/package/@typescene/typescene).

Example commands to set up a new project with TypeScript and Webpack:

```
> mkdir myproject
> cd myproject
> npm init
> npm install --save-dev typescript webpack ts-loader @typescene/typescene
```

Now, Webpack (with ts-loader) can be used to transpile a TypeScript source file, and generate output as a .js file that also includes Typescene sources.

In your TypeScript file, you can import all Typescene modules by adding the following line:

```typescript
import { Async, UI, App } from "@typescene/typescene";
```

Alternatively, you can use the `.min.js` file from the Node.js module root folder directly in your HTML file, which adds the `Async`, `UI`, and `App` objects to the global namespace.


## Issues & Contributions

Please report all issues on the GitHub issues page. Make sure to include the name of the affected module and method(s), and add a TypeScript code sample if possible.

Pull requests are welcome. Especially if they are related to one of the following focus areas:

* Bug fixes,
* Additional documentation (in JSDoc format, or in the /src/doc folder),
* A comprehensive unit test framework for the Async module,
* A comprehensive integration test framework for the UI and App modules.

Adding more features (components and layouts, animations, etc...) is currently _not_ a primary concern, until the appropriate test frameworks have been set up.
