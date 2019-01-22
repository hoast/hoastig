/**
 * Resolved extensions from the end of the file path.
 * @param {string[]} resolvableExtensions The extensions that can be resolve.
 * @param {string} fileName The path to resolve extensions from.
 */
const resolveExtensions = function(resolvableExtensions, fileName) {
	// Store extensions.
	let extensions = fileName.split(`.`);
	// Get base file name.
	fileName = extensions[0];
	// Remove base file name.
	extensions = extensions.slice(1);
	
	// Remove any extensions that will can be resolved.
	for (let i = extensions.length - 1; i >= 0; i--) {
		if (resolvableExtensions.indexOf(extensions[i]) >= 0) {
			// Remove extension from list.
			extensions.pop();
		} else {
			// Stop once the first extension is encountered that will not be transformed away.
			break;
		}
	}
	
	// Return file name with left over extensions.
	return extensions && extensions.length ? [ fileName, ...extensions ].join(`.`) : fileName;
};

module.exports = resolveExtensions;