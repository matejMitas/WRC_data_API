const fs = require('fs');
const cheerio = require('cheerio');
const JSONFormatter = require("simple-json-formatter");
// library for conversion of HTML entities to Unicode strings
const EntitiesModule = require('html-entities').XmlEntities;
const entities = new EntitiesModule();

const startSelectors = {
	crewNo: `td:nth-of-type(1)`,
	crewMembers: `td:nth-of-type(2)`,
	crewEquip: `td:nth-of-type(3)`,
	crewElig: `td:nth-of-type(4)`,
	crewClass: `td:nth-of-type(5)`,
	crewPrior: `td:nth-of-type(6)` 
};

function extractText(data) {
	data = data.split('<br>');
	data.forEach((item, index) => {
		data[index] = item.trim();
	});
	return data;
}

function createDate(array, offset) {
	let len = array.length;
	if (len < 3 || len > 5) {
		throw 'Date can be create either to day precision or to minute precision, nothing else';
	}
	// Date constructor is not content with strings
	array.forEach(function(elem, index){
		array[index] = parseInt(elem);
	});
	// normalization for full date range
	if (len === 3)
		array.push(0, 0);
	return new Date(array[2], array[1] - 1, array[0], array[3] + 1 - offset, array[4]);
}

function scrapeStartList(data) {
	// main object for data, gets transfered to JSON later on after filled
	var startList 	= {},
		$ 			= cheerio.load(data);
	// scraping	
	$('tbody tr').each(function() {
		// object, that holds temp info
		let crewObj = {
			crewNo: undefined,
			crewMembers: {
				crewDriver: {},
				crewCodriver: {}
			},
			crewEquip: {
				team: undefined,
				make: undefined,
				car: undefined,
			},
			crewInfo: {
				eligibilty: undefined,
				class: undefined,
				priority: undefined
			}
		}, crewPtr;
		// set crew number
		crewObj['crewNo'] = $(this).find(startSelectors.crewNo).html()
		// set driver/codriver info
		crewPtr = crewObj['crewMembers'];
		$(this).find(`${startSelectors.crewMembers} img`).each(function(index){
			var nat = $(this).attr('title');
			if (index === 0) {
				crewPtr['crewDriver']['nat'] = nat;
			} else if (index === 1) {
				crewPtr['crewCodriver']['nat'] = nat;
			} else {
				throw 'Crew has only two members';
			}
		});
		// remove all useless info
		$(this).find(`${startSelectors.crewMembers} img`).remove();
		// set driver/codriver names
		let ctx = $(this).find(startSelectors.crewMembers).html(),
			crewMembersData = extractText(ctx);
		crewPtr['crewDriver']['name'] = crewMembersData[0];
		crewPtr['crewCodriver']['name'] = crewMembersData[1];
		// set equipment info
		let make = $(this).find(`${startSelectors.crewEquip} img`).attr('src');
		make = make.slice(make.lastIndexOf('/') + 1, make.lastIndexOf('.'));
		crewPtr = crewObj['crewEquip'];
		crewPtr['make'] = `${make.slice(0,1).toUpperCase()}${make.slice(1)}`;
		// remove manufacturer image
		$(this).find(`${startSelectors.crewEquip} img`).remove();
		let equipInfo = extractText($(this).find(startSelectors.crewEquip).html());
		crewPtr['team']= equipInfo[0];
		crewPtr['car'] = equipInfo[1];
		// set info
		crewPtr = crewObj['crewInfo'];
		let crewEligInfo = $(this).find(startSelectors.crewElig).html();
		crewPtr['eligibilty'] = crewEligInfo !== 'None' ? crewEligInfo : undefined;
		crewPtr['class'] = $(this).find(startSelectors.crewClass).html().trim();
		let crewPriorInfo = $(this).find(startSelectors.crewPrior).html();
		crewPtr['priority'] = crewPriorInfo !== 'None' ? crewPriorInfo : undefined;
		// assign to the main obj
		startList[`crew_${crewObj.crewNo}`] = crewObj;
	});
	return startList;
}


const stageSelectors = {
	stageNo: `td:nth-of-type(1)`,
	stageName: `td:nth-of-type(2) a`,
	stageLen: `td:nth-of-type(3)`,
	stageStart: `td:nth-of-type(4)`,
	stageStatus: `td:nth-of-type(5)`
};

/*fs.readFile('source/itinerary.html', 'utf-8', (err, data) => {
	if (err) throw err;
	var $ = cheerio.load(data),
		stages = [];

	var offset = -5;

	$('tbody').each(function() {
		var day = $(this).find('tr:first-of-type td strong').html().split('-')[1].trim().split('.');

		$(this).find('tr:nth-of-type(n+2)').each(function(){
			let stage = {};
			stage['stageNo'] = $(this).find(stageSelectors.stageNo).html();
			stage['stageName'] = entities.decode($(this).find(stageSelectors.stageName).html().trim());
			stage['stageLen'] = parseFloat($(this).find(stageSelectors.stageLen).html());
			stage['stageStart'] = createDate(day.concat($(this).find(stageSelectors.stageStart).html().trim().split(':')), offset);
			stage['stageStatus'] = $(this).find(stageSelectors.stageStatus).html().trim();

			stages.push(stage);
		});
	});
	console.log(stages);
});*/

fs.readFile('out.html', 'utf-8', (err, data) => {
	if (err) throw err;
	// scraping itself
	fs.writeFile('json/startList.json', JSONFormatter.format(JSON.stringify(scrapeStartList(data)), "\t"), function(err){
		if (err) throw err;
	    console.log('Start list sucessfully scraped and saved');
	});
});

/*fs.readFile('source/text.html', 'utf-8', (err, data) => {
	if (err) throw err;
	data = entities.decode(data);

	var $ = cheerio.load(data);
	$('p').each(function() {
		let articleType = $(this).find('span').attr('class').split(' ')[1];
		if (articleType === 'comment') {
			let heading, text, indexes;

			$(this).find('span').remove();
			heading = entities.decode($(this).find('strong').html()).trim().split(' ');

			$(this).find('strong').remove();
			text = entities.decode($(this).html()),
			indexes = [text.indexOf('"'), text.lastIndexOf('"')];
			if (indexes[0] > -1 && indexes[1] > -1) {
				console.log('\n---------');
				console.log(heading);
				console.log(text.slice(indexes[0]+1, indexes[1]));
			}
		}
		// console.log($(this).find('span').attr('class'));
		//console.log($(this).find('strong').html());
	});
});*/


