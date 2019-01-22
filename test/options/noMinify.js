// Node modules.
const path = require(`path`);
// Dependency modules.
const test = require(`ava`);
// Helper modules.
const equalDirectory = require(`../helpers/equalDirectory`),
	removeFiles = require(`../helpers/removeFiles`);
// Library module.
const hoastig = require(`../../library`);

// Create overview of test directory paths.
const directory = __filename.substring(0, __filename.lastIndexOf(`.`));

const options = {
	development: false,
	noChanged: true,
	noTransformCSS: true,
	noTransformJS: true,
	remove: false
};

/**
 * Clean-up: always remove build directories.
*/
test.after.always(`Remove files`, async function(t) {
	try {
		await removeFiles([
			path.join(directory, `default-dst`),
			path.join(directory, `false-dst`),
			path.join(directory, `true-dst`)
		]);
	} catch(error) {
		return t.fail(error);
	}
	
	t.pass();
});

test(`default`, async function(t) {
	try {
		// Run hoastig.
		await hoastig(directory, {
			destination: `default-dst`,
			sources: `default-src`
		}, options);
		
		// Compare actual result with expected result.
		await equalDirectory(t, path.join(directory, `default-dst`), path.join(directory, `default-exp`));
	} catch(error) {
		t.fail(error);
	}
});

test(`false`, async function(t) {
	try {
		// Run hoastig.
		await hoastig(directory, {
			destination: `false-dst`,
			sources: `false-src`
		}, Object.assign({}, options, {
			noMinify: false
		}));
		
		// Compare actual result with expected result.
		await equalDirectory(t, path.join(directory, `false-dst`), path.join(directory, `false-exp`));
	} catch(error) {
		t.fail(error);
	}
});

test(`true`, async function(t) {
	try {
		// Run hoastig.
		await hoastig(directory, {
			destination: `true-dst`,
			sources: `true-src`
		}, Object.assign({}, options, {
			noMinify: true
		}));
		
		// Compare actual result with expected result.
		await equalDirectory(t, path.join(directory, `true-dst`), path.join(directory, `true-exp`));
	} catch(error) {
		t.fail(error);
	}
});