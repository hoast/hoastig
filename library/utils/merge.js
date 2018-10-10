/**
 * Check whether the item is an object.
 * @param {*} item 
 */
const isObject = function(item) {
	return (item && typeof item === `object` && !Array.isArray(item));
};

/**
 * 
 * @param {object} target Target object to merge to.
 * @param  {...any} sources Objects to merge into the target.
 */
const merge = function(target, ...sources) {
	if (!sources.length) {
		return target;
	}
	const source = sources.shift();
	
	if (isObject(target) && isObject(source)) {
		for (const key in source) {
			if (isObject(source[key])) {
				if (!target[key]) {
					Object.assign(target, { [key]: {} });
				}
				merge(target[key], source[key]);
			} else {
				Object.assign(target, { [key]: source[key] });
			}
		}
	}
	
	return merge(target, ...sources);
};

module.exports = merge;