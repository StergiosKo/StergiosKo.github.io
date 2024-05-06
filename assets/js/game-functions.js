function updateUI(entity, containerId) {
    const container = document.getElementById(containerId);
    let statsHtml = `
        <div class="stats-row"><strong>HP:</strong> ${entity.currentStats.HP} / ${entity.maxStats.HP}</div>
        <div class="stats-row"><strong>Attributes:</strong></div>
        <ul>
            <li><strong>STR:</strong> ${entity.attributes.STR}</li>
            <li><strong>DEX:</strong> ${entity.attributes.DEX}</li>
            <li><strong>INT:</strong> ${entity.attributes.INT}</li>
        </ul>
    `;

    container.innerHTML = statsHtml;
}

// Score > 5 Hero wins, Score = -1 Monster wins
function startCombat(entity1, entity2) {
    let turn = 0;
    const maxTurns = 5; // Assuming each entity has 5 cards
    let loop = 0;
    entity1.updateCurrentStats();
    entity2.updateCurrentStats();

    let score = 0;

    while(entity1.currentStats.HP > 0 && entity2.currentStats.HP > 0) {
        console.log(`Turn ${turn + 1}`);

        // Entity 1 plays a card
        entity1.roundStart();
        if (entity1.currentStats.HP <= 0) {
            console.log(`${entity2.name} wins!`);
            score = -1;
            break;
        }
        entity1.executeAction(entity2, turn % maxTurns);
        // Check if entity2 is defeated
        if (entity2.currentStats.HP <= 0) {
            console.log(`${entity1.name} wins!`);
            score = 2;
            break;
        }

        // Entity 2 plays a card
        entity2.roundStart();
        if (entity2.currentStats.HP <= 0) {
            console.log(`${entity1.name} wins!`);
            score = 2;
            break;
        }
        entity2.executeAction(entity1, turn % maxTurns);
        // Check if entity1 is defeated
        if (entity1.currentStats.HP <= 0) {
            console.log(`${entity2.name} wins!`);
            score = -1;
            break;
        }

        turn++;
        if (turn >= maxTurns){
            loop++;
            turn = 0; // Reset the turn counter after all cards have been played
        }
        if (loop >= 5) break;
    }
    if (score != -1){
        score = calculateQuestScore(entity1.maxStats.HP, entity1.currentStats.HP, loop * 5 + turn);
    }
    return score;
}

function getRandomValue(min, max) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}


async function displayCards(jsonPath, cardClass, effectValuesFunction) {
    try {
        const response = await fetch(jsonPath);
        const data = await response.json();

        let cards = data.map(cardData => {
            // Apply the specific getEffectValues function for this card type
            effectValuesFunction(cardData);

            // Dynamically determine the parameters based on the card type
            let guid = generateGUID();

            let card;
            if (cardClass === CardAction) {
                card = new CardAction(cardData, guid);
            } else if (cardClass === CardEquipment) {
                card = new CardEquipment(cardData, guid);
            } else {
                throw new Error("Unknown card class type");
            }

            return card;
        });

        const cardsContainer = document.getElementById('cardsContainer');

        cards.forEach(card => {
            cardsContainer.innerHTML += card.generateHTML();
        });
        return cards;
    } catch (error) {
        console.error("Failed to load JSON data from", jsonPath, ":", error);
    }
}

async function createLocations(locPath, rewPath) {

    const rewardsMap = {}
    try{
        const response = await fetch(rewPath);
        const data = await response.json();

        for (const reward of data) {
            rewardsMap[reward.id] = reward;
        }

    } catch(error){
        console.error("Failed to load JSON data from", rewPath, ":", error);
        return
    }

    try {
        const response = await fetch(locPath);
        const data = await response.json();

        let locations = data.map(loc => {
            const location = new Location(loc, rewardsMap); // Create a Location object
            location.monster = location.createMonster(); // Create and assign a Monster object to this location
            return location; // Return the Location object with its monster
        });

        return locations;
    } catch (error) {
        console.error("Failed to load JSON data from", locPath, ":", error);
    }
}

function getRandomNumber(min, max) {
    if (min == max) return min;
    return Math.random() * (max - min) + min;
}

function checkOngoingQuests(locations, heroList) {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("questData-")) {
            const locationId = key.split("-")[1];
            const questData = JSON.parse(localStorage.getItem(key)); // Retrieve quest data

            if (locations[locationId]) {
                // Find the hero with the matching GUID
                const hero = heroList.find(h => h.GUID === questData.heroGUID);

                if (hero) {
                    locations[locationId].checkQuestEnd(hero, questData.score); // Pass the hero and score
                } else {
                    console.error(`Hero with GUID ${questData.heroGUID} not found in heroList.`);
                }
            }
        }
    }
}


function generateGUID(){
    return crypto.randomUUID();
}

function saveToLocalStorage(object) {
    const serializedObject = object.serialize();
    const key = localStorage.getItem(object.GUID) ? object.GUID : `guid${object.GUID}`;
    localStorage.setItem(key, serializedObject);
}

function getAllGUIDs() {
    let guids = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("guid")) {
            guids.push(getKeyWithoutPrefix(key)); // Remove "guid" prefix to get the actual GUID
        }
    }
    return guids;
}

/**
 * A function that returns the key without the prefix "guid" if it starts with it.
 *
 * @param {string} key - The key to process.
 * @return {string} The key without the "guid" prefix if present.
 */
function getKeyWithoutPrefix(key) {
    if (key.startsWith("guid")) return key.slice(4);
    else return key;
}

function deserializeAllGUIDs(actionCardsData, equipmentCardsData, resourceCardsData) {
    let deserializedObjects = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("guid")) {
            const itemJSON = localStorage.getItem(key);
            const deserializedObject = deserialize(key, itemJSON, actionCardsData, equipmentCardsData, resourceCardsData);
            if (deserializedObject) deserializedObjects.push(deserializedObject);
        }
    }
    return deserializedObjects;
}


async function loadJSONFile(path){
    try{
        const response = await fetch(path);
        const data = await response.json();

        return data;

    } catch(error){
        console.error("Failed to load JSON data from", path, ":", error);
        return undefined
    }
}

function deserializeAllHeroes(cards) {
    let deserializedObjects = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("guid")) {
            const itemJSON = localStorage.getItem(key);
            const deserializedObject = deserializeHero(key, itemJSON, cards);
            if (deserializedObject) deserializedObjects.push(deserializedObject);
        }
    }
    return deserializedObjects;
}

function deserializeHero(guid, jsonString, allCards) {
    const data = JSON.parse(jsonString);
    if (data.classType != 'Hero') return null;

    let actionCards = data.actions.map(actionGuid => {
        const foundCard = allCards.find(card => card.GUID === actionGuid);
        return foundCard;
    });

    let equipmentCards = data.equipment.map(equipmentGuid => {
        const foundCard = allCards.find(card => card.GUID === equipmentGuid);
        return foundCard;
    }).filter(card => card != null);

    // Create a new hero with the filtered action and equipment cards
    let hero = new Hero(data.name, getKeyWithoutPrefix(guid), actionCards, equipmentCards, data.level, data.exp);

    return hero;
}


function deserialize(guid, jsonString, actionCardsData, equipmentCardsData, resourceCardsData) {
    const data = JSON.parse(jsonString);

    switch (data.classType) {
        case 'CardAction': {
            let cardData = actionCardsData.find(card => card.id === data.id);
            if(data.quality) cardData = getScaling(cardData, data.quality);
            // console.log(cardData)
            
            // Update the scaling part for each effect in cardData.effects
            // const updatedEffects = cardData.effects.map((effect, index) => ({
            //     ...effect,
            //     scaling: data.effects[index].scaling
            // }));

            // Create a new cardData object with the same data as the original but with the new effects
            // const newCardData = {
            //     ...cardData,
            //     effects: updatedEffects
            // };
            if (cardData) {
                return new CardAction(cardData, getKeyWithoutPrefix(guid));
            }
            break;
        }
        case 'CardEquipment': {
            let cardData = equipmentCardsData.find(card => card.id === data.id);
            if(data.quality) cardData = getScaling(cardData, data.quality);

            // const newCardData = {
            //     ...cardData,
            //     stats: data.stats
            // };

            if (cardData) {
                return new CardEquipment(cardData, getKeyWithoutPrefix(guid));
            }
            break;
        }
        case 'Card': {
            if (!data.id) return null;
            const cardData = resourceCardsData.find(card => card.id === data.id);

            if (cardData) {
                return new Card(cardData, getKeyWithoutPrefix(guid), data.quantity);
            }
            break;
        }
        // Handle other classTypes as needed
        default:
            break;
    }
}

function createCard(id, quantity, data, classType, quality, saveToStorage = true) {
    try {
        // Filter to find the specific card data by ID
        let specificCardData = data.find(cardData => cardData.id == id);

        if (!specificCardData) {
            console.error("Card with specified ID not found in the data.");
            return [];
        }

        specificCardData = getScaling(specificCardData, quality);

        let cards = []
        // Create the specified number of cards
        if (classType == CardAction || classType == CardEquipment){
            cards = Array.from({ length: quantity }, () => {
                let guid = generateGUID();
                let newCard = new classType(specificCardData, guid);
                if (saveToStorage) {
                    saveToLocalStorage(newCard);
                }
                return newCard;
            });
       }
        else{
            cards.push(new Card(coolData, generateGUID(), quantity))
        }

        console.log("Created cards:", cards);
        return cards;
    } catch (error) {
        console.error("Failed to load JSON data from", data, ":", error);
        console.log("Stack trace:", error.stack);
        return [];
    }
}

function toggleSection(locationId, section, buttonId) {
    const actionsId = `actions-${locationId}`;
    const rewardsId = `rewards-${locationId}`;
    const actionsSection = document.getElementById(actionsId);
    const rewardsSection = document.getElementById(rewardsId);

    const buttonActions = document.getElementById(buttonId + 'actions');
    const buttonRewards = document.getElementById(buttonId + 'rewards');
    
    // Close the current section and open the selected one
    if (section === 'actions') {
        actionsSection.classList.remove('d-none');
        rewardsSection.classList.add('d-none');
        buttonActions.classList.remove('d-none-button');
        buttonRewards.classList.add('d-none-button');
    } else if (section === 'rewards') {
        rewardsSection.classList.remove('d-none');
        actionsSection.classList.add('d-none');
        buttonActions.classList.add('d-none-button');
        buttonRewards.classList.remove('d-none-button');
    }
}


function calculateLocalStorageSizeInKB() {
    let totalSizeInBytes = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);

        totalSizeInBytes += byteCount(key);
        totalSizeInBytes += byteCount(value);
        
        // totalSizeInBytes += key.length * 2; // Each character is approx. 2 bytes
        // totalSizeInBytes += value.length * 2; // Each character is approx. 2 bytes
    }
    
    const totalSizeInKB = totalSizeInBytes / 1024; // Convert bytes to kilobytes
    return totalSizeInKB;
}


function checkIfNewUser() {
    const newUserKey = 'isNewUser';

    // Check if the key exists in localStorage
    if (localStorage.getItem(newUserKey) === null) {
        // Key doesn't exist, meaning the user is new to the site
        console.log('Welcome, new user!');

        // Create the key with an appropriate value
        localStorage.setItem(newUserKey, 'false'); // 'false' indicates the user is no longer new

        return true; // Return true to indicate this is a new user
    } else {
        // Key exists, meaning the user has visited the site before
        console.log('Welcome back!');

        return false; // Return false to indicate the user is not new
    }
}

async function readyGame(user){

    const heroContainer = document.getElementById('heroContainer');

    const heroModal = document.getElementById('heroModal');

    let locations = await createLocations("assets/json/locations.json", "assets/json/gameRewards.json");
    const locModal = document.getElementById('locationModal');

    // Find the element with the id 'location-container'
    const locationContainer = document.getElementById('locationContainer');

    const heroesQuestContainer = document.getElementById('heroesQuestContainer');

    const crafterContainer = document.getElementById('crafterContainer');
    
    const crafterModal = document.getElementById('crafterModal');

    const cardsContainer = document.getElementById('all-cardsContainer');
    const cardsSortButtonContainer = document.getElementById('button-sorting-container');

    const goldElement = document.getElementById('gold');

    const heroCostElement = document.getElementById('hero-cost');
    
    user.saveUIElement(cardsContainer, 'cardsEl');
    user.saveUIElement(heroContainer, 'heroesEl');
    user.saveUIElement(heroModal, 'heroModalEl');
    user.saveUIElement(heroesQuestContainer, 'heroQuestEl');
    user.saveUIElement(crafterContainer, 'crafterEl');
    user.saveUIElement(crafterModal,'crafterModalEl');
    user.saveUIElement(goldElement, 'goldEl');
    user.saveUIElement(heroCostElement, 'heroCostEl');

    console.log(user)
    user.addGold(0); // Display user gold

    user.generateSortButtons(cardsSortButtonContainer, cardsContainer);
    user.displayCardsMain(cardsContainer);
    user.displayHeroes(heroContainer, heroModal);
    user.displayCrafters();

    const locationHTML = locations[0].generateMiniHTML();
    locationContainer.innerHTML = locationHTML;


    locations.forEach(location => {
        location.addMiniButtonFunctionality(locModal);
    })

    user.displayHeroesQuest(heroesQuestContainer);

    checkOngoingQuests(locations, user.heroes);

    const heroHireElement = document.getElementById('hero-hire');
    heroHireElement.addEventListener('click', () => {
        user.hireHero();
    })

    user.checkCrafting();
    user.saveData();
    // console.log(user)
    // user.saveCrafters();

}

function byteCount(s) {
    return encodeURI(s).split(/%..|./).length - 1;
}

async function createNewUser() {
    console.log("New user detected. Creating Cards");
    const [actionData, equipmentData, basicCardsData] = 
        await Promise.all([
            loadJSONFile("assets/json/gameActionCards.json"),
            loadJSONFile("assets/json/gameEquipmentCards.json"),
            loadJSONFile("assets/json/gameRewards.json")
        ]);

    const [actionCards, equipmentCards] = [
        createCard(2000, 1, actionData, CardAction, 50),
        createCard(3000, 1, equipmentData, CardEquipment, 50)
    ];

    let heroActions = [];
    for (let i = 0; i < 5; i++) {
        if (i < actionCards.length) {
            heroActions.push(actionCards[i]);
        } else {
            heroActions.push(null);
        }
    }
    
    let allCards = [...actionCards, ...equipmentCards];

    const hero = new Hero('Mr Knight', generateGUID(), heroActions, equipmentCards, 1, 0);
    const heroesArray = [hero];

    let extraActions = createCard(2000, 1, actionData, CardAction, 50);
    let extraEquipment = createCard(3000, 1, equipmentData, CardEquipment, 50);
    allCards.push(...extraActions);
    allCards.push(...extraEquipment);

    saveToLocalStorage(hero);
    let newCard = createCard(2000, 1, actionData, CardAction, 50);
    allCards.push(newCard[0]);

    const jsonActionCrafter = {
        id: 0,
        name: "Action Crafter",
        level: 1,
        exp: 0,
        knownCards: []
    }

    const jsonEquipmentCrafter = {
        id: 1,
        name: "Equipment Crafter",
        level: 1,
        exp: 0,
        knownCards: []
    }

    let actionCrafter = new Crafter(0, jsonActionCrafter, CardAction, actionData, 2);
    let equipmentCrafter = new Crafter(1, jsonEquipmentCrafter, CardEquipment, equipmentData, 2);

    let gold = 50
    localStorage.setItem("gold", gold);

    user = new User(heroesArray, allCards, [actionCrafter, equipmentCrafter], gold);
    user.saveData();
    user.saveCrafters();

    console.log(user);
    
    readyGame(user);
}

async function createExistingUser(){
    console.log("Existing user detected. Loading Cards");
    let actionData = await loadJSONFile("assets/json/gameActionCards.json");
    let equipmentData = await loadJSONFile("assets/json/gameEquipmentCards.json");
    let basicCardsData = await loadJSONFile("assets/json/gameRewards.json");

    let crafters = deserializeCrafters(actionData, equipmentData, basicCardsData);

    let cardsArray = deserializeAllGUIDs(actionData, equipmentData, basicCardsData);

    let heroesArray = deserializeAllHeroes(cardsArray);

    let gold = parseInt(localStorage.getItem("gold"));

    user = new User(heroesArray, cardsArray, crafters, gold);

    readyGame(user);

}

function capitalizeWord(string){
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function calculateWidth(value, max) {
    return (value / max) * 100;
}

function calculateQuestScore(maxhealth, healthLeft, numTurns) {
    const healthScore = (Math.pow(healthLeft / maxhealth, 2)) * 2.5;
    const turnsScore = (1 - 1 / (1 + Math.sqrt(numTurns + 1))) * 2.5;
    let totalScore = healthScore + turnsScore;
    
    // Ensure the score is between 0 and 5
    totalScore = Math.max(0, Math.min(5, totalScore));
    
    return totalScore;
}


function rarityToNumber(rarity) {
    const rarityValues = {
        "common": 5,
        "uncommon": 4,
        "rare": 3,
        "epic": 2,
        "legendary": 1
    };

    // Convert the rarity string to lowercase to ensure case-insensitive matching
    rarity = rarity.toLowerCase();

    // Return the numerical value for the given rarity, or a default value if the rarity is not recognized
    return rarityValues[rarity] || 0; // Assuming 0 as a default value for unknown rarities
}


function deserializeCrafters(actionData, equipmentData, rewardsData){
    let deserializedObjects = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("crafter")) {
            const itemJSON = JSON.parse(localStorage.getItem(key));
            const id = key.split("-")[1];

            let classType;
            let cardsData;
            

            switch (itemJSON.cardType){
                case "CardAction":
                    classType = CardAction;
                    cardsData = actionData;
                    break;
                case "CardEquipment":
                    classType = CardEquipment;
                    cardsData = equipmentData;
                    break;
                default:
                    break;
            }

            const deserializedObject = new Crafter(id, itemJSON, classType, cardsData, 2, rewardsData);

            if (deserializedObject) deserializedObjects.push(deserializedObject);
        }
    }
    return deserializedObjects;
}

function visualizeBar(gained, start, end, speed, element){
    let current = start;

    const intervalTime = 30; // Time in milliseconds
    const updateAmount = (gained - start) / (speed / intervalTime); // Adjust the 1000 to control the duration of the animation
    const prevExpBar = element.querySelector('#prev-exp-bar');
    const newExpBar = element.querySelector('#new-exp-bar');

    // Set the initial width of the prevExpBar
    prevExpBar.style.width = calculateWidth(start, end) + '%';

    // Update the newExpBar over time
    const interval = setInterval(() => {
        current += updateAmount; // Increment the currentExp towards the target exp

        if (current >= gained) {
            current = gained; // Ensure we don't go over the target exp
            clearInterval(interval); // Stop the interval when we reach the target exp
        }

        const newExpWidth = calculateWidth(current - start, end);
        newExpBar.style.width = newExpWidth + '%';
        newExpBar.setAttribute('aria-valuenow', current);
    }, intervalTime);
}

function getScaling(card, quality){
    const updatedCard = JSON.parse(JSON.stringify(card)); // Create a deep copy of the card object

    if (updatedCard.effects){
        updatedCard.effects.forEach(effect => {
            const effectType = Object.keys(effect.scaling)[0]; // e.g., "STR"
            const range = effect.scaling[effectType];
            if (range.min !== undefined && range.max !== undefined) {
                let scalingValue = range.min + (quality / 100) * (range.max - range.min);
                effect.scaling[effectType] = parseFloat(scalingValue.toFixed(2));
            }
        });
    }
    if (updatedCard.stats){
        Object.keys(updatedCard.stats).forEach(statType => {
            const range = updatedCard.stats[statType];
            if (range.min !== undefined && range.max !== undefined) {
                let scalingValue = range.min + (quality / 100) * (range.max - range.min);
                updatedCard.stats[statType] = Math.round(scalingValue);
            }
        });
    }
    updatedCard['quality'] = quality;

    return updatedCard;
}

function qualityToRank(quality){
    if (quality < 40) return 'D';
    if (quality < 60) return 'C';
    if (quality < 80) return 'B';
    if (quality < 95) return 'A';
    return 'S';
}

function deleteFromLocalStorage(key) {
    localStorage.removeItem(key);
}