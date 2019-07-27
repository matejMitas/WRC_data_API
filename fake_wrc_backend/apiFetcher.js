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
		this.basePath = config.get('FakeDataApi.originalPath');
		this.dbConfig = config.get('FakeDataApi.db');
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
			for await (let ralliesData of this._getData()) {

				/*
				Check if rally is already store in database
				*/

				console.log(ralliesData.eventId)
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
		let payload = {}
		payload.humanId = {
			year	: parseInt(eventData.startDate.split('-')[0]),
			country	: eventData.country.iso3
		}
		payload.data = eventData

		console.log(payload);
	}

	async _getStagesInfo() {
		//
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

	async _logToDb(payload) {
		/*
		Way to track fetching data from API and storing it
		in our own database
		*/
		await this.adp.insertIntoCollection('log', {
			timestamp: new Date().getTime(),
			payload: payload
		});
	}

	async _deleteLogDb(query) {
		await this.adp.deleteFromCollection('log', query);
	}
}

(async function() {
	var af = new ApiFetcher();
	af.execute();
}());