'use strict';

const active = require('./lib/active');
const get = require('./lib/get');
const dynamos = require('./lib/dynamos');
const health = require('./lib/health');
const cache = require('./lib/cache');
const extensionRX = /\.(?:json|rss)$/;
let metrics;
let useCache = false;
let timeout;

exports.health = health.check;

exports.get = fromURL => {

	if(useCache){
		let cacheItem = cache.retrieve(fromURL);
		if(cacheItem){
			return Promise.resolve(cacheItem);
		}
	}
	const extension = (extensionRX.exec(fromURL) || [''])[0];
	if (extension) {
		fromURL = fromURL.replace(extensionRX, '');
	}

	const dynamo = dynamos[active()];

	return get({
		dynamo: dynamo.instance,
		table: dynamo.table,
		fromURL,
		metrics,
		timeout
	}).catch(err => {
		if (err.message === 'URL_NOT_FOUND') {
			// NB. This will still get cached by the next then because
			// now this promise is not rejected anymore.
			return {
				fromURL: fromURL + extension,
				toURL: fromURL + extension,
				code: 100
			};
		}
		return Promise.reject(err);
	}).then(result => {
		result = {
			fromURL: result.fromURL + extension,
			toURL: result.toURL + extension,
			code: result.code
		};
		useCache && cache.store(fromURL, result);
		return result;
	});
};

exports.init = opts => {
	metrics = opts.metrics;
	useCache = opts.useCache || false;
	timeout = opts.timeout;
	cache.init({ metrics });
	active.init({ metrics });
};
