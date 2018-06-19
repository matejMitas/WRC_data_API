const cheerio = require('cheerio');
const EntitiesModule = require('html-entities').XmlEntities;
const entities = new EntitiesModule();

module.exports = {
	
	__crawlAllRallies: async function() {
		await this.__navigateBrowser('calendar/calendar/page/671-206-16--.html', true);
		// for cheerio operation
		var $ = cheerio.load(await this.__crawlBrowser('.news .data tbody')),
			rallyInfos = [],
			rallyLinks = [],
			resultLinks = [];
		// find all links, divide them into two groups
		$('a').each(function() {
			let rallyInfo = {},
				acronym = $(this).find('img').attr('src'),
				link = $(this).attr('href').slice(8);
			// rally acronym, extracted from IMG src
			if (acronym) {
				rallyInfo['acronym'] = acronym.slice(acronym.lastIndexOf('/') + 2, acronym.indexOf('_'));
				// parse full rally name
				let name = $(this).html()
				rallyInfo['name'] = name.slice(name.indexOf('>') + 1).trim();
				rallyInfos.push(rallyInfo);
			}	
			// sort links according to type
			if (link.indexOf('results') > -1) {
				resultLinks.push(link);
			} else if (link.indexOf('calendar') > -1) {
				if (rallyLinks.indexOf(link) === -1)
					rallyLinks.push(link);
			}
		});
		// save rallies to database
		console.log(rallyInfos);
		console.log(rallyLinks);
		console.log(resultLinks);
	},

	// Crawling methods
	__crawlRallyInfo: async function(path) {
		await this.__navigateBrowser(path, true);
		var $ 			= cheerio.load(await this.__crawlBrowser('.box.w1.info.fright')),
			createDate 	= this.__createDate,
			datesTemp 	= {}, 
			opts 		= {
				from: 1,
				to: 2,
				timezone: 3,
				classes: 4,
				distance: 5,
				liason: 6,
				servicePark: 7
			},
			results 	= {
				date: {
					from: undefined,
					to: undefined
				},
				classes: []
			};

		$('tr').each(function(index) {
			let ctx = $(this).find('td:nth-of-type(2)').html();

			if (index === opts.timezone) {
				// not necessarely a variable, but faster to access
				let timezone = parseInt(ctx.split(' ')[1]);
				results['timezone'] = timezone;
				// we can assign date after timezone is resolved
				results['date']['from'] = createDate(datesTemp['from'], timezone, false);
				results['date']['to'] = createDate(datesTemp['to'], timezone, false);
			} else if (index === opts.from) {
				// just save it, we now nothing about timezone
				datesTemp['from'] = ctx.split('.').concat([1, 0]);
			} else if (index === opts.to) {
				// just save it, we now nothing about timezone
				datesTemp['to'] = ctx.split('.').concat([24, 59]);
			} else if (index === opts.classes) {
				ctx.split('<br>').forEach(function(e, i){
					results['classes'][i] = e.trim();
				});
			} else if (index === opts.distance) {
				results['distance'] = parseFloat(ctx.split(' ')[1].replace('(', '').replace(',', '.'));
			} else if (index === opts.liason) {
				results['liason'] = parseFloat(ctx.split(' ')[0].replace('.', '').replace(',', '.'));
			} else if (index === opts.servicePark) {
				results['servicePark'] = entities.decode(ctx);
			}
		});
		console.log(results);
	},

	__crawlItinerary: async function(path, offset) {
		await this.__navigateBrowser(path, true);
		var $ 		= cheerio.load(await this.__crawlBrowser('#datasite .data')),
			stages  = [],
			sel = this.selectors.itinerary,
			createDate = this.__createDate; 

		$('tbody').each(function() {
			// if page decides to not return anything
			var dateSource = $(this).find('tr:first-of-type td strong').html();
			if (dateSource === null)
				return;
			var day = dateSource.split('-')[1].trim().split('.');

			$(this).find('tr:nth-of-type(n+2)').each(function(){
				let stage = {};
				
				stage['stageNo'] = $(this).find(sel.stageNo).html();
				stage['stageName'] = entities.decode($(this).find(sel.stageName).html().trim());
				stage['stageLen'] = parseFloat($(this).find(sel.stageLen).html());
				stage['stageStart'] = createDate(day.concat($(this).find(sel.stageStart).html().trim().split(':')), offset, true);
				stage['stageStatus'] = $(this).find(sel.stageStatus).html().trim();

				stages.push(stage);
			});
		});
		console.log(stages);
	}

};