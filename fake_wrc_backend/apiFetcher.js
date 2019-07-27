/*
Library imports
*/
const fetchWrapper = require('node-fetch')
const colors = require('colors');
const parseSchema = require('mongodb-schema');

process.env['NODE_CONFIG_DIR'] = `${__dirname.split('/').slice(0, -1).join('/')}/config`;
const config = require('config');
/*
Own modules
*/
const AdapterModule = require('../modules/crawler/adapter.js');

class ApiFetcher {
	constructor() {
		this.basePath 	= config.get('FakeDataApi.originalPath');
		this.dbConfig 	= config.get('FakeDataApi.db');
		this.dbCols 	= config.get('FakeDataApi.dbCols');
	}

	async execute() {
		try {
			this.adp = new AdapterModule(
				`${this.dbConfig.type}${this.dbConfig.host}:${this.dbConfig.port}`, 
				this.dbConfig.dbName
			);
			await this.adp.connect();
			await this._getRallyInfo(81);
			/*
			First, get all rally IDs (here named eventId to introduce confussion)
			*/
			// for await (var rallyData of this._getData()) {
			// 	var eventId = rallyData.eventId;
			// 	await this._getRallyInfo(eventId);
			// }

			await this.adp.disconnect();
		} catch (error) {
			console.log(error);
		}
	}

	async _getRallyInfo(eventId) {
		/*
		Each _get method has responsibility
		to determine wherever its core functionality
		is fullfiled and can be passed down the 
		data organisation tree
		*/
		var hasHumanId = await this._checkPresence(
			this.dbCols.rally, 
			{'data.eventId': eventId}
		);

		if (!hasHumanId) {
			this._logInfo(`Rally (${eventId}) is about to fetched`, 'prog');
			/*
			Even though 'event' and 'rally' overlaps without
			any serious thought about consistency we still need
			both to get all classes
			*/
			let eventData = (await this._getData(eventId).next()).value
			var rallyId = eventData.rallies[0].rallyId
			let rallyData = (await this._getData(`${eventId}/rallies/${rallyId}`).next()).value
			/*
			Add 'eligibilities' and 'groups'
			*/
			eventData.eligibilities = rallyData.eligibilities;
			eventData.groups = rallyData.groups;
			/*
			Create unique ID that is human-readable.
			Extract year and ISO country code
			*/
			humanId = {
				year: parseInt(eventData.startDate.split('-')[0]),
				country: eventData.country.iso3,
			};

			await this._storeRecord(
				this.dbCols.rally, 
				humanId,	 
				eventData
			);

			this._logInfo(`Rally (${eventId}) is fetched`, 'done');
		} else {
			this._logInfo(`Rally (${eventId}) already saved`, 'info');
		}

		/*
		After rally is fetched (or already in place), stages/entries needs to be taken care of
		*/
		await this._getStagesInfo(eventId, hasHumanId);
		await this._getEntries(eventId);
		this._logDivider();
	}

	async _getStagesInfo(eventId, rallyHumanId) {
		for await (var stageData of this._getData(`${eventId}/stages`)) {
			var stageId = stageData.stageId;
			var hasHumanId = await this._checkPresence(
				this.dbCols.stage, 
				{'data.eventId': eventId, 'data.stageId': stageId}
			);

			if (!hasHumanId) {
				this._logInfo(`Stages (${stageId}) for rally (${eventId}) is about to fetched`, 'prog');
				/*
				Copy humanId for each step of the loop to ensure
				possiblity of appending SS code
				*/
				let humanId = rallyHumanId;
				humanId.code = stageData.code

				await this._storeRecord(
					this.dbCols.stage, 
					humanId,
					stageData
				);

				this._logInfo(`Stages (${stageId}) for rally (${eventId}) is fetched`, 'done');
			} else {
				this._logInfo(`Stages (${stageId}) for rally (${eventId}) already saved`, 'info');
			}
		}
	}

	async _getEntries() {

	}

	async _getSplits() {

	}

	async * _getData(urlModifier=null) {
		try {
	    	const response = await fetchWrapper(urlModifier ? `${this.basePath}/${urlModifier}` : this.basePath);
	    	const data = await response.json();

	    	if (data instanceof Array) {
	    		for (let item of data) {
	    			yield item;
	    		}
	    	} else {
	    		yield data;
	    	}
	  	} catch (error) {
	    	console.log(error);
	  	}
	}

	async _storeRecord(col, humanId, data) {
		let payload = {};
		payload.humanId = humanId
		payload.timestamp = new Date().getTime();
		payload.data = data;

		await this.adp.insertIntoCollection(col, payload);
	}

	async _checkPresence(col, query) {
		/*
		Sometimes is useful to return not only binary state but 
		*/
		try {
			let found = (await this.adp.findInCollection(col, query))[0].humanId
			console.log(found);
			return found;
		} catch (err) {
			return false;
		}
	}

	_logInfo(msg, severity) {
		let coloredMsg;
		let matchSeverity = {
			'done'	: msg.green,
			'info'	: msg.cyan,
			'err'	: msg.red,
			'prog'	: msg.yellow
		}
		console.log(matchSeverity[severity]);
	}

	_logDivider() {
		console.log('------------------------------------------------------------');
	}
}

(async function() {
	var af = new ApiFetcher();
	af.execute();
}());