# Typescene
Typescene is a strongly typed GUI toolkit for Web applications written in TypeScript.

Learn more about Typescene at [typescene.org](http://typescene.org), and follow [@typescene](https://twitter.com/typescene) on twitter.

The docs can be found at [docs.typescene.org](http://docs.typescene.org/).

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

## Building from source

This repository is organized as a 'monorepo', and uses the [Lerna](https://lernajs.io/) tool for managing internal dependencies.

Use the following commands to manage builds:

* `npm run bootstrap`: this links all internal dependencies together and installs external dependencies.
* `npm run clean`: this removes all build artifacts and NPM modules. Afterwards, run `npm run bootstrap` again to get up and running.
* `npm run build`: this builds all modules, generates the `.min.js` file in the main module, and updates the documentation in the `docs` folder.
* `npm run update-docs`: this just updates the documentation in the `docs` folder. Requires all modules to have been built already.
