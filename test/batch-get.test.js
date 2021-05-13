'use strict';

const proxyquire = require('proxyquire');
const expect = require('chai').expect;
const fastFtFixture = require('./fixtures/fastft.json');
const justasFastFtFixture = require('./fixtures/justasfastft.json');
const metricsMock = require('./utils/metrics-mock');

const mockInstance = {
	batchGetItem: (opts, cb) => {
		cb(null, {
			Responses: {
				urlmgmtapi_primary: [
					fastFtFixture.Item,
					justasFastFtFixture.Item
				]
			}
		});
	}
};

const main = proxyquire('..', {
	'./lib/dynamos': {
		init: () => null,
		get: function (name) {
			return this[name];
		},
		primary: { table: 'urlmgmtapi_primary', instance: mockInstance },
		replica: { table: 'urlmgmtapi_replica', instance: mockInstance }
	}
});

describe('#batchGet', () => {

	before(() => main.init({ metrics: metricsMock, timeout: 500 }));

	it('should #get /fastft and /justasfastft', () => {
		return main.batchGet(['https://www.ft.com/fastft', 'https://www.ft.com/justasfastft'])
			.then(data => {
				expect(data).to.eql([
					{
						code: 100,
						fromURL: 'https://www.ft.com/fastft',
						toURL: 'https://www.ft.com/stream/brandId/NTlhNzEyMzMtZjBjZi00Y2U1LTg0ODUtZWVjNmEyYmU1NzQ2-QnJhbmRz'
					},
					{
						code: 100,
						fromURL: 'https://www.ft.com/justasfastft',
						toURL: 'https://www.ft.com/stream/brandId/NTlhNzEyMzMtZjBjZi00Y2U1LTg0ODUtZWVjNmEyYmU1NzQ2-QnJhbmRz'
					}
				]);
			});
	});

	it('should return a vanity-like response if the database doesn\'t contain a url', () => {
		return main.batchGet(['https://www.ft.com/fastft', 'https://www.ft.com/unknown'])
			.then(data => {
				expect(data).to.eql([
					{
						code: 100,
						fromURL: 'https://www.ft.com/fastft',
						toURL: 'https://www.ft.com/stream/brandId/NTlhNzEyMzMtZjBjZi00Y2U1LTg0ODUtZWVjNmEyYmU1NzQ2-QnJhbmRz'
					},
					{
						code: 100,
						fromURL: 'https://www.ft.com/unknown',
						toURL: 'https://www.ft.com/unknown'
					}
				]);
			});
	});

	it('should reject urls with trailing slashes to the slash-less url', () => {
		return main.batchGet(['https://www.ft.com/fastft/'])
			.then(() => {
				throw new Error('should have thrown');
			}, err => {
				expect(err.toString()).to.contain('Trailing slash redirection to trimmed URLs not supported');
			});
	});

});
