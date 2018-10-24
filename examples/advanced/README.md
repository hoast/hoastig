# Advanced example

## Installation and usage

```
npm i --save
```

```
npm run build
```

## Explanation

### Underscore files

`src/site/content/_index.md` and `src/site/content/about/_index.hbs.md` both file names start with and underscore, however in the processed build the files will have been renamed to `dst/index.html` and `dst/about/index.html` with the underscore removed. This is done by setting the `rename.underscore` setting to true in the `hoastig.json` configuration. It is important to now that having both a `src/site/content/index.md` and `src/site/content/index.md` can lead to unpredictable results, as well as other files in the content directory starting with an underscore will be renamed too.

### Overriding files

`src/theme/static/icon.png` and `src/site/static/icon.png` both source directories contain a different icon with the same name. Since `theme` is first in the list it will be overridden by `site`, as a result the `B` icon will end up in the destination directory.

### Handlebars inside content files

`src/site/content/about/_index.hbs.md` the extension contains both `.md` and `.hbs` as a result the file will first be transformed from Markdown to HTML. Luckily it ignores any Handlebars code which means it can then be converted from Handlebars to HTML.
