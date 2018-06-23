# WRC data API
An attempt to turn publicly available data into REST &amp; GraphQL APIs
\--
Working in progress.

### REST API Routes

#### GET list of all rallies with basic information
Please be aware that order of rallies starts at zero (as in most or programming languages).
```javascript
/rallies
```
Output:
```javascript
[
	{
		"acronym" : "mco",
		"name" : "Rallye Monte-Carlo",
		"info" : {
			"date" : {
				"from" : ISODate("2018-01-25T00:00:00Z"),
				"to" : ISODate("2018-01-28T00:00:00Z")
			},
			"order" : 0
		}
	},
	...
	{
		"acronym" : "aus",
		"name" : "Kennards Hire Rally Australia",
		"info" : {
			"date" : {
				"from" : ISODate("2018-11-15T00:00:00Z"),
				"to" : ISODate("2018-11-18T00:00:00Z")
			},
			"order" : 12
		}
	}
]
```

#### GET rally info
You can either use numeric `id` of the rally (according to `info.order`) or its `acronym`.
```javascript
/rally/3
/rally/fra
```
Output:
```javascript
[
	{
		"acronym" : "fra",
		"name" : "Corsica Linea - Tour de Corse",
		"info" : {
			"date" : {
				"from" : ISODate("2018-04-05T00:00:00Z"),
				"to" : ISODate("2018-04-08T00:00:00Z")
			},
			"timezone" : 2,
			"classes" : [
				"WRC3",
				"WRC2",
				"WRC",
				"JWRC"
			],
			"distance" : 333.48,
			"liason" : 1120.1,
			"servicePark" : "Bastia",
			"links" : {
				"detail" : "calendar/tourdecorse-2018/page/702--702-682-.html",
				"results" : "results/france/stage-times/page/400-236---.html"
			},
			"order" : 3
		}
	}
]
```
