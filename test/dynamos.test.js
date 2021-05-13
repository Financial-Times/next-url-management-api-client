'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const dynamos = require('../lib/dynamos');
const Agent = require('https').Agent

describe('#dynamos', () => {

	beforeEach(() => sinon.stub(dynamos, '_createDynamoDBInstance'));
	afterEach(() => dynamos._createDynamoDBInstance.restore())

	it('should initialise primary and replica instances', () => {
		dynamos.init();
		expect(dynamos._createDynamoDBInstance.args[0][0]).to.deep.equal({
			region: 'eu-west-1',
			accessKeyId: 'URLMGMTAPI_AWS_ACCESS',
			secretAccessKey: 'URLMGMTAPI_AWS_SECRET',
			httpOptions: {}
		})
		expect(dynamos._createDynamoDBInstance.args[1][0]).to.deep.equal({
			region: 'us-east-1',
			accessKeyId: 'URLMGMTAPI_AWS_ACCESS',
			secretAccessKey: 'URLMGMTAPI_AWS_SECRET',
			httpOptions: {}
		})
	})

	it('should be possible to get primary or replica', () => {
		expect(dynamos.get('primary').table).to.equal('urlmgmtapi_primary')
		expect(dynamos.get('replica').table).to.equal('urlmgmtapi_replica')
	});

	it('should pass http options', () => {
		dynamos.init({
			timeout: 1000,
			connectTimeout: 100,
			poolConnections: true
		});
		const httpOptions = dynamos._createDynamoDBInstance.args[0][0].httpOptions;
		expect(httpOptions).to.exist
		expect(httpOptions.timeout).to.equal(1000)
		expect(httpOptions.connectTimeout).to.equal(100)
		expect(httpOptions.agent instanceof Agent).to.be.true
	});

});
