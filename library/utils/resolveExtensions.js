const resolveExtensions = function(resolved, fileName) {
	// Store extensions.
	let extensions = fileName.split(`.`);
	// Get base file name.
	fileName = extensions[0];
	// Remove base file name.
	extensions = extensions.slice(1);
	
	// Remove any extensions that will be resolved.
	for (let i = extensions.length - 1; i >= 0; i--) {
		if (resolved.indexOf(extensions[i]) > 0) {
			// Remove extension from list.
			extensions.pop();
		} else {
			// Stop once the first extension is encountered that will not be transformed away.
			break;
		}
	}
	
	// Return file name with left over extensions.
	return [ fileName ].concat(extensions).join(`.`);
};

module.exports = resolveExtensions;