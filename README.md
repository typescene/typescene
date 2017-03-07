# Typescene
Typescene is a strongly typed GUI toolkit for Web applications written in TypeScript.

## Documentation

The documentation for Typescene is available over at [`typescene.github.io/typescene`](https://typescene.github.io/typescene).

## Installation

The Typescene toolkit is available from NPM, at [@typescene/typescene](https://www.npmjs.com/package/@typescene/typescene).

Example commands to set up a new project with TypeScript and Webpack:

```
> mkdir myproject
> cd myproject
> npm init
> npm install --save-dev typescript webpack ts-loader @typescene/typescene
```

Import the toolkit in your TypeScript or ES6 / ES2015+ files as follows:

```typescript
import { Async, UI, App } from "@typescene/typescene";
```

## Building from source

This repository is organized as a 'monorepo', and uses the [Lerna](https://lernajs.io/) tool for managing internal dependencies.

Use the following commands to manage builds:

* `npm run bootstrap`: this links all internal dependencies together and installs external dependencies.
* `npm run clean`: this removes all build artifacts and NPM modules. Afterwards, run `npm run bootstrap` again to get up and running.
* `npm run build`: this builds all modules, generates the `.min.js` file in the main module, and updates the documentation in the `docs` folder.
* `npm run update-docs`: this just updates the documentation in the `docs` folder. Requires all modules to have been built already.
