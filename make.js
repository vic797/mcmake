const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const os = require("os");
const mctypes = require("./types");

module.exports = make = {

    /**
     * Get the '.minecraft' folder on any platform
     * @returns {string} The '.minecraft' folder
     */
    getMinecraftPath: function() {
        switch (os.platform()) {
            case "win32":
            case "win64": //???
                return path.join(os.homedir(), "AppData", "Roaming", ".minecraft");
            case "darwin":
                return path.join(os.homedir(), "Library", "Application Support", "minecraft");
            case "linux":
            default:
                return path.join(os.homedir(), ".minecraft");
        }
    },

    /**
     * Builds a datapack located in the directory set by dir
     * @param {string} dir Input directory
     * @param {string} forcedout A forced output directory 
     * @returns {object} An object with 'success' (boolean) and 'message' (string)
     */
    build: function(dir, forcedout) {
        console.log("Building " + dir);
        var meta = path.join(dir, "pack.yml");
        if (fs.existsSync(meta)) {
            try {
                var text = fs.readFileSync(meta, { encoding: "utf-8" });
                var data = yaml.load(text, { schema: mctypes.MINECRAFT_SCHEMA });
                return make.buildWith(data, dir, forcedout);
            } catch (e) {
                return { success: false, message: e };
            }
        } else {
            return { success: false, message: "File '" + meta + "' not found" };
        }
    },

    /**
     * Builds a datapack located in the directory set by dir with the data set
     * by data
     * @param {object} data Input data from 'pack.yml'
     * @param {string} dir Output directory
     * @param {string} forcedout A forced output directory 
     * @returns {object} An object with 'success' (boolean) and 'message' (string)
     */
    buildWith: function(data, dir, forcedout) {
        if (!("name" in data)) {
            return { success: false, message: "'name' attribute not defined!" };
        }
        var output = dir;
        if (forcedout !== undefined) {
            output = forcedout;
            if (!fs.existsSync(output)) {
                return { success: false, message: "Directory '" + output + "' not found!" };
            }
        } else {
            if ("testworld" in data) {
                output = path.join(make.getMinecraftPath(), "saves", data["testworld"], "datapacks");
            } else {
                return { success: false, message: "Save '" + data["testworld"] + "' not found!" };
            }
        }
        console.log("Building " + dir + " into " + output);
        if (fs.existsSync(output)) {
            if (forcedout === undefined) output = path.join(output, data["name"]);
            //make.deleteDir(output);
            if (!fs.existsSync(output)) fs.mkdirSync(output);
            make.makeMeta(data, output);
            if (!fs.existsSync(output)) fs.mkdirSync(output);
            return make.compile(dir, output, data);
        } else {
            return { success: false, message: "Save '" + data["testworld"] + "' does not contains a 'datapacks' directory!" };
        }
    },

    /**
     * Copiles all the files in input into output
     * @param {strung} input Input directory
     * @param {string} output Output directory
     * @param {object} data Data
     */
    compile: function(input, output, data) {
        var dirs = fs.readdirSync(input);
        for (var i = 0; i < dirs.length; i++) {
            var dir = dirs[i];
            var file = path.join(input, dir);
            if (fs.lstatSync(file).isDirectory()) {
                var result = make.compile(file, path.join(output, dir), data);
                if (!result.success) {
                    return result;
                }
            } else {
                if (dir.endsWith("mcfunction") || dir.endsWith("json") || dir.endsWith("mcmeta")) {
                    var result = make.compileFile(file, path.join(output, dir), data);
                    if (!result.success) {
                        return result;
                    }
                } else if (dir !== "pack.yml") { //Don't copy 'pack.yml'
                    var result = make.copyFile(file, path.join(output, dir));
                    if (!result.success) {
                        return result;
                    }
                }
            }
        }
        return { success: true, message: "" };
    },
    /*
    /**
     * Deletes a directory tree
     * @param {string} path Path to folder
     *
    deleteDir: function(path) {
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach(function(file, indes) {
                var curPath = path + "/" + file;
                if (fs.lstatSync(curPath).isDirectory()) {
                    make.deleteDir(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    },
    */
    /**
     * Copiles a single file
     * @param {string} file Input file
     * @param {string} out Output file
     * @param {object} data Data
     */
    compileFile: function(file, out, data) {
        console.log("Processing file " + file);
        var file = fs.readFileSync(file, { encoding: "utf-8" });
        var lines = file.split(/(\r\n|\r|\n)/g);
        var outtext = "";
        var exreg = /^!export "([^"]*)"$/; // Export regex (begin)
        var eexreg = "!end-export"; // End export
        var exported = [];
        var exporting = false;
        var exportarget = "";
        for (var i = 0; i < lines.length; i++) {
            var ln = lines[i];
            if (exreg.test(ln)) { //Begin export
                if (exporting) {
                    // If already exporting...
                    return { success: false, message: "Requested exporting on " + file + " at line " + (i + 1) + ". An '!export' inside another may cause output errors" };
                }
                exporting = true;
                exported = [];
                exportarget = "";
                var tar = exreg.exec(ln);
                exportarget = tar[1];
            } else if (eexreg == ln) { // End export
                if (exporting) {
                    make.exportFile(path.join(path.dirname(out), exportarget) + ".mcfunction", exported);
                }
                exporting = false;
            } else {
                if (exporting) {
                    exported.push(make.processLine(ln, data, i));
                } else {
                    outtext += make.processLine(ln, data, i) + os.EOL;
                }
            }
        }
        outtext = outtext.replace(/[\r\n]+/g, os.EOL);
        var parent = path.dirname(out);
        if (!fs.existsSync(parent)) {
            fs.mkdirSync(parent, { recursive: true });
        }
        fs.writeFileSync(out, outtext, { encoding: "utf-8" });
        return { success: true, message: "" };
    },

    exportFile: function(file, lines) {
        var text = lines.join(os.EOL).replace(/[\r\n]+/g, os.EOL);
        var parent = path.dirname(file);
        if (!fs.existsSync(parent)) {
            fs.mkdirSync(parent, { recursive: true });
        }
        fs.writeFileSync(file, text, { encoding: "utf-8" });
    },

    /**
     * Processes a single line replacing anything that matches '\$(\w+)' with its corresponding value
     * @param {string} line Line to process
     * @param {object} data Data
     */
    processLine: function(line, data, index) {
        if (line.startsWith("#"))
            return line;
        if (/^\$(\w+)\?\s+(.*)$/g.test(line)) {
            return line.replace(/^\$(\w+)\?\s+(.*)$/g, function(m0, m1, m2) {
                if (m1 in data && (typeof data[m1] === "boolean") && data[m1]) {
                    return make.processLine(m2, data);
                } else {
                    return "";
                }
            });
        } else if (/^\$!(\w+)\?\s+(.*)$/g.test(line)) {
            return line.replace(/^\$!(\w+)\?\s+(.*)$/g, function(m0, m1, m2) {
                if (m1 in data && (typeof data[m1] === "boolean") && !data[m1]) {
                    return make.processLine(m2, data);
                } else {
                    return "";
                }
            });
        } else if (/^\$(\w+)&\s+(.*)$/g.test(line)) {
            return line.replace(/^\$(\w+)&\s+(.*)$/g, function(m0, m1, m2) {
                if (m1 in data && Array.isArray(data[m1])) {
                    var out = "";
                    for (var i = 0; i < data[m1].length; i++) {
                        out += make.processLine(m2.replace("$_", data[m1][i]), data) + os.EOL;
                    }
                    return out;
                } else {
                    console.error(m1 + " is not a list at line " + (index + 1));
                    return "";
                }
            });
        } else if (/^\$(\w+)%\s+(.*)$/.test(line)) {
            return line.replace(/^\$(\w+)%\s+(.*)$/g, function(m0, m1, m2) {
                if (m1 in data && (typeof data[m1] === "object") && "cls" in data[m1] && data[m1].cls == "range") {
                    var out = "";
                    var r = data[m1];
                    for (var i = r.begin; i <= r.end; i++) {
                        out += make.processLine(m2.replace("$_", "" + i), data) + os.EOL;
                    }
                    return out;
                } else {
                    console.error(m1 + " is not a range at line " + (index + 1));
                    return "";
                }
            });
        } else {
            return line.replace(/\$(\w+)/g, function(m0, m1) {
                if (m1 in data) {
                    return data[m1];
                } else {
                    console.error(m1 + " is not defined at line " + (index + 1));
                    return "";
                }
            });
        }
    },

    copyFile: function(file, out) {
        console.log("Coping file " + file);
        var text = fs.readFileSync(file);
        parent = path.dirname(out);
        if (!fs.existsSync(parent)) {
            fs.mkdirSync(parent);
        }
        fs.writeFileSync(out, text);
        return { success: true, message: "" };
    },

    /**
     * Creates the 'pack.mcmeta' file
     * @param {object} data Data from 'pack.yml'
     * @param {string} dir Output directory
     */
    makeMeta: function(data, dir) {
        var meta = { pack: {} };
        if ("description" in data) {
            meta.pack["description"] = data["description"];
        } else {
            meta.pack["description"] = "";
        }
        if ("pack_format" in data) {
            meta.pack["pack_format"] = data["pack_format"];
        } else {
            meta.pack["pack_format"] = 1;
        }
        fs.writeFileSync(path.join(dir, "pack.mcmeta"), JSON.stringify(meta, null, 4), { encoding: "utf-8" });
    },
    /*
    mergeDicts: function(dict1, dict2) {
        var out = {};
        for (var key in dict1) {
            out[key] = dict1[key];
        }
        for (var key in dict2) {
            out[key] = dict2[key];
        }
        return out;
    }*/
}

//module.exports = make;