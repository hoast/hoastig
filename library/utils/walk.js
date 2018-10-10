// Node modules.
const fs = require(`fs`),
	path = require(`path`);

/**
 * Recursive flattening of an array.
 * @param {Array} array The multi-depth array.
 */
const flatten = function(array) {
	return array.reduce(function(array, value) {
		return array.concat(Array.isArray(value) ? flatten(value) : value);
	}, []);
};

/**
 * Scan a for files recursively.
 * @param {String} directory directory name.
 * @param {String[]} arguments file path, possibly split up in segments but in order.
 */
const walk = function(directory) {
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
					return walk(directory, relative, file);
				})).then(function(result) {
					resolve(flatten(result));
				}).catch(reject);
			});
		});
	});
};

module.exports = walk;