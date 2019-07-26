const fetchWrapper = require('node-fetch')
const colors = require('colors');
const parseSchema = require('mongodb-schema');
const AdapterModule = require('../modules/crawler/adapter.js');

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
		try {
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
		} catch (error) {
			console.log(error);
		}
	}

	async test() {
		try {
			var adp = new AdapterModule('mongodb://localhost:27017', this.database);
			await adp.connect();

			var event = 81;
			var splitIds = [2077, 2078, 2079, 2080, 2082];

			/*
			Get split IDs
			*/
			var splits = (await adp.findProjectInCollection('stages', {'eventId': event, 'stageId': 1031}))[0].splitPoints;
			var wrcEntries = (await adp.findProjectInCollection('entries', {'eventId': event, 'eligibility': 'M'}));


			for (let entry of wrcEntries) {
				var entryId = entry.entryId;
				process.stdout.write(`${entry.driver.code}\t`);

				for (let split of splits) {
					let splitId = split.splitPointId;

					let data = (await adp.findProjectInCollection(
						'splits', 
						{'entryId': entryId, 'splitPointId': splitId},
						{'_id': 0, 'elapsedDurationMs': 1, 'splitDateTime': 1}
					))[0].elapsedDurationMs;

					process.stdout.write(this._printTime(data).cyan);
				}
				process.stdout.write(`\n`);
			}

			await adp.disconnect();
		} catch (error) {
			console.log(error);
		}
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

	_printTime(millis) {
		let minutes = this._addTrailingZero(Math.round(millis/60000));
		let seconds = this._addTrailingZero((millis % 60000 / 1000).toFixed(2));

		//let milliseconds =

		return `${minutes}:${seconds}\t`;
	}

	_addTrailingZero(num) {
		return num < 10 ? `0${num}` : num;
	}
}

(async function() {
	const BASEURL = 'https://www.wrc.com/service/sasCacheApi.php?route=events';
	const DATABASE = 'FakeDataApi'

	var af = new ApiFetcher(BASEURL, DATABASE);
	af.test();
}())