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
const merge = require(`./utils/merge`),
	resolveExtensions = require(`./utils/resolveExtensions`);
const getFiles = require(`./get/files`),
	getFunctions = require(`./get/functions`);

module.exports = async function(directory, config = {}, options = {}) {
	debug(`Start hoastig.`);
	
	// Legacy support for `config.source`.
	if (config.source) {
		// If `config.sources` not set `config.source` to it.
		if (!config.sources) {
			config.sources = config.source;
		} else {
			// If both set make sure config.sources is an array.
			if (typeof(config.sources) === `string`) {
				config.sources = [
					config.sources
				];
			}
			
			// Prepend `config.source` to each `config.sources` value.
			config.sources = config.sources.map(function(source) {
				return `${config.source}/${source}`;
			});
		}
	}
	
	// If `config.sources` is a string turn it into an array.
	if (config.sources && typeof(config.sources) === `string`) {
		config.sources = [
			config.sources
		];
	}
	
	debug(`Start merging configuration with default.`);
	// Override default config with user defined config.
	config = merge({
		development: {
			host: `localhost`,
			port: 8080
		},
		
		destination: `dst`,
		sources: [
			`src`
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
		},
		rename: {
			prettify: true,
			underscore: false
		}
	}, config);
	debug(`Config assigned over default.`);
	
	// Overwrite `site_url` if in development mode. 
	if (config.metadata.site_url && options.development) {
		// Overwrite `site_url` in metadata.
		config.metadata.site_url = `${config.development.host}:${config.development.port}`;
		
		// Prepend `http://` if not already present.
		if (!config.metadata.site_url.startsWith(`http://`) && !config.metadata.site_url.startsWith(`https://`)) {
			config.metadata.site_url = `http://${config.metadata.site_url}`;
		}
		
		debug(`Development flag set, metadata.site_url is set to '${config.metadata.site_url}'.`);
	}
	
	debug(`Start hoast initialization.`);
	
	// Filter out everything not within the content and static directories.
	let patterns;
	if (!config.sources || config.sources.length === 0) {
		patterns = [
			`content/*`,
			`static/*`,
			`content`,
			`static`
		];
	} else {
		patterns = [];
		config.sources = config.sources.map(function(source) {
			// Add the content and static directory
			patterns.push(`${source}/content/*`);
			patterns.push(`${source}/static/*`);
			patterns.push(`${source}/content`);
			patterns.push(`${source}/static`);
			
			// Add source directory to patterns.
			patterns.push(source);
			// Get all directories leading up to the source directory.
			// This allows us to construct a pattern that matches the directories leading up to the source directory, but not any content within it.
			const segments = source.split(`/`);
			const length = segments.length - 1;
			let pattern;
			if (length > 0) {
				for (let i = 0; i < length; i++) {
					// Add directory to patterns.
					pattern = segments.slice(0, i + 1).join(`/`);
					if (!patterns.includes(pattern)) {
						patterns.push(pattern);
					}
				}
			}
			
			return path.join(...segments);
		});
	}
	
	// Initialize hoast.
	const hoast = Hoast(directory, {
		source: ``,
		destination: config.destination.replace(`/`, path.sep),
		
		remove: options.remove,
		patterns: patterns,
		concurrency: config.concurrency,
		
		metadata: config.metadata
	});
	
	if (config.sources && config.sources.length > 1) {
		// Filter out files in the current directory if an equivalent file is in a directory after it.
		// In other words removing duplicate files later on.
		config.sources.forEach(function(source, index) {
			// Skip if last in list.
			if (index + 1 >= config.sources.length) {
				return;
			}
			
			// Add filter duplicate filter checking any subsequent sources.
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
		decorators: await getFunctions(hoast.directory, config.sources, `decorators`),
		// Get helpers.
		helpers: await getFunctions(hoast.directory, config.sources, `helpers`),
		// Get partials.
		partials: await getFiles(hoast.directory, config.sources, `partials`, [ `.html`, `.hbs`, `handlebars` ])
	};
	
	// Continue adding to module stack.
	hoast
		// Filter out files that have not been changed since the last build.
		.use(changed())
		// Read file content.
		.use(read())
		// Remove the source sub directory and apply rename configuration to file paths.
		.use(rename({
			engine: function(filePath) {
				// Split file path up in segments.
				let fileSegments = filePath.split(path.sep);
				
				if (config.sources) {
					// Get amount of directory layers.
					let count = 0;
					
					// Iterate through sources.
					for (let i = 0; i < config.sources.length; i++) {
						// If file path starts.
						if (!filePath.startsWith(config.sources[i])) {
							continue;
						}
						// Write length of segment to count.
						count = config.sources[i].split(path.sep).length;
					}
					
					if (count > 0) {
						// Remove source directory.
						fileSegments = fileSegments.slice(count);
					}
				}
				
				// Apply special rename rules for `content` files.
				if (fileSegments[0] === `content`) {
					// Get file name with resolved extensions.
					let fileName = fileSegments[fileSegments.length - 1];
					
					// Remove underscore from file name.
					if (config.rename.underscore && fileName.startsWith(`_`)) {
						fileName = fileName.substring(1);
					}
					
					// Beatify HTML file paths if base name will resolve to `index`. Result: `page.html` -> `page/index.html`.
					if (config.rename.prettify && resolveExtensions([ `hbs`, `handlebars`, `md`, `markdown`, `markdown-it` ], fileName) !== `index`) {
						// Split extension in file path.
						const extensions = fileName.split(`.`);
						// Create new file path with `index` inserted in between the file base name and the extensions.
						fileName = path.join(extensions[0], [ `index` ].concat(extensions.slice(1)).join(`.`));
					}
					
					// Write name back to segments array.
					fileSegments[fileSegments.length - 1] = fileName;
				}
				
				// Return result.
				return path.join(...fileSegments);
			}
		}))
		// Read front matter from content.
		.use(frontmatter({
			engine: function(filePath, fileContent) {
				// Get front matter using library.
				const { content, data, excerpt } = graymatter(fileContent, {
					excerpt: true
				});
				
				// If no excerpt then set extracted excerpt.
				if (!data.excerpt && excerpt) {
					data.excerpt = excerpt;
				}
				
				// Next sections adds extra info to data.
				
				// Split file path up.
				const fileSegments = filePath.split(path.sep);
				// Start with site_url if set.
				data.base_url = config.metadata.site_url ? `${config.metadata.site_url}/` : `/`;
				// Set page url relative to root directory.
				if (fileSegments.length > 2) {
					data.base_url += `${fileSegments.slice(1, fileSegments.length - 1).join(`/`)}/`;
				}
				// Add page url to data, which consists of `base_url` and the file path with all extensions resolved.
				data.page_url = `${data.base_url}${resolveExtensions([ `hbs`, `handlebars`, `md`, `markdown`, `markdown-it` ], fileSegments[fileSegments.length - 1])}.html`;
				
				// Return results.
				return {
					content: content,
					frontmatter: data
				};
			},
			patterns: `content/*.md`
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
		}))
		// Remove type directory. Result: `static/js/nav.js` -> `js/nav.js`.
		.use(rename({
			engine: function(filePath) {
				// Get index of first path separator.
				let index = filePath.indexOf(path.sep);
				// Sub string past the first path separator.
				return filePath.substring(index + path.sep.length);
			},
			patterns: [
				`content/*`,
				`static/*`
			]
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
	
	debug(`Start processing.`);
	try {
		// Start the hoast process.
		await hoast.process();
	} catch(error) {
		debug(`Error encountered during processing.`);
		throw error;
	}
	debug(`Processing finished.`);
};