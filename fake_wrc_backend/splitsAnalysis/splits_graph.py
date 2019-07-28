import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import matplotlib.ticker as plticker
import matplotlib.image as mpimg
from matplotlib.ticker import ScalarFormatter

import json

with open('test.json') as json_file:
    split_data = json.load(json_file)

for record in split_data:
	print(record)

figure = plt.figure(figsize=(12,8))
plt.plot([0,1,2,4], [0,1,82,66])
plt.savefig('test.png')