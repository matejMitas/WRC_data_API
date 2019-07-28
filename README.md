# World Rally Championship timing

As official timing service is somewhat lacking in most areas, I decided such a global sport could do better than clumsy SPA application.
Aim here is to create high availabilty client oriented service built on top of GraphQL protocol with Redis-based caching.


## 🚨 Disclaimer 🚨
Data used in project are not my own property and are not stored in this repository. 

Current usage
------------------
This project is in its starting phase, therefore only realy working thing is fetching data from original API.
First step is to have up and running `MongoDB`, config is located in `config/default.json` with more options but user
is discouraged to change anything but database confing at this point.

```json
"FakeDataApi": {
	"db": {
		"type": "mongodb://",
		"host": "localhost",
		"port"  : 27017,
		"dbName": "FakeDataApi"
	}
}
```

After the database is ready, run `npm install` to obtain all dependencies. 

```
node fake_wrc_backend/apiFetcher.js
```

Calling this fetches data about `rallies`, `stages`, `entries` and `splits` about each rally in the last two years (seasons `2018` and `2019`). Database has a following structure with four collections mirroring data types. Please note that any other document-based can be used but user need to supply own driver. 
```
-- FakeDataApi
	-- rally
	-- stage
	-- entry
	-- split
```
Since IDs of data obtained from original API leave a lot to be desired in terms of readability, each record is modified in following manner:

```json
{
	"humanId" : {
		"year" 		: 2019,
		"country" 	: "MCO"
	},
	"timestamp" : 1564254972973,
	"data"      : {
		"data returned from API"
	}
}
```

`data` field stores original data fetched from API, `timestamp` is just an UNIX timestamp currently not utilised (later planned for data relevance checks) and `humanId` used for development purposes. 