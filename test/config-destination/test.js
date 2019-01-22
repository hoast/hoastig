// Node modules.
const path = require(`path`);
// Dependency modules.
const test = require(`ava`);
// Helper modules.
const equalDirectory = require(`../helpers/equalDirectory`),
	removeFiles = require(`../helpers/removeFiles`);
// Library module.
const hoastig = require(`../../library`);

const options = {
	development: false,
	noChanged: true,
	noTransformCSS: true,
	noTransformJS: true,
	noMinify: true,
	remove: false
};

/**
 * Clean-up: always remove build directories.
*/
test.after.always(`Remove files`, async function(t) {
	try {
		await removeFiles([
			path.join(__dirname, `dst`),
			path.join(__dirname, `override-dst`)
		]);
	} catch(error) {
		t.fail(error);
	}
	
	t.pass();
});

test.serial(`default`, async function(t) {
	// Execute: run hoastig.
	try {
		await hoastig(__dirname, null, options);
	} catch(error) {
		t.fail(error);
	}
	
	// Test: compare actual result with expected result.
	try {
		await equalDirectory(t, path.join(__dirname, `dst`), path.join(__dirname, `exp`));
	} catch(error) {
		t.fail(error);
	}
});

test.serial(`override`, async function(t) {
	// Execute: run hoastig.
	try {
		await hoastig(__dirname, {
			destination: `override-dst`
		}, options);
	} catch(error) {
		t.fail(error);
	}
	
	// Test: compare actual result with expected result.
	try {
		await equalDirectory(t, path.join(__dirname, `override-dst`), path.join(__dirname, `exp`));
	} catch(error) {
		t.fail(error);
	}
});