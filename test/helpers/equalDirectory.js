// Node modules.
const fs = require(`fs`),
	path = require(`path`);

/**
 * Creates a file tree by scanning the given directory recursively.
 * @param {String} directory Absolute path to directory.
 * @param {String} fileName Name of
 */
const createTree = async function(directory, file = ``) {
	// Create absolute path.
	if (file !== ``) {
		directory = path.join(directory, file);
	}
	
	return new Promise(function(resolve, reject) {
		// Retrieve file status.
		fs.lstat(directory, function(error, stats) {
			if (error) {
				return reject(error);
			}
			
			// If it is a file resolve with its stats.
			if (stats.isFile()) {
				return resolve(file);
			}
			
			// Read directory and invoke this method for all items in it.
			fs.readdir(directory, function(error, content) {
				if (error) {
					return reject(error);
				}
				
				// Recursively call for each file in subdirectory.
				Promise.all(content.map(function(item) {
					// Recursively call this again.
					return createTree(directory, item);
				})).then(function(results) {
					return {
						path: file,
						files: results
					};
				}).catch(reject);
			});
		});
	});
};

/**
 * Reads and compares file content.
 * @param {Object} t Ava instance.
 * @param {String} actualFile File path of file to compare to.
 * @param {String} expectedFile File path of file to compare with.
 */
const equalFile = async function(t, actualFile, expectedFile) {
	// Wrapper so the readFile function can be used as a promise.
	const readFile = function(filePath) {
		return new Promise(function(reject, resolve) {
			fs.readFile(filePath, function(error, data) {
				if (error) {
					return reject(error);
				}
				
				resolve(data);
			});
		});
	};
	
	try {
		// Read each file and compare its content.
		t.deepEqual(await readFile(actualFile), await readFile(expectedFile));
	} catch(error) {
		throw error;
	}
};

/**
 * Compares the content of each file in the directory and sub-directories.
 * @param {Object} t Ava instance.
 * @param {String} actualDirectory Directory path of directory to compare to.
 * @param {String} expectedDirectory Directory path of directory to compare with.
 * @param {Object} tree File tree of directory to compare.
 */
const equalDirectory = async function(t, actualDirectory, expectedDirectory, tree) {
	if (!tree) {
		// Create actual file tree.
		tree = await createTree(actualDirectory);
		// Create and compare file trees.
		t.deepEqual(tree, await createTree(expectedDirectory));
	} else {
		// Update directory paths.
		actualDirectory = path.join(actualDirectory, tree.path);
		expectedDirectory = path.join(expectedDirectory, tree.path);
	}
	
	// Compare the content of each directory.
	return Promise.all(
		tree.files.map(function(file) {
			// If file is a string then it refers to the name of a file in the current directory.
			if (typeof(file) === `string`) {
				// Therefore compare each file.
				return equalFile(t, path.join(actualDirectory, file), path.join(expectedDirectory, file));
			}
			// Otherwise it is a file tree node of a sub directory.
			// Therefore call this function recursively.
			return equalDirectory(t, actualDirectory, expectedDirectory, file);
		})
	);
};

module.exports = equalDirectory;