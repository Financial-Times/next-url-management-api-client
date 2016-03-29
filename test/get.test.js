'use strict';

const proxyquire = require('proxyquire');
const expect = require('chai').expect;
const itemFixture = require('./fixtures/fastft.json');
const metricsMock = require('./utils/metrics-mock');

const mockInstance = {
	getItem: (opts, cb) => {
		if (opts.Key.FromURL.S === 'https://www.ft.com/fastft') {
			setTimeout(() => cb(null, itemFixture))
		} else if (opts.Key.FromURL.S === 'https://www.ft.com/slowft') {
			setTimeout(() => cb(null, itemFixture), 1000)
		} else {
			setTimeout(() => cb(null, {}));
		}
	}
};

const main = proxyquire('..', {
	'./lib/dynamos': {
		master: { table: 'urlmgmtapi_master', instance: mockInstance },
		slave: { table: 'urlmgmtapi_slave', instance: mockInstance }
	}
});

describe('#get', () => {

	before(() => main.init({ metrics: metricsMock, timeout: 500 }));

	it('should #get /fastft', () => {
		return main.get('https://www.ft.com/fastft')
			.then(data => {
				expect(data).to.eql({
					code: 100,
					fromURL: 'https://www.ft.com/fastft',
					toURL: 'https://www.ft.com/stream/brandId/NTlhNzEyMzMtZjBjZi00Y2U1LTg0ODUtZWVjNmEyYmU1NzQ2-QnJhbmRz'
				});
			});
	});

	it('should #get /fastft.rss', () => {
		return main.get('https://www.ft.com/fastft.rss')
			.then(data => {
				expect(data).to.eql({
					code: 100,
					fromURL: 'https://www.ft.com/fastft.rss',
					toURL: 'https://www.ft.com/stream/brandId/NTlhNzEyMzMtZjBjZi00Y2U1LTg0ODUtZWVjNmEyYmU1NzQ2-QnJhbmRz.rss'
				});
			});
	});

	it('should #get /fastft.json', () => {
		return main.get('https://www.ft.com/fastft.json')
			.then(data => {
				expect(data).to.eql({
					code: 100,
					fromURL: 'https://www.ft.com/fastft.json',
					toURL: 'https://www.ft.com/stream/brandId/NTlhNzEyMzMtZjBjZi00Y2U1LTg0ODUtZWVjNmEyYmU1NzQ2-QnJhbmRz.json'
				});
			});
	});

	it('should return a vanity-like response if the database doesn\'t contain a url', () => {
		return main.get('https://www.ft.com/unknown')
			.then(data => {
				expect(data).to.eql({
					code: 100,
					fromURL: 'https://www.ft.com/unknown',
					toURL: 'https://www.ft.com/unknown'
				});
			});
	});

	it('should return a vanity-like response for rss if the database doesn\'t contain a url', () => {
		return main.get('https://www.ft.com/unknown.rss')
			.then(data => {
				expect(data).to.eql({
					code: 100,
					fromURL: 'https://www.ft.com/unknown.rss',
					toURL: 'https://www.ft.com/unknown.rss'
				});
			});
	});

	it('should return a vanity-like response for json if the database doesn\'t contain a url', () => {
		return main.get('https://www.ft.com/unknown.json')
			.then(data => {
				expect(data).to.eql({
					code: 100,
					fromURL: 'https://www.ft.com/unknown.json',
					toURL: 'https://www.ft.com/unknown.json'
				});
			});
	});

	it('should reject if the vanity service takes too long', () => {
		return main.get('https://www.ft.com/slowft')
			.then(() => {
				throw new Error('getting a slow vanity should not resolve');
			}, error => {
				expect(error.toString()).to.contain('timed out')
			});
	});

	it('should know that next dot will be www dot quite soon', () => {
		return main.get('https://next.ft.com/fastft')
			.then(data => {
				expect(data).to.eql({
					code: 100,
					fromURL: 'https://www.ft.com/fastft',
					toURL: 'https://www.ft.com/stream/brandId/NTlhNzEyMzMtZjBjZi00Y2U1LTg0ODUtZWVjNmEyYmU1NzQ2-QnJhbmRz'
				});
			});
	});

});
