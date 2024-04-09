class Entity {
    constructor(name, attributes, maxStats, statusEffects) {
        this.name = name || "Uknown Entity";
        this.attributes = attributes || { "STR": 1, "DEX": 1, "INT": 20 };
        this.maxStats = maxStats || { "HP": 10, "CRIT": 0.5, "MANA": 1, 'CRITD': 1.5};
        this.currentStats = {};
        this.cardsActions = [];
        this.statusEffects = statusEffects || {"burn": 0, "charge": 0, "paralysis": 0, "freeze": 0};

        // Initialize the entity's stats upon creation
        this.updateCurrentStats();
    }

    applyStatus(name, value) {
        value = Math.floor(value); // Ensure amount is an integer
        if (this.statusEffects[name] !== undefined) {
            this.statusEffects[name] += value;
            // if (value > 0) console.log(`${this.name} took ${value} ${name}`);
        } else {
            console.warn(`Status ${name} does not exist.`);
        }
        // console.log(this.statusEffects);
    }

    deepCopy(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    updateCurrentStats() {
        // Default implementation - can be overridden in subclasses
        this.currentStats = this.deepCopy(this.maxStats);
    }

    logStats() {
        console.log("Name: ", this.name);
        console.log("Attributes", this.attributes);
        console.log("Current Stats", this.currentStats);
    }

    
    // Method to apply damage
    damage(amount) {
        amount = Math.floor(amount); // Ensure amount is an integer
        this.currentStats.HP -= amount;
        if (this.currentStats.HP < 0) this.currentStats.HP = 0;
        // console.log(`${this.name} takes ${amount} damage, current HP: ${this.currentStats.HP}`);
    }

    // Method to apply healing
    heal(amount) {
        amount = Math.floor(amount); // Ensure amount is an integer
        const maxHP = this.maxStats.HP;
        this.currentStats.HP += amount;
        if (this.currentStats.HP > maxHP) this.currentStats.HP = maxHP;
        // console.log(`${this.name} is healed for ${amount}, current HP: ${this.currentStats.HP}`);
    }

    addActionCard(card) {
        this.cardsActions.push(card);
    }

    executeAction(opponent, cardIndex) {
        const action = this.cardsActions[cardIndex];
        // console.log(`${this.name} uses ${action.name} on ${opponent.name}`);
        // Simplified; here you would apply the card's effect to the opponent

        // Determine if the action is a critical hit
        const isCriticalHit = Math.random() * 100 < this.currentStats.CRIT;
        if (isCriticalHit) {
            // console.log('Critical hit!');
        }
        action.doAction(this, opponent, isCriticalHit, this.currentStats['CRITD']);
    }

    roundStart(){
        // Burn
        let burn = this.statusEffects['burn'] 
        if (burn > 0) {
            // console.log(`${this.name} is burned for ${burn}`);
            this.damage(burn)
            burn = burn/2
            this.applyStatus("burn", -burn)
        }

        // Paralysis
        if (this.statusEffects['paralysis'] > 0){
            this.applyStatus("paralysis", -1)
        }

        // Freeze
        if (this.statusEffects['freeze'] > 0){
            this.applyStatus("freeze", -1)
        }
    }

    getActions(){
        return this.cardsActions;
    }

    displayActions(div) {
        // Clear existing content
        div.innerHTML = '';

        // Iterate through each action and append its HTML to the div
        this.cardsActions.forEach(action => {
            const actionHtml = action.generateHTML(); // Assuming generateHTML returns a string of HTML
            div.innerHTML += actionHtml; // Append the action's HTML to the div
        });
    }
    
}

class Hero extends Entity {
    constructor(name, guid, cardsActions, equipmentCards, level, exp) {
        super(
            name,
            { "STR": 5, "DEX": 5, "INT": 5 }, 
            { "HP": 10, "CRIT": 0.5, "MANA": 1, 'CRITD': 1.5}
        );
        this.MAX_LEVEL = 20;
        this.level = level;
        this.exp = exp;
        this.updateMaxExp();
        this.updateStatsPerLevel();
        this.cardsEquipment = { "Head": null, "Body": null, "Weapon": null , "Accessory": null};
        equipmentCards.forEach(card => {
            this.equipEquipment(card);
            if (card) card.setAvailability(false);
        })

        if (cardsActions){
            this.cardsActions = cardsActions;
            this.cardsActions.forEach(action => {
                if (action) action.setAvailability(false);
            })
        } 
        else this.cardsActions = [null, null, null, null, null];
        this.GUID = guid;
        this.available = true;

        this.addBasicCards();
        this.addBasicEquipment();

        // Initialize the entity's stats upon creation
        this.updateCurrentStats();
    }

    displayEquipment(div){
    
        // Clear existing content
        div.innerHTML = '';
    
        // Iterate through each equipment and append its HTML to the div with labels
        Object.entries(this.cardsEquipment).forEach(([key, equipment]) => {
            let currentDiv = document.createElement('div');
            currentDiv.classList.add('equipment-card');
            currentDiv.innerHTML += `<p>${key}</p>`; // Add label
            if (!equipment) currentDiv.innerHTML += '<p>No equipment <br> equipped</p>';
            else{
                const equipmentHTML = equipment.generateHTML(); // Assuming generateHTML returns a string of HTML
                currentDiv.innerHTML += equipmentHTML; // Append the action's HTML to the div
            }

            div.appendChild(currentDiv);
        });
    }

    generateHTML() {
        return `
            <div class="hero-container d-flex flex-wrap">
                <h2>${this.name}</h2>
                <div class="row ms-2">
                <p class="attributes">Attributes: STR: ${this.attributes.STR}, DEX: ${this.attributes.DEX}, INT: ${this.attributes.INT}</p>
                <p class="max-stats">Max Stats: HP: ${this.maxStats.HP}, CRIT: ${this.maxStats.CRIT}, MANA: ${this.maxStats.MANA}, CRITD: ${this.maxStats['CRITD']}</p>
                </div>
                <div class="row">
                <p class="level-exp">Level: ${this.level} Exp: ${this.exp}/${this.maxExp}</p>
                <p> Availability: ${this.available ? "Yes" : "No"}</p>
                <p> Available Mana: ${this.getAvailableMana()}</p>
                </div>
                <div>
                <button class="btn btn-primary" id="hero-button-actions">Actions</button>
                <button class="btn btn-primary d-none-button" id="hero-button-equipment">Equipment</button>
                </div>
                <div class="w-100"></div>
                <div>
                    <div id="cards" class="hero-cards d-flex flex-wrap mt-1"></div>
                </div>
            </div>
        `;
    }

    generateButtonHTML(idname, modalId) {
        return `
            <button id="${idname}-hero-button-${this.GUID}" class="hero-button btn btn-primary ${this.available ? '' : 'd-none-button'}" ${modalId ? 'data-toggle="modal"' : ''}  data-target="#${modalId}">
                <h4>${this.name}</h4>
                <p>Level: ${this.level}, Exp: ${this.exp}/${this.maxExp}</p>
            </button>
        `;
    }

    testMethod(){
        console.log("test")
    }

    /**
     * Increment the level if it is below the maximum level.
    */
    levelUP(){
        if (this.level < this.MAX_LEVEL){
            this.level += 1;
            updateStatsPerLevel();
            updateMaxExp();
            this.updateCurrentStats();
        }
    }

    /**
     * Add basic cards to the existing cardsActions array.
     *
     * @param {Object} basicCard - The basic card object data to add.
     */
    addBasicCards(){
        // For null action cards
        let basicCard = {
            "id": null,
            "name": "Punch",
            "artwork": "https://cdnb.artstation.com/p/assets/images/images/008/410/265/large/victoria-collins-black-lotus.jpg?1512581450",
            "description": "Deal {0} STR damage",
            "mana": 1,
            "card_type": "Force",
            "rarity": "Common",
            "level": 1,
            "effects": [
                {
                    "target": 1,
                    "effect": "damage",
                    "scaling": {"STR": 0.5}
                }
            ]
        }
        for(let i=0; i < this.cardsActions.length; i++){
            if(!this.cardsActions[i]){
                this.addActionCard(new CardAction(basicCard, generateGUID(), false), i)
            }
        }
    }

    addBasicEquipment(){
        // For null equipment cards
        const basicEquipmentData = [
            {
                "name": "Basic Helmet",
                "card_type": "Head",
                "artwork": "https://cdnb.artstation.com/p/assets/images/images/008/410/265/large/victoria-collins-black-lotus.jpg?1512581450",
                "description": "Gain {0} STR | {1} DEX | {2} INT",
                "rarity": "Common",
                "level": 1,
                "stats": {"STR": 0, "DEX": 0, "INT": 0}
            },
            {
                "name": "Basic Armor",
                "card_type": "Body",
                "artwork": "https://cdnb.artstation.com/p/assets/images/images/008/410/265/large/victoria-collins-black-lotus.jpg?1512581450",
                "description": "Gain {0} STR | {1} DEX | {2} INT",
                "rarity": "Common",
                "level": 1,
                "stats": {"STR": 0, "DEX": 0, "INT": 0}
            },
            {
                "name": "Basic Sword",
                "card_type": "Weapon",
                "artwork": "https://cdnb.artstation.com/p/assets/images/images/008/410/265/large/victoria-collins-black-lotus.jpg?1512581450",
                "description": "Gain {0} STR | {1} DEX | {2} INT",
                "rarity": "Common",
                "level": 1,
                "stats": {"STR": 0, "DEX": 0, "INT": 0}
            },
            {
                "name": "Basic Ring",
                "card_type": "Accessory",
                "artwork": "https://cdnb.artstation.com/p/assets/images/images/008/410/265/large/victoria-collins-black-lotus.jpg?1512581450",
                "description": "Gain {0} STR | {1} DEX | {2} INT",
                "rarity": "Common",
                "level": 1,
                "stats": {"STR": 0, "DEX": 0, "INT": 0}
            }
        ];

        basicEquipmentData.forEach(basicEquipment => {
            if (!this.cardsEquipment[basicEquipment.card_type]) {
                this.equipEquipment(new CardEquipment(basicEquipment, generateGUID(), false));
            }
        });
    
    }

    updateStatsPerLevel(){
        for (let i = 1; i < this.level; i++) {
            for (const [key, value] of Object.entries(this.attributes)) {
                this.attributes[key] += 1;
              }
        }
        this.updateCurrentStats();
    }

    updateMaxExp(){
        this.maxExp = this.level * this.level/2 * 100;
    }

    /**
     * Serialize the object into a JSON string.
     *
     * @return {string} The serialized JSON string.
     */
    serialize() {
        // Extract the GUIDs from the cardsActions array
        let actionGUIDs = this.cardsActions.map(card => card.saved ? card.GUID : null);

        // Extract the GUIDs from the cardsEquipment map
        let equipmentGUIDs = Object.values(this.cardsEquipment).map(equipment => equipment.saved ? equipment.GUID : null);

        return JSON.stringify({
            classType: 'Hero',
            name: this.name,
            actions: actionGUIDs,
            equipment: equipmentGUIDs,
            level: this.level,
            exp: this.exp
        });
    }

    setAvailability(bool){
        this.available = bool;
    }
    
    isAvailable(){
        return this.available;
    }


    // Hero-specific methods or overrides of Entity methods
    updateCurrentStats() {
        // Hero-specific logic for updating current stats
        this.maxStats.HP = this.attributes.STR * 3;
        this.maxStats.CRIT = 0.5 + parseFloat((this.attributes.DEX * 0.5).toFixed(2));
        this.maxStats.CRITD = 1.5 + parseFloat((this.attributes.DEX * 0.022).toFixed(2));
        this.maxStats.MANA = this.attributes.INT;

        this.currentStats = this.deepCopy(this.maxStats);
    }

    /**
     * Adds a card to the specified index in the cardsActions array.
     *
     * @param {CardAction} card - the card to add
     * @param {number} index - the index where the card should be added
     */
    addActionCard(card, index) {
        if (index >= 0 && index < this.cardsActions.length) {
            let oldCard = this.cardsActions[index];
            this.cardsActions[index] = card;
            card.setAvailability(false);
            if (oldCard) oldCard.setAvailability(true);
            return oldCard
        }
    }

    /**
     * Equip new equipment or replace existing equipment and update stats accordingly.
     *
     * @param {CardEquipment} equipment - The equipment to be equipped or replaced
     * @return {CardEquipment} The previously equipped equipment
     */
    equipEquipment(equipment) {
        const type = equipment.piece; // "Head", "Body", "Weapon", "Accessory"
        if (!this.cardsEquipment[type]) {
            console.log(`${this.name} Equipping new ${type} equipment: ${equipment.name}`);
        } else {
            console.log(`${this.name} Replacing ${type} equipment: ${this.cardsEquipment[type].name} with ${equipment.name}`);
            // Remove the stats of the currently equipped equipment of the same type
            this.updateStats(this.cardsEquipment[type], false);
        }

        // Equip the new equipment and add its stats
        let oldEquipment = this.cardsEquipment[type]
        if (oldEquipment) oldEquipment.setAvailability(true);
        equipment.setAvailability(false);
        this.cardsEquipment[type] = equipment;
        this.updateStats(equipment, true);

        return oldEquipment;
    }

    updateStats(equipment, add = true) {
        Object.keys(equipment.stats).forEach(stat => {
            if (add) {
                // Check if the attribute exists; if not, initialize it
                if (!this.attributes[stat]) {
                    this.attributes[stat] = 0;
                }
                this.attributes[stat] += equipment.stats[stat];
            } else {
                // When removing, subtract the stat; check to prevent negative attributes
                this.attributes[stat] -= equipment.stats[stat];
                if (this.attributes[stat] < 0) {
                    this.attributes[stat] = 0;
                }
            }
        });
        // Call updateCurrentStats() to recalculate currentStats based on the updated attributes
        this.updateCurrentStats();
    }

    getAvailableMana(){
        let usedMana = 0;
        this.cardsActions.forEach(card => {
            usedMana += card.mana;
        })
        return this.maxStats.MANA - usedMana;
    }

    getAction(guid){
        return this.cardsActions.find(card => card.GUID === guid);
    }

    getEquipment(guid){
        return Object.values(this.cardsEquipment).find(card => card.GUID === guid);
    }

    replaceAction(cardLeave, cardEnter){
        const index = this.cardsActions.indexOf(cardLeave);
        if (index !== -1) {
            this.addActionCard(cardEnter, index);
        }
    }


}

class Monster extends Entity {
    constructor(name, data) {
        super(name, data.attributes, data.stats);
        
        // Prepare the cardActions map for quick lookup by ID
        const cardActionById = new Map(data.cardsActions.map(card => [card.id, card]));
        
        // Map the action IDs to their corresponding CardAction objects
        this.cardsActions = data.actions.map(actionId => {
            const actionCardData = cardActionById.get(actionId);
            if (!actionCardData) {
                console.error(`Action card with ID ${actionId} not found.`);
                return null; // Or handle this case as appropriate
            }
            return new CardAction(actionCardData);
        }).filter(action => action !== null); // Filter out any actions that weren't found
    }

    // Override the updateCurrentStats method from Entity
    updateCurrentStats() {
        // For monsters, just directly copy maxStats to currentStats without modifications
        this.currentStats = this.deepCopy(this.maxStats);
    }

    // You can add more monster-specific methods or properties here
}

class Card {
    constructor(data, guid, quantity, saved = true) {
        this.name = data.name;
        this.artwork = data.artwork;
        this.description = data.description;
        this.rarity = data.rarity;
        this.level = data.level;
        this.GUID = guid;
        this.id = data.id;
        quantity ? this.quantity = quantity : this.quantity = 1
        this.available = true;
        this.saved = saved;
    }

    /**
     * Template string with placeholders replaced by object properties
     * Process description to include color-coded attributes
     *
     * @param {any} short - if parameter, adds short class to card
     * @return {type} returns html
     */
    generateHTML(short) {
        const html = `
        <article class="${'o-card' + (short ? ' card-short' : '')} ${this.available ? '' : 'card-unavailable'}">
            <figure class="c-bg_img o-flx_c" style="background-image: url(${this.artwork});">
                <figcaption class="c-bg_img_desc o-flx_el_b u-border_b"><b>${this.name}</b>
                </figcaption>
            </figure>
            <section class="o-card_b"><span>${this.description}</section>
            ${this.quantity !== -1 ? `<div class="card-number-box">x${this.quantity}</div>` : ''}
        </article>`;
    
        return html;
    }

    serialize(){
        return JSON.stringify({
            classType: 'Card',
            id: this.id,
            quantity: this.quantity
        });
    }

    getGUID(){
        return this.GUID;
    }

    getAvailability(){
        return this.available;
    }

    setAvailability(bool){
        this.available = bool;
    }

}

class CardAction extends Card {
    constructor(data, guid, saved = true) {
        super(data, guid, 1, saved);
        this.effects = data.effects;
        this.card_type = "Action - " + data.card_type;
        this.mana = data.mana;
    }

    serialize(){
        // Create a new array containing only the scaling part of each effect
        const scalingOnlyEffects = this.effects.map(effect => ({
            scaling: effect.scaling
        }));

        return JSON.stringify({
            classType: 'CardAction',
            id: this.id,
            effects: scalingOnlyEffects
        });
    }
    
    /**
     * Template string with placeholders replaced by object properties
     * Process description to include color-coded attributes
     *
     * @param {any} short - if parameter, adds short class to card
     * @return {type} returns html
     */
    generateHTML(short) {
        // Template string with placeholders replaced by object properties
            // Process description to include color-coded attributes

            // Assumes the description has placeholders like "Deal {0} STR damage and apply {1} INT Burn to the enemy"
        let updatedDescription = this.description;
        this.effects.forEach((effect, index) => {
            updatedDescription = updatedDescription.replace(`{${index}}`, Object.values(effect.scaling)[0]);
        });
        this.description = updatedDescription;
        
        let processedDescription = this.description
        .replace(/STR/g, '<span class="attr-str">STR</span>')
        .replace(/DEX/g, '<span class="attr-dex">DEX</span>')
        .replace(/INT/g, '<span class="attr-int">INT</span>');
        const html = `
            <article class="${'o-card' + (short ? ' card-short' : '')} ${this.available ? '' : 'card-unavailable'}" data-card-id="${this.GUID}">
                <figure class="c-bg_img o-flx_c" style="background-image: url(${this.artwork});">
                    <header class="c-top_icons"><span class="c-icon">${this.mana}</span></header>
                    <figcaption class="c-bg_img_desc o-flx_el_b u-border_b"><b>${this.name}</b>
                        <blockquote>${this.card_type}</blockquote>
                    </figcaption>
                </figure>
                <section class="o-card_b"><span>${processedDescription}</section>
            </article>`;
        
        return html;
    }

    doAction(user, opponent, isCriticalHit, critD){
        // Apply the effect based on its type
        this.effects.forEach(effect => {
            // Determine the target of the effect
            const target = effect.target === 0 ? user : opponent;

            const attributeValue = user.attributes[Object.keys(effect.scaling)[0]]; // e.g., "STR": 1.5
            let magnitude = attributeValue * Object.values(effect.scaling)[0];; // e.g., {"STR": 1.5} * effect magnitude

            if (isCriticalHit) {
                magnitude *= critD; // Adjust magnitude for critical damage
            }
            // Apply the effect based on its type
            switch (effect.effect) {
                case 'damage':
                    target.damage(magnitude);
                    break;
                case 'heal':
                    target.heal(magnitude);
                    break;
                case 'freeze':
                case 'charge':
                case 'paralysis':
                case 'burn':
                    target.applyStatus(effect.effect, magnitude);
                    break;
                default:
                    console.log(`Unknown effect type: ${effect.effect}`);
            }
        });
    }

}

class CardEquipment extends Card {
    constructor(data, guid, saved = true) {
        super(data, guid, 1, saved);
        this.stats = data.stats;
        this.card_type = "Equipment - " + data.card_type; // Note the change here for consistency
        this.piece = data.card_type;
    }

    serialize(){
        return JSON.stringify({
            classType: 'CardEquipment',
            id: this.id,
            stats: this.stats
        });
    }

    /**
     * Template string with placeholders replaced by object properties
     * Process description to include color-coded attributes
     *
     * @param {any} short - if parameter, adds short class to card
     * @return {type} returns html
     */
    generateHTML(short) {
        let updatedDescription = this.description;

        Object.entries(this.stats).forEach(([key, value], index) => {
            // Assuming you want to replace placeholders in the description with the stat values
            updatedDescription = updatedDescription.replace(`{${index}}`, value);
        });
        
        this.description = updatedDescription;
        

        let processedDescription = this.description
        .replace(/STR/g, '<span class="attr-str">STR</span>')
        .replace(/DEX/g, '<span class="attr-dex">DEX</span>')
        .replace(/INT/g, '<span class="attr-int">INT</span>');
        const html = `
            <article class="${'o-card' + (short ? ' card-short' : '')} ${this.available ? '' : 'card-unavailable'}" data-card-id="${this.GUID}">
                <figure class="c-bg_img o-flx_c" style="background-image: url(${this.artwork});">
                    <figcaption class="c-bg_img_desc o-flx_el_b u-border_b"><b>${this.name}</b>
                        <blockquote>${this.card_type}</blockquote>
                    </figcaption>
                </figure>
                <section class="o-card_b"><span>${processedDescription}</section>
            </article>`;
        
        return html;
    }
}

class Location {
    constructor(locationData, rewardsData) {
        this.id = locationData.id;
        this.name = locationData.name;
        this.artwork = locationData.artwork;
        this.description = locationData.description;
        this.level = locationData.level;
        this.time = locationData.time; // Quest duration in some unit of time
        this.monsterData = {
            attributes: locationData.attributes,
            stats: locationData.stats,
            actions: locationData.actions,
            cardsActions: locationData.cardsActions
        };
        this.rewards = [];
        this.currentMonster = new Monster(this.name, this.monsterData)

        // Populate the rewards array with JSON data for each reward ID
        locationData.rewards.forEach(rewardId => {
            const reward = rewardsData[rewardId];
            if (reward) {
                // For each reward ID in locationData.rewards, add the corresponding reward data from rewardsData
                this.rewards.push(new Card(reward, 0, -1));
            } else {
                console.log(`Reward with ID ${rewardId} not found.`);
            }
        });
        this.currentOpenSection = 'actions';  // Actions are open by default
    }

    createMonster() {
        // Creates and returns a Monster object based on stored monster data
        return new Monster(this.name, this.monsterData);
    }

    startBattle(hero){
        this.currentMonster = this.createMonster();
        let score = startCombat(hero, this.currentMonster);
        return score;
    }

    startQuest(hero) {
        hero.setAvailability(false);
        let score = this.startBattle(hero); // Assume this method starts the battle and returns a score
        console.log(`The hero ${hero.name} starts the quest ${this.name}.`);
        
        const endTime = new Date().getTime() + this.time * 1000; // Convert seconds to milliseconds
        const questData = { endTime: endTime, heroGUID: hero.GUID, score: score };
        localStorage.setItem(`questData-${this.id}`, JSON.stringify(questData));
        
        this.checkQuestEnd(hero, score); // Pass the hero and score to checkQuestEnd
    }

    checkQuestEnd(hero, score) {
        const questData = JSON.parse(localStorage.getItem(`questData-${this.id}`));
        if (questData) {
            const { endTime, heroGUID } = questData;
            const currentTime = new Date().getTime();
    
            if (currentTime >= endTime) {
                hero.setAvailability(true);
                console.log(`The quest in ${this.name} who the hero ${hero.name} took has ended with a score of ${score}.`);
                // console.log(`The hero: ${heroGUID} is now free`);
                // Perform any actions needed after quest end, e.g., reward the hero
                // this.receiveRewards(heroGUID); // Pass the hero's GUID to the receiveRewards method
                localStorage.removeItem(`questData-${this.id}`);
            } else {
                // If the quest is not yet finished, set a timeout to check again at the estimated end time
                setTimeout(() => {
                    this.checkQuestEnd(hero, score);
                }, endTime - currentTime);
            }
        }
    }

    // Formula for reward quantity
    getQuantity(rarity, score){
        let randomVal = getRandomNumber(0, 5 - score);
        return Math.round(this.rarityToNumber(rarity) - randomVal)
    }

    rarityToNumber(rarity) {
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

    receiveRewards() {
        const score = 5; // Given score value
        this.rewards.forEach(reward => {
            console.log(reward.name)
            const quantity = this.getQuantity(reward.rarity, score);
    
            for (let i = 0; i < quantity; i++) {
                const card = new Card(reward); // Assuming reward includes all necessary data for creating a Card
                console.log(card);
            }
        });
    }

    generateButtonHTML(){
        
    }

    generateHTML() {
        let html = `
        <div class="location card mb-3" data-location-id="${this.id}>
            <div class="card-header">
                <h2 class="card-title text-center">${this.name}</h2>
                <p class="card-text text-center">${this.description}</p>
            </div>
            <button class="btn btn-primary">Fight</button>
            <img src="${this.artwork}" class="card-img-top loc-image" alt="${this.name}">
            <div class="card-body">
                <h3 class="h5">Monster Stats</h3>
                <p class="card-text"><small>${JSON.stringify(this.monsterData.stats)}</small></p>
                <button id="location-button-${this.id}-actions" class="btn btn-primary" onclick="toggleSection('${this.id}', 'actions', 'location-button-${this.id}-')">Show Actions</button>
                <button id="location-button-${this.id}-rewards" class="btn btn-primary d-none-button" onclick="toggleSection('${this.id}', 'rewards', 'location-button-${this.id}-')">Show Rewards</button>
            </div>
            <div id="actions-${this.id}" class="actions">
            <h3>Actions</h3>
            <div class="d-flex flex-wrap">`;
        this.currentMonster.getActions().forEach(card => {
            html += card.generateHTML();
        });
        html += `</div></div>
        <div id="rewards-${this.id}" class="rewards d-none">
                    <h3>Rewards</h3>
                    <div class="d-flex flex-wrap">`;
        this.rewards.forEach(card => {
            html += card.generateHTML();
        });
        html += `</div></div>
        </div>`;
    
        return html;
    }

    testMethod(){
        console.log("test")
    }
}

class User {

    constructor(heroes, cards){
        this.heroes = heroes;
        this.cards = cards;
        this.chosenHero = null;
    }

    /**
     * Display cards in the specified HTML element.
     *
     * @param {HTMLElement} htmlElement - The HTML element to display the cards in
     * @param {Class} [cardType] - The type of cards to display
     */
   

    displayCards(htmlElement, cardType = null){
        htmlElement.innerHTML = this.cards
        .filter(card => cardType ? card.constructor === cardType : true)
        .map(card => {
            const cardHtml = card.generateHTML();
            const draggable = card.getAvailability() ? 'draggable-card' : '';
            return `<div class="${draggable}" draggable="${card.getAvailability()}" data-card-id="${card.GUID}">${cardHtml}</div>`;
        })
        .join('');
    
        // Add event listeners for dragstart
        htmlElement.querySelectorAll('.draggable-card').forEach(cardElement => {
            cardElement.addEventListener('dragstart', (event) => {
                event.dataTransfer.setData('text/plain', event.target.dataset.cardId);
            });
        });
    }

    displayHeroes(htmlElement, heroModal){
        htmlElement.innerHTML = this.heroes.map(hero => hero.generateButtonHTML("preview", heroModal.id)).join('');
        this.heroes.forEach(hero => {
            const button = document.getElementById(`preview-hero-button-${hero.GUID}`);
            button.addEventListener('click', () => this.displayHeroModal(hero, heroModal))
        });
    }

    displayHeroesQuest(htmlElement){
        htmlElement.innerHTML = this.heroes.map(hero => hero.generateButtonHTML("hero-quest")).join('');
        this.heroes.forEach(hero => {
            const button = document.getElementById(`hero-quest-hero-button-${hero.GUID}`);
            button.addEventListener('click',  () => {
                this.selectHeroQuest(hero);
            });
        });
    }

    selectHeroQuest(hero){
       const buttons =
            [...document.querySelectorAll('[id^="hero-quest-hero-button"]')]
          ;
        const heroButton = document.getElementById(`hero-quest-hero-button-${hero.GUID}`);
        buttons.forEach(button => {
            console.log(button)
            button.classList.remove('active');
        })
        heroButton.classList.add('active');
        this.chosenHero = hero;
    }

    /**
     * A description of the entire function.
     *
     * @param {type} hero - the hero to display
     * @param {type} modal - the modal element that will be displayed
     * @param {type} classType - action or equipment
     */
    displayHeroModal(hero, modal, classType = CardAction){
        const modalBody = modal.querySelector('.modal-body');
        modalBody.innerHTML = hero.generateHTML();

        modalBody.innerHTML += '<h4>Your Cards</h4><div class="scrollable-container user-cards-scrollable"><div id="user-cards" class="d-flex flex-wrap scrollable-content"></div></div>';

        const userCards = modalBody.querySelector('#user-cards');
        this.displayCards(userCards, CardAction);

        // Add event listeners to the modal body

        const actionButton = modalBody.querySelector('#hero-button-actions');
        const equipmentButton = modalBody.querySelector('#hero-button-equipment');
        const cardElement = modalBody.querySelector('#cards');

        this.modalDisplayByCardtype(hero, modal, cardElement, actionButton, equipmentButton, userCards, classType);
        
        // this.allowHeroCardDrop(hero, cardElement, classType, modal);

        // Add event listeners to the action and equipment buttons
        actionButton.addEventListener('click', () => this.modalDisplayByCardtype(hero, modal, cardElement, actionButton, equipmentButton, userCards, CardAction));

        equipmentButton.addEventListener('click', () => this.modalDisplayByCardtype(hero, modal, cardElement, actionButton, equipmentButton, userCards, CardEquipment));
        
    }

    modalDisplayByCardtype(hero, modal, cardElement, actionButton, equipmentButton, userCards, classType = CardAction){
        if (classType === CardAction) {
            actionButton.classList.remove('d-none-button');
            equipmentButton.classList.add('d-none-button');
            this.displayCards(userCards, CardAction);
            hero.displayActions(cardElement);
        } else if (classType === CardEquipment) {
            actionButton.classList.add('d-none-button');
            equipmentButton.classList.remove('d-none-button');
            this.displayCards(userCards, CardEquipment);
            hero.displayEquipment(cardElement);
        }
        this.allowHeroCardDrop(hero, cardElement, classType, modal);
    }

    allowHeroCardDrop(hero, htmlElement, classType, heroModal){
        // Add drop event listeners for hero cards
        htmlElement.querySelectorAll('.o-card').forEach(heroCardElement => {
            heroCardElement.addEventListener('dragover', (event) => {
                event.preventDefault(); // Necessary to allow dropping
            });
    
            heroCardElement.addEventListener('drop', (event) => {
                event.preventDefault();
                const userCardId = event.dataTransfer.getData('text/plain');
                const userCard = this.cards.find(card => card.GUID === userCardId);
                const heroCardId = heroCardElement.dataset.cardId;
                let heroCard;
                if (classType == CardAction) heroCard = hero.getAction(heroCardId);
                else if (classType == CardEquipment){
                    heroCard = hero.getEquipment(heroCardId);
                    if (heroCard.card_type != userCard.card_type){
                        heroCard = null;
                        console.log("Card types don't match");
                    }
                    
                } 
                
                if (userCard && heroCard) {
                    // Replace hero card with user card logic here...
                    console.log(`The hero card ${heroCard.name} was replaced with ${userCard.name}`);
                    if (classType == CardAction){
                        hero.replaceAction(heroCard, userCard);
                        console.log(hero);
                        this.displayHeroModal(hero, heroModal, CardAction);
                    }
                    else if(classType == CardEquipment){
                        hero.equipEquipment(userCard);
                        console.log(hero);
                        this.displayHeroModal(hero, heroModal, CardEquipment);
                    }
                    saveToLocalStorage(hero);
                    
                }
            });
        });
    }
}