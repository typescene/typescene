const fs = require("fs");
const path = require("path");
const docgen = require("../packages/docgen");
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

// make sure all target directories exist
if (!fs.existsSync("./docs")) fs.mkdirSync("./docs");
if (!fs.existsSync("./docs/monaco-editor")) fs.mkdirSync("./docs/monaco-editor");
if (!fs.existsSync("./docs/async")) fs.mkdirSync("./docs/async");
if (!fs.existsSync("./docs/ui")) fs.mkdirSync("./docs/ui");
if (!fs.existsSync("./docs/app")) fs.mkdirSync("./docs/app");

// copy files from docgen folder docs-dist to docs folder
copyFile("./packages/docgen/docs-dist/index.html", "./docs");
copyFile("./packages/docgen/docs-dist/index.css", "./docs");
copyFile("./packages/docgen/docs-dist/docs.css", "./docs");
copyFile("./packages/docgen/docs-dist/bootstrap.min.css", "./docs");
copyFile("./packages/docgen/docs-dist/logo.png", "./docs");
copyFile("./packages/docgen/docs-dist/favicon.ico", "./docs");
copyFile("./packages/docgen/docs-dist/main.min.js", "./docs");
copyFile("./packages/docgen/docs-dist/module/index.html",
    "./docs/async", "./docs/ui", "./docs/app");

// create folders for the Monaco editor and copy all files
copyFolder("./packages/docgen/docs-dist/monaco-editor", "./docs/monaco-editor");

// generate documentation JSON files
docgen.generateAsync("./packages/async/typings", "./packages/async/src/doc")
    .then(json => { console.log("Doc: Async (" + json.length + ")"); return json })
    .then(json => { fs.writeFile("./docs/async/documentation.json", json, brk) })
    .catch(err => { console.error("Async module documentation:", err) });
docgen.generateAsync("./packages/ui/typings", "./packages/ui/src/doc")
    .then(json => { console.log("Doc: UI (" + json.length + ")"); return json })
    .then(json => { fs.writeFile("./docs/ui/documentation.json", json, brk) })
    .catch(err => { console.error("UI module documentation:", err) });
docgen.generateAsync("./packages/app/typings", "./packages/app/src/doc")
    .then(json => { console.log("Doc: App (" + json.length + ")"); return json })
    .then(json => { fs.writeFile("./docs/app/documentation.json", json, brk) })
    .catch(err => { console.error("App module documentation:", err) });

// combine all .d.ts files into a single file
function combineAsync(dtsPath, baseID) {
    return new Promise(resolve => {
        var files = [];
        function findFiles(basePath) {
            fs.readdirSync(basePath).forEach(filename => {
                if (filename === "node_modules") return;
                filename = path.join(basePath, filename);
                if (fs.statSync(filename).isDirectory())
                    findFiles(filename);
                else if (filename.endsWith(".d.ts"))
                    files.push(filename.replace(/\\/g, "/"));
            });
        }
        findFiles(dtsPath);
        var combinedDefs = [], count = files.length;
        files.forEach((f, i) => {
            var n = f.slice(dtsPath.length).replace(/\.d\.ts$/, "");
            fs.readFile(f, (err, buf) => {
                if (err) throw err;
                var txt = String(buf);
                var m = baseID + n;
                var decl = m.replace(/\/index$/, "");
                txt = `declare module "${decl}" {\n${txt}\n}\n`;
                if (/from\s+\'/.test(txt)) throw new Error("Single quote import");
                txt = txt.replace(/^((?:import|export)[^\n]+from )\"(\.[^\"]+)\"/gm, (s, s1, s2) => {
                    var b = m.replace(/\/[^\/]+$/, "/");
                    var result = b + s2;
                    while (true) {
                        var r = result.replace(/\/\.\/|\/[^\/\.]+\/\.\.\//g, "/");
                        if (r === result) break;
                        result = r;
                    }
                    result = result.replace(/\/$/, "");
                    return `${s1}"${result}"`;
                });
                txt = txt.replace(/^export declare /gm, "export ");
                combinedDefs[i] = txt;
                if (!--count) resolve(combinedDefs.join("\n"));
            });
        });
    });
}

var p = ["async", "ui", "app"]
    .map(name => combineAsync(`packages/${name}/typings`, "@typescene/" + name));
p.push(combineAsync("packages/typescene", "@typescene/typescene"));
Promise.all(p).then(strings => {
    var output = strings.join("\n");
    fs.writeFileSync("./docs/typescene.d.ts.txt", output);
    console.log("Done combining definitions.");
});
