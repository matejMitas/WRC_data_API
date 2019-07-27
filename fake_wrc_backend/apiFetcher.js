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
			//await this._getRallyInfo(81);
			/*
			First, get all rally IDs (here named eventId to introduce confussion)
			*/
			for await (var rallyData of this._getData()) {
				var eventId = rallyData.eventId;
				/*
				Check if rally is already store in database
				TODO: move to separete method
				*/
				await this._getRallyInfo(eventId);
				this._logDivider();



				//
				//await this._getRallyInfo()

				

				/*
				TODO: 
					- entries
					- stages
					- penalties
					- retirements
				*/
			}

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

		let checkPresence = await this._checkPresence(this.dbCols.rally, {'data.eventId': eventId});
		if (!checkPresence) {
			this._logInfo(`Rally (eventId = '${eventId}') is about to fetched`, 'prog');
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
			
			let payload = {}
			/*
			Create unique ID that is human-readable.
			Extract year and ISO country code
			*/
			payload.humanId = {
				year	: parseInt(eventData.startDate.split('-')[0]),
				country	: eventData.country.iso3
			}
			payload.timestamp = new Date().getTime();
			payload.data = eventData;

			await this.adp.insertIntoCollection(this.dbCols.rally, payload);
			this._logInfo(`Rally (eventId = '${eventId}') is fetched`, 'done');
		} else {
			this._logInfo(`Rally (eventId = '${eventId}') already saved`, 'info');
		}
	}

	async _getStagesInfo() {
		//
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

	async _checkPresence(col, query) {
		let found = (await this.adp.findInCollection(col, query)).length
		return (found) ? true : false; 
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