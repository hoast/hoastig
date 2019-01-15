// Dependency modules.
const test = require(`ava`);
// Helper modules.
const constructDirectoryTable = require(`../helpers/constructDirectoryTable`),
	constructTree = require(`../helpers/constructTree`),
	removeFile = require(`../helpers/removeFile`);
// Library module.
const hoastig = require(`../../library`);

// Create overview of test directory paths.
const directory = __filename.substring(0, __filename.lastIndexOf(`.`));
const directoryTable = constructDirectoryTable(directory, [ `default`, `false`, `true` ], [ `bfr`, `dst`, `exp`, `src` ]);

const options = {
	develop: false,
	noTransformCSS: true,
	noTransformJS: true,
	noMinify: true,
	remove: false
};

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
		t.deepEqual(await constructTree(directoryTable.default.dst.absolute), await constructTree(directoryTable.default.exp.absolute));
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
			noChanged: false
		}));
	} catch(error) {
		t.fail(error);
	}
	
	// Test: compare actual result with expected result.
	try {
		t.deepEqual(await constructTree(directoryTable.false.dst.absolute), await constructTree(directoryTable.false.exp.absolute));
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
			noChanged: true
		}));
	} catch(error) {
		t.fail(error);
	}
	
	// Test: compare actual result with expected result.
	try {
		t.deepEqual(await constructTree(directoryTable.true.dst.absolute), await constructTree(directoryTable.true.exp.absolute));
	} catch(error) {
		t.fail(error);
	}
});