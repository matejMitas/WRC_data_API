/*
Library imports
*/
process.env['NODE_CONFIG_DIR'] = `${__dirname.split('/').slice(0, -2).join('/')}/config`;
const config = require('config');
const fs = require('fs');
/*
Own modules
*/
const AdapterModule = require('../../modules/crawler/adapter.js');

function parseSplitsPoints(splitPointsObj) {
	var data = splitPointsObj.map((item) => {
		return item.splitPointId;
	})
	/*
	One would expect that data in array is sorted but
	oftentimes it's not the case
	*/
	return data.sort((a,b) => a - b)
}

(async function() {
	/*
	Handle database
	*/
	var dbConfig = config.get('FakeDataApi.db');
	var dbCols = config.get('FakeDataApi.dbCols');
	var adp = new AdapterModule(
		`${dbConfig.type}${dbConfig.host}:${dbConfig.port}`, 
		dbConfig.dbName
	);
	await adp.connect();


	/*
	Fetch entries to match splits to crew
	*/
	var settings = {
		'humanId.country': 'FRA',
		'humanId.year': 2019
	}
	var entries = await adp.findInCollection(dbCols.entry, settings);
	/*
	Splits organized by stage number, stage is also needed to match 'splitPointId'
	*/
	settings['humanId.code'] = 'SS9';
	var stageSplits = (await adp.findInCollection(dbCols.stage, settings))[0].data.splitPoints;
	var splitIds = parseSplitsPoints(stageSplits);
	var merged = {}


	for (let entry of entries) {
		let id = entry.data.entryId;
		var elig = entry.data.eligibility;

		var record = {
			driver		: entry.data.driver.lastName, 
			codriver	: entry.data.codriver.lastName,
			elig 		: elig,
			splits 		: []
		}
		/*
		Find splits for each indivual entry and stage
		*/
		settings['data.entryId'] = id;
		var splits = await adp.findInCollection(dbCols.split, settings);

		for (var split of splits) {
			record.splits.push(split.data.splitDateTime);
		}

		/*
		Crew might have already retired before this stage
		*/
		try {
			if (record.splits.length) {
				merged[elig].push(record);
			}
		} catch (err) {
			if (err.name == 'TypeError') {
				merged[elig] = [];
			}
		}
	}

	fs.writeFile("test.json", JSON.stringify(merged), function(err) {
	    if (err) {
	        console.log(err);
	    }
	});
	/*
	Manually disconnect
	*/
	await adp.disconnect();
}());
