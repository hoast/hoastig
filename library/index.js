// Node modules.
const fs = require(`fs`),
	path = require(`path`);

// If debug available require it.
let debug; try { debug = require(`debug`)(`hoastig`); } catch(error) { debug = function() {}; }

// hoast modules.
const Hoast = require(`hoast`);
const read = Hoast.read,
	changed = require(`hoast-changed`),
	filter = require(`hoast-filter`),
	frontmatter = require(`hoast-frontmatter`),
	layout = require(`hoast-layout`),
	minify = require(`hoast-minify`),
	rename = require(`hoast-rename`),
	transform = require(`hoast-transform`);

// Front matter extraction library.
const graymatter = require(`gray-matter`);

// Custom libraries.
const merge = require(`./utils/merge`);
const getFiles = require(`./get/files`),
	getFunctions = require(`./get/functions`);

module.exports = async function(directory, config = {}, options = {}) {
	debug(`Start hoastig.`);
	
	debug(`Start merging configuration with default.`);
	// Override default config with user defined config.
	config = merge({
		development: {
			host: `localhost`,
			port: 8080
		},
		
		destination: `dst`,
		source: `src`,
		sources: null,
		metadata: {},
		
		concurrency: Infinity,
		minify: {
			css: {},
			html: {
				collapseWhitespace: true,
				removeComments: true
			},
			js: {}
		},
		rename: {
			prettify: true,
			underscore: false
		}
	}, config);
	debug(`Config assigned over default.`);
	
	// If in development overwrite 'base_url' in metadata.
	if (options.development) {
		config.metadata.base_url = `http://${config.development.host}:${config.development.port}`;
		debug(`Development flag set, metadata.base_url is set to '${config.metadata.base_url}'.`);
	}
	
	debug(`Start hoast initialization.`);
	// Initialize hoast.
	const hoast = Hoast(directory, {
		source: config.source,
		destination: config.destination,
		
		remove: options.remove,
		concurrency: config.concurrency,
		
		metadata: config.metadata
	});
	// Create absolute path to source directory.
	const absoluteSource = path.join(hoast.directory, hoast.options.source);
	
	// Start adding to module stack.
	hoast
		// Filter out everything not within the content and static directories in directories.
		.use(filter({
			// Create patterns for each source directory.
			patterns: config.sources ? config.sources.map(function(source) {
				return [ `content`, `static` ].map(function(directory) {
					return `${source}/${directory}/*`;
				});
			})
				// Flatten array.
				.reduce(function(previous, current) {
					return previous.concat(current);
				})
				// If no sources given then default.
				: [ `content/*`, `static/*` ]
		}));
	
	if (config.sources && config.sources.length > 1) {
		// Filter out files in the current directory if an equivalent file is in a directory after it.
		// In other words removing duplicate files later on.
		config.sources.forEach(function(source, index) {
			// Skip if last in list.
			if (index + 1 >= config.sources.length) {
				return;
			}
			
			// Add filter duplicate filter checking any sub-sequent sources.
			hoast.use(filter({
				engine: async function(file) {
					// For each directory listed below the current directory.
					for (let i = index + 1; i < config.sources.length; i++) {
						let accessible = await new Promise(function(resolve) {
							fs.access(file.path.replace(source, config.sources[i]), fs.constants.F_OK | fs.constants.R_OK, function(error) {
								resolve(!error);
							});
						});
						// If accessible exit out early and filter out the file from further processing.
						if (accessible) {
							return false; 
						}
					}
					// File not found in other directories lower down, therefore continue with processing.
					return true;
				},
				patterns: [
					`*`,
					`!(${source})/*`
				],
				patternOptions: {
					all: true,
					extended: true
				}
			}));
		});
	}
	
	// Get handlebars options.
	const handlebarsOptions = {
		// Get decorators.
		decorators: await getFunctions(absoluteSource, config.sources, `decorators`),
		// Get helpers.
		helpers: await getFunctions(absoluteSource, config.sources, `helpers`),
		// Get partials.
		partials: await getFiles(absoluteSource, config.sources, `partials`, [ `.html`, `.hbs` ])
	};
	
	// Continue adding to module stack.
	hoast
		// Filter out files that have not been changed since the last build.
		.use(changed())
		// Read file content.
		.use(read())
		// Remove the theme and site directory from the path names.
		.use(rename({
			engine: function(filePath) {
				let count = 0;
				
				if (config.sources) {
					for (let i = 0; i < config.sources.length; i++) {
						if (filePath.startsWith(config.sources[i])) {
							count = config.sources[i].split(path.sep).length;
							break;
						}
					}
				}
				
				filePath = filePath.split(path.sep);
				for (let j = 0; j < count; j++) {
					filePath.shift();
				}
				
				// Return result.
				return path.join(...filePath);
			}
		}))
		// Read front matter from content.
		.use(frontmatter({
			engine: function(filePath, content) {
				// Get front matter using library.
				const result = graymatter(content, {
					excerpt: true
				});
				
				// If no excerpt then set extracted excerpt.
				if (!result.data.excerpt && result.excerpt) {
					result.data.excerpt = result.excerpt;
				}
				
				// Return results.
				return {
					content: result.content,
					frontmatter: result.data
				};
			},
			patterns:`content/*.md`
		}))
		// Transform Markdown content to HTML.
		.use(transform({
			options: Object.assign({
				html: true,
				plugins: [
					`markdown-it-anchor`
				]
			}, handlebarsOptions),
			patterns: `content/*.md`
		}))
		// Fill content into handlebar templates.
		.use(layout({
			directories: config.sources ? config.sources.map(function(source) {
				return `${source}/layouts`;
			}) : `layouts`,
			wrappers: `base.hbs`,
			options: handlebarsOptions,
			patterns: `content/*.html`
		}));
	
	// Only minify if not in development mode.
	if (!options.development) {
		hoast
			// Minify the CSS, HTML, and JS files.
			.use(minify({
				css: config.minify.css,
				html: config.minify.html,
				js: config.minify.js
			}));
	}
	
	hoast
		// Clean-up file paths.
		.use(rename({
			engine: function(filePath) {
				// Spite file path up.
				let newPath = filePath.split(path.sep);
				// Remove type directory. (static/js/nav.js -> js/nav.js)
				newPath.shift();
				
				// Apply special rename rules for content files.
				if (filePath.startsWith(`content`)) {
					// Get file name from past.
					let fileName = newPath[newPath.length - 1];
					
					// Remove underscore from file name.
					if (config.rename.underscore && fileName.startsWith(`_`)) {
						fileName = newPath[newPath.length - 1] = fileName.substring(1);
					}
					
					// Beatify HTML file paths. (page.html -> page/index.html)
					if (config.rename.prettify && fileName !== `index.html`) {
						newPath[newPath.length - 1] = fileName.split(`.`).slice(0, -1).join(`.`);
						newPath.push(`index.html`);
					}
				}
				
				// Join path sections back together.
				return path.join(...newPath);
			},
			patterns: [
				`content/*`,
				`static/*`
			]
		}));
	
	debug(`Start processing.`);
	try {
		await hoast.process();
	} catch(error) {
		debug(`Error encountered during processing.`);
		throw error;
	}
	debug(`Processing finished.`);
};