const puppeteer = require('puppeteer');

module.exports = class Browser {
	constructor(headless) {
		this.headless = headless;
	}
	async start() {
		this.browser = await puppeteer.launch({headless: this.headless});
		this.page = await this.browser.newPage();
	} 
	async close() {
		this.browser.close();
	}
};