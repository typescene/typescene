const fs = require("fs");
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

/** Recursive content writer implementation */
function writeContent(items, outDir, upName, upFileName) {
    return items.map(item => {
        var fileName = item.id.replace(/\//, "__").replace(/[^\w_.]/g, "-") + ".html";

        // compose content
        var content = "";
        content += "<h1>" + esc(item.name) + "</h1>";
        if (item.textSummary) content += "<p><i>" + esc(item.textSummary) + "</i></p>";
        if (item.code) content += "<pre><code>" + esc(item.code) + "</pre></code>";
        if (item.doc) content += item.doc;
        item.text && item.text.forEach(t => {
            if (t.type) content += "<div style=\"background: #eee; padding: 1rem\">";
            if (t.title) content += "<h3>" + esc(t.title) + "</h3>";
            content += t.content;
            if (t.type) content += "</div>";
        });

        // remember file name and title
        var itemName = item.code && item.id || item.name || "";
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
        fs.writeFileSync(outDir + "/" + fileName,
            wrapItemContent(slug, content,
                itemName === item.name ? itemName : (item.name + " (" + itemName + ")"),
                upName, upFileName,
                stripCut(item.textSummary || item.doc)));
        return fileName;
    });
}

/** Write out the index to index.html */
function writeIndex(outDir) {
    var lis = [];
    filesWritten.forEach(fileName => {
        lis.push(`<li><a href="${fileName}">${esc(contentIndex[fileName])}</a></li>`);
    });

    fs.writeFileSync(outDir + "/index.html", `<!DOCTYPE html>
<meta charset="utf-8">
<title>Documentation Index</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<body style="margin: 0; padding: 0; font: menu; text-align: center">
    <header style="background: #222; color: #eee; padding: 1rem">
        <h2>Typescene Documentation</h2>
    </header>
    <section style="padding: 1rem; max-width: 28rem; margin: 0 auto; text-align: left">
        <h1>Text Index</h1>
        <p><i>Version ${version}</i></p>
        <ul style="list-style-type: none">
            ${lis.join("\n            ")}
        </ul>
    </section>
</body>
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
        <style>
            body { margin: 0; padding: 0; font: menu; text-align: center }
            header { background: #222; color: #eee; padding: 1rem }
            body > section { padding: 1rem; max-width: 28rem; margin: 0 auto; text-align: left }
            pre { white-space: pre-wrap }
        </style>
    </head>
    <body>
        <header>
            <p>Loading documentation viewer...</p>
        </header>
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
                <a href="http://docs.typescene.org/${version}/content">Sitemap</a>
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
                location.hash = "#/${id || ""}";
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
                            window.typescene.Async.sleep(10).then(function () {
                                history.replaceState && history.replaceState(
                                    history.state || {},
                                    window.title, "/index.${version}.html" + location.hash)
                            });
                        });
                    }
                }, 10);
            }
        })();
    </script>
`;