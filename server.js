const express = require('express');
const app = express();

app.get('/', (req, res) => {
	res.send('WRC Data API')
});

app.get('/rally', (req, res) => {
	res.send('List all available rallies');
});

app.get('/rally/:rallyId', (req, res) => {
	res.send(`All info about rally: ${req.params.rallyId}`);
});

app.get('/rally/:rallyId/stages', (req, res) => {
	res.send(`List all stages for rally: ${req.params.rallyId}`);
});



app.listen(3000, () => console.log('Example app listening on port 3000!'))