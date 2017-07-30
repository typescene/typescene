const DIST_PATH = "./dist";

// ----------------------------------------------------------------------------
// `.npmignore` text content

const npmIgnoreText = `npm-debug.log*
*.log
node_modules/
internal/`;

// ----------------------------------------------------------------------------
// `README.md` text content

const readmeMDText = `# Typescene (module)

This module is part of the Typescene toolkit.

Find out more at [typescene.org](http://typescene.org/).`;

// ----------------------------------------------------------------------------
// Template for `package.json`

const packageJSON = {
    "name": undefined,  // @typescene/...
    "version": undefined,  // taken from root package
    "description": "Typescene toolkit", // + package description
    "author": "Jelmer Cormont",
    "license": "MIT",
    "repository": "https://github.com/typescene/typescene/tree/master/npm-dist/",  // + package
    "homepage": "http://typescene.org/",
    "main": "./lib/index.js",
    "module": "./lib/index.js",
    "typings": "./typings/index.d.ts",
    "publishConfig": undefined // taken from root package
};

// ----------------------------------------------------------------------------
// Prebuild script (create DIST_PATH folder)

const fs = require("fs");
const rimraf = require("rimraf");

const rootPackageJson = JSON.parse(fs.readFileSync("./package.json").toString());
const version = rootPackageJson.version;
const publishConfig = rootPackageJson.publishConfig;

rimraf(DIST_PATH, err => {
    if (err) throw err;
    console.log(`> Preparing NPM packages in ${DIST_PATH}: v${version} [@${publishConfig.tag}]`);

    // make a package directory within `dist-npm/`
    function mkpackage(packageName, description, subModules, dependencies) {
        let path = DIST_PATH + "/" + packageName;
        fs.mkdirSync(path);

        // add meta data files
        let packageData = Object.assign({}, packageJSON);
        packageData.name = "@typescene/" + packageName;
        packageData.version = version;
        packageData.publishConfig = publishConfig;
        packageData.description += " " + description;
        packageData.repository += packageName;
        if (dependencies) packageData.dependencies = dependencies;
        fs.writeFileSync(path + "/package.json", JSON.stringify(packageData, undefined, "  "));
        fs.writeFileSync(path + "/.npmignore", npmIgnoreText);
        fs.writeFileSync(path + "/README.md", readmeMDText);

        // add sub module aliases (`index.js` and `index.d.ts`)
        subModules.forEach(subModuleName => {
            let subModulePath = path + "/" + subModuleName;
            let upPath = subModuleName.split("/").map(() => "../").join("");
            fs.mkdirSync(subModulePath);
            fs.writeFileSync(subModulePath + "/index.js",
                `export * from "${upPath}lib/${subModuleName}";`);
            fs.writeFileSync(subModulePath + "/index.d.ts",
                `export * from "${upPath}typings/${subModuleName}";`);
        });

        // add reference to `core` if needed
        if (packageName !== "core") {
            fs.mkdirSync(path + "/node_modules");
            fs.mkdirSync(path + "/node_modules/@typescene");
            fs.mkdirSync(path + "/node_modules/@typescene/core");
            fs.writeFileSync(path + "/node_modules/@typescene/core/index.js",
                `export * from "../../../../core"`);
            fs.writeFileSync(path + "/node_modules/@typescene/core/Async.js",
                `export * from "../../../../core/lib/Async"`);
            fs.writeFileSync(path + "/node_modules/@typescene/core/UI.js",
                `export * from "../../../../core/lib/UI"`);
            fs.writeFileSync(path + "/node_modules/@typescene/core/App.js",
                `export * from "../../../../core/lib/App"`);
        }
    }

    // prepare the `core` and `dom` packages
    fs.mkdirSync(DIST_PATH);
    mkpackage("core", "core package", ["Async", "UI", "App"]);
    mkpackage("dom", "DOM package", ["Async", "UI", "App", "UI/DOM", "App/Http"], {
        "@typescene/core": version
    });
});
