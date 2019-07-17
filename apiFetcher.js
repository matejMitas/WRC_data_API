const fetchWrapper = require('node-fetch')
const parseSchema = require('mongodb-schema');
const AdapterModule = require('./modules/crawler/adapter.js');

class ApiFetcher {
	constructor(basePath, database) {
		this.basePath = basePath;
		this.database = database;
		/*
		Each event has two IDs (don't really know why), so 
		it easier to store them at topmost level.
		*/
		this.current = {
			eventId: 0,
			rallyId: 0
		};
	}

	async execute() {
		var adp = new AdapterModule('mongodb://localhost:27017', this.database);
		await adp.connect();

		this.current.eventId = 81
		await this._getRallyInfo()

		/*
		First, get all rally IDs (here named eventId to introduce confussion)
		*/
		for await (let ralliesData of this._getData()) {
			//this.current.eventId = ralliesData.eventId
			//await this._getRallyInfo()
			
			/*
			TODO: 
				- entries
				- stages
				- penalties
				- retirements
			*/
		}

		await adp.disconnect();
	}

	async _getRallyInfo(eventId) {
		// let year = parseInt(rallyData.slug.split('-').slice(-1)[0]);
		// let country = rallyData.countryId;

		let rallyData = (await this._getData(this.current.eventId).next()).value
		this.current.rallyId = rallyData.rallies[0].rallyId
		//this.current.rallyId = rallyData
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
}

(async function() {
	const BASEURL = 'https://www.wrc.com/service/sasCacheApi.php?route=events';
	const DATABASE = 'rallyStorage'

	var af = new ApiFetcher(BASEURL, DATABASE);
	af.execute();
}())