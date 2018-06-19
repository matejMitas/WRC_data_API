

const BrowserModule = require('./browser.js');

module.exports = {

	__crawlBrowser: async function(selector) {
		return await this.browser.crawl(selector);
	},

	__openBrowser: async function() {
		this.browser = new BrowserModule(true);
		await this.browser.start();
	}, 

	__closeBrowser: async function() {
		await this.browser.close();
	},

	__navigateBrowser: async function(path, prefix) {
		let url = prefix ? `${this.urls.prefix}${path}` : path;
		await this.browser.navigate(url);
	},

	__navigateClickBrowser: async function(path, selector, prefix) {
		let url = prefix ? `${this.urls.prefix}${path}` : path;
		await this.browser.navigateClick(url, selector);
	},

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
		if (normalize)
			array[3] = array[3] - offset

		return new Date(array[2], array[1] - 1, array[0], array[3] + 1, array[4]);
	},

	__extractText: function(data) {
		data = data.split('<br>');
		data.forEach((item, index) => {
			data[index] = item.trim();
		});
		return data;
	}

};