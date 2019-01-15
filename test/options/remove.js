// Dependency modules.
const test = require(`ava`);
// Helper modules.
const copyDirectory = require(`../helpers/copyDirectory`),
	constructDirectoryTable = require(`../helpers/constructDirectoryTable`),
	equalDirectory = require(`../helpers/equalDirectory`),
	removeFile = require(`../helpers/removeFile`);
// Library module.
const hoastig = require(`../../library`);

// Create overview of test directory paths.
const directory = __filename.substring(0, __filename.lastIndexOf(`.`));
const directoryTable = constructDirectoryTable(directory, [ `default`, `false`, `true` ], [ `bfr`, `dst`, `exp`, `src` ]);

const options = {
	development: false,
	noChanged: true,
	noTransformCSS: true,
	noTransformJS: true,
	noMinify: true
};

/**
 * Setup: copy before directory to destination directory.
 */
test.before(`Create files`, async function(t) {
	t.plan(1);
	
	await Promise.all(
		Object.keys(directoryTable).map(function(testName) {
			// Copy before to destination directory.
			return copyDirectory(directoryTable[testName].bfr.absolute, directoryTable[testName].dst.absolute);
		})
	).then(async function() {
		t.pass();
	}).catch(function(error) {
		t.fail(error);
	});
});

/**
 * Clean-up: always remove build directories.
*/
test.after.always(`Remove files`, function(t) {
	t.plan(1);
	
	return Promise.all(
		Object.keys(directoryTable).map(function(testName) {
			return removeFile(directoryTable[testName].dst.absolute);
		})
	).then(function() {
		t.pass();
	}).catch(function(error) {
		t.fail(error);
	});
});

test(`default`, async function(t) {
	// Execute: run hoastig.
	try {
		await hoastig(directory, {
			sources: directoryTable.default.src.relative,
			destination: directoryTable.default.dst.relative
		}, options);
	} catch(error) {
		t.fail(error);
	}
	
	// Test: compare actual result with expected result.
	try {
		await equalDirectory(t, directoryTable.default.dst.absolute, directoryTable.default.exp.absolute);
	} catch(error) {
		t.fail(error);
	}
});

test(`false`, async function(t) {
	// Execute: run hoastig.
	try {
		await hoastig(directory, {
			sources: directoryTable.false.src.relative,
			destination: directoryTable.false.dst.relative
		}, Object.assign({}, options, {
			remove: false
		}));
	} catch(error) {
		t.fail(error);
	}
	
	// Test: compare actual result with expected result.
	try {
		await equalDirectory(t, directoryTable.false.dst.absolute, directoryTable.false.exp.absolute);
	} catch(error) {
		t.fail(error);
	}
});

test(`true`, async function(t) {
	// Execute: run hoastig.
	try {
		await hoastig(directory, {
			sources: directoryTable.true.src.relative,
			destination: directoryTable.true.dst.relative
		}, Object.assign({}, options, {
			remove: true
		}));
	} catch(error) {
		t.fail(error);
	}
	
	// Test: compare actual result with expected result.
	try {
		await equalDirectory(t, directoryTable.true.dst.absolute, directoryTable.true.exp.absolute);
	} catch(error) {
		t.fail(error);
	}
});