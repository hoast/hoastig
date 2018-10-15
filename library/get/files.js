// Node modules.
const fs = require(`fs`),
	path = require(`path`);

// If debug available require it.
let debug; try { debug = require(`debug`)(`hoastig/get/files`); } catch(error) { debug = function() {}; }

// Custom libraries.
const namePath = require(`../utils/namePath`),
	walk = require(`../utils/walk`);

/**
 * Get content from all files in the given directories that match any of the extensions.
 * @param {String} directory Absolute path to directories that contain the subdirectories.
 * @param {Array of strings} sourceDirectories List of directories in order of which overrides which.
 * @param {String} subDirectory Additional and optional subdirectory to look through.
 * @param {Array of strings} extensions Array of file extensions formatted as `.html`.
 * @returns Array of file paths of type string.
 */
const getFiles = async function(directory, sourceDirectories, subDirectory, extensions) {
	debug(`Looking for custom files in directory '${directory}' in source directories '${sourceDirectories}' and in sub directory '${subDirectory}' with extensions '${extensions}'.`);
	
	// Check if source directories, and construct path(s) where functions might be located.
	const absolutePaths = [];
	if (!sourceDirectories) {
		absolutePaths.push(path.join(directory, subDirectory));
	} else {
		// Iterate through sources in reverse order.
		for (let i = sourceDirectories.length - 1; i >= 0; i--) {
			absolutePaths.push(path.join(directory, sourceDirectories[i], subDirectory));
		}
	}
	
	debug(`Looking for custom files.`);
	const files = {};
	// Iterate through absolute paths.
	const absolutePathsLength = absolutePaths.length;
	for (let i = 0; i < absolutePathsLength; i++) {
		const absolutePath = absolutePaths[i];
		debug(`Looking for custom files in '${absolutePath}'.`);
		
		// Go through directory and return paths relative to the given directory.
		const filePaths = await walk(absolutePath);
		if (!filePaths || filePaths.length <= 0) {
			debug(`No files found in directory.`);
			continue;
		}
		debug(`Found files '${filePaths}'.`);
		
		await Promise.all(
			// Iterate through file paths.
			filePaths.map(function(filePath) {
				return new Promise(function(resolve) {
					// Check if file is of type javascript.
					if (extensions && extensions.length > 0 && extensions.indexOf(path.extname(filePath).toLowerCase()) < 0) {
						debug(`File '${filePath}' not valid due to extension and therefore ignored.`);
						return resolve();
					}
					
					// Create file name.
					let fileName = namePath(filePath);
					
					// Check if already present in array.
					if (files.hasOwnProperty(fileName)) {
						debug(`File '${filePath}' already present in list and therefore ignored.`);
						return resolve();
					}
					
					// Get content from storage.
					fs.readFile(path.join(absolutePath, filePath), `utf8`, function(error, data) {
						if (error) {
							debug(`File '${filePath}' ran into error when reading therefore ignored: ${error}`);
							return resolve();
						}
						debug(`File '${filePath}' successfully added to list.`);
						resolve({
							name: fileName,
							content: data
						});
					});
				});
			})
		)
			.then(function(results) {
				results.forEach(function(file) {
					if (!file) {
						return;
					}
					files[file.name] = file.content;
				});
			}).catch(function(error) {
				throw error;
			});
	}
	debug(`Finished searching for custom files.`);
	
	return files;
};

module.exports = getFiles;