// Node modules.
const path = require(`path`);

/**
 * 
 * @param {String} directory Absolute path to directory (probably __dirname).
 * @param {String} file Absolute path to file (probably __filename)
 * @param {String[]} prefixes Sub directory prefixes (probably test input option)
 * @param {String[]} suffixes Sub directory suffixes (probably directory name type)
 */
const createDirectoryTable = function(directory, prefixes, suffixes) {
	const result = {};
	// Iterate over each test.
	prefixes.forEach(function(prefix) {
		// Get name of subdirectory.
		result[prefix] = {};
		
		suffixes.forEach(function(suffix) {
			result[prefix][suffix] = {};
			result[prefix][suffix].relative = prefix.concat(`-`, suffix);
			result[prefix][suffix].absolute = path.join(directory, result[prefix][suffix].relative);
		});
	});
	
	return result;
};

module.exports = createDirectoryTable;