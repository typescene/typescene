var fs = require("fs");
var path = require("path");

// process all files in the typings directory
fs.readdirSync("typings").forEach(file => {
    if (file.endsWith(".js")) {
        // delete emitted js files
        fs.unlinkSync("typings/" + file);
    }
});
