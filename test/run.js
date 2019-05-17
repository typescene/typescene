let esmRequire = require("esm")(module);
let path = require("path");
let fs = require("fs");
let ts = require("typescript");

let TestCase;
TestCase = exec("TestCase.ts");
execAll("cases");
process.stdout.write(" 🐌 Running tests");
runAllTests();

function req(path) {
    return esmRequire(path.replace(/^(\.\.\/)+dist/, "../dist"));
}

function rel() {
    let segments = [__dirname];
    for (let i = 0; i < arguments.length; i++) {
        segments.push(arguments[i]);
    }
    return path.join.apply(path, segments);
}

function exec(fileName) {
    let code = fs.readFileSync(rel(fileName), "utf8");
    let js = ts.transpile(code, {
        strict: true,
        target: ts.ScriptTarget.ES5
    });
    str = "(exports, require, typescene, consider, it)=>{\n" + js +
        "\nreturn exports}";
    let f = eval(str);
    return f({}, req, req("../dist"),
        TestCase && TestCase.consider,
        TestCase && TestCase.it);
}

function execAll(folderName) {
    let ls = fs.readdirSync(rel(folderName));
    ls.sort();
    ls.forEach(name => {
        let p = path.join(folderName, name);
        let isDir = fs.statSync(rel(p)).isDirectory();
        if (isDir) execAll(p);
        else if (p.endsWith(".ts")) exec(p);
    });
}

function runAllTests() {
    let errors = [];
    let promises = [];
    let groups = TestCase.getTestGroups();
    groups.forEach(group => {
        group.cases.forEach(testCase => {
            promises.push(testCase.runAsync()
                .catch(err => {
                    errors.push(testCase.name + ":\n" +
                        String(err.stack || err));
                })
                .then(() => {
                    let err = testCase.getError();
                    if (err) {
                        errors.push(testCase.name + ":\n" +
                            String(err.stack || err));
                    }
                    process.stdout.write(".")
                }));
        });
    });
    Promise.all(promises).then(() => {
        process.stdout.write("\n");
        let log = "";
        let nUndef = 0;
        log += ("-").repeat(80) + "\n";
        groups.forEach(group => {
            log += " 🔍 " + group.name + "\n";
            group.cases.forEach(testCase => {
                if (!testCase.callback) nUndef++;
                let err = testCase.getError();
                let dots = Math.max(0, 68 - testCase.name.length);
                log += "    - " + testCase.name +
                    " " + (".").repeat(dots) +
                    (!testCase.callback ? " 💤\n" :
                        err ? " 💥\n" : " ✅\n");
            });
            log += ("-").repeat(80) + "\n";
        });
        if (nUndef) {
            log += "Note: " + nUndef + " test(s) are undefined\n";
        }
        console.log(log);
        if (!errors.length) {
            console.log(" 😁 All tests OK!");
            fs.writeFileSync("test.log", log);
        }
        else {
            console.log(" 😔 " + errors.length + " test(s) failed.");
            log += "\n" + errors.join("\n\n" + ("-").repeat(80) + "\n\n");
            fs.writeFileSync("test.log", log);
            console.log("    Details written to `test.log`");
            process.exit(1);
        }
    });
}
