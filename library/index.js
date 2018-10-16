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
						// Remove source sub directory.
						fileSegments = fileSegments.slice(count);
					}
				}
				
				// Apply special rename rules for 'content' files.
				if (fileSegments[0] == `content`) {
					// Split file name from extensions.
					let fileName = fileSegments[fileSegments.length - 1].split(`.`);
					// Join extension together and store.
					const extensions = fileName.slice(1).join(`.`);
					// Get base file name.
					fileName = fileName[0];
					
					// Remove underscore from file name.
					if (config.rename.underscore && fileName.startsWith(`_`)) {
						fileName = fileName.substring(1);
					}
					
					// Beatify HTML file paths. (page.html -> page/index.html)
					if (config.rename.prettify && fileName !== `index`) {
						fileName = path.join(fileName, `index`);
					}
					
					// Merge name and extensions back together.
					fileSegments[fileSegments.length - 1] = `${fileName}.${extensions}`;
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
				// Get base file name without extensions.
				const fileName = fileSegments[fileSegments.length - 1].split(`.`)[0];
				// Start with site_url if set.
				data.base_url = config.metadata.site_url ? `${config.metadata.site_url}/` : `/`;
				// Set page url relative to root directory.
				if (fileSegments.length > 2) {
					data.base_url += `${fileSegments.slice(1, fileSegments.length - 1).join(`/`)}/`;
				}
				// Add page url to data.
				data.page_url = `${data.base_url}${fileName}.html`;
				
				// Return results.
				return {
					content: content,
					frontmatter: data
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
		}))
		// Remove type directory. 'static/js/nav.js' -> 'js/nav.js'.
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
		await hoast.process();
	} catch(error) {
		debug(`Error encountered during processing.`);
		throw error;
	}
	debug(`Processing finished.`);
};