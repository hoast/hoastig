// Node modules.
const fs = require(`fs`);

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

module.exports = equalFile;