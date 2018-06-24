const puppeteer = require('puppeteer');
const fs = require('fs');
const cheerio = require('cheerio');
// library for conversion of HTML entities to Unicode strings
const EntitiesModule = require('html-entities').XmlEntities;
const entities = new EntitiesModule();
// puppetter instance wrapped in our wrapper
const BrowserModule = require('./modules/crawler/browser.js');
const AdapterModule = require('./modules/crawler/adapter.js');
const CrawlerUtil = require('./modules/crawler/utils.js');
const CrawlerFn = require('./modules/crawler/functions.js');
const CrawlerOpt = require('./modules/crawler/options.js');


class Crawler {
	constructor(opts) {
		if (!opts.hasOwnProperty('parseAll')) 
			throw 'Unknown options object passed while creating parser';
		// TODO: select what we want to scrape
		// TODO: initialize connection to the database
		this.adp = new AdapterModule('mongodb://localhost:27017', 'api');
		// add items
		this.blueprint = CrawlerOpt.blueprint;
		this.selectors = CrawlerOpt.selectors;
		this.urls = CrawlerOpt.urls;
		// temp obj for navigating around the site
		this.rallies = undefined;
	}

	async exec() {
		// initialize browser & connect to database
		await this.__openBrowser();
		await this.adp.connect();
		// get basic info


		//await this.crawlRallyBasic();
		//await this.crawlItinenaries();

		//var payload = await this.__crawlStartList('results/sweden/stage-times/page/326-227---.html');
		//console.log(JSON.stringify(payload));

		/*for (var item of payload) {
			var schema = {
				crewId: item.crewId,
				members: item.members,
				equip: [{ 
					team: item.equip.team, 
					make: item.equip.make, 
					car: item.equip.car,
					// which rallies did the crew used this setup on
					usedIn: [0] 
				}],
				starts: [0]
			}

			await this.addCrew(schema);
		}*/

		console.log(await this.adp.findProjectInCollection('Rallies', {}, {acronym: 1}));



		//await this.adp.updateInCollection('Rallies', {acronym: 'mco'}, {startList: payload}, false);

		// we're done with crawling, bye for now
		await this.adp.disconnect();
		await this.__closeBrowser();
	}

	async crawlRallyBasic() {
		await this.adp.dropCollection('Rallies');
		await this.__crawlAllRallies();

		for (var key in this.rallies) {
			let info = await this.__crawlRallyInfo(key, this.rallies[key].infoLink);
			// update info with links for possible recrawl further on
			info['links'] = {
				'detail'	: this.rallies[key].infoLink,
				'results'	: this.rallies[key].resultsInfo
			};
			// save to DB
			await this.adp.insertIntoCollection('Rallies', {
				acronym: key.toLowerCase(), 
				name: this.rallies[key].name,
				order: this.rallies[key].order,
				info: info
			});
		}
		// 22.6.2018 - updates for missing wrc.com data
		await this.adp.updateInCollection('Rallies', {acronym: 'MCO'}, {'info.servicePark': 'Gap'}, false);
		await this.adp.updateInCollection('Rallies', {acronym: 'GBR'}, {'info.timezone': 1}, false);
		await this.adp.updateInCollection('Rallies', {acronym: 'FRA'}, {'info.distance': 333.48, 'info.liason': 1120.1}, false);
	}

	async crawlItinenaries(acronym = false) {
		var timezones = await this.adp.findProjectInCollection('Rallies', 
			{}, 
			{_id: 0, acronym: 1, 'info.timezone': 1, 'info.links.results': 1}
		);

		for (let i = 0, len = timezones.length; i < len; i++) {
			let elem = timezones[i];

			if (elem.info.links.results) {
				console.log(elem.info.links.results);
				console.log(elem.acronym);
				console.log(elem.info.timezone);

				var stages = await this.__crawlItinerary(elem.acronym, elem.info.links.results, elem.info.timezone);
				if (stages.length === 0) {
					console.log(`Problem for: ${elem.acronym}`)
				} else {
					await this.adp.updateInCollection('Rallies', 
						{acronym: elem.acronym}, 
						{stages: stages}, 
						false
					);
				}
			}
		}

		// normalize itineraries
		/*var allStages = await this.adp.findProjectInCollection('Rallies', 
			{},
			{_id: 0, acronym: 1, 'stages.no': 1, 'stages.name': 1, 'stages.len': 1}
		);

		for (const rallyStages of allStages) {
			console.log(rallyStages.acronym);

			for (const stages in rallyStages) {
				if (stages === 'stages') {
					for (const stage of rallyStages[stages])  {
						console.log(`--- ${stage.name}`);
					}
				}
			}
		}*/
	}

	async addCrew(crewId) {
		await this.adp.insertIntoCollection('Crews', crewId);
	}

	async findCrew(crewId) {

	}
}

// UTIL methods
Crawler.prototype.__crawlBrowser = CrawlerUtil.__crawlBrowser;
Crawler.prototype.__openBrowser = CrawlerUtil.__openBrowser;
Crawler.prototype.__closeBrowser = CrawlerUtil.__closeBrowser;
Crawler.prototype.__navigateBrowser = CrawlerUtil.__navigateBrowser;
Crawler.prototype.__navigateClickBrowser = CrawlerUtil.__navigateClickBrowser;
Crawler.prototype.__createDate = CrawlerUtil.__createDate;
Crawler.prototype.__extractText = CrawlerUtil.__extractText;
Crawler.prototype.__toCapitalCase = CrawlerUtil.__toCapitalCase;
// SCRAPE methods
Crawler.prototype.__crawlItinerary = CrawlerFn.__crawlItinerary;
Crawler.prototype.__crawlAllRallies = CrawlerFn.__crawlAllRallies;
Crawler.prototype.__crawlRallyInfo = CrawlerFn.__crawlRallyInfo;
Crawler.prototype.__crawlStartList = CrawlerFn.__crawlStartList;
Crawler.prototype.__crawlLiveText = CrawlerFn.__crawlLiveText;



var crawler = new Crawler({
    parseAll: true
});

crawler.exec();






(async function scrape() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // reading all stage times
    
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

    fs.writeFile('./out', pages, _ => console.log('done'));

    // close the browser window
    browser.close();
});