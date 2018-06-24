/**
 * @fileoverview Crawling methods for crawler
 *
 * This is where the business logic sits. 'wrc.com' is
 * built as a classical server rendered app despite trying
 * to convey remotely similar SPA-alike look. Here are all the 
 * necessary functions for crawling individual pages, below
 * is depicted operation mode:
 * TODO: show tree structure.
 * @author contact@matejmitas.com (Matěj Mitaš)
 */
const cheerio = require('cheerio');
const EntitiesModule = require('html-entities').XmlEntities;
const entities = new EntitiesModule();

module.exports = {
	/**
   	 * Crawl rally calendar, basic info about all rallies
   	 * First function to execute
     */
	__crawlAllRallies: async function() {
		await this.__navigateBrowser(this.urls.rallyList, true);
		var $ 			= cheerio.load(await this.__crawlBrowser('.news .data tbody')),
			rallies 	= {},
			returnData 	= [],
			tempIndex,
			orderCounter = 0;

		// find all links, divide them into two groups
		$('a').each(function() {
			let rally = {},
				acronym = $(this).find('img').attr('src'),
				title = $(this).attr('data-lang-en');
				link = $(this).attr('href').slice(8);
			// rally acronym, extracted from IMG src
			if (acronym) {
				tempIndex = acronym.slice(acronym.lastIndexOf('/') + 2, acronym.indexOf('_'));
				// parse full rally name
				let name = $(this).html()
				rally['name'] = entities.decode(name.slice(name.indexOf('>') + 1).trim());
				rally['infoLink'] = link;
				rallies[tempIndex] = rally;
				rally['order'] = orderCounter;
				orderCounter += 1;
			} else if (title) {
				rallies[tempIndex]['resultsInfo'] = link;
			}
		});
		this.rallies = rallies;
	},

	/**
   	 * Get rally's detailed info (distance, liason...) 
   	 * Executed from __crawlAllRallies
   	 * @param path wrc.com's url path to particular event
     */
	__crawlRallyInfo: async function(acronym, path) {
		await this.__navigateBrowser(path, true);
		var $ 				= cheerio.load(await this.__crawlBrowser('.box.w1.info.fright')),
			createDate 		= this.__createDate,
			toCapitalCase 	= this.__toCapitalCase,
			opts			= this.selectors.info,
			datesTemp 		= {}, 
			results 		= {
				date: {
					from: undefined,
					to: undefined
				},
				timezone	: undefined,
				classes		: [],
				distance	: undefined,
				liason		: undefined,
				servicePark	: undefined
			};

		$('tr').each(function() {
			let id 	= $(this).find('td:nth-of-type(1)').html().replace(':', '').toLowerCase().trim(),
				ctx = $(this).find('td:nth-of-type(2)').html();
			// read date, so we're able to tell, whenever it's past rally,
			// current one or upcoming
			if (id === opts.timezone) {
				let timezone = parseInt(ctx.split(' ')[1]);
				results['timezone'] = timezone ? timezone : 1;
			} else if (id === opts.startDate) {
				// just save it, we now nothing about timezone
				results['date']['from'] = createDate(ctx.split('.').concat([0, 0]), 0, false);
			} else if (id === opts.endDate) {
				// just save it, we now nothing about timezone
				results['date']['to'] = createDate(ctx.split('.').concat([0, 0]), 0, false);
			} else if (id === opts.category) {
				ctx.split('<br>').forEach(function(e, i){
					results['classes'][i] = e.trim();
				});
			} else if (id === opts.distance) {
				let distance = parseFloat(ctx.split(' ')[1].replace('(', '').replace(',', '.'));
				results['distance'] = isNaN(distance) ? undefined : distance;
			} else if (id === opts.liason) {
				results['liason'] = parseFloat(ctx.split(' ')[0].replace('.', '').replace(',', '.'));
			} else if (id === opts.servicePark) {
				results['servicePark'] = toCapitalCase(entities.decode(ctx));
			}
		});
		console.log(`Crawled: ${acronym}`);
		return results;
	},

	/**
   	 * Get rally's itinerary pointed by URL path
   	 * @param path wrc.com's url path to particular event's itinerary
   	 * @param UTC time offset to normalize time stamps used throughout
     */
	__crawlItinerary: async function(acronym, path, offset) {
		await this.__navigateBrowser(path, true);
		var $ = cheerio.load(await this.__crawlBrowser('#datasite .data')),
			test = $('tbody tr:nth-of-type(2) td:nth-of-type(3)').html();
		// if page has no content	
		if (test === null || isNaN(parseInt(test))) {
			await this.__navigateBrowser(path, true);
			$ = cheerio.load(await this.__crawlBrowser('#datasite .data'));
		}

		var stages  	= [],
			sel 		= this.selectors.itinerary,
			createDate 	= this.__createDate; 

		$('tbody').each(function() {
			// if page decides to not return anything
			var dateSource = $(this).find('tr:first-of-type td strong').html();
			if (dateSource === null)
				return false;
			var day = dateSource.split('-')[1].trim().split('.');

			$(this).find('tr:nth-of-type(n+2)').each(function(){
				let stage = {};
				
				stage['no'] = parseInt($(this).find(sel.stageNo).html().slice(2));
				stage['name'] = entities.decode($(this).find(sel.stageName).html().trim());
				stage['len'] = parseFloat($(this).find(sel.stageLen).html());
				stage['start'] = createDate(day.concat($(this).find(sel.stageStart).html().trim().split(':')), offset, true);
				stage['status'] = $(this).find(sel.stageStatus).html().trim();

				stages.push(stage);
			});
		});
	
		console.log(`Crawled stages for: ${acronym}`)
		return stages;
	},

	/**
   	 * Get rally's start list
   	 * @param path wrc.com's url path to particular event's start list
     */
	__crawlStartList: async function(path) {
		// get to correct destination
	    await this.__navigateClickBrowser(path, this.selectors.startList.page, true);
	    // main object for data, gets transfered to JSON later on after filled
		var startList 	= [],
			$ 			= cheerio.load(await this.__crawlBrowser('.scrolltable')),
			sel 		= this.selectors.startList,
			extractText = this.__extractText,
			toCapitalCase 	= this.__toCapitalCase;
		// scraping	
		$('tbody tr').each(function() {
			// object, that holds temp info
			let crewObj = {
				no: undefined,
				crewId: undefined,
				members: {
					driver: {},
					codriver: {}
				},
				equip: {
					team: undefined,
					make: undefined,
					car: undefined,
				},
				info: {
					eligibilty: undefined,
					class: undefined,
					priority: undefined
				}
			}, crewPtr;
			
			// set crew number
			crewObj['no'] = parseInt($(this).find(sel.no).html());
			// set driver/codriver info
			crewPtr = crewObj['members'];
			$(this).find(`${sel.members} img`).each(function(index){
				var nat = $(this).attr('title');
				if (index === 0) {
					crewPtr['driver']['nat'] = nat.toLowerCase();
				} else if (index === 1) {
					crewPtr['codriver']['nat'] = nat.toLowerCase();
				} else {
					throw 'Crew has only two members';
				}
			});
			// remove all useless info
			$(this).find(`${sel.members} img`).remove();
			// set driver/codriver names
			let ctx = $(this).find(sel.members).html(),
				crewMembersData = extractText(ctx);
		    // set driver/codriver's name
		    let driverName 	 = crewMembersData[0].split('. '),
		    	codriverName = crewMembersData[1].split('. ');

			crewPtr['driver']['name'] = driverName[0].indexOf('&') > -1 ? undefined : driverName[0];
			crewPtr['driver']['surname'] = toCapitalCase(entities.decode(driverName[1]));

			crewPtr['codriver']['name'] = codriverName[0];
			crewPtr['codriver']['surname'] = toCapitalCase(entities.decode(codriverName[1]));
			// set equipment info
			let make = $(this).find(`${sel.equip} img`).attr('src');
			make = make.slice(make.lastIndexOf('/') + 1, make.lastIndexOf('.'));
			crewPtr = crewObj['equip'];
			crewPtr['make'] = `${make.slice(0,1).toUpperCase()}${make.slice(1)}`;
			// remove manufacturer image
			$(this).find(`${sel.equip} img`).remove();
			let equipInfo = extractText($(this).find(sel.equip).html());
			crewPtr['team']= toCapitalCase(entities.decode(equipInfo[0]));
			crewPtr['car'] = equipInfo[1];
			// set info
			crewPtr = crewObj['info'];
			let crewEligInfo = $(this).find(sel.elig).html();
			crewPtr['eligibilty'] = crewEligInfo !== 'None' ? crewEligInfo : undefined;
			crewPtr['class'] = $(this).find(sel.class).html().trim();
			let crewPriorInfo = $(this).find(sel.prior).html();
			crewPtr['priority'] = crewPriorInfo !== 'None' ? crewPriorInfo : undefined;

			crewObj['crewId'] = `${entities.decode(driverName[1]).toLowerCase().split(' ').slice(-1)[0]}-${entities.decode(codriverName[1]).toLowerCase().split(' ').slice(-1)[0]}`;

			// assign to the main obj*/
			startList.push(crewObj);
		});
		return startList;
	},


	__crawlStageDetail: async function() {

	},

	/**
   	 * Get live text (comments from drivers at the end of the stages)
     */
	__crawlLiveText: async function() {
		// TODO:
		await this.__navigateBrowser(this.urls.liveText, false);
		console.log(await this.__crawlBrowser('.popuptext.scrollcontent'))
	}
}; 