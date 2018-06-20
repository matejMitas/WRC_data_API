const puppeteer = require('puppeteer');
const fs = require('fs');
const cheerio = require('cheerio');
// library for conversion of HTML entities to Unicode strings
const EntitiesModule = require('html-entities').XmlEntities;
const entities = new EntitiesModule();
// puppetter instance wrapped in our wrapper
const BrowserModule = require('./modules/crawler/browser.js');
const CrawlerUtil = require('./modules/crawler/utils.js');
const CrawlerFn = require('./modules/crawler/functions.js');
const CrawlerOpt = require('./modules/crawler/options.js');


class Crawler {
	constructor(opts) {
		if (!opts.hasOwnProperty('parseAll')) 
			throw 'Unknown options object passed while creating parser';
		// TODO: select what we want to scrape
		// TODO: initialize connection to the database
		// add items
		this.blueprint = CrawlerOpt.blueprint;
		this.selectors = CrawlerOpt.selectors;
		this.urls = CrawlerOpt.urls;
		// temp obj for navigating around the site
		this.rallies = undefined;
	}

	async exec() {
		// initialize browser
		await this.__openBrowser();
		// read all rallies
		await this.__crawlAllRallies();
		// read each rally's info
		// for (var key in this.rallies.info) {
		// 	await this.__crawlRallyInfo(key, this.rallies.info[key]);
		// }
		console.log(this.rallies);
		//await this.__crawlLiveText();
		//await this.__crawlItinerary('results/mexico/stage-times/page/334-228---.html', -5);
		//await this.__crawlStartList('livetiming/page/4175----.html');
		//await this.__crawlStageTime();

		// we're done with crawling, bye for now
		await this.__closeBrowser();
	}

	async crawlFull() {

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