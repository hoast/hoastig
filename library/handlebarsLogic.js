// Node modules.
const fs = require(`fs`),
	path = require(`path`);

// If debug available require it.
let debug; try { debug = require(`debug`)(`hoastig/handlebarsLogic`); } catch(error) { debug = function() {}; }

// Extensions per content type.
const EXTENSIONS_CODE = [
	`.js`
];
const EXTENSIONS_TEXT = [
	`.handlebars`,
	`.hbs`,
	`.html`
];

/**
 * Scan a for files recursively.
 * @param {String} directory directory name.
 * @param {String[]} arguments file path, possibly split up in segments but in order.
 * @returns Array of string containing each files path.
 */
const getFilePaths = function(directory) {
	let absolute = path.join(...arguments),
		relative = path.join(...Array.prototype.slice.call(arguments, 1));
	return new Promise(function(resolve, reject) {
		fs.lstat(absolute, function(error, stats) {
			if (error) {
				return resolve();
			}
			
			if (stats.isFile()) {
				return resolve(relative);
			}
			
			// Read directory and invoke this method for all items in it.
			fs.readdir(absolute, function(error, files) {
				if (error) {
					return reject(error);
				}
				
				Promise.all(files.map(function(file) {
					return getFilePaths(directory, relative, file);
				})).then(function(result) {
					// Flatten array before resolving.
					resolve(result.reduce(function(previous, current) {
						if (!current) {
							return previous;
						} else if (Array.isArray(current)) {
							return previous.concat(current);
						} else {
							previous.push(current);
							return previous;
						}
					}, []));
				}).catch(reject);
			});
		});
	});
};

/**
 * Retrieves code of file.
 * @param {String} filePath Path to file.
 */
const getFileCode = function(filePath) {
	// Get extension.
	const extension = path.extname(filePath).toLowerCase();
	
	if (EXTENSIONS_CODE.indexOf(extension) >= 0) {
		try {
			return require(filePath);
		} catch(error) {
			debug(`Function '${filePath}' could not be required and therefore ignored.`);
			return false;
		}
	}
	
	debug(`File '${filePath}' has no valid extension, should be one of '${EXTENSIONS_CODE}'.`);
	return false;
};

/**
 * Retrieves text of file.
 * @param {String} filePath Path to file.
 */
const getFileText = function(filePath) {
	// Get extension.
	const extension = path.extname(filePath).toLowerCase();
	
	if (EXTENSIONS_TEXT.indexOf(extension) >= 0) {
		return new Promise(function(resolve) {
			fs.readFile(filePath, `utf8`, function(error, data) {
				if (error) {
					debug(`File '${filePath}' ran into error when reading therefore ignored: ${error}`);
					return resolve(false);
				}
				debug(`File '${filePath}' successfully added to list.`);
				resolve(data);
			});
		});
	}
	
	debug(`File '${filePath}' has no valid extension, should be one of '${EXTENSIONS_TEXT}'.`);
	return Promise.resolve(false);
};

/**
 * Retrieves 'decorators', 'helpers', and 'partials' from sources.
 * @param {String[]} sources Source directories.
 * @param {Number} concurrency Maximum number of files to process at once.
 */
const handlebarsLogic = async function(sources, concurrency = Infinity) {
	debug(`Looking for files in directories '${sources}'.`);
	
	// Variable for storing results into per type.
	const files = {
		decorators: {},
		helpers: {},
		partials: {},
	};
	
	// Iterate through sources in reverse order.
	for (let i = sources.length - 1; i >= 0; i--) {
		// Construct absolute path for the source.
		const source = sources[i];
		
		// For each key of files.
		await Promise.all(
			// Iterate over each key.
			Object.keys(files).map(async function(key) {
				// Get all file paths inside the directory.
				const filePaths = await getFilePaths(path.join(source, key));
				
				// Check if directory existed.
				if (!filePaths) {
					return;
				}
				
				// Batch out files as to not handle to many at once.
				let batch;
				while (filePaths.length > 0) {
					// Slice file paths based on concurrency.
					batch = filePaths.splice(0, concurrency);
					
					// Iterate over file paths.
					await Promise.all(
						batch.map(async function(filePath) {
							// Remove extension from path.
							let name = filePath.split(`.`).slice(0, -1).join(`.`);
							// Convert back slashes to forward slashes.
							if (process.platform === `win32`) {
								name = name.replace(/\\/g, `/`);
							}
							
							// If file already in list then exit early.
							if (files[key].hasOwnProperty(name)) {
								return;
							}
							
							// Create absolute path for file path.
							const absolutePath = path.join(source, key, filePath);
							
							// Check type of file content and then retrieve it.
							let content;
							if (key === `partials`) {
								content = await getFileText(absolutePath);
							} else {
								content = getFileCode(absolutePath);
							}
							
							// If no valid return then exit early.
							if (!content) {
								return;
							}
							
							// Write content to correct key and file name.
							files[key][name] = content;
						})
					);
				}
			})
		);
	}
	
	return files;
};

module.exports = handlebarsLogic;