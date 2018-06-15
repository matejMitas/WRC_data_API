const fs = require('fs');
const cheerio = require('cheerio');
const JSONFormatter = require("simple-json-formatter");

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

function scrapeItinerary(data) {

}


fs.readFile('out.html', 'utf-8', (err, data) => {
	if (err) throw err;
	// scraping itself
	fs.writeFile('json/startList.json', JSONFormatter.format(JSON.stringify(scrapeStartList(data)), "\t"), function(err){
		if (err) throw err;
	    console.log('Start list sucessfully scraped and saved');
	});
});