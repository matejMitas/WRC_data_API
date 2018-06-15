const puppeteer = require('puppeteer');
const fs = require('fs');
const cheerio = require('cheerio');
// library for conversion of HTML entities to Unicode strings
const Entities = require('html-entities').XmlEntities;
const entities = new Entities();
// puppetter instance wrapped in our wrapper
const Browser = require('./browser.js');


class WRCParser {
	constructor(opts) {
		if (!opts.hasOwnProperty('parseAll')) 
			throw 'Unknown options object passed while creating parser';
		// select what we want to scrape

		// initialize connection to the database
	
		// add items
		this.blueprint = {
			live: {
				overall: 2,
				splits: 3,
				stages: 4,
				itinerary: 6,
				startlist: 7,
				penalties: 8,
				retirement: 9
			},
			detail: {
				from: 1,
				to: 2,
				timezone: 3,
				classes: 4,
				distance: 5,
				liason: 6,
				servicePark: 7
			}
		}
	}
	exec() {
		// start parsing
	}
}


// main menu mapping
const menuMap = {
	overall: 2,
	splits: 3,
	stages: 4,
	itinerary: 6,
	startlist: 7,
	penalties: 8,
	retirement: 9
}

async function readResults(page, selector) {
  	await page.waitForSelector(selector);
	return await page.evaluate(selector => {
    	return document.querySelector(selector).innerHTML;
    }, selector);
}

async function loadPage(page, url) {
	await page.goto(`http://www.wrc.com/en/wrc/${url}`);
}

function parseDate(dt) {
	dt = dt.split('.');
	return new Date(parseInt(dt[2]), parseInt(dt[1])-1, parseInt(dt[0]));
}


async function readStartList(page) {
	// navigate to page
    await page.goto('http://www.wrc.com/en/wrc/livetiming/page/4175----.html');
    // go to 'Overlay page'
    const allResultsSelector = `.liveCenterContent > ul > li:nth-of-type(${menuMap.startlist}) > a`;
  	await page.waitForSelector(allResultsSelector);
  	await page.click(allResultsSelector);


  	const resultsSelector = '.scrolltable';
  	await page.waitForSelector(resultsSelector);

  	var result = await page.evaluate(resultsSelector => {
    	return document.querySelector(resultsSelector).innerHTML;
    }, resultsSelector);


    fs.writeFile('./source/startList.html', result, _ => console.log('Start List Read'));
}

async function readAllRallies(page) {
	await loadPage(page, 'calendar/calendar/page/671-206-16--.html');
	// for cheerio operation
	var $,
		rallyInfos = [],
		rallyLinks = [],
		resultLinks = [];

	$ = cheerio.load(await readResults(page, '.news .data tbody'));
	// find all links, divide them into two groups
	$('a').each(function() {
		let rallyInfo = {},
			acronym = $(this).find('img').attr('src'),
			link = $(this).attr('href').slice(8);
		// rally acronym, extracted from IMG src
		if (acronym) {
			rallyInfo['acronym'] = acronym.slice(acronym.lastIndexOf('/') + 2, acronym.indexOf('_'));
			// parse full rally name
			let name = $(this).html()
			rallyInfo['name'] = name.slice(name.indexOf('>') + 1).trim();
			rallyInfos.push(rallyInfo);
		}	
		// sort links according to type
		if (link.indexOf('results') > -1) {
			resultLinks.push(link);
		} else if (link.indexOf('calendar') > -1) {
			if (rallyLinks.indexOf(link) === -1)
				rallyLinks.push(link);
		}
	});

	//console.log(rallyInfos);
	console.log(rallyLinks);
	console.log(resultLinks);
}

async function readRallyDetail(page, url) {
	await loadPage(page, url);
	var $ 		= cheerio.load(await readResults(page, '.box.w1.info.fright')),
		opts 	= {
			from: 1,
			to: 2,
			timezone: 3,
			classes: 4,
			distance: 5,
			liason: 6,
			servicePark: 7
		}
		results = {
			date: {
				from: undefined,
				to: undefined
			},
			classes: []
		};

	$('tr').each(function(index) {
		let ctx = $(this).find('td:nth-of-type(2)').html();
		if (index === opts.from) {
			results['date']['from'] = parseDate(ctx);
		} else if (index === opts.to) {
			results['date']['to'] = parseDate(ctx);
		} else if (index === opts.timezone) {
			results['timezone'] = parseInt(ctx.split(' ')[1]);
		} else if (index === opts.classes) {
			ctx.split('<br>').forEach(function(e, i){
				results['classes'][i] = e.trim();
			});
		} else if (index === opts.distance) {
			results['distance'] = parseFloat(ctx.split(' ')[1].replace('(', '').replace(',', '.'));
		} else if (index === opts.liason) {
			results['liason'] = parseFloat(ctx.split(' ')[0].replace('.', '').replace(',', '.'));
		} else if (index === opts.servicePark) {
			results['servicePark'] = entities.decode(ctx);
		}
	});

	console.log(results);
}

(async function scrape() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    var parser = new WRCParser({
    	parseAll: true
    });
    parser.exec();
    
    //await readStartList(page);
    //await readAllRallies(page);
   	//await readRallyDetail(page, 'calendar/finland-2018/page/699--699-682-.html');

    // reading all stage times
    /*
  	// Wait for the results page to load and display the results.
  	const resultsSelector = '#datasite > form > select';
  	await page.waitForSelector(resultsSelector);

  	// read values
    var select = await page.evaluate(resultsSelector => {
    	return document.querySelector(resultsSelector).innerHTML;
    }, resultsSelector);

    // get all values for options
    var $ = cheerio.load(select),
    	options = [];
    $('option').each(function(index) {
    	options.push($(this).val());
    })
    // order in individual stages, reminiscent of actual order
    var pages = [];
    for (var i = 0, len = options.length; i < 2; i++) {
    	await page.select(resultsSelector, options[i]);
    	const sel = '.scrolltable';
    	await page.waitForSelector(sel);
    	pages.push(await page.evaluate(sel => {return document.querySelector(sel).innerHTML}, sel));
    }

    fs.writeFile('./out', pages, _ => console.log('done'));*/

    // close the browser window
    browser.close();
});