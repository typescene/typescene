module.exports = {
    entry: "./src/index.ts",
    resolve: {
        extensions: ["", ".ts", ".js"],
        root: require("path").resolve("./src")
    },
    output: {
        filename: "index.js",
        library: "Typescene",
        libraryTarget: "commonjs2"
    },
    module: {
        loaders: [
            { test: /\.ts$/, loader: "ts-loader" }
        ]
    }
}