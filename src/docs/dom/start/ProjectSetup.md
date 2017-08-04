# Setting Up a New Project
<!-- id: start/setup -->
<!-- topic: Project Setup -->
<!-- summary: Setting up a new Typescene project -->
<!-- sort: 01 -->

Learn how to set up a new web application project that uses TypeScript and the Typescene toolkit.

## Requirements
<!-- type: note -->
Before you start, you'll need to make sure that you have a recent version of Node and NPM installed on your computer. Find out more about installing Node and NPM at [nodejs.org](https://nodejs.org/).

## 1. The easy way: using the Yeoman generator

[Yeoman](http://yeoman.io/) is a scaffolding tool that helps you to put together project skeletons for all kinds of frameworks, using specific generator packages for each framework or platform. The Typescene generator can save you a lot of time when setting up a new project.

To install the generator, run the following command:

```bash
npm install -g yo generator-typescene
```

Then, create an application (in a new folder) with the following commands:

```bash
mkdir my-project
cd my-project
yo typescene
```

You can even use the Yeoman generator to add new modules to an existing project:

```bash
yo typescene:module my-new-module
```

See the [documentation](https://www.npmjs.com/package/generator-typescene) for the Typescene generator package for more detail.

## Running Your Application

You can compile and run your application with a few simple commands:

* `npm run build` to compile your code for production (into the `dist/` and/or `public/` folders).
* `npm run start:dev` to open a browser and view the result of your application as bundled by Webpack.
* If you used the `systemjs` option of the Yeoman generator, run `npm run watch` to compile your code and watch for changes. You can then use a tool such as `http-server` (from [this package](https://www.npmjs.com/package/http-server)) or equivalent to serve the result.

## Next steps

Add code to your application inside of the `src/` folder.

Learn about [async concepts](#/start/async) and [creating a UI](#/start/ui).

---

## 2. Creating a project manually

If you choose not to use Yeoman, you can set up a project structure manually. This isn't such a laborious process as for some other web app frameworks, because Typescene itself has no dependencies and isn't picky about the way you organize, compile, or bundle your TypeScript code.

Still, there are a number of different tools involved. You'll need to complete the following steps:

1. Create a project folder
2. Set up NPM and add dependencies
3. Configure TypeScript and add your code
4. Configure a bundler

These steps are described below.

## Create a project folder

Your application code needs to live in a folder on your hard drive, along with its dependencies (i.e. libraries and tools, such as Typescene itself).

Create a folder using the Finder (Mac), Explorer (Windows) or the terminal:

```bash
mkdir my-project
cd my-project
```


## Set up NPM

Your project is actually a _package_ just by itself. This means it can refer to other packages as its dependencies, which are all managed by the NPM package manager.

To configure an NPM package, you need a `package.json` file. Here's a version of the package configuration file that can be used to set up a simple Typescene project, and loads up Webpack as a bundler:

```json
{
  "name": "my-project",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "build": "webpack -p",
    "start:dev": "webpack-dev-server -d --open"
  },
  "devDependencies": {
    "@typescene/dom": "0.9",
    "typescript": "2",
    "webpack": "3",
    "webpack-dev-server": "2",
    "ts-loader": "2",
    "html-webpack-plugin": "2"
  }
}
```

With this `package.json` file, NPM is able to initialize your package and install its dependencies. At the command prompt (or using your IDE, if it has NPM integration), run the following command:

```bash
npm install
```

This creates a `node_modules/` folder within your project folder.


## Configure TypeScript

TypeScript needs its own configuration file. At a minimum, you'll need to specify the following options:

* Output should be generated in the 'ES5' version of the JavaScript standard, for general compatibility with IE9+ and all modern browsers.
* Module output should follow the _newer_ 'ES6' standard (also known as 'ES2015'), for better results with Webpack. TypeScript should still look for modules in the standard NPM directories though (the 'Node' module resolution model).
* Typescene uses a TypeScript feature called 'decorators', which needs to be declared separately.

Putting it all together, your project's `tsconfig.json` file should at least contain the following properties:

```json
{
  "compilerOptions": {
    "target": "es5",
    "module": "es2015",
    "moduleResolution": "node",
    "strict": true,
    "experimentalDecorators": true
  }
}
```

You can place this file at the root of your project folder, but it's generally better to keep it right next to your source code, so we'll put in a `src/` sub folder.

You can use the `src/` folder to contain all of your application code. It's a good idea to create more folders _within_ this folder for all parts and/or features of your application, but for this example you'll need only a single file, `src/main.ts`:

```typescript
import { App } from "@typescene/dom";
App.showMessageBox("Hi", "Hello, world!");
```


## Configure Webpack as a bundler

To run the application, you'll need to load it in a browser. This means you need an `.html` file, along with a single `.js` file that contains all of your application code _as well as_ the Typescene framework itself, since otherwise the browser wouldn't know how to load any this code separately.

[Webpack](https://github.com/webpack/webpack) is a great tool for producing a single JavaScript file (a _bundle_). It concatenates, and optionally minifies all your code in one step. As a bonus, `ts-loader` compiles TypeScript files, `html-webpack-plugin` generates an HTML file, and `webpack-dev-server` can be used to auto-refresh this page during development.

Webpack reads its configuration from `webpack.config.js` in your project root folder by default:

```javascript
var path = require("path");
var HtmlWebpackPlugin = require("html-webpack-plugin");
module.exports = {
    entry: "./src/main.ts",
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "dist")
    },
    resolve: {
        extensions: ["*", ".js", ".ts"],
    },
    module: {
      rules: [
        { test: /\.ts$/, loader: "ts-loader" }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({ title: "My Application" })
    ]
}
```


## Note
<!-- type: note -->

Using Webpack to bundle the application output is optional. You can use any other method to load your TypeScript or JavaScript code into a browser (or application platform such as Electron or a mobile app framework based on Web technologies), as long as the Typescene DOM package code is either included in your `.js` file(s), or loaded separately as a `.min.js` file.

## Running your application

You can now use NPM scripts to compile and run your app:

* `npm run build` to build for production, and
* `npm run start:dev` to start a Webpack development server.
