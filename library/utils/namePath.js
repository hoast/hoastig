/**
 * Converts path into a consistent name.
 * @param {String} path Path with extension.
 */
const namePath = function(path) {
	// Remove extension from path.
	path = path.split(`.`).slice(0, -1).join(`.`);
	// Convert back slashes to forward slashes.
	if (process.platform === `win32`) {
		path = path.replace(/\\/g, `/`);
	}
	return path;
};

module.exports = namePath;