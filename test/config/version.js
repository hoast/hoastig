// Dependency modules.
const test = require(`ava`);
// Custom module.
const Hoastig = require(`../../library`);

// Get module info.
const info = require(`../../package.json`);

const options = {
	develop: false,
	noChanged: true,
	noTransformCSS: true,
	noTransformJS: true,
	noMinify: true,
	remove: false
};

test(`Version same as project`, async function(t) {
	// Use same version as package.
	const version = info.version;
	
	// Run hoastig.
	try {
		await Hoastig(__dirname, {
			version: version
		}, options);
	} catch(error) {
		t.fail();
		return;
	}
	
	t.pass();
});

test(`Version 0.0.0`, async function(t) {
	// Lowest version possible.
	const version = `0.0.0`;
	
	// Run hoastig.
	try {
		await Hoastig(__dirname, {
			version: version
		}, options);
	} catch(error) {
		t.pass(); // Test is expected to fail!
		return;
	}
	
	t.fail();
});

test(`Version major greater`, async function(t) {
	// Split semantic versioning up.
	let version = info.version.split(`.`);
	// Parse major version number and increment it.
	version[0] = (parseInt(version[0]) + 1).toString();
	// Concatenate version numbers together.
	version = version.concat(`.`);
	
	// Run hoastig.
	try {
		await Hoastig(__dirname, {
			version: version
		}, options);
	} catch(error) {
		t.pass(); // Test is expected to fail!
		return;
	}
	
	t.fail();
});