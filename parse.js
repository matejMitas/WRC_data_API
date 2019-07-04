const fs = require('fs');
const cheerio = require('cheerio');
const JSONFormatter = require("simple-json-formatter");
// library for conversion of HTML entities to Unicode strings
const EntitiesModule = require('html-entities').XmlEntities;
const entities = new EntitiesModule();
const where = require('node-where');
const countries = require("i18n-iso-countries");

const AdapterModule = require('./modules/crawler/adapter.js');

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
	return new Date(array[2], array[1] - 1, array[0], array[3] + 1 - offset, array[4]);
}

/*fs.readFile('source/index.html', 'utf-8', (err, data) => {
	if (err) throw err;
	// for cheerio operation
	var $ 			= cheerio.load(data);
	//console.log(data);

	$('.season-event-name a').attr('title', 'Show results').each(function(){
		console.log('https://www.ewrc-results.com' + $(this).attr('href').replace('/final', '/entries'));
	})
});*/

// fs.readFile('./michelin.html', 'utf-8', (err, data) => {
// 	if (err) throw err;
// 	// for cheerio operation
// 	var $ 			= cheerio.load(data);
// 	//console.log(data);




// 	$('a').each(function(){
// 		console.log('http://www.dtmu.ge' + $(this).attr('href').slice(1))
// 	})
// });

// fs.readFile('./test.html', 'utf-8', (err, data) => {
// 	if (err) throw err;
// 	// for cheerio operation
// 	var $ 			= cheerio.load(data);
// 	//console.log(data);




// 	$('a').each(function(){
// 		console.log('http://dandelioncosmetics.by' + $(this).attr('href'))
// 	})
// });



// where.is(`Alghero, ${countries.getName("ita", "en")}`, function(err, result) {
//   if (result) {
//     // Same result as address search
//     // ...
//     console.log(result);
//   }
// });


// fs.readFile('source/splits.html', 'utf-8', (err, data) => {
// 	if (err) throw err;
// 	// for cheerio operation
// 	var $ 			= cheerio.load(data),
// 		rallies 	= [],
// 		returnData 	= [],
// 		tempIndex;

// 	// find all links, divide them into two groups
// 	$('tbody tr').each(function() {
// 		//console.log($(this).html());

// 		$(this).find('td').each(function(index) {
// 			if (index === 1) {
// 				console.log($(this).html());
// 			}
// 		});
//  	});
// });

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
