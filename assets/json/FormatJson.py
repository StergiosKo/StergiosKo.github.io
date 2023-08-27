# Python program to read
# json file

import json

# Opening JSON file
f = open('preFormatedCards.json', encoding="utf8")

# returns JSON object as
# a dictionary
data = json.load(f)

# Iterating through the json
# list

newData = {
    "cards": []
}

basicLands = {"Plains": 0, "Island": 0, "Swamp": 0, "Mountain": 0, "Forest": 0}

def cost_to_colors(string):
    templist = "all "
    if string == "":
        return templist + "land"

    ncolors = 0
    for key, val in colors.items():
        if key in str(string):
            ncolors += 1
            templist += val + " "

    if ncolors > 1:
        templist += "multi"
    return templist


def convert_url(string):
    string = string.replace(',', '')
    string = string.replace("’", '')
    string = string.replace("&", '')
    return string


colors = {'W': 'white', 'U': 'blue', 'B': 'black', 'R': 'red', 'G': 'green'}

for i in data["spoiler"]["card"]:
    tempDict = {}
    tempDict['name'] = i['name']
    tempDict['illustrator'] = i['illustrator']
    tempDict['notes'] = i['notes']
    tempDict['color'] = cost_to_colors(i['cost'])
    tempDict['imagePath'] = "/assets/images/HnK/" + convert_url(i["name"]) + ".png"
    if i['rarity'] == "B":
        if basicLands[tempDict['name']] > 0:
            tempDict['imagePath'] = "/assets/images/HnK/" + convert_url(i["name"]) + "." + str(
                basicLands[tempDict['name']]) + ".png"
        basicLands[tempDict['name']] = basicLands[tempDict['name']] + 1

    newData["cards"].append(tempDict)


print(newData)
# Serialize data and write back to file
with open('newCards.json', 'w') as fnew:
    json.dump(newData, fnew)

# Closing file
f.close()
fnew.close()