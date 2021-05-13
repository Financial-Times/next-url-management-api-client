'use strict';

const AWS = require('aws-sdk');
const https = require('https');

function dynamo (table, region, opts) {
	const httpOptions = {};
	if (opts.timeout) {
		httpOptions.timeout = opts.timeout
	}
	if (opts.poolConnections === true) {
		httpOptions.agent = new https.Agent({ keepAlive: true})
	}
	if (opts.connectTimeout) {
		httpOptions.connectTimeout = opts.connectTimeout
	}

	return {
		table,
		instance: module.exports._createDynamoDBInstance({
			region: region,
			accessKeyId: process.env.URLMGMTAPI_AWS_ACCESS_KEY || process.env.AWS_ACCESS_KEY,
			secretAccessKey: process.env.URLMGMTAPI_AWS_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY,
			httpOptions
		})
	};
}

const dynamos = {};

module.exports.init = function (opts) {
	opts = opts || {};
	dynamos.primary = dynamo('urlmgmtapi_primary', 'eu-west-1', opts);
	dynamos.replica = dynamo('urlmgmtapi_replica', 'us-east-1', opts)
}

module.exports.get = name => dynamos[name];

// here to make writing tests easier as AWS sdk is a devil to mock
module.exports._createDynamoDBInstance = opts => new AWS.DynamoDB(opts)
