#!/usr/bin/env node

// Node modules.
const { constants, access, readFile } = require(`fs`),
	{ resolve } = require(`path`);
// If debug available require it.
let debug; try { debug = require(`debug`)(`hoastig-cli`); } catch(error) { debug = function() {}; }
// Dependency modules.
const commander = require(`commander`);
// Custom modules.
const info = require(`../package.json`),
	Hoastig = require(`../library`);

// Trace unhandled rejections.
process.on(`unhandledRejection`, function(reason, promise) {
	console.log(`Unhandled Rejection at:`, promise, `reason:`, reason);
});

// Setup command utility.
commander
	.name(info.name)
	.description(info.description)
	.version(info.version)
	.option(`-c, --config <path>`, `path to configuration file`, info.name.concat(`.json`))
	.option(`-d, --development`, `process files in development mode`)
	.option(`-r, --remove`, `remove destination directory beforehand`)
	.parse(process.argv);

// If version or help called do process.
if (commander.version !== true && commander.help !== true) {
	console.log(`Start building...`);
	let time = process.hrtime();

	// Translate arguments.
	const directory = process.cwd();
	const filePath = resolve(directory, commander.config);
	debug(`Process from ${directory} using configuration from ${filePath}.`);
	// Check file access.
	access(filePath, constants.F_OK | constants.R_OK, function(error) {
		if (error) {
			throw error;
		}
		debug(`Configuration accessible.`);
		
		// Read configuration file.
		readFile(filePath, `utf8`, async function(error, data) {
			if (error) {
				throw error;
			}
			debug(`Configuration read: ${data}`);
			
			// Process directory using configuration.
			try {
				await Hoastig(directory, JSON.parse(data), {
					development: commander.development,
					remove: commander.remove
				});
			} catch(error) {
				throw error;
			}
			
			time = process.hrtime(time);
			console.log(`Finished in ${(time[0] + time[1] / 1e9).toFixed(3)}s.`);
		});
	});
}