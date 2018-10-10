// Node modules.
const fs = require(`fs`),
	path = require(`path`);
// TODO: Assert whether options are correct at each step of the process.

// If debug available require it.
const debug = require(`debug`)(`hoastig`);

// Hoast modules.
const Hoast = require(`hoast`);
const read = Hoast.read,
	changed = require(`hoast-changed`),
	convert = require(`hoast-convert`),
	filter = require(`hoast-filter`),
	frontmatter = require(`hoast-frontmatter`),
	layout = require(`hoast-layout`),
	rename = require(`hoast-rename`),
	transform = require(`hoast-transform`);

// Front matter extraction.
const matter = require(`gray-matter`);
// Modules for file compression.
const CleanCSS = require(`clean-css`),
	minifyHTML = require(`html-minifier`).minify,
	minifyJS = require(`terser`).minify;

// Custom libraries.
const merge = require(`./utils/merge`);
const getData = require(`./get/data`),
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
		sources: [
			``
		],
		metadata: {},
		
		concurrency: Infinity,
		minify: {
			css: {},
			html: {
				collapseWhitespace: true,
				removeComments: true
			},
			js: {}
		}
	}, config, {
		minify: {
			css: {
				returnPromise: false
			}
		}
	}); // Overwrite clean-css configuration to make sure the system works.
	debug(`Config merged with default.`);
	
	// Initialize Clean CSS.
	const minifyCSS = new CleanCSS(config.minify.css);
	debug(`Clean CSS initialized.`);
	
	// Specify custom CSS minifier for the HTML minifier.
	config.minify.html.minifyCSS = function(content) {
		try {
			return minifyCSS.minify(content).styles;
		}
		catch (error) {
			return content;
		}
	};
	debug(`Custom CSS minifier initialized for the HTML minifier.`);
	// Specify custom JS minifier for the HTML minifier.
	config.minify.html.minifyJS = function(content) {
		const result = minifyJS(content, config.minify.js);
		return !result.error ? result.code : content;
	};
	debug(`Custom JS minifier initialized for the HTML minifier.`);
	
	// If in development overwrite 'base_url' in metadata.
	if (options.development) {
		config.metadata.base_url = `http://${config.development.host}:${config.development.port}`;
		debug(`Development flag set, metadata.base_url is set to '${config.metadata.base_url}'.`);
	}
	
	debug(`Start Hoast initialization.`);
	// Initialize Hoast.
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
			patterns: config.sources.map(function(source) {
				return [ `content`, `static` ].map(function(directory) {
					return `${source}/${directory}/*`;
				});
			}) // Create patterns.
				.reduce(function(previous, current) {
					return previous.concat(current);
				}) // Flatten array.
		}));
	
	if (config.sources.length > 1) {
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
		partials: await getData(absoluteSource, config.sources, `partials`, [ `.html`, `.hbs` ])
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
				
				for (let i = 0; i < config.sources.length; i++) {
					if (filePath.startsWith(config.sources[i])) {
						count = config.sources[i].split(path.sep).length;
						break;
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
				const result = matter(content, {
					excerpt: true
				});
				
				return {
					content: result.content,
					frontmatter: Object.assign({ excerpt: result.excerpt }, result.data)
				};
			},
			patterns:`content/*.md`
		}))
		// Transform markdown content to HTML.
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
			directories: config.sources.map(function(source) {
				return `${source}/layouts`;
			}),
			wrappers: `base.hbs`,
			options: handlebarsOptions,
			patterns: `content/*.html`
		}));
	
	// Only minify if not in development mode.
	if (!options.development) {
		hoast
			// Minify the CSS, HTML, and JS files.
			.use(convert({
				engine: function(filePath, content) {
					let result;
					// Get file extension.
					switch(path.extname(filePath).toLowerCase()) {
						case `.css`:
							try {
								return minifyCSS.minify(content).styles;
							} catch(error) {
								return content;
							}
						case `.html`:
							return minifyHTML(content, config.minify.html);
						case `.js`:
							result = minifyJS(content, config.minify.js);
							return !result.error ? result.code : content;
					}
					return content;
				},
				patterns: [
					`*.css`,
					`*.html`,
					`*.js`
				]
			}));
	}
	
	hoast
		// Clean-up file paths.
		.use(rename({
			engine: function(filePath) {
				// Remove type directory. (static/js/nav.js -> js/nav.js)
				let newPath = filePath.split(path.sep);
				newPath.shift();
				
				// Beatify HTML file paths. (page.html -> page/index.html)
				if (filePath.startsWith(`content`)) {
					const fileName = newPath[newPath.length - 1];
					if ([ `index.html` ].indexOf(fileName) < 0) {
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