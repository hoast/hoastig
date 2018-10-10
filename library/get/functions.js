// Node modules.
const assert = require(`assert`),
	path = require(`path`);

// If debug available require it.
const debug = require(`debug`)(`hoastig/get/functions`);

// Custom libraries.
const namePath = require(`../utils/namePath`),
	walk = require(`../utils/walk`);

// Constant values.
const EXTENSIONS = [
	`.js`
];

/**
 * Get code from all `.js` files in the given directories.
 * @param {String} directory Absolute path to directories that contain the subdirectories.
 * @param {Array of strings} sourceDirectories List of directories in order of which overrides which.
 * @param {String} subDirectory Additional and optional subdirectory to look through.
 * @returns Array of file paths of type string.
 */
const getFunctions = async function(directory, sourceDirectories, subDirectory) {
	// Validate arguments.
	assert(typeof(directory) === `string`, `directory must be of type string.`);
	assert(Array.isArray(sourceDirectories) && sourceDirectories.length > 0 && typeof(sourceDirectories[0] === `string`), `sourceDirectories must be an array of string.`);
	if (subDirectory) {
		assert(typeof(subDirectory) === `string`, `subDirectory must be of type string.`);
	}
	debug(`Looking for custom files in directory '${directory}' in source directories '${sourceDirectories}' and in sub directory '${subDirectory}'.`);
	
	debug(`Looking for custom functions.`);
	let functions = {};
	// Iterate through sources in reverse order.
	for (let i = sourceDirectories.length - 1; i >= 0; i--) {
		// Construct path where functions might be located.
		const absoluteDirectory = path.join(directory, sourceDirectories[i], subDirectory);
		debug(`Looking for custom functions in: ${absoluteDirectory}.`);
		
		// Go through directory and return paths relative to the given directory.
		const filePaths = await walk(absoluteDirectory);
		if (!filePaths || filePaths.length <= 0) {
			debug(`No functions found in directory.`);
			continue;
		}
		debug(`Found functions '${filePaths}'.`);
		
		// Iterate through function paths.
		filePaths.forEach(function(filePath) {
			// Check if file is of type javascript.
			if (EXTENSIONS.indexOf(path.extname(filePath).toLowerCase()) < 0) {
				debug(`Function '${filePath}' not valid due to extension and therefore ignored.`);
				return;
			}
			
			// Create file name.
			let fileName = namePath(filePath);
			
			// Check if already present in array.
			if (functions.hasOwnProperty(fileName)) {
				debug(`Function '${filePath}' already present in list and therefore ignored.`);
				return;
			}
			
			// Get code from storage.
			try {
				functions[fileName] = require(path.join(absoluteDirectory, filePath));
			} catch(error) {
				debug(`Function '${filePath}' could not be required and therefore ignored.`);
			}
		});
	}
	debug(`Finished searching for custom functions.`);
	
	return functions;
};

module.exports = getFunctions;