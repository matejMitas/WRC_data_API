/**
 * @fileoverview Util/helper functions
 *
 * Support functions for crawler, mostly for parsing
 * As well as interface for puppeteer
 * TODO: show tree structure.
 * @author contact@matejmitas.com (Matěj Mitaš)
 */
const BrowserModule = require('./browser.js');

/**
 * Daylight offset computation extravaganza
 * @souce https://stackoverflow.com/questions/11887934/how-to-check-if-the-dst-daylight-saving-time-is-in-effect-and-if-it-is-whats
 * @author https://stackoverflow.com/users/1241365/sheldon-griffin
 */
Date.prototype.stdTimezoneOffset = function () {
    var jan = new Date(this.getFullYear(), 0, 1);
    var jul = new Date(this.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
}
/**
 * Daylight offset computation extravaganza
 * @souce https://stackoverflow.com/questions/11887934/how-to-check-if-the-dst-daylight-saving-time-is-in-effect-and-if-it-is-whats
 * @author https://stackoverflow.com/users/1241365/sheldon-griffin
 */
Date.prototype.isDstObserved = function () {
    return this.getTimezoneOffset() < this.stdTimezoneOffset();
}

module.exports = {
	/**
   	 * Return crawled data pointed by selector
   	 * @param selector Page location
     */
	__crawlBrowser: async function(selector) {
		return await this.browser.crawl(selector);
	},
	/**
   	 * Start & open headless Chrome via interface
   	 * located in 'browser.js'
     */
	__openBrowser: async function() {
		this.browser = new BrowserModule(true);
		await this.browser.start();
	}, 
	/**
   	 * Finish working with headless Chrome via interface
   	 * located in 'browser.js'
     */
	__closeBrowser: async function() {
		await this.browser.close();
	},
	/**
   	 * Navigate to particular page
   	 * @param path URL to visit
   	 * @param prefix Include prefix, WRC.com prefix
     */
	__navigateBrowser: async function(path, prefix) {
		let url = prefix ? `${this.urls.prefix}${path}` : path;
		await this.browser.navigate(url);
	},
	/**
   	 * Navigate to particular page and click on element
   	 * @param path URL to visit
   	 * @param selector To be clicked
   	 * @param prefix Include prefix, WRC.com prefix
     */
	__navigateClickBrowser: async function(path, selector, prefix) {
		let url = prefix ? `${this.urls.prefix}${path}` : path;
		await this.browser.navigateClick(url, selector);
	},




	/**
   	 * Navigate to particular page and click on element
   	 * @param path URL to visit
   	 * @param selector To be clicked
   	 * @param normalize Is time in UTC or not? Used for
   	 * manual setting of time stamps for rally star/end
     */
	__createDate: function(array, offset, normalize) {
		let len = array.length;
		if (len < 3 || len > 5) {
			throw 'Date can be create either to day precision or to minute precision, nothing else';
		}
		// Date constructor is not content with strings
		array.forEach(function(elem, index){
			array[index] = parseInt(elem);
		});
		// normalization for full date range
		if (normalize) {
			array[3] = array[3] - offset
		}

		let date = new Date(array[2], array[1] - 1, array[0], array[3] + 1, array[4]);
		if (date.isDstObserved()) { 
		     date.setHours(2);
		}
		return date;
	},
	/**
   	 * Helper function for extracting lists from
   	 * poorly designed single elements with content
   	 * seprated by '<br>'
   	 * @param data To be treated
     */
	__extractText: function(data) {
		data = data.split('<br>');
		data.forEach((item, index) => {
			data[index] = item.trim();
		});
		return data;
	},
	/**
   	 * Converts string to sentece case
   	 * @param string To be treated
     */
	__toCapitalCase: function(string) {
		let returnString = '',
			temp = '';
		string.split(' ').forEach((elem, index) => {
			if (index)
				temp += ' ';
			temp += elem.toLowerCase();
			if (!elem.toLowerCase().match(/^[dlv]\w{1,2}$/))
				returnString += index ? temp.slice(0,2).toUpperCase()+ temp.slice(2) : temp.slice(0,1).toUpperCase() + temp.slice(1);
			else
				returnString += temp;
			temp = '';
		});
		return returnString;
	}
}; 