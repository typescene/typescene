const fs = require("fs");
const path = require("path");
const rootPackageJson = JSON.parse(fs.readFileSync("./package.json").toString());
var version = String(rootPackageJson.version);
version = version.replace(/^(\d+\.\d+)\..*/, "$1");

// generate json and type definition files
if (!fs.existsSync("./docs")) fs.mkdirSync("./docs");
require("./update-docs");

// initialize folder with assets, including dependencies
console.log("> Compiling docs viewer ...");
const copy = require("./lib/copy");
copy.folder("./src/docs-viewer/assets", "./docs");
if (!fs.existsSync("./docs/" + version + "/monaco-editor"))
    fs.mkdirSync("./docs/" + version + "/monaco-editor");
if (!fs.existsSync("./docs/" + version + "/monaco-editor/min"))
    fs.mkdirSync("./docs/" + version + "/monaco-editor/min");
copy.folder("./node_modules/monaco-editor/min",
    "./docs/" + version + "/monaco-editor/min");
if (!fs.existsSync("./docs/icons")) {
    fs.mkdirSync("./docs/icons");
    fs.mkdirSync("./docs/icons/css");
    fs.mkdirSync("./docs/icons/fonts");
}
copy.folder("./node_modules/font-awesome/css", "./docs/icons/css");
copy.folder("./node_modules/font-awesome/fonts", "./docs/icons/fonts");

// reference correct JS file from root index.html
const indexHtmlPath = path.resolve(__dirname, "../docs/index.html");
var indexHtmlContent = fs.readFileSync(indexHtmlPath).toString();
indexHtmlContent = indexHtmlContent.replace("src=\"main.min.js\"",
    "src=\"/" + version + "/main.min.js\"");
indexHtmlContent += "\n\n<footer style=\"text-align: right\">" +
    "<a style=\"color: #aaa; font: menu\" href=\"/doc/index.html\">" +
    "Sitemap (Text Index)</a></footer>\n";
fs.writeFileSync(indexHtmlPath, indexHtmlContent);

// also create versioned html to reference this JS version, and 404 page
fs.writeFileSync(indexHtmlPath.replace(".html", `.${version}.html`), indexHtmlContent);
indexHtmlContent = `---
permalink: /404.html
---
` + indexHtmlContent;
fs.writeFileSync(path.resolve(__dirname, "../docs/404.html"), indexHtmlContent);

// compile the viewer app using Webpack
const webpack = require("webpack");
webpack({
    entry: path.resolve(__dirname, "../src/docs-viewer/main.ts"),
    devtool: "eval-cheap-module-source-map",
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
        new webpack.DefinePlugin({ VERSION: version }),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.optimize.ModuleConcatenationPlugin(),
        //new webpack.optimize.UglifyJsPlugin(),
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
