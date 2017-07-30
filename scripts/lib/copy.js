const fs = require("fs");
const path = require("path");

module.exports = {
    // helper function to copy a file
    file: function (src, ...destPath) {
        var fileName = src.replace(/^.*[\/\\]([^\/\\]+)$/, "$1");
        var data = fs.readFileSync(src);
        destPath.forEach(p => {
            fs.writeFileSync(path.join(p, fileName), data);
        });
    },

    // helper function to copy a folder
    folder: function (srcPath, destPath) {
        var files = fs.readdirSync(srcPath);
        files.forEach(fileName => {
            var stats = fs.statSync(path.join(srcPath, fileName));
            if (stats.isDirectory()) {
                var doesExist = fs.existsSync(path.join(destPath, fileName));
                if (!doesExist) fs.mkdirSync(path.join(destPath, fileName));
                this.folder(path.join(srcPath, fileName), path.join(destPath, fileName));
            }
            else {
                this.file(path.join(srcPath, fileName), destPath);
            }
        });
    }
}
