module.exports = {
    entry: "./src/viewer/main.ts",
    output: {
        filename: "main.min.js",
        path: require("path").resolve("./docs-dist")
    },
    resolve: {
        extensions: ["*", ".ts", ".js"]
    },
    module: {
        rules: [
            { test: /\.ts$/, use: "ts-loader" }
        ]
    }
}