'use strict';

const expect = require('chai').expect;
const metricsMock = require('../utils/metrics-mock');

const mockInstance = {
	getItem: (opts, cb) => {
		setTimeout(() => cb(null, {}));
	}
};

const get = require('../../lib/get');

describe('#get', () => {

	it('should reject when a database doesn\'t return URL', () => {
		return get({
				fromURL: 'https://www.ft.com/unknown',
				dynamo: mockInstance,
				metrics: metricsMock,
				table: 'urlmgmtapi_primary',
				timeout: 500
			})
			.then(() => {
				throw new Error('this shouldn\'t resolve');
			}, err => {
				expect(err.message).to.eql('URL_NOT_FOUND');
			});
	});

});
