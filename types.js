const yaml = require("js-yaml");

function Range(b, e) {
    this.cls = "range";
    this.begin = b;
    this.end = e;
}

function Coordinates(cx, cy, cz) {
    this.cls = "coord";
    this.x = cx;
    this.y = cy;
    this.z = cz;
}

function Id(ie) {
    this.cls = "id";
    this.fullid = "minecraft:" + ie;
    this.id = ie;
}

var rangeType = new yaml.Type("!range", {
    kind: "sequence",
    resolve: function(data) {
        return data !== null && data.length === 2;
    },
    construct: function(data) {
        return new Range(data[0], data[1]);
    },
    instanceOf: Range,
    represent: function(range) {
        return [range.end, range.begin];
    }
});

var coordsType = new yaml.Type("!coord", {
    kind: "sequence",
    resolve: function(data) {
        return data !== null && data.length === 3;
    },
    construct: function(data) {
        return new Coordinates(data[0], data[1], data[2]);
    },
    instanceOf: Coordinates,
    represent: function(coord) {
        return [coord.x, coord.y, coord.z];
    }
});

var idType = new yaml.Type("!mcid", {
    kind: "scalar",
    resolve: function(data) {
        return data !== null;
    },
    construct: function(data) {
        return new Id(data);
    },
    instanceOf: Id,
    represent: function(mcid) {
        return mcid.fullid;
    }
});

var MINECRAFT_SCHEMA = yaml.Schema.create([rangeType, coordsType, idType]);

module.exports.rangeType = rangeType;
module.exports.coordsType = coordsType;
module.exports.idType = idType;
module.exports.MINECRAFT_SCHEMA = MINECRAFT_SCHEMA;