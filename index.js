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
		this.adp = new AdapterModule('mongodb://localhost:27017', 'ewrc');
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

		var links = [ 
			'https://www.ewrc-results.com/results/44262-neste-rally-finland-2018/?s=175462',
			'https://www.ewrc-results.com/results/44262-neste-rally-finland-2018/?s=175463',
			'https://www.ewrc-results.com/results/44262-neste-rally-finland-2018/?s=175464',
			'https://www.ewrc-results.com/results/44262-neste-rally-finland-2018/?s=175465',
			'https://www.ewrc-results.com/results/44262-neste-rally-finland-2018/?s=175466',
			'https://www.ewrc-results.com/results/44262-neste-rally-finland-2018/?s=175467',
			'https://www.ewrc-results.com/results/44262-neste-rally-finland-2018/?s=175468',
			'https://www.ewrc-results.com/results/44262-neste-rally-finland-2018/?s=175469',
			'https://www.ewrc-results.com/results/44262-neste-rally-finland-2018/?s=175470',
			'https://www.ewrc-results.com/results/44262-neste-rally-finland-2018/?s=175471',
			'https://www.ewrc-results.com/results/44262-neste-rally-finland-2018/?s=175472',
			'https://www.ewrc-results.com/results/44262-neste-rally-finland-2018/?s=175473',
			'https://www.ewrc-results.com/results/44262-neste-rally-finland-2018/?s=175474',
			'https://www.ewrc-results.com/results/44262-neste-rally-finland-2018/?s=175475',
			'https://www.ewrc-results.com/results/44262-neste-rally-finland-2018/?s=175476',
			'https://www.ewrc-results.com/results/44262-neste-rally-finland-2018/?s=175477',
			'https://www.ewrc-results.com/results/44262-neste-rally-finland-2018/?s=175478',
			'https://www.ewrc-results.com/results/44262-neste-rally-finland-2018/?s=175479',
			'https://www.ewrc-results.com/results/44262-neste-rally-finland-2018/?s=175480',
			'https://www.ewrc-results.com/results/44262-neste-rally-finland-2018/?s=175481',
			'https://www.ewrc-results.com/results/44262-neste-rally-finland-2018/?s=175482',
			'https://www.ewrc-results.com/results/44262-neste-rally-finland-2018/?s=175483',
			'https://www.ewrc-results.com/results/44262-neste-rally-finland-2018/?s=175484' 
		];

		for (let i = 9; i < links.length; i++) {
			await this.__navigateBrowser(links[i], false);
			
			await this.adp.insertIntoCollection('SourceEwrc', {
				order: i,
				payload: await this.__crawlBrowser('main')
			});
		}

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
		await this.adp.updateInCollection('Rallies', {acronym: 'MCO'}, {'info.servicePark': 'Gap'});
		await this.adp.updateInCollection('Rallies', {acronym: 'GBR'}, {'info.timezone': 1});
		await this.adp.updateInCollection('Rallies', {acronym: 'FRA'}, {'info.distance': 333.48, 'info.liason': 1120.1});
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

	async crawlStartLists(acronym = false) {
		// decide whenever we want complete list (hence crawl all startlists)
		// or crawl individual rally startlist
		const query = acronym ? {acronym: acronym} : {};
		// query DB
		var data = await this.adp.findProjectInCollection('Rallies', 
			query, 
			{_id: 0, acronym: 1, order: 1, 'info.links.results': 1}
		);

		for (var elem of data) {
			let link = elem.info.links.results,
				order = elem.order;
			// if there's anything to scrape
			if (link) {
				var payload = await this.__crawlStartList(link);
				for (var item of payload)
					await this.addCrew(acronym, item);
			}
		}
	}

	async crawlPenalties(acronym = false) {
		// decide whenever we want complete list (hence crawl all startlists)
		// or crawl individual rally startlist
		const query = acronym ? {acronym: acronym} : {};
		// query DB
		var data = await this.adp.findProjectInCollection('Rallies', 
			query, 
			{_id: 0, acronym: 1, order: 1, 'info.links.results': 1}
		);
	}

	async addCrew(acronym, item) {
		let res = await this.adp.findProjectInCollection('Crews', {crewId: item.crewId}, {_id: 0, members: 0}),
			currEquip = item.equip;

		// crew already exists
		if (res !== []) {
			res = res[0];

			for (var newItem of res.equip) {
				if (currEquip.team === newItem.team && 
					currEquip.make === newItem.make && 
					currEquip.car === newItem.car) {
					console.log('pridavame start');
				} else {
					console.log('pridavame vehikl');
				}
			}
			//await this.adp.updatePushToCollection('Crews', {crewId: item}, 'starts', order);
		} else {
			var schema = {
				crewId: item.crewId,
				members: item.members,
				equip: [{ 
					team: item.equip.team, 
					make: item.equip.make, 
					car: item.equip.car,
					// which rallies did the crew used this setup on
				}],
				starts: {}
			}
			// when we add crew, only one 'equipment' is available at the disposal
			// hence the index is pointed to the array 'equip'
			schema.starts[acronym] = 0;
			await this.adp.insertIntoCollection('Crews', schema, false);
		}
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
Crawler.prototype.__crawlPenalties = CrawlerFn.__crawlPenalties;
Crawler.prototype.__crawlLiveText = CrawlerFn.__crawlLiveText;



var crawler = new Crawler({
    parseAll: true
});

crawler.exec();



// (async function scrape() {
//     const browser = await puppeteer.launch({headless: false});
//     const page = await browser.newPage();
//     const adp = new AdapterModule('mongodb://localhost:27017', 'ewrc');
//     await adp.connect();


// 	await page.setViewport({ width: 1920, height: 1050 })
//     // reading all stage times    
//     await page.goto('https://www.wrc.com/en/wrc/livetiming/page/4175----.html');

//     // Wait for the results page to load and display the results.
//   	var resultsSelector = '.contentnav li:nth-of-type(3) a';
//   	await page.waitForSelector(resultsSelector);

//   	await page.click(resultsSelector);

//   	// Wait for the results page to load and display the results.
//   	resultsSelector = '#datasite > form > select';
//   	await page.waitForSelector(resultsSelector);

//   	// read values
//     var select = await page.evaluate(resultsSelector => {
//     	return document.querySelector(resultsSelector).innerHTML;
//     }, resultsSelector);

//     // get all values for options
//     var $ = cheerio.load(select),
//     	options = [];
//     $('option').each(function(index) {
//     	options.push($(this).val());
//     })

//     //await adp.dropCollection('Source');

//    	// order in individual stages, reminiscent of actual order
//     var pages = [];
//     for (var i = 4, len = options.length; i < 5; i++) {
//     	await page.select(resultsSelector, options[i]);
//     	const sel = '#datasite';

//     	console.log(i);

//     	await page.waitForSelector(sel);
//     	await page.waitForSelector('#myTable');
//     	var data = {
//     		order: i,
//     		payload: await page.evaluate(sel => {return document.querySelector(sel).innerHTML}, sel) 
// 		};

// 		await adp.insertIntoCollection('Source', data);
//     }

//     //fs.writeFile('./out', pages, _ => console.log('done'));

// 	await adp.disconnect();
//     // close the browser window
//     browser.close();
// });