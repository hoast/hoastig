<div align="center">
  
  [![](icons/128.png)](https://hoast.js.org)
  
  [![npm package @latest](https://img.shields.io/npm/v/hoastig.svg?label=npm@latest&style=flat-square&maxAge=3600)](https://npmjs.com/package/hoastig)
  [![npm package @next](https://img.shields.io/npm/v/hoastig/next.svg?label=npm@next&style=flat-square&maxAge=3600)](https://npmjs.com/package/hoastig/v/next)
  
  [![Travis-ci status](https://img.shields.io/travis-ci/com/hoast/hoastig.svg?branch=master&label=test%20status&style=flat-square&maxAge=3600)](https://travis-ci.com/hoast/hoastig)
  [![CodeCov coverage](https://img.shields.io/codecov/c/github/hoast/hoastig/master.svg?label=test%20coverage&style=flat-square&maxAge=3600)](https://codecov.io/gh/hoast/hoastig)
  
  [![License agreement](https://img.shields.io/github/license/hoast/hoastig.svg?style=flat-square&maxAge=86400)](https://github.com/hoast/hoastig/blob/master/LICENSE)
  [![Open issues on GitHub](https://img.shields.io/github/issues/hoast/hoastig.svg?style=flat-square&maxAge=86400)](https://github.com/hoast/hoastig/issues)
  
</div>

# hoastig

A static page generator made with [`hoast`](https://hoast.js.org). It is build to be simple, understandable, and functional out of the box in order to serve a basis to be changed by others to create a workflow that fits their needs as well as show the power of hoast.

The system builds by layering source directories in order to modularize site content and site layouts. It supports all the basic which you might expect from a static page generator. First `gray-matter` is used to extract front matter from markdown files. `markdown-it` is used to convert the Markdown content to HTML. `handlebars` enters the HTML content into layouts. Any CSS, JavaScript, and TypeScript files are processed using `postcss` and `babel`. Finally all CSS, HTML, and JavaScript files are minified using `clean-css`, `html-minifier`, and `terser` respectively.

## Table of contents

* [Installation and usage](#installation-and-usage)
  * [Command line interface](#command-line-interface)
  * [Script](#script)
  * [Development mode](#development-mode)
* [Configuration](#configuration)
* [Structure](#structure)
  * [Configuration file](#configuration-file)
  * [Destination directory](#destination-directory)
  * [Source directories](#source-directories)
* [Handlebars context](#handlebars-context)
  * [Content](#content)
  * [URLs](#urls)
* [Known issues](#known-issues)

## Installation and usage

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

> See [development mode](#development-mode) for more information about the `-d` and `--development` options.

### Script

If for any reason you want to use the static page generator as part of node application install it locally using `npm i --save hoastig`. After which you should be able to require it and call the asynchronous `hoastig(directory[, config, options])` function. See the table below for an explanation of each parameter as well as an example.

**Options**

* `directory`: Path to directory to work from, most likely `__dirname`.
  * Type: `String`
  * Required: `yes`
* `config`: Configuration, see [configuration](#configuration) for more details.
  * Type: `Object`
  * Required: `no`, see configuration section for default values.
* `options`: Process options.
  * `development`: Process in [development mode](#development-mode).
    * Type: `Boolean`
    * Default: `false`
  * `remove`: Remove the destination directory before processing.
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

### Development mode

The development mode is activated when the `-d` or `--development` options is set when using the command line interface, or the `options.development` boolean is set to true when using script. The difference between normal build mode and development build mode are listed below.

* If `development.concurrency` is set it will override `concurrency`.
* If `metadata.base_url` is set it will be overwritten using the `development.address` and `development.port`.
* Minification of the `.css`, `.html`, and `.js` will be disabled.

## Configuration

* `destination`: The directory to write the processed files to. Forward slashes (`/`) should be used as separators in the paths.
  * Type: `String`
  * Default: `dst`
* `sources`: The directories to process files from, whereby files in the directories later in the list overwrite files in the directories before it. Forward slashes (`/`) should be used as separators in the paths.
  * Type: `String` or `Array of strings`
  * Default: `[ "src" ]`
* `metadata`: Metadata given to the layouts.
  * Type: `Object`
  * Default: `{}`
* `rename`
  * `prettify`: Whether to prettify the file paths for the web. For example going from `article.html` to `article/index.html`.
    * Type: `Boolean`
    * Default: `true`
  * `underscore`: Whether to remove the underscore at the start of file names in the content directory.
    * Type: `Boolean`
    * Default: `false`
* `transform`: Advanced options used to modify how the CSS, Markdown, and JavaScript are transformed using PostCSS, Markdown-it, and Babel respectively.
  * `css`:
    * `plugins`: The plugins used by [PostCSS]() to process `.css` files.
  * `js`: The configuration used by [Babel](https://babeljs.io/docs/en/next/options) to process any `.js` and `.ts`. The `code` property is always set to `true`.
  * `md`: 
    * `highlight`: Differs from `mardown-it`'s highlight option! When set to true or to an object then highlighting of code blocks will be enabled. If set to an object it will be given as configuration options to [`Highlight.js`](https://highlightjs.readthedocs.io/en/latest/api.html#configure-options).
      * Type: `Boolean` or `Object`
      * Default: `false`
* `minify`
  * `css`: Options for [clean-css](https://github.com/jakubpawlowicz/clean-css#constructor-options).
    * Type: `Object`
    * Default: `{}`
  * `html`: Options for [html-minifier](https://github.com/kangax/html-minifier#options-quick-reference).
    * Type: `Object`
    * Default: `{ "collapseWhitespace": true, "removeComments": true }`
  * `js`: Options for [terser](https://github.com/terser-js/terser#minify-options).
    * Type: `Object`
    * Default: `{}`
* `concurrency`: Maximum number of files to process at once.
  * Type: `Number`
  * Default: `Infinity`
* `development`
  * `concurrency`: Override for `concurrency` during development mode.
    * Type: `Number`
    * Default: `undefined`
  * `host`: Address to use during development mode.
    * Type: `String`
    * Default: `localhost`
  * `port`: Process to use during development mode.
    * Type: `Number`
    * Default: `8080`

> The `css` and `js` options will also be given to the `html` minifier to use for CSS and JS content within files given to it.

**Defaults**

```JSON
{
  "destination": "dst",
  "sources": [
    "src"
  ],
  
  "metadata": {},
  
  "rename": {
    "prettify": true,
    "underscore": false
  },
  "transform": {
    "css": {
      "plugins": [
        [
          "postcss-preset-env", {
            "stage": 2
          }
        ]
      ]
    },
    "js": {
      "presets": [
        "@babel/presets-typescript",
        [
          "@babel/preset-env", {
            "targets": "> 1%, not dead"
          }
        ]
      ]
    },
    "md": {
      "html": true,
      "plugins": [
        "markdown-it-anchor"
      ]
    }
  },
  "minify": {
    "css": {},
    "html": {
      "collapseWhitespace": true,
      "removeComments": true
    },
    "js": {}
  },
  
  "concurrency": Infinity,
  
  "development": {
    "concurrency": undefined,
    "host": "localhost",
    "port": 8080
  }
}
```

## Structure

### Configuration file

When using the command line interface the configuration can be specified in a `.json` file. By default this will retrieve a `hoastig.json` in the directory the command is executed from, this can be overwritten using the `-c` or `--config` option. For more detail see the [configuration](#configuration) section.

### Destination directory

The destination directory is the directory relative to where the program is executed from and can be defined in the configuration file.

### Source directories

The source directories are a list of paths relative to the where the program is executed from and can be defined in the configuration file. This list can used to split parts of a site up in, for instance a theme and content directory. Each directory in the list will overwrite the previous one in the order they are provided in if duplicate files are found. Each source directory follows the following pattern of optional sub directories and files.

* `content`: Content files, each file will be transformed into a page. Files should have the `.hbs`, `.html`, or `.md` extension. Extension are eventually converted to `.html` if they are not already. Extension can also be chained so that a markdown file can include handlebar partials for instance. For example `page.hbs.md` will first be transformed from markdown to html, then it will be read as handlebars and transformed to html again, this time giving it the `.html` extension. Finally the resulting or pre-existing `.html` files will be minified.
* `decorators`: Handlebar decorators. Files should have the `.js` extension. The file should export a single handlebars decorator compatible function.
* `helpers`: Handlebar helpers. Files should have the `.js` extension. The file should export a single handlebars helper compatible function.
* `layouts`: Handlebar layouts. Files should have the `.hbs` extension.
* `partials`: Handlebar partials. Files should either have the `.hbs` or `.html` extension.
* `static`: Files in this directory will be transferred over to the root of the destinations directory. `.ccs`, `.html`, and `.js` will be automatically minified.
* `metadata.json`: A JSON file containing metadata for the layout context> The `config.json`'s metadata will be deeply assigned over this.

> Any files put in the root of a source directory or sub directories not specified in the list above will be ignored by the program. This is useful for storing any `README.md` or other miscellaneous files.

#### Default example

```
├── dst/
├── src/
│   ├── content/
│   ├── decorators/
│   ├── helpers/
│   ├── layouts/
│   ├── partials/
│   ├── static/
│   └── metadata.json
└── hoastig.json
```

#### Custom example

hoastig.json:

```JSON
{
  "destination": "destination",
  "sources": [
    "themes/theme",
    "site"
  ]
}
```

Directory structure:

```
├── destination/
├── site/
│   ├── content/
│   └── static/
└── themes/
│   └── theme/
│       ├── helpers/
│       ├── layouts/
│       ├── partials/
│       ├── static/
│       └── metadata.json
└── hoastig.json
```

> Do note the paths given to `sources` always use forward slashes as separators no matter the platform. Secondly any files in the `themes/theme` directory also present in the `site` directory are overwritten, because of the order specified under sources in the `hoastig.json`.

## Handlebars context

The context provided to the Handlebars files exists out of the meta data from the configuration file, values generated by hoastig, and the files front matter all merged into one object. The overview below shows which values are generated by hoastig during the building process.

### Content

* `content`: Content of the file.
  * Type: `String`
* `excerpt`: Excerpt of the content of the file. This can be marked down in the content of the file by using three hyphens after the front matter section of the file.
  * Type: `String`

**Examples**

Markdown files content:

```
---YAML
title: Lorem ipsum
---

Donec vulputate imperdiet aliquet. Fusce ac felis feugiat, sodales nisi id, vestibulum erat.

---

Maecenas congue, velit nec ultrices consectetur, dolor justo scelerisque augue, sed varius orci quam nec quam.

* Morbi tincidunt
* Enim lobortis
```

Resulting Handlebars context:

```JavaScript
{
  title: "Lorem ipsum",
  content: "<p>Donec vulputate imperdiet aliquet. Fusce ac felis feugiat, sodales nisi id, vestibulum erat.</p>\n<p>Maecenas congue, velit nec ultrices consectetur, dolor justo scelerisque augue, sed varius orci quam nec quam.</p>\n<ul>\n<li>Morbi tincidunt</li>\n<li>Enim lobortis</li>\n</ul>",
  excerpt: "Donec vulputate imperdiet aliquet. Fusce ac felis feugiat, sodales nisi id, vestibulum erat."
}
```

### URLs

* `site_url`: When the development option is set this will be set to the development host and port set in the configuration. Recommended to be set in the meta data of the configuration file as well.
  * Type: `String`
* `base_url`: The relative directory path to the page from the root of the destination directory. If `site_url` is set it will be prepended to this value to create an absolute url.
  * Type: `String`
* `page_url`: The relative file path to the page from the root of the destination directory. If `site_url` is set it will be prepended to this value to create an absolute url.
  * Type: `String`

**Examples**

For a file at path `content/example.md`:

```JavaScript
{
  base_url: "/example/",
  page_url: "/example/index.html"
}
```

For a file at path `content/example.md` with `rename.prettify` set to `false`:

```JavaScript
{
  base_url: "/",
  page_url: "/example.html"
}
```

For a file at path `content/example.md` with `site_url` set to `https://example.com`:

```JavaScript
{
  site_url: "https://example.com",
  base_url: "https://example.com/example/",
  page_url: "https://example.com/example/index.html"
}
```

For a file at path `content/example.md` with the `development` option set to `true`:

```JavaScript
{
  site_url: "http://localhost:8080",
  base_url: "http://localhost:8080/example/",
  page_url: "http://localhost:8080/example/index.html"
}
```
## Known issues

* Inline CSS and JavaScript/TypeScript is not processed by PostCSS and Babel.
* Not compatible with [pnpm](https://pnpm.js.org) a fast and disk space efficient alternative to the npm.