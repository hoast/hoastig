# Changelog

## 1.2.0 (2018-11-20)
### Added
- Checkbox plugin added to Markdown transformation.
- Highlighting added to Markdown transformation.
- `metadata.json` files support added.

## 1.1.8 (2018-10-28)
### Changed
- Updated `hoast` and `hoast-layout` to versions `1.1.4` and `1.3.0` respectively.
- Switched to using `hoast.helpers.deepAssign` instead of custom `merge` utility function.
- Rewrote retrieval of Handlebars' `decorators`, `helpers`, and `partials` options.
- Restructured scripts in `library` directory.

## 1.1.7 (2018-10-27)
### Changed
- Updated `hoast-layouts` to version `1.2.3`.

## 1.1.6 (2018-10-27)
### Added
- `development.concurrency` added to config for overwriting `concurrency` when using the development option.
### Changed
- Updated `hoast-layouts` to version `1.2.2`.

## 1.1.5 (2018-10-26)
### Fixed
- Fixed resolving extensions, whereby the first extensions in the resolve list was not taken into account.

## 1.1.4 (2018-10-25)
### Fixed
- Fixed using sub-directories in `destination` and `sources` config options.

## 1.1.3 (2018-10-24)
### Changed
- updated hoast and the hoast modules.
### Fixed
- Prettified file paths, `base_url` front matter values, and `page_url` front matter values fixed by assuming only `.hbs`, `.handlebars`, `.md`, `.markdown`, and `.markdown-it` will be transformed and therefore removed.
### Removed
- `config.source` has been deprecated, but legacy support still remains.

## 1.1.2 (2018-10-16)
### Added
- `base_url` and `page_url` will be added to the front matter of content files.

## 1.1.1 (2018-10-15)
### Added
- `rename.prettify` added to config, disabling this will not prettify urls of content files.
- `rename.underscore` added to config, enabling this will remove the first underscore of content files.
### Changed
- `debug` Changed from dependency to devDependency.
- Renamed `library/get/data.js` to `library/get/files.js`.
### Removed
- Assertions removed from `library/get/files.js` and `library/get/functions.js`.
### Fixed
- Optimized assigning excerpts to front matter.

## 1.0.3 (2018-10-11)
### Added
- `hoast-minify` added to process.
### Removed
- `hoast-convert` removed as `hoast-minify` takes its function. Therefore `clean-css`, `html-minifier`, and `terser` are now indirectly dependencies via `hoast-minify` as well.

## 1.0.2 (2018-10-11)
### Added
- Eslint testing added with travis-ci.
### Fixed
- CSS minification fixed.
- Command line interface flags -V and -h fixed.

## 1.0.1 (2018-10-10)
### Added
- `hoast` icon added to `README.md`.
### Changed
- Rewrote sections of `README.md`.

## 1.0.0 (2018-10-10)
Initial release.