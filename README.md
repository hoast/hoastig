<div align="center">
  
  [![](icons/128.png)](https://hoast.github.io)
  
  [![npm package @latest](https://img.shields.io/npm/v/hoastig.svg?label=npm@latest&style=flat-square&maxAge=3600)](https://npmjs.com/package/hoastig)
  [![npm package @next](https://img.shields.io/npm/v/hoastig/next.svg?label=npm@next&style=flat-square&maxAge=3600)](https://npmjs.com/package/hoastig/v/next)
  
  [![License agreement](https://img.shields.io/github/license/hoast/hoastig.svg?style=flat-square&maxAge=86400)](https://github.com/hoast/hoastig/blob/master/LICENSE)
  [![Open issues on GitHub](https://img.shields.io/github/issues/hoast/hoastig.svg?style=flat-square&maxAge=86400)](https://github.com/hoast/hoastig/issues)
  
</div>

# hoastig

A static page generator made with [`hoast`](hoast.github.io). It is build to be simple, understandable, and functional out of the box, in order to show the power of `hoast` as well as serve a basis to by changed by others to create a workflow that fits their needs.

The system builds by layering source directories in order to modularize site content and site layouts. It supports all the basic which you might expect from a static page generator. First `gray-matter` is used to extract front matter from markdown files. `markdown-it` is used to convert the content. `handlebars` enters the content into specified layouts. Finally all CSS, HTML, and JavaScript are minified using `clean-css`, `html-minifier`, and `terser` respectively.

## Table of contents

* [Installation & usage](#installation-&-usage)
  * [Command line interface](#command-line-interface)
  * [Script](#script)
* [Configuration](#configuration)
* [Structure](#structure)
  * [Configuration file](#configuration-file)
  * [Destination directory](#destination-directory)
  * [Source directory](#source-directory)
* [License](#license)

## Installation & usage

### Command line interface

To use the command line interface you need to install the tool either locally or globally using the npm package manager which comes prepackaged with [Node.js](https://nodejs.org). After you have installed node run the following command to install the package globally with `npm i -g hoastig` or locally with `npm i --save hoastig`.

If you install it globally you can use the `hoastig [options]` command from anywhere on your device. Try running `hoastig --help` to see what commands you can use or see the overview below.

If you install it locally you can use the `node node_modules/hoastig/bin/hoastig` command from that package, so you can easily se a build command up in the `package.json`. To see what commands you can use see the overview below.

**Options**

```
-V, --version        output the version number
-h, --help           output usage information
-c, --config <path>  path to configuration file (default: hoastig.json)
-d, --development    process files in development mode
-r, --remove         remove destination directory beforehand
```

> `-d, --development` disables minification of any files as wel as overwrite the `base_url` variable in the `metadata` to a specified address and port in the [configuration file](#configuration).

### Script

If for any reason you want to use the static page generator as part of node application install it locally using `npm i --save hoastig`. After which you should be able to require it and call the asynchronous `hoastig(directory[, config, options])` function. See the table below for an explanation of each parameter as well as an example.

* `directory`: Path to directory to work from, most likely `__dirname`.
  * Type: `String`
  * Required: `yes`
* `config`: Process configuration, see [configuration](#configuration) for more details.
  * Type: `Object`
  * Required: `no`, see configuration section for default values.
* `options`: Process options.
  * Type: `Object`
  * Required: `{ development: false, remove: false }`.
* `options.development`: Whether to disable minification of any files as wel as overwrite the `base_url` variable in the `metadata` to a specified address and port in the [configuration file](#configuration).
  * Type: `Boolean`
  * Default: `false`
* `options.remove`: whether to remove the destination directory before starting to process files.
  * Type: `Boolean`
  * Default: `false`

**Example**

```JavaScript
import hoastig from "hoastig";

const config = {},
      options = {};

hoastig(__dirname config, options);
```

> The function is asynchronous and can therefore be used in combination with the `await` keyword.

## Configuration

* `destination`: The directory to write the processed files to.
  * Type: `String`
  * Default: `dst`
* `source`: The directory to process files from.
  * Type: `String`
  * Default: `src`
* `sources`: The subdirectories to process files from, whereby the directories later in the list overwrite files in the directories before it.
  * Type: `Array of strings`
  * Default: `['']`
* `metadata`: Metadata given to the layouts.
  * Type: `Object`
  * Default: `{}`
* `concurrency`: Maximum number of files to process at once.
  * Type: `Number`
  * Default: `Infinity`
* `minify`
  * `css`: Options for [clean-css](https://github.com/jakubpawlowicz/clean-css#constructor-options).
    * Type: `Object`
    * Default: `{}`
  * `html`: Options for [html-minifier](https://github.com/kangax/html-minifier#options-quick-reference).
    * Type: `Object`
    * Default: `{ "collapseWhitespace": true, "removeComments": true }`
  * `js`: Options for [tenrser](https://github.com/terser-js/terser#minify-options).
    * Type: `Object`
    * Default: `{}`
* `development`
  * `host`: Address to use in a development build.
    * Type: `String`
    * Default: `localhost`
  * `port`: Process to use in a development build.
    * Type: `Number`
    * Default: `8080`

> The `css` and `js` options will also be given to the `html` minifier to use for CSS and JS content within files given to it.

**Defaults**

```JSON
{
  "destination": "dst",
  "source": "src",
  "sources": [
    ""
  ],
  "metadata": {},
  
  "concurrency": Infinity,
  "minify": {
    "css": {},
    "html": {
      "collapseWhitespace": true,
      "removeComments": true
    },
    "js": {}
  },
  
  "development": {
    "host": "localhost",
    "port": 8080
  }
}
```

## Structure

### Configuration file

When using the command line interface the configuration can be specified in a `.json` file. By default this will retrieve a `hoastig.json` in the directory the command is executed from, this can be overwritten using the `-c` or `--config` option. For more detail see the [configuration](#configuration) section.

### Destination directory

The destination directory is the directory relative to where the command is executed from and can be defined in the configuration file, by default this is set to `dst`.

### Source directory

The source directory is the directory relative to where the command is executed from and can be defined in the configuration file, by default this is set to `src`. A separate list of sources can be specified which are contained within the source directory. This list can be used to split parts of a site out in for instance a theme and content, by default this list is set to `[ "" ]`. The directories overwrite the previous one in the order they are provided in. The defaults result into taking the `src` directory as the root and only directory to build. Each source directory follows the following pattern of directories.

* `content`: Content files, each file will be transformed into a page. Files should have the `.hbs`, `.html`, or `.md` extension. Extension are eventually converted to `.html` if they are not already. Extension can also be chained so that a markdown file can include handlebar partials for instance. For example `page.hbs.md` will first be transformed from markdown to html, then it will be read as handlebars and transformed to html again, this time giving it the `.html` extension. Finally the resulting or pre-existing `.html` files will be minified.
* `decorators`: Handlebar decorators. Files should have the `.js` extension. The file should export a single handlebars decorator compatible function.
* `helpers`: Handlebar helpers. Files should have the `.js` extension. The file should export a single handlebars helper compatible function.
* `layouts`: Handlebar layouts. Files should have the `.hbs` extension.
* `partials`: Handlebar partials. Files should either have the `.hbs` or `.html` extension.
* `static`: Files in this directory will be transferred over to the root of the destinations directory. `.ccs`, `.html`, and `.js` will be automatically minified.

> Any files put in the root of a source directory or directories not specified in the list above will be ignored by the program. This is useful for storing any `README.md` or other miscellaneous files and directories.

#### Default example

```
├── dst/
├── src/
│   ├── content/
│   ├── decorators/
│   ├── helpers/
│   ├── layouts/
│   ├── partials/
│   └── static/
└── hoastig.json
```

#### Custom example

hoastig.json:

```JSON
{
  "destination": "destination",
  "source": "source",
  "sources": [
    "theme",
    "site"
  ]
}
```

Directory structure:

```
├── destination/
├── source/
│   ├── site/
│   │   ├── content/
│   │   └── static/
│   └── theme/
│       ├── helpers/
│       ├── layouts/
│       ├── partials/
│       └── static/
└── hoastig.json
```

> Do note in this example any files in the `theme` directory also present in the `site` directory are overwritten because of the order specified under sources in the `hoastig.json`.

## License

[ISC license](https://github.com/hoast/hoast/blob/master/LICENSE)