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
			path.join(__dirname, `default-dst`),
			path.join(__dirname, `string-dst`),
			path.join(__dirname, `array-dst`),
			path.join(__dirname, `multiple-dst`),
			path.join(__dirname, `subdirectory-dst`)
		]);
	} catch(error) {
		t.fail(error);
	}
	
	t.pass();
});

test(`Default value`, async function(t) {
	// Execute: run hoastig.
	try {
		await hoastig(__dirname, {
			destination: `default-dst`
		}, options);
	} catch(error) {
		t.fail(error);
	}
	
	// Test: compare actual result with expected result.
	try {
		await equalDirectory(t, path.join(__dirname, `default-dst`), path.join(__dirname, `exp`));
	} catch(error) {
		t.fail(error);
	}
});

test(`Override string`, async function(t) {
	// Execute: run hoastig.
	try {
		await hoastig(__dirname, {
			destination: `string-dst`,
			sources: `string-src`
		}, options);
	} catch(error) {
		t.fail(error);
	}
	
	// Test: compare actual result with expected result.
	try {
		await equalDirectory(t, path.join(__dirname, `string-dst`), path.join(__dirname, `exp`));
	} catch(error) {
		t.fail(error);
	}
});

test(`Override array`, async function(t) {
	// Execute: run hoastig.
	try {
		await hoastig(__dirname, {
			destination: `array-dst`,
			sources: [
				`array-src`
			]
		}, options);
	} catch(error) {
		t.fail(error);
	}
	
	// Test: compare actual result with expected result.
	try {
		await equalDirectory(t, path.join(__dirname, `array-dst`), path.join(__dirname, `exp`));
	} catch(error) {
		t.fail(error);
	}
});

test(`Override multiple`, async function(t) {
	// Execute: run hoastig.
	try {
		await hoastig(__dirname, {
			destination: `multiple-dst`,
			sources: [
				`multiple-src-A`,
				`multiple-src-B`,
			]
		}, options);
	} catch(error) {
		t.fail(error);
	}
	
	// Test: compare actual result with expected result.
	try {
		await equalDirectory(t, path.join(__dirname, `multiple-dst`), path.join(__dirname, `multiple-exp`));
	} catch(error) {
		t.fail(error);
	}
});

test(`Override subdirectory`, async function(t) {
	// Execute: run hoastig.
	try {
		await hoastig(__dirname, {
			destination: `subdirectory-dst`,
			sources: `subdirectory-src/src`
		}, options);
	} catch(error) {
		t.fail(error);
	}
	
	// Test: compare actual result with expected result.
	try {
		await equalDirectory(t, path.join(__dirname, `subdirectory-dst`), path.join(__dirname, `exp`));
	} catch(error) {
		t.fail(error);
	}
});