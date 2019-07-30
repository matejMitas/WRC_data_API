const express = require('express');
const morgan  = require('morgan');
const AdapterModule = require('../modules/crawler/adapter.js');
/*
Config path
*/
process.env['NODE_CONFIG_DIR'] = `${__dirname.split('/').slice(0, -1).join('/')}/config`;
const config = require('config');

const app = express();
var adp;

app.use(morgan('combined'));

/*
Info route
*/
app.get('/', (req, res) => {
	res.send(`
		Mirror of 'https://www.wrc.com/service/sasCacheApi.php'.<br>
		All routes are taken without prefix URL (https://www.wrc.com/service/sasCacheApi.php?route=).
	`)
});

/*
Events == Rallies, not sure why they selected such a confusing
naming convension
*/
app.get('/events', async (req, res) => {
	res.send('List all available rallies');
});

/*
Info about event
*/
app.get('/events/:eventId', (req, res) => {
	res.send(`All info about rally: ${req.params.eventId}`);
});

/*
Split times
*/
app.get('/events/:eventId/stages/:stageId/splittimes', async (req, res) => {
	const stage = parseInt(req.params.stageId);

	const splitPointsData = await adp.findProjectInCollection('stage', {'data.stageId': stage}, {'_id': 0, 'data.splitPoints': 1});
	try {
		const splitPoints = splitPointsData[0].data.splitPoints.map((item) => item.splitPointId)
		var ret = await adp.findProjectInCollection('split', 
			{'data.splitPointId': {'$in': splitPoints}}, 
			{'_id': 0, 'data': 1}
		);

		res.json(ret.map((item) => item.data));
	} catch (err) {
		res.status(404).send([]);
	}
	

	
});

/*
Error route
*/
app.get('*', (req, res) => {  
	res.status(404).send([]);
});

/*
Wrapped in async function to facilite database adapter's
asynchronous nature
*/
(async function() {

	var dbConfig = config.get('FakeDataApi.db');

	adp = new AdapterModule(
		`${dbConfig.type}${dbConfig.host}:${dbConfig.port}`, 
		dbConfig.dbName
	);
	await adp.connect();

	const server = app.listen(3000, () => {
// 	console.log(`Mirror of 'https://www.wrc.com/service/sasCacheApi.php' running on 3000
// All routes are taken without prefix URL (https://www.wrc.com/service/sasCacheApi.php?route=).`)
	})

}());



