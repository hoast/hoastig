const os = require(`os`);

const ipAddresses = function() {
	const interfaces = os.networkInterfaces();
	
	const addresses = [];
	for (let k in interfaces) {
		for (let k2 in interfaces[k]) {
			const address = interfaces[k][k2];
			if (address.family === `IPv4` && !address.internal) {
				addresses.push(address.address);
			}
		}
	}
	
	return addresses;
};

module.exports = ipAddresses;