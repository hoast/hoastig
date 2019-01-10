// Dependency modules.
const test = require(`ava`);
// Custom module.
const Hoastig = require(`../../library`);

// Get module info.
const info = require(`../../package.json`);

test(`equal version`, async function(t) {
	// Use same version as package.
	const version = info.version;
	
	// Run hoastig.
	try {
		await Hoastig(__dirname, {
			version: version
		});
	} catch(error) {
		t.fail();
		return;
	}
	
	t.pass();
});

test(`lowest version`, async function(t) {
	// Lowest version possible.
	const version = `0.0.0`;
	
	// Run hoastig.
	try {
		await Hoastig(__dirname, {
			version: version
		});
	} catch(error) {
		t.pass();
		return;
	}
	
	t.fail();
});

test(`major greater version`, async function(t) {
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
		});
	} catch(error) {
		t.pass();
		return;
	}
	
	t.fail();
});