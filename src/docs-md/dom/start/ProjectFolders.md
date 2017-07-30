# Setting Up a Project Folder
<!-- id: start/projects -->
<!-- topic: Project Folders -->
<!-- summary: Setting up a project folder for a simple project -->
<!-- sort: 01 -->

Follow along with this example to understand how to set up a project with Typescene, TypeScript and Webpack, using Node and the NPM package manager.

## Requirements
<!-- type: note -->
**Node JS:** This example requires that you have a recent version of Node and NPM installed on your computer. Find out more about installing Node and NPM at [nodejs.org](https://nodejs.org/).

**TypeScript:** You will also need a recent version of TypeScript. Find out how to install TypeScript at [typescriptlang.org](http://www.typescriptlang.org/).

## Create a project folder

First, create a folder on your hard drive to contain all of the files for this project. Then, create a `src/` folder within your project folder, to contain all of your TypeScript source files.

In these folders, you'll create the following files using the steps below:

* `package.json` -- refer to Set up NPM.
* `src/tsconfig.json` -- refer to Set up TypeScript.
* `src/main.ts` -- refer to Add Your Code.
* `webpack.config.js` -- refer to Set up Webpack.


## Set up NPM

Your project is not just a folder that contains your source code, it is actually an NPM package just by itself. This means it can refer to other NPM packages as its dependencies, such as the Typescene package.

To configure an NPM package folder, it needs a `package.json` file. Here's a version of the package configuration file that can be used to set up a simple Typescene project, along with its TypeScript and Webpack dependencies:

```json
{
  "name": "myproject",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "build": "webpack",
    "start-dev": "webpack-dev-server"
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

After creating the `package.json` file, NPM needs to initialize the package and install dependencies. At the command prompt (or through your IDE), run the following command:

```bash
npm install
```

You should now have a `node_modules/` folder within your project folder.


## Set up TypeScript

TypeScript needs its own configuration file. For this minimal example, this file needs to specify the following options:

* Output should be generated in the 'ES5' version of the JavaScript standard, for general compatibility with IE9+ and all modern browsers.
* Modules should be using the _newer_ 'ES6' (also called 'ES2015') standard, especially for packing up with Webpack. TypeScript should still look for modules in the standard NPM directories though (the 'Node module resolution' model).
* Typescene uses a TypeScript feature called 'decorators', which needs to be whitelisted separately.

Add a `src/tsconfig.json` file that looks like this:

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


## Add Your Code

You can use the `src/` folder to contain all of your application code. It is a good idea to create sub folders for all parts and/or features of your application, but for this example there is only a single file, `src/main.ts`:

```typescript
import { App } from "@typescene/dom";
App.showMessageBox("Hi", "Hello, world!");
```


## Set up Webpack

To run the application, you'll need to load it in a browser. This means you need an `.html` file, along with a single `.js` file that contains your application code _as well as_ the Typescene framework itself, since the browser doesn't know where to find your dependencies.

[Webpack](https://github.com/webpack/webpack) is a good tool to do this. It compiles, 'bundles', and optionally minifies all your TypeScript code in one step. As a bonus, `html-webpack-plugin` also generates an HTML file, and `webpack-dev-server` can be used during development.

Webpack needs reads its configuration from `webpack.config.js` by default:

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


## Running Your Application

Webpack is now configured to create output in the `dist/` directory whenever you run it. This is all you need when deploying your application to a server.

For development, the `webpack-dev-server` tool is a great time saver. It reloads the page whenever you make a change in one of the source files. Since Webpack is already set up, you can run the server with the following command:

```bash
webpack-dev-server
```

That's all. Navigate to the path displayed (e.g. `http://localhost:8081`), and see the application run in your browser.
