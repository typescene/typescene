# Using the Yeoman generator
<!-- id: start/setup/yeoman -->
<!-- sort: 01 -->

<!-- ## -->
<!-- type: intro -->
Save time when creating Typescene projects and modules, with the Yeoman scaffolding tool.

## Installation
<a href="http://yeoman.io/" target="_blank">Yeoman</a> is a scaffolding tool that helps you to put together project skeletons for all kinds of frameworks, using specific generator packages for each framework or platform.

### Installing the generator
<!-- type: task -->
To install the generator for Typescene, run the following command:

```bash
npm install -g yo generator-typescene
```

## Usage

{icon::fa-hand-o-right}See the <a href="https://www.npmjs.com/package/generator-typescene" target="_blank">documentation</a> for the Typescene generator package for more detail.

### Creating an application
<!-- type: task -->
Create an application (in a new folder) with the following commands:

```bash
mkdir my-project
cd my-project
yo typescene
```

### Adding a module
<!-- type: task -->
You can even use the Yeoman generator to add new modules to an existing project:

```bash
yo typescene:module my-new-module
```

### Running your new app
<!-- type: task -->
Compile and run your application with a few simple commands:

* `npm run build` to compile your code for production (into the `dist/` and/or `public/` folders).
* `npm run start:dev` to open a browser and view the result of your application as bundled by Webpack.
* If you used the `systemjs` option of the Yeoman generator, run `npm run watch` to compile your code and watch for changes. You can then use a tool such as `http-server` (from <a href="https://www.npmjs.com/package/http-server" target="_blank">this package</a>) or equivalent to serve the result.

## Next steps

Add code to your application inside of the `src/` folder.

[{icon::fa-play}Get started creating UI components](~/start/ui)

