const fs = require("fs");
const path = require("path");
function brk(err) { if (err) throw err }

// helper function to copy a file
function copyFile(src, ...destPath) {
    var fileName = src.replace(/^.*[\/\\]([^\/\\]+)$/, "$1");
    fs.readFile(src, (err, data) => {
        if (err) throw err;
        destPath.forEach(p => {
            fs.writeFile(path.join(p, fileName), data, brk);
        });
    });
}

// helper function to copy a folder
function copyFolder(srcPath, destPath) {
    fs.readdir(srcPath, (err, files) => {
        if (err) throw err;
        files.forEach(fileName => {
            fs.stat(path.join(srcPath, fileName), (err, stats) => {
                if (err) throw err;
                if (stats.isDirectory()) {
                    fs.exists(path.join(destPath, fileName), yesno => {
                        if (!yesno) fs.mkdirSync(path.join(destPath, fileName));
                        copyFolder(path.join(srcPath, fileName),
                            path.join(destPath, fileName));
                    });
                }
                else {
                    copyFile(path.join(srcPath, fileName), destPath);
                }
            });
        });
    });
}


// update minified bootstrap css file in docs-dist folder first
var source = path.join(__dirname, "..",
    "node_modules", "bootstrap", "dist", "css", "bootstrap.min.css");
var destPath = path.join(__dirname, "..", "docs-dist");
copyFile(source, destPath);

// create folders for the Monaco editor and copy all files
var monacoOut = path.join(__dirname, "..", "docs-dist", "monaco-editor");
if (!fs.existsSync(monacoOut)) fs.mkdirSync(monacoOut);
var minOut = path.join(monacoOut, "min");
if (!fs.existsSync(minOut)) fs.mkdirSync(minOut);
copyFolder(
    path.join(__dirname, "..", "node_modules", "monaco-editor", "min"),
    minOut);
