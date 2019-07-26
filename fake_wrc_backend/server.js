const express = require('express');
const app = express();

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
app.get('/events', (req, res) => {
	res.send('List all available rallies');
});

/*
Info about event
*/
app.get('/events/:eventId', (req, res) => {
	res.send(`All info about rally: ${req.params.eventId}`);
});

app.listen(3000, () => {
	console.log(`Mirror of 'https://www.wrc.com/service/sasCacheApi.php' running on 3000
All routes are taken without prefix URL (https://www.wrc.com/service/sasCacheApi.php?route=).`)
})