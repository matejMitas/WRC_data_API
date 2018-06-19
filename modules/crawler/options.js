exports.blueprint = {
	live: {
		overall: 2,
		splits: 3,
		stages: 4,
		itinerary: 6,
		startlist: 7,
		penalties: 8,
		retirement: 9
	},
	detail: {
		from: 1,
		to: 2,
		timezone: 3,
		classes: 4,
		distance: 5,
		liason: 6,
		servicePark: 7
	}
}

exports.selectors = {
	itinerary: {
		stageNo: `td:nth-of-type(1)`,
		stageName: `td:nth-of-type(2) a`,
		stageLen: `td:nth-of-type(3)`,
		stageStart: `td:nth-of-type(4)`,
		stageStatus: `td:nth-of-type(5)`
	},
	startList: {
		page: `.liveCenterContent > ul > li:nth-of-type(${exports.blueprint.live.startlist}) > a`,
		crewNo: `td:nth-of-type(1)`,
		crewMembers: `td:nth-of-type(2)`,
		crewEquip: `td:nth-of-type(3)`,
		crewElig: `td:nth-of-type(4)`,
		crewClass: `td:nth-of-type(5)`,
		crewPrior: `td:nth-of-type(6)` 
	}
}

exports.urls = {
	prefix: 'http://www.wrc.com/en/wrc/',
	rallyList: 'calendar/calendar/page/671-206-16--.html',
	liveText: 'http://www.wrc.com/live-ticker/live_popup_text.html'
}
