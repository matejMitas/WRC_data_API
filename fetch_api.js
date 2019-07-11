const fetchWrapper = require('node-fetch')
const baseUrl = 'https://www.wrc.com/service/sasCacheApi.php?route=events'

async function* getData(url) {
	try {
    	const response = await fetchWrapper(url);
    	const data = await response.json();

    	if (data instanceof Array) {
    		for (let item of data) {
    			yield item
    		}
    	} else {
    		yield data
    	}
  	} catch (error) {
    	console.log(error);
  	}
}

(async function(){
	for await (let data of getData(baseUrl)) {
		for await (let rallyData of getData(`${baseUrl}/${data.eventId}`)) {
			/*
			Fetch all rally general info, nearly everything is already contained
			in first 'route=events' fetch but 'rallyId' is weirdly missing and is
			vital for next requests
			*/
			console.log(rallyData)
		}
	}
}())
