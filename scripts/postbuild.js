const fs = require("fs");
const path = require("path");

// add version constant to root exports
const rootPackageJson = JSON.parse(fs.readFileSync("./package.json").toString());
const version = rootPackageJson.version;
const indexJsPath = path.resolve(__dirname, "../dist/core/lib/index.js");
var indexJsContent = fs.readFileSync(indexJsPath);
indexJsContent += `export const version = "${version}"\n`;
fs.writeFileSync(indexJsPath, indexJsContent);

// create `.min.js` file for the DOM module
console.log("> Creating DOM typescene.min.js using Webpack ...");
const webpack = require("webpack");
webpack({
    entry: "./dist/dom/lib/index.js",
    output: {
        filename: "typescene.min.js",
        path: path.resolve(__dirname, "../dist/dom/")
    },
    resolve: {
        alias: {
            "@typescene/core/Async": path.resolve(__dirname, "../dist/core/lib/Async/index.js"),
            "@typescene/core/UI": path.resolve(__dirname, "../dist/core/lib/UI/index.js"),
            "@typescene/core/App": path.resolve(__dirname, "../dist/core/lib/App/index.js")
        }
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin(),
        new webpack.optimize.ModuleConcatenationPlugin()
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
