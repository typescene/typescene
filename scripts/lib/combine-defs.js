const fs = require("fs");
const path = require("path");

module.exports = {
    combineAsync: function combineAsync(dtsPath, baseID) {
        dtsPath = path.join("./", dtsPath);
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
                    txt = txt.replace(/^((?:import|export)[^\n]+from |import )\"(\.[^\"]+)\"/gm, (s, s1, s2) => {
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
};
