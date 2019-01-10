// Node modules.
const fs = require(`fs`),
	path = require(`path`);
// Custom modules.
const createDirectory = require(`./createDirectory`);

/**
 * 
 * @param {String} source Path to the directory or file that will be copied over.
 * @param {String} destination Path to where the directory or file needs to go.
 */
const copyDirectory = function(source, destination) {
	return new Promise(function(resolve, reject) {
		// Retrieve source status.
		fs.lstat(source, function(error, stats) {
			if (error) {
				return reject(error);
			}
			
			// Check if file.
			if (stats.isFile()) {
				// Create directory.
				createDirectory(path.dirname(destination)).then(function() {
					// Copy file over.
					fs.copyFile(source, destination, function() {
						if (error) {
							return reject(error);
						}
						
						return resolve();
					});
				});
				
				return;
			}
			// Else must be a directory.
			
			// Read directories files.
			fs.readdir(source, function(error, files) {
				if (error) {
					return reject(error);
				}
				
				// Recursively call for each file in subdirectory.
				Promise.all(files.map(function(file) {
					// Call this function recursively.
					return copyDirectory(
						path.join(source, file),
						path.join(destination, file)
					);
				})).then(function() {
					return resolve();
				}).catch(reject);
			});
		});
	});
};

module.exports = copyDirectory;