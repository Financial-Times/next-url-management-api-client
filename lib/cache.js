'use strict';
const NodeCache = require('node-cache');

const OPTIONS = {
	stdTTL: 30 * 60, // 1/2h in seconds — https://github.com/tcs-de/nodecache#options
	checkperiod: 60
};

let cacheInstance;
let metrics;

function calculateTimeDiff(startTime){
	let endTime = process.hrtime(startTime);
	return (endTime[0] * 1000) + Math.round(endTime[1] / 1e6);
}

function init(opts){
	metrics = opts.metrics;
	if(!cacheInstance){
		cacheInstance = new NodeCache(OPTIONS);
	}
}

function store(key, value){
	return new Promise(function(resolve, reject){
		cacheInstance.set(key, value, function(err){
			if(err){
				return reject(err);
			}

			resolve();
		})
	});
}

function retrieve(key){
	let startTime = process.hrtime();
	let value = cacheInstance.get(key);
	let timeTaken = calculateTimeDiff(startTime);
	let result = timeTaken ? 'hits' : 'miss';
	metrics.count(`internal_cache.${result}`);
	metrics.histogram(`internal_cache.${result}_time`, timeTaken);
	return value;
}

module.exports = {
	init: init,
	store: store,
	retrieve: retrieve
};
