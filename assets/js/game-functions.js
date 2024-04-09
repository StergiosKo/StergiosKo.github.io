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

    while(entity1.currentStats.HP > 0 && entity2.currentStats.HP > 0) {
        console.log(`Turn ${turn + 1}`);

        // Entity 1 plays a card
        entity1.roundStart();
        if (entity1.currentStats.HP <= 0) {
            console.log(`${entity2.name} wins!`);
            return -1;
        }
        entity1.executeAction(entity2, turn % maxTurns);
        // Check if entity2 is defeated
        if (entity2.currentStats.HP <= 0) {
            console.log(`${entity1.name} wins!`);
            return 5;
        }

        // Entity 2 plays a card
        entity2.roundStart();
        if (entity2.currentStats.HP <= 0) {
            console.log(`${entity1.name} wins!`);
            return 5;
        }
        entity2.executeAction(entity1, turn % maxTurns);
        // Check if entity1 is defeated
        if (entity1.currentStats.HP <= 0) {
            console.log(`${entity2.name} wins!`);
            return -1;
        }

        turn++;
        if (turn >= maxTurns){
            loop++;
            turn = 0; // Reset the turn counter after all cards have been played
        }
        if (loop >= 5) break;
    }
}

function getRandomValue(min, max) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function getEffectValues(card) {
    const magnitudes = []; // To store the random magnitudes for use in the description
    card.effects.forEach(effect => {
        const effectType = Object.keys(effect.scaling)[0]; // e.g., "STR"
        const range = effect.scaling[effectType];
        if (range.min !== undefined && range.max !== undefined) {
            // Assign a random value within the range
            const randomValue = getRandomValue(range.min, range.max);
            console.log(card.name + " " + effectType + " " + randomValue);
            effect.scaling[effectType] = randomValue;
            magnitudes.push(randomValue);
        }
    });

    return card;
}

function getEffectValues(card) {
    const updatedCard = JSON.parse(JSON.stringify(card)); // Create a deep copy of the card object
    updatedCard.effects.forEach(effect => {
        const effectType = Object.keys(effect.scaling)[0]; // e.g., "STR"
        const range = effect.scaling[effectType];
        if (range.min !== undefined && range.max !== undefined) {
            // Assign a random value within the range
            const randomValue = getRandomValue(range.min, range.max);
            console.log(updatedCard.name + " " + effectType + " " + randomValue);
            effect.scaling[effectType] = randomValue;
        }
    });

    return updatedCard;
}

function getEquipmentStatsValues(card) {
    const updatedCard = JSON.parse(JSON.stringify(card)); // Create a deep copy of the card object
    const statsUpdates = []; // To store the random stat values for use in the description

    Object.keys(updatedCard.stats).forEach(statType => {
        const range = updatedCard.stats[statType];
        if (range.min !== undefined && range.max !== undefined) {
            // Assign a random value within the range
            const randomValue = Math.floor(getRandomValue(range.min, range.max));
            console.log(updatedCard.name + " " + statType + " " + randomValue);
            updatedCard.stats[statType] = randomValue;
            statsUpdates.push(randomValue);
        }
    });

    return updatedCard;
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
            const cardData = actionCardsData.find(card => card.id === data.id);
            
            // Update the scaling part for each effect in cardData.effects
            const updatedEffects = cardData.effects.map((effect, index) => ({
                ...effect,
                scaling: data.effects[index].scaling
            }));

            // Create a new cardData object with the same data as the original but with the new effects
            const newCardData = {
                ...cardData,
                effects: updatedEffects
            };
            if (newCardData) {
                return new CardAction(newCardData, getKeyWithoutPrefix(guid));
            }
            break;
        }
        case 'CardEquipment': {
            const cardData = equipmentCardsData.find(card => card.id === data.id);

            const newCardData = {
                ...cardData,
                stats: data.stats
            };

            if (cardData) {
                return new CardEquipment(newCardData, getKeyWithoutPrefix(guid));
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

function createCard(id, quantity, data, classType, effectValuesFunction, randomValues, saveToStorage = true) {
    try {
        // Filter to find the specific card data by ID
        const specificCardData = data.find(cardData => cardData.id == id);

        if (!specificCardData) {
            console.error("Card with specified ID not found in the data.");
            return [];
        }

        let coolData = specificCardData
        if (randomValues){
            console.log("Applying effectValuesFunction for classType:", specificCardData);
            // Apply the specific getEffectValues function for this card type
            coolData = effectValuesFunction(specificCardData);
            console.log(coolData);
        }

        let cards = []
        // Create the specified number of cards
        if (classType == CardAction || classType == CardEquipment){
            cards = Array.from({ length: quantity }, () => {
                let guid = generateGUID();
                let newCard = new classType(coolData, guid);
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
    const cardsContainer = document.getElementById('cardsContainer');
    // const cardsToggleBtn = document.getElementById('toggle-cards-btn');

    // cardsToggleBtn.addEventListener('click', () => {
    //     cardsContainer.classList.toggle('d-none');
    // });

    const heroContainer = document.getElementById('heroContainer');
    // const heroToggleBtn = document.getElementById('toggle-hero-btn');

    // heroToggleBtn.addEventListener('click', () => {
    //     heroContainer.classList.toggle('d-none');
    // });

    const heroModal = document.getElementById('heroModal');

    user.displayCards(cardsContainer);
    user.displayHeroes(heroContainer, heroModal);

    let locations = await createLocations("assets/json/locations.json", "assets/json/gameRewards.json");

    const locationHTML = locations[0].generateHTML();

    // Find the element with the id 'location-container'
    const locationContainer = document.getElementById('locationContainer');
    locationContainer.innerHTML = locationHTML;

    const heroesQuestContainer = document.getElementById('heroesQuestContainer');
    user.displayHeroesQuest(heroesQuestContainer);

    // locations[0].startQuest(heroesArray[0]);
    // checkOngoingQuests(locations, heroesArray);

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

function byteCount(s) {
    return encodeURI(s).split(/%..|./).length - 1;
}

async function createNewUser() {
    console.log("New user detected. Creating Cards");
    const [actionData, equipmentData, basicCardsData] = 
        await Promise.all([
            loadJSONFile("assets/json/gameActionCards.json"),
            loadJSONFile("assets/json/gameEquipmentCards.json"),
            loadJSONFile("assets/json/gameBasicCards.json")
        ]);

    console.log("starting")
    const [actionCards, equipmentCards] = [
        createCard(2000, 1, actionData, CardAction, getEffectValues, true),
        createCard(3000, 1, equipmentData, CardEquipment, getEquipmentStatsValues, true)
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

    console.log("ending")
    let extraActions = createCard(2000, 1, actionData, CardAction, getEffectValues, true);
    let extraEquipment = createCard(3000, 1, equipmentData, CardEquipment, getEquipmentStatsValues, true);
    allCards.push(...extraActions);
    allCards.push(...extraEquipment);

    saveToLocalStorage(hero);
    let newCard = createCard(2000, 1, actionData, CardAction, getEffectValues, true);
    allCards.push(newCard[0]);

    const user = new User([hero], allCards);

    console.log(user);
    
    readyGame(user);
}

async function createExistingUser(){
    console.log("Existing user detected. Loading Cards");
    let actionData = await loadJSONFile("assets/json/gameActionCards.json");
    let equipmentData = await loadJSONFile("assets/json/gameEquipmentCards.json");
    let basicCardsData = await loadJSONFile("assets/json/gameBasicCards.json");

    let cardsArray = deserializeAllGUIDs(actionData, equipmentData, basicCardsData);

    let heroesArray = deserializeAllHeroes(cardsArray);

    const user = new User(heroesArray, cardsArray);
    console.log(user);

    readyGame(user);
    saveToLocalStorage(user.heroes[0]);
    // let actionGUIDs = user.heroes[0].cardsActions.map(card => card.saved ? "test" : null);
    // console.log(actionGUIDs)
}

// console.log(1024 * 1024 * 5 - escape(encodeURIComponent(JSON.stringify(localStorage))).length);