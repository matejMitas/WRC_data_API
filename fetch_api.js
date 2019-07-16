const fetchWrapper = require('node-fetch')
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

		/*
		First, get all rally IDs (here named eventId to introduce confussion)
		*/
		for await (let rallyData of this._getData()) {
			console.log(rallyData);

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

	async getRallyInfo(rallyId) {

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