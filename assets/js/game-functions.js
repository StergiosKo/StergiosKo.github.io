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
            effect.scaling[effectType] = randomValue;
            magnitudes.push(randomValue);
        }
    });

    return card;
}

function getEquipmentStatsValues(card) {
    const statsUpdates = []; // To store the random stat values for use in the description

    Object.keys(card.stats).forEach(statType => {
        const range = card.stats[statType];
        if (range.min !== undefined && range.max !== undefined) {
            // Assign a random value within the range
            const randomValue = Math.floor(getRandomValue(range.min, range.max));
            card.stats[statType] = randomValue;
            statsUpdates.push(randomValue);
        }
    });

    return card;
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

async function testCombat(hero, location){
    let enemy = location.createMonster();

    actionCards = await displayCards(
        'assets/json/gameActionCards.json',
        CardAction,
        getEffectValues // Adjusted for action card specifics
    );
    
    equipmentCards = await displayCards(
        'assets/json/gameEquipmentCards.json',
        CardEquipment,
        getEquipmentStatsValues // Adjusted for action card specifics
    );
    // hero.addActionCard(actionCards[0])
    // hero.addActionCard(actionCards[0])
    // hero.addActionCard(actionCards[0])
    // hero.addActionCard(actionCards[0])
    // hero.addActionCard(actionCards[0])

    // hero.equipEquipment(equipmentCards[0])
    // updateUI(hero, 'hero-stats');
    // updateUI(enemy, 'monster-stats');

    // location.startQuest();

    // startCombat(hero, enemy); // Assuming startCombat is defined and ready to be called

    // updateUI(hero, 'hero-stats');
    // updateUI(enemy, 'monster-stats');
    // saveToLocalStorage(actionCards[0]);
    // saveToLocalStorage(equipmentCards[0]);
    
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

const charactersGUID = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function generateUniqueShortGUID() {
    let uniqueGUID = '';
    let isUnique = false;

    while (!isUnique) {
        let potentialGUID = '';
        for (let i = 0; i < 6; i++) {
            potentialGUID += charactersGUID.charAt(Math.floor(Math.random() * charactersGUID.length));
        }
        
        // Check uniqueness in localStorage keys
        isUnique = true; // Assume it's unique until found otherwise
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.includes(potentialGUID)) {
                isUnique = false;
                break; // Found the GUID in existing keys, break and generate a new one
            }
        }

        if (isUnique) {
            uniqueGUID = potentialGUID; // A unique GUID has been found
        }
    }

    return uniqueGUID;
}


function saveToLocalStorage(object) {
    const serializedObject = object.serialize();
    console.log(serializedObject)
    localStorage.setItem(`guid${object.GUID}`, serializedObject); // Prepending "guid"
}

function getAllGUIDs() {
    let guids = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("guid")) {
            guids.push(key.slice(4)); // Remove "guid" prefix to get the actual GUID
        }
    }
    return guids;
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

    // Filter the allCards array to find action cards that match the GUIDs in data.actions
    let actionCards = data.actions.map(actionGuid => 
        allCards.find(card => card.GUID === actionGuid));

    // Filter the allCards array to find equipment cards that match the GUIDs in data.equipment
    let equipmentCards = data.equipment.map(equipmentGuid => 
        allCards.find(card => card.GUID === equipmentGuid)).filter(card => card != null);

    // Create a new hero with the filtered action and equipment cards
    let hero = new Hero(data.name, guid, actionCards, equipmentCards);

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
                return new CardAction(newCardData, guid);
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
                return new CardEquipment(newCardData, guid);
            }
            break;
        }
        case 'Card': {
            const cardData = resourceCardsData.find(card => card.id === data.id);

            if (cardData) {
                return new Card(cardData, guid, data.quantity);
            }
            break;
        }
        // Handle other classTypes as needed
        default:
            break;
    }
}

async function createCard(id, quantity, data, classType, effectValuesFunction, randomValues) {
    try {
        // Filter to find the specific card data by ID
        const specificCardData = data.find(cardData => cardData.id == id);

        if (!specificCardData) {
            console.error("Card with specified ID not found in the data.");
            return [];
        }

        if (randomValues){
            // Apply the specific getEffectValues function for this card type
            effectValuesFunction(specificCardData);
        }

        let cards = []
        // Create the specified number of cards
        if (classType == CardAction || classType == CardEquipment){
            cards = Array.from({ length: quantity }, () => {
                let guid = generateGUID();
                return new classType(specificCardData, guid);
            });
        }
        else{
            cards.push(new Card(specificCardData, generateGUID(), quantity))
        }

        return cards;
    } catch (error) {
        console.error("Failed to load JSON data from", data, ":", error);
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


