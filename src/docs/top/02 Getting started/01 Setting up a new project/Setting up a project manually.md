# Setting up a project manually
<!-- id: start/setup/files -->
<!-- sort: 02 -->

If you choose not to use Yeoman, you can set up a project structure by yourself. This isn't such a laborious process as for some other web app frameworks, because Typescene itself has no dependencies and isn't picky about the way you organize, compile, or bundle your TypeScript code.

Still, there are a number of different tools involved. You'll need to complete the following steps:

1. Create a project folder
2. Set up NPM and add dependencies
3. Configure TypeScript and add your code
4. Configure a bundler

## Preparing your project files

### Creating a project folder
<!-- type: task -->
Your application code needs to live in a folder on your hard drive, along with its dependencies (i.e. libraries and tools, such as Typescene itself).

Create a folder using the Finder (Mac), Explorer (Windows) or the terminal:

```bash
mkdir my-project
cd my-project
```


### Setting up NPM
<!-- type: task -->
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


### Configuring TypeScript
<!-- type: task -->
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

## Compiling and running your code

### Configuring Webpack as a bundler
<!-- type: task -->
To run your application, you'll need to load it in a browser. This means you need an `.html` file, along with a single `.js` file that contains all of your application code _as well as_ the Typescene framework itself, since otherwise the browser wouldn't know how to load any this code separately.

<a href="https://github.com/webpack/webpack" target="_blank">Webpack</a> is a great tool for producing a single JavaScript file (a _bundle_). It concatenates, and optionally minifies all your code in one step. As a bonus, `ts-loader` compiles TypeScript files, `html-webpack-plugin` generates an HTML file, and `webpack-dev-server` can be used to auto-refresh this page during development.

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

<!-- ## -->
<!-- type: note -->
{icon::fa-hand-o-right}**Note:** Using Webpack to bundle the application output is optional. You can use any other method to load your TypeScript or JavaScript code into a browser (or application platform such as Electron or a mobile app framework based on Web technologies), as long as the Typescene DOM package code is either included in your `.js` file(s), or loaded separately as a `.min.js` file (found in the root folder of the `@typescene/dom` NPM package).

### Running your application
<!-- type: task -->
You can now use NPM scripts to compile and run your app:

* `npm run build` to build for production, and
* `npm run start:dev` to start a Webpack development server.

## Next steps

The code in `src/main.ts` doesn't really do anything yet. Start developing your UI by writing your own components.

[{icon::fa-play}Get started creating UI components](~/start/ui)
