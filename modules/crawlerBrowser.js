const puppeteer = require('puppeteer');

module.exports = class Browser {

	constructor(headless) {
		this.headless = headless;
		this.status = true;
	}

	async start() {
		this.browser = await puppeteer.launch({headless: this.headless});
		this.page = await this.browser.newPage();
	}

	async close() {
		this.browser.close();
	}

	async navigate(path) {
		await this.page.goto(path, {timeout: 1500}).catch(e => {this.status = !this.status});
	}

	async navigateClick(path, selector) {
		await this.navigate(path);
		await this.page.waitForSelector(selector, {timeout: 1500}).catch(e => {this.status = !this.status});
		await this.page.click(selector);
	}

	async crawl(selector) {
		let status = true;
		await this.page.waitForSelector(selector, {timeout: 1500}).catch(e => {this.status = !this.status});
		return status ? await this.page.evaluate(selector => {
	    	return document.querySelector(selector).innerHTML;
	    }, selector) : undefined;
	}

};