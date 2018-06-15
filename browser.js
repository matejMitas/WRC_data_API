const puppeteer = require('puppeteer');

module.exports = class Browser {
	constructor(headless) {
		this.headless = headless;
	}
	// PUBLIC methods
	async start() {
		this.browser = await puppeteer.launch({headless: this.headless});
		this.page = await this.browser.newPage();
	} 
	async close() {
		this.browser.close();
	}
	async navigate(path) {
		await this.page.goto(path);
	}
	async crawl(selector) {
		let status = true;
		await this.page.waitForSelector(selector, {timeout: 1500}).catch(e => {status = !status});
		return status ? await this.page.evaluate(selector => {
	    	return document.querySelector(selector).innerHTML;
	    }, selector) : undefined;
	}
};