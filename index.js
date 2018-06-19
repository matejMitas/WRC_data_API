const puppeteer = require('puppeteer');
const fs = require('fs');
const cheerio = require('cheerio');
// library for conversion of HTML entities to Unicode strings
const EntitiesModule = require('html-entities').XmlEntities;
const entities = new EntitiesModule();
// puppetter instance wrapped in our wrapper
const BrowserModule = require('./modules/crawlerBrowser.js');
const CrawlerUtil = require('./modules/crawlerUtil.js');
const CrawlerFn = require('./modules/crawlerFn.js');


class Crawler {
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
			},
		}

		this.selectors = {
			itinerary: {
				stageNo: `td:nth-of-type(1)`,
				stageName: `td:nth-of-type(2) a`,
				stageLen: `td:nth-of-type(3)`,
				stageStart: `td:nth-of-type(4)`,
				stageStatus: `td:nth-of-type(5)`
			}
		}

		this.urls = {
			prefix: 'http://www.wrc.com/en/wrc/',
			rallyList: 'calendar/calendar/page/671-206-16--.html',
			liveText: 'http://www.wrc.com/live-ticker/live_popup_text.html'
		}
	}

	async exec() {
		// initialize browser
		await this.__openBrowser();
		//await this.__crawlAllRallies();
		await this.__crawlRallyInfo('calendar/finland-2018/page/699--699-682-.html');
		//await this.__crawlLiveText();
		//await this.__crawlItinerary('results/mexico/stage-times/page/334-228---.html', -5);
		
		//console.log(await this.__createDate([ '26', '07', '2018', 24, 59], 0));

		// we're done with crawling, bye for now
		await this.__closeBrowser();
	}

	async __crawlLiveText() {
		await this.__navigateBrowser(this.urls.liveText, false);
		console.log(await this.__crawlBrowser('.popuptext.scrollcontent'))
		
	}
}

// UTIL methods
Crawler.prototype.__crawlBrowser = CrawlerUtil.__crawlBrowser;
Crawler.prototype.__openBrowser = CrawlerUtil.__openBrowser;
Crawler.prototype.__closeBrowser = CrawlerUtil.__closeBrowser;
Crawler.prototype.__navigateBrowser = CrawlerUtil.__navigateBrowser;
Crawler.prototype.__createDate = CrawlerUtil.__createDate;
// SCRAPE methods
Crawler.prototype.__crawlItinerary = CrawlerFn.__crawlItinerary;
Crawler.prototype.__crawlAllRallies = CrawlerFn.__crawlAllRallies;
Crawler.prototype.__crawlRallyInfo = CrawlerFn.__crawlRallyInfo;


var crawler = new Crawler({
    parseAll: true
});

crawler.exec();








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
	await loadPage(page, 'livetiming/page/4175----.html');
    // go to 'Overlay page'
    const allResultsSelector = `.liveCenterContent > ul > li:nth-of-type(${menuMap.startlist}) > a`;
  	await page.waitForSelector(allResultsSelector);
  	await page.click(allResultsSelector);


  	const resultsSelector = '.scrolltable';
  	await page.waitForSelector(resultsSelector);

  	var result = await page.evaluate(resultsSelector => {
    	return document.querySelector(resultsSelector).innerHTML;
    }, resultsSelector);



    // main object for data, gets transfered to JSON later on after filled
	var startList 	= {},
		$ 			= cheerio.load(result);
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

	console.log(startList);
}

(async function scrape() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    //await readStartList(page);
    //await readAllRallies(page);
   	//await readRallyDetail(page, 'calendar/finland-2018/page/699--699-682-.html');
   	//await readRallyIntinerary(page);

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
})();