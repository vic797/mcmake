const fs = require("fs");
const process = require('process');
const path = require("path");
const ArgumentParser = require("argparse").ArgumentParser;
const builder = require("./make");
const readlineSync = require("readline-sync");
const JSZip = require("jszip");
const tmp = require("tmp");

function checkMinecraft() {
    if (!fs.existsSync(builder.getMinecraftPath())) {
        abort("Minecraft folder not found!", 1);
    }
}

/**
 * Aborts the process
 * @param {string} message Exit message
 * @param {number} code Exit code
 */
function abort(message, code) {
    console.error(message);
    process.exit(code);
}

/**
 * Initializes a new datapath in path. If path is not set creates a new datapack in the current directory
 * @param {string} path Path to initialize a new datapack
 */
function initialize(dire) {
    var worlds = builder.getMinecraftPath();
    if (fs.existsSync(worlds)) {
        const end = require("os").EOL;
        var saves = [];
        var slist = fs.readdirSync(path.join(worlds, "saves"));
        for (var i = 0; i < slist.length; i++) {
            if (fs.lstatSync(path.join(worlds, "saves", slist[i])).isDirectory()) {
                saves.push(slist[i]);
            }
        }
        var dirname = readlineSync.question("Datapack name: ");
        var desc = readlineSync.question("Datapack description: ");
        var ns = readlineSync.question("Datapack main namespace: ");
        var index = readlineSync.keyInSelect(saves, "Test world: ");
        if (index < 0) {
            abort("Canceled!", 1);
        }
        var text = "# Build instructions" + end +
            "testworld: " + saves[index] + end +
            "name: " + dirname + end +
            "description: " + desc + end +
            "format: 1" + end + end +
            "# Global variables" + end +
            "# Put your variables here" + end +
            "hello: Hello, world!" + end;
        fs.writeFileSync(path.join(dire, "pack.yml"), text);
        fs.mkdirSync(path.join(dire, ns));
        console.log("Generated new datapack in " + dire)
    } else {
        abort("Minecraft folder not found!", 1);
    }
}

/**
 * Builds a data pack located at path. If path is not set builds a datapack in the
 * current directory if possible
 * @param {string} path Path to the datapack to build
 * @param {string} output A path to write the output, overwriting "testworld" in "pack.yml"
 */
function make(dire, output) {
    var result = builder.build(dire, output);
    if (!result.success) {
        abort(result.message);
    }
}

/**
 * Compresses a data pack into a single ZIP file
 * @param {JSZip} zip JSZip instance
 * @param {string} dir Directory to compress
 */
function zipFolder(zip, dir) {
    var cont = fs.readdirSync(dir);
    for (var i = 0; i < cont.length; i++) {
        var ent = path.join(dir, cont[i]);
        if (fs.lstatSync(ent).isDirectory()) {
            var zdir = zip.folder(cont[i]);
            zipFolder(zdir, ent);
        } else {
            zip.file(cont[i], fs.readFileSync(ent, { encoding: "utf-8" }));
        }
    }
}

/**
 * Main entry point
 */
function main() {
    var parser = new ArgumentParser({
        version: "1.0",
        prog: "mcmake",
        addHelp: true,
        description: "MCmake - Minecraft Function Compiler",
        epilog: "Note: '--init', '--make' and '--zip' are mutualy exclusive. Can not be used together."
    });
    parser.addArgument(
        ["-i", "--init"], {
            help: "Initializes a new data pack.",
            action: "storeTrue"
        }
    );
    parser.addArgument(
        ["-m", "--make"], {
            help: "Builds the data pack.",
            action: "storeTrue"
        }
    );
    parser.addArgument(
        ["-z", "--zip"], {
            help: "Builds and compresses the data pack into a ZIP file."
        }
    );
    parser.addArgument(
        ["-p", "--path"], {
            help: "Optional argument. If set, modifies the output directory for any other argument; beeing the current directory by default.",
            defaultValue: "."
        }
    );
    checkMinecraft();
    var args = parser.parseArgs();
    if ((args.init && args.make) ||
        (args.make && args.zip != null) ||
        (args.init && args.zip != null) ||
        (args.init && args.make && args.zip != null)) {
        abort("Ilegal agument combination!", 1);
    } else {
        if (args.init) {
            initialize(args.path);
        } else if (args.make) {
            make(args.path);
        } else if (args.zip) {
            var jz = new JSZip();
            var tmpobj = tmp.dirSync({ unsafeCleanup: true });
            make(args.path, tmpobj.name);
            zipFolder(jz, tmpobj.name);
            jz.generateAsync({ type: "nodebuffer" }).then(function(content) {
                fs.writeFileSync(args.zip, content);
            }).catch(function(reason) {
                console.error(reason);
            });
            tmpobj.removeCallback();
        }
    }
}

main();