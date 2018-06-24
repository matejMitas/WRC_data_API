/**
 * @fileoverview Config objects for various purposes
 *
 * Mostly enums revolving around certain elements on 
 * page. Both numerical indexes in predefined elements
 * or complete selectors 
 * @author contact@matejmitas.com (Matěj Mitaš)
 */

/**
 * Numerical indexes
 */
exports.blueprint = {
	live: {
		overall		: 2,
		splits		: 3,
		stages 		: 4,
		itinerary	: 6,
		startList 	: 7,
		penalties	: 8,
		retirement	: 9
	},
	detail: {
		from		: 1,
		to 			: 2,
		timezone 	: 3,
		classes 	: 4,
		distance 	: 5,
		liason 		: 6,
		servicePark : 7
	},
}
/**
 * Cheerio selectors
 */
exports.selectors = {
	itinerary: {
		stageNo		: `td:nth-of-type(1)`,
		stageName	: `td:nth-of-type(2) a`,
		stageLen	: `td:nth-of-type(3)`,
		stageStart	: `td:nth-of-type(4)`,
		stageStatus	: `td:nth-of-type(5)`
	},
	startList: {
		page		: `.liveCenterContent > ul > li:nth-of-type(${exports.blueprint.live.startList}) > a`,
		no			: `td:nth-of-type(1)`,
		members		: `td:nth-of-type(2)`,
		equip		: `td:nth-of-type(3)`,
		elig		: `td:nth-of-type(4)`,
		class		: `td:nth-of-type(5)`,
		prior		: `td:nth-of-type(6)` 
	},
	info: {
		startDate	: 'start date',
		endDate 	: 'end date',
		timezone	: 'timezone',
		category	: 'category',
		distance 	: 'stages',
		liason		: 'distance',
		servicePark	: 'servicepark'
	}
}
/**
 * Testing URLs
 */
exports.urls = {
	prefix		: 'http://www.wrc.com/en/wrc/',
	rallyList	: 'calendar/calendar/page/671-206-16--.html',
	liveText 	: 'http://www.wrc.com/live-ticker/live_popup_text.html'
}

exports.rallies = { 
  MCO:
   { name: 'Rallye Monte-Carlo',
     infoLink: 'calendar/monte-carlo-2018/page/683--683-682-.html',
     resultsInfo: 'results/monte-carlo/stage-times/page/318-226---.html' },
  SWE:
   { name: 'Rally Sweden',
     infoLink: 'calendar/sweden-2018/page/684--684-682-.html',
     resultsInfo: 'results/sweden/stage-times/page/326-227---.html' },
  MEX:
   { name: 'Rally Guanajuato México',
     infoLink: 'calendar/mexico-2018/page/694--694-682-.html',
     resultsInfo: 'results/mexico/stage-times/page/334-228---.html' },
  FRA:
   { name: 'Corsica Linea - Tour de Corse',
     infoLink: 'calendar/tourdecorse-2018/page/702--702-682-.html',
     resultsInfo: 'results/france/stage-times/page/400-236---.html' },
  ARG:
   { name: 'YPF Rally Argentina',
     infoLink: 'calendar/argentina-2018/page/696--696-682-.html',
     resultsInfo: 'results/argentina/stage-times/page/346-230---.html' },
  PRT:
   { name: 'Vodafone Rally de Portugal',
     infoLink: 'calendar/portugal-2018/page/695--695-682-.html',
     resultsInfo: 'results/portugal/stage-times/page/342-229---.html' },
  ITA:
   { name: 'Rally Italia Sardegna',
     infoLink: 'calendar/italy-2018/page/697--697-682-.html',
     resultsInfo: 'results/italy/stage-times/page/360-231---.html' },
  FIN:
   { name: 'Neste Rally Finland',
     infoLink: 'calendar/finland-2018/page/699--699-682-.html' },
  DEU:
   { name: 'ADAC Rallye Deutschland',
     infoLink: 'calendar/germany-2018/page/700--700-682-.html' },
  TUR:
   { name: 'Rally Turkey',
     infoLink: 'calendar/turkey-2018/page/5038--5038-682-.html' },
  GBR:
   { name: 'Dayinsure Wales Rally GB',
     infoLink: 'calendar/wales-2018/page/704--704-682-.html' },
  ESP:
   { name: 'RallyRACC Catalunya - Rally de España',
     infoLink: 'calendar/spain-2018/page/703--703-682-.html' },
  AUS:
   { name: 'Kennards Hire Rally Australia',
     infoLink: 'calendar/australia-2018/page/701--701-682-.html' } }
