// Node modules.
const fs = require(`fs`),
	path = require(`path`);

/**
 * Remove directory or file.
 * @param {String} file Path of directory or file.
 */
const removeFile = function(file) {
	return new Promise(function(resolve, reject) {
		fs.lstat(file, function(error, stats) {
			if (error) {
				if (error.code === `ENOENT`) {
					// File does not exist.
					return resolve();
				}
				return reject(error);
			}
			
			if (stats.isFile()) {
				// If file unlink it.
				fs.unlink(file, function (error) {
					if (error) {
						return reject(error);
					}
					resolve();
				});
			} else {
				// For readability use 'directory' instead if 'file'
				const directory = file;
				// Get All files within the directory.
				fs.readdir(directory, function(error, directoryFiles) {
					if (error) {
						return reject(error);
					}
					
					// If directory then remove each directory and\or file within, then remove this directory.
					Promise.all(directoryFiles.map(function(directoryFile) {
						return removeFile(path.join(directory, directoryFile));
					})).then(function() {
						// Remove the now empty directory.
						fs.rmdir(directory, function(error) {
							if (error) {
								return reject(error);
							}
							resolve();
						});
					}).catch(reject);
				});
			}
		});
	});
};

module.exports = removeFile;