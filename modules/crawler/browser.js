/**
 * @fileoverview Interface over puppeteer Chrome headless browser
 *
 * Just a simple wrapper (interface if you will) for 
 * headless Chrome built solely on ES6 async capabilites
 * @author contact@matejmitas.com (Matěj Mitaš)
 */
const puppeteer = require('puppeteer');

module.exports = class Browser {
	/**
   	 * Base settings for browser
     */
	constructor(headless) {
		this.headless = headless;
		this.status = true;
	}
	/**
   	 * Get Chrome up and running
     */
	async start() {
		// TODO: Error handling
		this.browser = await puppeteer.launch({headless: this.headless});
		this.page = await this.browser.newPage();
	}
	/**
   	 * Close the browser
     */
	async close() {
		this.browser.close();
	}
	/**
   	 * Navigate the browser to particular location
   	 * @param URL path
     */
	async navigate(path) {
		// TODO: Better error handling
		await this.page.goto(path, {timeout: 1500}).catch(e => {this.status = !this.status});
	}
	/**
   	 * Navigate the browser to particular location and click on selected element
   	 * @param path URL
   	 * @param selector On which we desire to click
     */
	async navigateClick(path, selector) {
		// TODO: Better error handling
		await this.navigate(path);
		await this.page.waitForSelector(selector, {timeout: 1500}).catch(e => {this.status = !this.status});
		await this.page.click(selector);
	}
	/**
   	 * Extract page segment pointed to by selector
   	 * @param selector Which we want use as an entry point
     */
	async crawl(selector) {
		// TODO: Better error handling
		let status = true;
		await this.page.waitForSelector(selector, {timeout: 1500}).catch(e => {this.status = !this.status});
		return status ? await this.page.evaluate(selector => {
	    	return document.querySelector(selector).innerHTML;
	    }, selector) : undefined;
	}
};