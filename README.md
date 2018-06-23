# WRC data API
An attempt to turn publicly available data into REST &amp; GraphQL APIs
\--
Working in progress.

### REST API Routes

#### Get list of all rallies with basic information
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
