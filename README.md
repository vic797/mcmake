# MCmake

**MCmake** is a tool for making [data packs](https://minecraft.gamepedia.com/Data_pack) for [Minecraft](https://www.minecraft.net/) that supports [variables](https://en.wikipedia.org/wiki/Variable_(computer_science)), conditions and loops. MCmake is ment to avoid coping entire commands over and over only to change a block id or a number. MCmake uses [YAML](https://en.wikipedia.org/wiki/YAML) for the data.

> YAML is a human-readable data-serialization language.

## Installing

Download the stand alone executables from [releases](https://github.com/vic797/mcmake/releases)

## Running from source

To run from source you need [NodeJS](https://nodejs.org/).

## How to use MCmake

In a **Terminal** or **Command prompt**:

```bash
mcmake [-h] [-v] [-i] [-m] [-z ZIP] [-p PATH]
# Or
mcmake [--help] [--version] [--init] [--make] [--zip ZIP] [--path PATH]
```

|Argument|What it does|
|---|---|
|`-i`, `--init`|Initializes a new MCmake Data Pack, can be used with `--path`|
|`-m`, `--make`|Builds a MCmake Data Pack, can be used with `--path`|
|`-z`, `--zip`|Compiles and compresses a data pack, can be used with `--path`|
|`-p`, `--path`|Selects a path where, if used with `--init`, the new data pack will be generated or, if used with `--make`,  or `--zip` the MCmake Data Pack is located|

> **Note:** `--init`, `--make` and `--zip` are mutualy exclusive. Can not be used together.

### Examples

```bash
# Initialize a data pack in the current directory
mcmake -i
# Or
mcmake --init

# Initialize a data pack in another directory
mcmake -i -p "path/to/your/datapack"
# Or
mcmake --init --path "path/to/your/datapack"

# Build a data pack in the current directory
mcmake -m
# Or
mcmake --make

# Build a data pack in another directory
mcmake -m -p "path/to/your/datapack"
# Or
mcmake --make --path "path/to/your/datapack"

# Compress a data pack
mcmake -z "path/to/the/zip/file.zip"
# Or
mcmake --zip "path/to/the/zip/file.zip"

# Compress a data pack in another directory
mcmake -z "path/to/the/zip/file.zip" -p "path/to/your/datapack"
# Or
mcmake --zip "path/to/the/zip/file.zip" --path "path/to/your/datapack"
```

> **Note:** MCmake **can not** be used with any regular data pack.

## How it works

MCmake uses a file called `pack.yml` that looks like this:

```yaml
# Build instructions
name: test datapack
description: A simple test datapack
format: 1
testworld: My world

# Global variables
hello: Hello, world!
```

Where this tags **must** exists:

* `name` is the name of the directory that will contain the datapack.
* `description` is the description of the data pack.
* `format` is the format of the data pack. Always `1`.
* `testworld` is the name of the testing world (ignored when compressing to `.zip`). The compiled datapack will be generated inside `.minecraft/saves/[testworld]/datapacks/[name]`.

> **Note:** `description` and `format` are used to generate the `pack.mcmeta` file.

Bellow `# Global variables` you can add your own variables. YAML uses the format `key: value` for simple values; supports strings, numbers, booleans and lists.

```yaml
# String
hello: Hello world

# Number
score: 10

# Boolean
show: true
# Or
show: false

# Lists
blocks: [minecraft:dirt, minecraft:cobblestone, minecraft:water]
# Or
blocks:
 - minecraft:dirt
 - minecraft:cobblestone
 - minecraft:water
```

> **Note:** YAML also supports sub-keys but they are not used in MCmake

### How to use variables

#### Strings and Numbers

In any `mcfunction` file you can use variables like `$key`. For example, considering the example `pack.yaml` you can use the variable `hello` like this:

```
say $hello
```

And the output file will look like this:

```
say Hello, world!
```

#### Booleans

You can output a command depending of a `true` or `false` value of a variable. For example, if you are testing your data pack you could have a variable `testing`:

```yaml
testing: true
```

And in your `mcfunction` you have a line that in the form of `$testing? command`; then this line will only be writen to the output file **if** `testing` **is true**:

```
$testing? tellraw @a ["",{"text":"Testing mode","color":"green"}]
```

You can also output a line by inverting the value (**true** turns **false** and **false** turns **true**) by adding a `!` after the `$`:

```
# In this case the command will not be writen because 'testing'
# is true and is turned into false

$!testing? tellraw @a ["",{"text":"Testing mode disabled","color":"red"}]
```

#### Lists

Considering this list: 

```yaml
blocks: 
  - minecraft:grass
  - minecraft:dirt
  - minecraft:stone
```

On your `mcfunction` you will have something like: 

```
$blocks& execute if block ~ ~-1 ~ $_ run say Block~!
```

Notice the `&` after the variable name; this indicates MCmake that you want to use a list. Also notice the `$_`; this is changed for an entry in the list. 

The generated file will look like this: 

```
execute if block ~ ~-1 ~ minecraft:grass run say Block~!
execute if block ~ ~-1 ~ minecraft:dirt run say Block~!
execute if block ~ ~-1 ~ minecraft:stone run say Block~!
```

#### Ranges

> **Note:** ranges are not a standar YAML type.

A range is a custom type that MCmake uses to repeat a command `n` times.

```yaml
# A range that goes from 1 to 5
values: !range [1, 5]
```

To use a range use the syntax `$name% command`:

```
$range% say Value $_
```

> **Note**: the `$_` works like in lists.

And the output file will look like this:

```
say Value 1
say Value 2
say Value 3
say Value 4
say Value 5
```

#### Exports

An exported block inside a function is a group of commands that are writen to another file when compiled. Export blocks begin with `!export "filename"` (where _filename_ is the name of the function) and ends with `!end-export`. For example, this function contains a `!export` block:

```
say Not exported function

!export "example"
say Exported function
!end-export
```

When compiled two files will be generated:

```
say Not exported function
```

And another file called `example.mcfunction`:

```
say Exported function
```
