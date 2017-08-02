const fs = require("fs");

const rootPackageJson = JSON.parse(fs.readFileSync("./package.json").toString());
var version = String(rootPackageJson.version);
version = version.replace(/^(\d+\.\d+)\..*/, "$1");
console.log(`> Updating docs for v${version} ...`);

// create folder if it doesn't exist yet
var docsVersionPath = `./docs/${version}`;
if (!fs.existsSync(docsVersionPath)) fs.mkdirSync(docsVersionPath);

// generate documentation JSON file
const docgen = require("./lib/docgen");
const splitContent = require("./lib/split-content");
var contentPath = docsVersionPath + "/content";
docgen.generateAsync("./src/docs", version)    
    .then(data => splitContent(data, contentPath).then(() => JSON.stringify(data)))
    .then(json => { console.log("+ documentation.json (" + json.length + " bytes)"); return json })
    .then(json => { fs.writeFileSync(docsVersionPath + "/documentation.json", json) })
    .catch(err => { console.error(err) });

// combine all DOM .d.ts files into a single file for the code editor
const combineDefs = require("./lib/combine-defs");
Promise.all([
    combineDefs.combineAsync("./dist/core/typings", "@typescene/core"),
    combineDefs.combineAsync("./dist/dom/typings", "@typescene/dom")
]).then(strings => {
    var output = strings.join("\n");
    fs.writeFileSync(docsVersionPath + "/typescene.d.ts.txt", output);
});
