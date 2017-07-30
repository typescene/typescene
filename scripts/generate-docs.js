const fs = require("fs");
const path = require("path");

// generate json and type definition files
if (!fs.existsSync("./docs")) fs.mkdirSync("./docs");
require("./update-docs");

// initialize folder with assets, including bootstrap css and the Monaco editor
console.log("> Compiling docs viewer ...");
const copy = require("./lib/copy");
copy.folder("./src/docs-pages", "./docs");
copy.file("./node_modules/bootstrap/dist/css/bootstrap.min.css", "./docs");
if (!fs.existsSync("./docs/monaco-editor")) fs.mkdirSync("./docs/monaco-editor");
if (!fs.existsSync("./docs/monaco-editor/min")) fs.mkdirSync("./docs/monaco-editor/min");
copy.folder("./node_modules/monaco-editor/min", "./docs/monaco-editor/min");

// reference correct JS file from root index.html
const rootPackageJson = JSON.parse(fs.readFileSync("./package.json").toString());
var version = String(rootPackageJson.version);
version = version.replace(/^(\d+\.\d+)\..*/, "$1");
const indexHtmlPath = path.resolve(__dirname, "../docs/index.html");
var indexHtmlContent = fs.readFileSync(indexHtmlPath).toString();
indexHtmlContent = indexHtmlContent.replace("src=\"main.min.js\"",
    "src=\"" + version + "/main.min.js\"");
fs.writeFileSync(indexHtmlPath, indexHtmlContent);

// also create versioned html to reference this JS version
fs.writeFileSync(indexHtmlPath.replace(".html", `.${version}.html`), indexHtmlContent);

// compile the viewer app using Webpack
const webpack = require("webpack");
webpack({
    entry: path.resolve(__dirname, "../src/docs-viewer/main.ts"),
    //devtool: "eval-cheap-module-source-map",
    output: {
        filename: "main.min.js",
        path: path.resolve(__dirname, "../docs/" + version)
    },
    resolve: {
        extensions: ["*", ".ts", ".js"],
        alias: {
            "@typescene/dom": "../../dist/dom"
        }
    },
    module: {
        rules: [
            { test: /\.ts$/, use: "awesome-typescript-loader?configFileName=./src/docs-viewer/tsconfig.json" }
        ]
    },
    plugins: [
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.optimize.ModuleConcatenationPlugin(),
        new webpack.optimize.UglifyJsPlugin(),
    ]
}, (err, stats) => {
    if (err) {
        // show error output
        console.error(err);
    }
    else {
        // show console output
        console.log(stats.toString({
            colors: true,
            chunks: false,
            assets: false,
            modules: false
        }));
    }
});
