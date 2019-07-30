import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import matplotlib.ticker as plticker
import matplotlib.image as mpimg
from matplotlib.ticker import ScalarFormatter

import json
import datetime

with open('test.json') as json_file:
    split_data = json.load(json_file)

def convertTime(time_string):
	date, time = time_string.split('T')
	year, month, day = date.split('-')
	hour, minute, temp_second = time.split(':')

	temp_suffix = temp_second.split('.')

	if (len(temp_suffix) == 2):
		seconds = int(temp_suffix[0])
		mili = int(temp_suffix[1].replace('Z', ''))
	else:
		seconds = int(temp_suffix[0].replace('Z', ''))
		mili = 0
	
	args = (int(year), int(month), int(day), int(hour), int(minute), seconds, mili)

	return int(datetime.datetime(*args).strftime('%s'))

figure = plt.figure(figsize=(14,9))

elig_colors = {
	'M' 		: 'blue',
	'WRC2PRO' 	: 'magenta',
	'WRC2' 		: 'red',
	'RGT' 		: 'yellow',
	'JWRC' 		: 'green',
	'None' 		: 'cyan'
}

for elig, records in split_data.items():
	for record in records:
		splits = record['splits']
		y = []
		for split in splits:
			y.append(convertTime(split))


		x = list(range(0,len(y)))
		plt.yticks(x, list(range(1,len(y)+1)))

		print(y)

		plt.scatter(y, x, color=elig_colors[elig], alpha=0.5)

plt.savefig('test.png')