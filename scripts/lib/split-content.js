const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");

/** Helper function to escape text for use in HTML */
function esc(s) {
    return s.replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/** Helper function to strip tags and cut length */
function stripCut(s) {
    if (!s) return s;
    s = s.replace(/<[^>]+>/g, "").replace(/\s+/, " ");
    if (s.length > 350) s = s.slice(0, 348).replace(/\s\w+$/, "") + "...";
    return s;
}

/** Version number (x.y) loaded from data */
var version;

/** Split documentation data and generate separate HTML files for search engines */
module.exports = function splitContent(data, outDir) {
    version = data.version;
    return new Promise((resolve, reject) => {
        rimraf(outDir, err => {
            if (err) {
                reject(err);
                return;
            }
            console.log("> Writing documentation content (html)");
            fs.mkdirSync(outDir);
            writeContent(data.items, outDir);
            writeIndex(outDir);
            resolve();
        });
    });    
}

/** Content index (file names => titles; written at the end) */
var filesWritten = [];
var contentIndex = {};
var foldersExist = {};

/** Recursive content writer implementation */
function writeContent(items, outDir, upName, upFileName) {
    var sorted = items.slice(0).sort((a, b) => a.id === b.id ? 0 : a.id > b.id ? 1 : -1);
    return sorted.map(item => {
        let makeFileName = id => id.replace(/[^\w_.\/]/g, "-");
        var fileName = makeFileName(item.id);

        // check folders
        var current = outDir;
        fileName.split("/").slice(0, -1).forEach((s, i) => {
            current = path.resolve(current, s);
            if (!foldersExist[current] && !fs.existsSync(current)) {
                fs.mkdirSync(current);
            }
            foldersExist[current] = true;
        });

        // compose content
        var content = "";
        content += "<h1>" + esc(item.name) + "</h1>";
        if (item.textSummary) content += "<p><i>" + esc(item.textSummary) + "</i></p>";
        if (item.code) content += "<pre><code>" + esc(item.code) + "</pre></code>";
        if (item.doc) content += item.doc;
        item.text && item.text.forEach(t => {
            if (t.type === "note" || t.type === "example")
                content += "<div style=\"background: #eee; padding: 1rem\">";
            if (t.title) content += "<h3>" + esc(t.title) + "</h3>";
            content += t.content.replace(/href=\"#\/([^\"]+)\"/g, (match, s) => {
                return "href=\"" + makeFileName(s) + "\"";
            });
            if (t.type) content += "</div>";
        });

        // remember file name and title
        var itemName = item.code && (item.id && item.id.replace(/!/g, "")) || item.name || "";
        filesWritten.push(fileName);
        var linkText = item.textTopic || itemName.replace(/[\.\/]/g, " > ");
        if (item.isClass) linkText += " (class)";
        else if (item.isInterface) linkText += " (interface)";
        contentIndex[fileName] = linkText;

        // recurse for sub items
        if (item.items) {
            var subFileNames = writeContent(item.items, outDir, itemName, fileName);
            content += "<ul>"
            subFileNames.forEach(sub => {
                content += `<li><a href="${sub}">${esc(contentIndex[sub])}</a></li>`
            });
            content += "</ul>"
        }

        // write file
        var slug = item.textSlug || item.id || "";
        fs.writeFileSync(outDir + "/" + fileName + ".html",
            wrapItemContent(slug, content,
                itemName === item.name ? itemName : (item.name + " (" + itemName + ")"),
                upName, upFileName,
                stripCut(item.textSummary || item.doc)));
        return fileName;
    });
}

/** Write out the index to index.html */
function writeIndex(outDir) {
    var list = [];
    filesWritten.forEach(fileName => {
        list.push(`<li><a href="${fileName}">${esc(contentIndex[fileName])}</a></li>`);
    });

    fs.writeFileSync(outDir + "/index.html", `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Documentation Index</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="shortcut icon" type="image/png" href="/favicon.png" />
        <link href="/icons/css/font-awesome.min.css" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,300i,400,400i,600" rel="stylesheet">
        <style>
            html { font-size: 16px }
            body { margin: 0; padding: 0; font-family: "Source Sans Pro", sans-serif; text-align: center }
            header { background: linear-gradient(284deg, rgb(34, 187, 255) 0%, rgb(85, 0, 153) 100%); color: #fff; padding: 1rem }
            body > section { padding: 1rem; max-width: 32rem; margin: 0 auto; text-align: left }
        </style>
    </head>
    <body>
        <header>
            <h2>Typescene Documentation</h2>
        </header>
        <section>
            <h1>Text Index</h1>
            <p><i>Version ${version}</i></p>
            <ul>
                ${list.join("\n                ")}
            </ul>
        </section>
    </body>
</html>
`);
}

/** Wrap content for an item into a full HTML page */
function wrapItemContent(slug, content, name, upName, upFileName, description) {
    if (!description) description = "No description";
    description = `Typescene reference: ${name} - ${description}`;
    return `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>${esc(name)}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="${description}" />
        <link rel="shortcut icon" type="image/png" href="/favicon.png" />
        <link href="/icons/css/font-awesome.min.css" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,300i,400,400i,600" rel="stylesheet">
        <style>
            html { font-size: 16px }
            body { margin: 0; padding: 0; font-family: "Source Sans Pro", sans-serif; text-align: center }
            header { background: linear-gradient(284deg, rgb(34, 187, 255) 0%, rgb(85, 0, 153) 100%); color: #fff; padding: 3rem }
            body > section { padding: 1rem; max-width: 32rem; margin: 0 auto; text-align: left }
            pre { white-space: pre-wrap }
            .fa:first-child { paddingRight: .5rem }
        </style>
    </head>
    <body>
        <header>
            <p id="loadingText">Loading documentation viewer</p>
        </header>
        <script>
            !(function () {
                var l = document.getElementById("loadingText");
                var t = " " + l.textContent + " ";
                var s = 0, d;
                !(function u() {
                    var d = "", n = s = (s + 1) % 4;
                    while (n--) d += ".";
                    l.textContent = d + t + d;
                    if (!window.typescene) setTimeout(u, 500);
                })();
            })();
        </script>
        <section>
            <p>
                <a href="index.html">&lt; Text Index</a>
                ${ upFileName ? " | <a href=\"" + upFileName + "\">" + esc(upName) + "</a>" : "" }
            </p>
${content}
            <hr>
            <p>This is the documentation page for &ldquo;${esc(name)}&rdquo;, part of the Typescene toolkit.</p>
            <p>
                <a href="http://typescene.org">Typescene</a> |
                <a href="http://docs.typescene.org">Documentation</a> |
                <a href="http://docs.typescene.org/doc/index.html">Sitemap</a>
            </p>
        </section>
        ${ getDocsScript(slug) }
    </body>
</html>
`;
}

/** Helper that returns the script to open up the full docs experience */
let getDocsScript = (id) => `
    <script>
        !(function () {
            var xhr = new XMLHttpRequest();
            xhr.addEventListener("load", load);
            xhr.open("GET", "/index.${version}.html");
            xhr.send();
            function load() {
                var html = xhr.responseText
                    .replace(/^.!DOCTYPE.*\\n/gm, "")
                    .replace(/^.meta.*\\n/gm, "")
                    .replace(/^.title.*\\n/gm, "");
                var div = document.createElement("div");
                div.innerHTML = html;
                var oldHeader = document.body.querySelector("header");
                var oldContent = document.body.querySelector("section");
                var scripts = [];
                function execNextScript() {
                    if (scripts.length) document.body.appendChild(scripts.shift());
                }
                while (div.firstChild) {
                    var tag = div.firstChild.tagName;
                    if (tag && tag.toLowerCase() === "script") {
                        var script = document.createElement("script");
                        script.onload = execNextScript;
                        script.onerror = execNextScript;
                        script.src = div.firstChild.src;
                        div.removeChild(div.firstChild);
                        scripts.push(script);
                    }
                    else {
                        document.body.appendChild(div.firstChild);
                    }
                }
                execNextScript();
                var interval = setInterval(function () {
                    if (window.typescene) {
                        clearInterval(interval);
                        window.typescene.App.Application.ready.then(function () {
                            document.body.removeChild(oldHeader);
                            document.body.removeChild(oldContent);
                        });
                    }
                }, 10);
            }
        })();
    </script>
`;