// Node modules.
const fs = require(`fs`),
	path = require(`path`);

// If debug available require it.
let debug; try { debug = require(`debug`)(`hoastig`); } catch (error) { debug = function() {}; }

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
const handlebarsLogic = require(`./handlebarsLogic`);

const resolveExtensions = function(resolved, fileName) {
	// Store extensions.
	let extensions = fileName.split(`.`);
	// Get base file name.
	fileName = extensions[0];
	// Remove base file name.
	extensions = extensions.slice(1);
	
	// Remove any extensions that will be resolved.
	for (let i = extensions.length - 1; i >= 0; i--) {
		if (resolved.indexOf(extensions[i]) >= 0) {
			// Remove extension from list.
			extensions.pop();
		} else {
			// Stop once the first extension is encountered that will not be transformed away.
			break;
		}
	}
	
	// Return file name with left over extensions.
	return (extensions && extensions.length) ? extensions.unshift(fileName).join(`.`) : fileName;
};

const hoastig = async function(directory, config = {}, options = {}) {
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
	config = Hoast.helpers.deepAssign({
		destination: `dst`,
		sources: [
			`src`
		],
		
		metadata: {},
		
		highlight: false,
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
		},
		
		concurrency: Infinity,
		
		development: {
			concurrency: undefined,
			host: `localhost`,
			port: 8080
		}
	}, config);
	debug(`Config assigned over default.`);
	
	// Merge `metadata.json` files of source directories with `config.metadata`.
	if (config.sources && config.sources.length > 1) {
		debug(`Merging 'metadata.json' files in source directories with 'config.metadata'.`);
		
		await Promise.all(config.sources.map(function(source) {
			return new Promise(function(resolve) {
				// Create `metadata.json` file path.
				const filePath = path.join(directory, source, `metadata.json`);
				
				// Check if file exists at path.
				fs.access(filePath, fs.constants.F_OK | fs.constants.R_OK, function(error) {
					if (error) {
						return resolve(null);
					}
					
					// Read file.
					fs.readFile(filePath, `utf8`, async function(error, data) {
						if (error) {
							return resolve(null);
						}
						
						// Parse JSON.
						return resolve(JSON.parse(data));
					});
				});
			});
		})).then(function(results) {
			// Add `config.metadata` last in stack.
			results.push(config.metadata);
			
			// Overwrite `config.metadata` with merger of results.
			config.metadata = results.reduce(function(previous, current) {
				// If no metadata found skip.
				if (!current) {
					return previous;
				}
				
				// Deep assign current metadata with previous.
				return Hoast.helpers.deepAssign(previous, current);
			}, {});
		});
	}
	
	// Overwrite `site_url` if in development mode.
	if (options.development) {
		debug(`Development option enabled.`);
		
		// Overwrite concurrency in config.
		if (config.development.concurrency) {
			config.concurrency = config.development.concurrency;
			debug(`'concurrency' is set to 'development.concurrency' of '${config.concurrency}'.`);
		}
		
		// Overwrite `site_url` in metadata.
		if (config.metadata.site_url) {
			config.metadata.site_url = `${config.development.host}:${config.development.port}`;
			
			// Prepend `http://` if not already present.
			if (!config.metadata.site_url.startsWith(`http://`) && !config.metadata.site_url.startsWith(`https://`)) {
				config.metadata.site_url = `http://${config.metadata.site_url}`;
			}
			
			debug(`'metadata.site_url' is set to 'development.host:development.port' of '${config.metadata.site_url}'.`);
		}
	}
	
	// Filter out everything not within the content and static directories.
	let patterns;
	if (config.sources && config.sources.length > 0) {
		patterns = [];
		config.sources = config.sources.map(function(source) {
			// Add the content and static directory
			patterns.push(`${source}/content/*`);
			patterns.push(`${source}/static/*`);
			patterns.push(`${source}/content`);
			patterns.push(`${source}/static`);
			
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
			// Add source directory to patterns.
			patterns.push(source);
			
			return path.join(...segments);
		});
	} else {
		patterns = [
			`content/*`,
			`static/*`,
			`content`,
			`static`
		];
	}
	
	debug(`Start hoast initialization.`);
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
	
	// Get Markdown options.
	const markdownOptions = {
		html: true,
		plugins: [
			`markdown-it-anchor`,
			`markdown-it-task-checkbox`
		]
	};
	// If config specifies highlighting add the helper function.
	if (config.highlight) {
		// Get necessary libraries.
		const highlight = require(`highlightjs`),
			markdown = require(`markdown-it`)();
		
		// Set optional configuration of highlight library.
		if (typeof(config.highlight) === `object`) {
			highlight.configure(config.highlight);
		}
		
		// Create function as Markdown options property.
		markdownOptions.highlight = function(string, language) {
			if (language && highlight.getLanguage(language)) {
				try {
					return `<pre class="hljs"><code>${highlight.highlight(language, string, true).value}</code></pre>`;
				} catch (error) {
					debug(`Highlighting failed for '${language}' language.`);
				}
			}
			return `<pre class="hljs"><code>${markdown.utils.escapeHtml(string)}</code></pre>`;
		};
	}
	
	// Get handlebars options.
	const handlebarsOptions = await handlebarsLogic(
		(config.sources && config.sources.length > 0) ? config.sources.map(function(source) {
			return path.join(directory, source);
		}) : [ directory ],
		config.concurrency
	);
	
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
				
				if (config.sources && config.sources.length > 0) {
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
		// Transform Markdown content to HTML and Handlebars to HTML.
		.use(transform({
			options: Object.assign(markdownOptions, handlebarsOptions),
			patterns: `content/*.md`
		}))
		// Fill content into handlebar templates.
		.use(layout({
			directories: (config.sources && config.sources.length > 0) ? config.sources.map(function(source) {
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
	} catch (error) {
		debug(`Error encountered during processing.`);
		throw error;
	}
	debug(`Processing finished.`);
};

module.exports = hoastig;