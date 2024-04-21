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
                ${this.generateBasicHTML()}
            </button>
        `;
    }

    generateBasicHTML(){
        return `<h4>${this.name}</h4>
        <p>Level: ${this.level}, Exp: ${this.exp}/${this.maxExp}</p>`
    }

    /**
     * Increment the level if it is below the maximum level.
    */
    levelUP(){
        if (this.level < this.MAX_LEVEL){
            this.level += 1;
            this.exp = 0;
            this.updateStatsPerLevel();
            this.updateMaxExp();
            this.updateCurrentStats();
            console.log("Level up!");
            console.log(this);
        }
    }

    receiveEXP(exp){
        if (this.exp + exp >= this.maxExp){
            console.log(this.exp + " " + exp + " " + this.maxExp);
            let remainingExp = this.maxExp - this.exp;
            this.levelUP();
            return remainingExp;
        }
        else{
            this.exp += exp;
        }
        
        return this.exp;
    }

    receiveEXPAll(exp){
        let count = 0;
        while(exp > 0){
            exp = exp - this.receiveEXP(exp);
            if (count > 100 || this.level == this.MAX_LEVEL) break;
        }
        // Return final exp
        return this.exp;
    }

    getMaxEXP(){
        return this.maxExp;
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
            "mana": 0,
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

    getEXP(){
        return this.exp;
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
        } else {
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
        if(data.level) this.level = data.level;
        else this.level = 1;
        this.mana = 0;
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
        <article id="cardId-${this.id}" class="${'o-card' + (short ? ' card-short' : '')} ${this.available ? '' : 'card-unavailable'}">
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

    addQuantity(quantity){
        this.quantity += quantity;
    }

    removeQuantity(quantity){
        this.quantity -= quantity;
    }

}

class CardAction extends Card {
    constructor(data, guid, saved = true) {
        super(data, guid, 1, saved);
        this.quality = data.quality;
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
            quality: this.quality
        });
    }

    serializeTest(){
        return JSON.stringify({
            classType: 'CardAction',
            id: this.id,
            quality: this.quality
        })
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
            let minValue = Object.values(effect.scaling)[0].min;
            let maxValue = Object.values(effect.scaling)[0].max;
            if (minValue && maxValue) {
                // If the scaling has min and max values, replace with "minValue - maxValue"
                updatedDescription = updatedDescription.replace(`{${index}}`, `${minValue} - ${maxValue}`);
            } else {
                // Otherwise, replace with the current scaling value
                updatedDescription = updatedDescription.replace(`{${index}}`, Object.values(effect.scaling)[0]);
            }
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
        this.quality = data.quality;
        this.stats = data.stats;
        this.card_type = "Equipment - " + data.card_type; // Note the change here for consistency
        this.piece = data.card_type;
    }

    serialize(){
        return JSON.stringify({
            classType: 'CardEquipment',
            id: this.id,
            quality: this.quality
        });
    }

    serializeTest(){
        return JSON.stringify({
            classType: 'CardEquipment',
            id: this.id,
            quality: this.quality
        })
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
            if (value.min && value.max) {
                // If the scaling has min and max values, replace with "minValue - maxValue"
                updatedDescription = updatedDescription.replace(`{${index}}`, `${value.min} - ${value.max}`);
            } else {
                // Otherwise, replace with the current scaling value
                updatedDescription = updatedDescription.replace(`{${index}}`, value);
            }
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
        this.exp = locationData.exp;
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
        this.available = 'available';
        this.currentHero;
        this.currentScore;
        this.endTime;

        // UI
        this.availabilityUI;
    }
    
    setAvailability(availability){
        this.available = availability;
        let text = this.available;
        if(this.available === 'quest'){
            // Set interval function that displays time left to craft
            let secondsLeft = (this.endTime - Date.now()) / 1000;
            let interval = setInterval(() => {
                secondsLeft = (this.endTime - Date.now()) / 1000;
                const minutes = Math.floor(secondsLeft / 60);
                const seconds = Math.ceil(secondsLeft % 60);
                let currentText =  `${minutes}m ${seconds}s`;
                this.updateAvailabilityUI(this.available, currentText);
            }, 1000);
            setTimeout(() => {
                clearInterval(interval);
            }, (this.endTime - Date.now()));
        }
        this.updateAvailabilityUI(this.available, text);
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
        this.setAvailability('quest');
        
        this.checkQuestEnd(hero, score); // Pass the hero and score to checkQuestEnd
    }

    checkQuestEnd(hero, score) {
        const questData = JSON.parse(localStorage.getItem(`questData-${this.id}`));
        this.currentHero = hero;
        if (questData) {
            const { endTime, heroGUID } = questData;
            this.endTime = endTime;
            const currentTime = new Date().getTime();
    
            if (currentTime >= endTime) {
                this.setAvailability('reward');
                hero.setAvailability(true);
                this.currentScore = score;
                console.log(`The quest in ${this.name} who the hero ${hero.name} took has ended with a score of ${score}.`);

            } else {
                // If the quest is not yet finished, set a timeout to check again at the estimated end time
                this.setAvailability('quest');
                setTimeout(() => {
                    this.checkQuestEnd(hero, score);
                }, endTime - currentTime);
            }
        }
    }

    // Formula for reward quantity
    getQuantity(rarity, score){
        let randomVal = getRandomNumber(0, 5 - score);
        return Math.round(rarityToNumber(rarity) - randomVal)
    }


    receiveCards() {
        const cards = [];
        this.rewards.forEach(reward => {
            const quantity = this.getQuantity(reward.rarity, this.currentScore);
            const card = user.receiveResourceCard(reward, quantity);
            cards.push(card);
        });
        return cards;
    }

    giveRewards(htmlElement){
        localStorage.removeItem(`questData-${this.id}`);
        
        if (this.currentScore < 0){
            let html = `<div>
            <h3>Quest Failed</h3>
            </div>`;
            htmlElement.innerHTML = html;
            return;
        }

        const cards = this.receiveCards(this.currentScore);
        const prevLevel = this.currentHero.level;
        const prevExp = this.currentHero.getEXP();
        const exp = this.currentHero.receiveEXPAll(this.exp);
        const level = this.currentHero.level;
        saveToLocalStorage(this.currentHero);

        const maxExp = this.currentHero.getMaxEXP();

        // Create a dynamic progress bar
        let html = `
        <div class="rewards">
            <h3>Quest Victory</h3>
            <p>The quest in ${this.name} who the hero ${this.currentHero.name} took has ended with a score of ${Math.round(this.currentScore)}.</p>
            <div class="reward-cards d-flex flex-wrap">
                ${cards.map(card => card.generateHTML()).join('')}
            </div>
            <div class="reward-exp">
            <h4>${this.currentHero.name} Level = <span id="hero-level">${prevLevel < level ? ` ${prevLevel} -> ` : ''}${level}</span></h4>
                <div>
                    <div class="row">
                    <p class="col-1">EXP Bar</p>
                    <p class="col-10 text-center">${prevExp} + ${this.exp} = ${exp} / ${this.currentHero.getMaxEXP()}</p>
                    </div>
                    <div class="progress">
                        <div id="prev-exp-bar" class="progress-bar progress-bar-striped bg-success" role="progressbar" style="width: ${calculateWidth(prevExp, maxExp)}%" aria-valuenow="${prevExp}" aria-valuemin="0" aria-valuemax="${maxExp}"></div>
                        <div id="new-exp-bar" class="progress-bar progress-bar-striped bg-warning" role="progressbar" style="width: 0%" aria-valuenow="${prevExp}" aria-valuemin="${prevExp}" aria-valuemax="${maxExp}"></div>
                    </div>
                </div>
            </div>
        </div>`;

        htmlElement.innerHTML = html;
        console.log(htmlElement)

        // Check if the hero has leveled up
        if (prevLevel == level) {
            // Hero did not level up, just visualize the current EXP gain
            visualizeBar(exp, prevExp, maxExp, 1000, htmlElement);
        } else {
            // Hero has leveled up at least once
            visualizeBar(exp, 0, maxExp, 1000, htmlElement);
        }

    }

    generateMiniHTML(){
        let html = `
        <div class="location-mini">
        <button id="location-mini-${this.id}">
            <p class="location-status w100 ${this.available}">${capitalizeWord(this.available)}</p>
            <h3>${this.name}</h3>
            <img src="${this.artwork}" alt="${this.name}">
        </button>
        </div>`
        
        return html;
    }

    addMiniButtonFunctionality(modal){
        let button = document.getElementById(`location-mini-${this.id}`);
        button.addEventListener('click', () => this.displayLocModal(modal));
        this.availabilityUI = button.querySelector('.location-status');
    }

    updateAvailabilityUI(availability, text){
        this.availabilityUI.innerHTML = capitalizeWord(text);
        this.availabilityUI.classList.remove('available', 'quest', 'reward');
        this.availabilityUI.classList.add(availability);
    }

    displayLocModal(modal){
        const modalBody = modal.querySelector('.modal-body');
        let modalJqueryId = "#" + $(modal).attr('id');
        if (this.available === 'reward'){
            this.giveRewards(modalBody);
            this.setAvailability('available');
            user.displayHeroesQuest();
        }
        else if (!user.chosenHero || this.available !== 'available'){
            console.log("Hero not selected or unavailable");
            return
        }
        else {
            modalBody.innerHTML = this.generateHTML();
            const fightButton = modal.querySelector(`#fight-button-${this.id}`);
            fightButton.addEventListener('click', () => {
                this.startQuest(user.chosenHero);
                this.available = 'quest';

                // get miniHTML element and change availability

                $(modalJqueryId).modal('hide');
        });
        }
        // Code to open the modal (e.g., using jQuery's modal method)
        $(modalJqueryId).modal('show');
    }

    generateHTML() {
        let html = `
        <div class="location card mb-3" data-location-id="${this.id}">
            <div class="row">
                <div class="col-4">
                    <h2 class="card-title text-center">${this.name}</h2>
                    <p class="card-text text-center">${this.description}</p>
                    <img src="${this.artwork}" class="card-img-top loc-image" alt="${this.name}">
                </div>  
                <div class="card-body col-4">
                    <h3 class="h5">Monster Stats</h3>
                    <p class="card-text"><small>${JSON.stringify(this.monsterData.stats)}</small></p>
                    <button id="location-button-${this.id}-actions" class="btn btn-primary" onclick="toggleSection('${this.id}', 'actions', 'location-button-${this.id}-')">Show Actions</button>
                    <button id="location-button-${this.id}-rewards" class="btn btn-primary d-none-button" onclick="toggleSection('${this.id}', 'rewards', 'location-button-${this.id}-')">Show Rewards</button>
                </div>
                <div class="col-4">
                    <h3>Selected Hero</h3>
                    <div class="selected-hero">
                        ${user.displayChosenHero()}
                    </div>
                    ${this.available === 'available' ? `<button id="fight-button-${this.id}" class="btn btn-primary fight-button">Fight</button>` : ''}
                </div>
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

}

class User {

    constructor(heroes, cards, crafters, slotNumber){
        this.heroes = heroes;
        this.cards = cards;
        this.crafters = crafters;
        this.chosenHero = null;

        // UI
        this.heroQuestEl = null;
        this.cardsEl = null;
        this.heroesEl = null;
        this.heroModalEl = null;
        this.crafterEl = null;
        this.crafterModalEl = null;
    }

    /**
     * Display cards in the specified HTML element.
     *
     * @param {HTMLElement} htmlElement - The HTML element to display the cards in
     * @param {Class} [cardType] - The type of cards to display
     */

    saveData(){
        this.heroes.forEach(hero => saveToLocalStorage(hero));
        this.cards.forEach(card => saveToLocalStorage(card));
        this.saveCrafters();
    }

    testSave(){
        this.cards.forEach(card => {
            const serializedObject = card.serializeTest();
            const key = localStorage.getItem(card.GUID) ? card.GUID : `guid-test${card.GUID}`;
            localStorage.setItem(key, serializedObject);
        });
    }

    displayCrafters(){
        this.crafterEl.innerHTML = '';
        this.crafters.forEach(crafter => {
            this.crafterEl.innerHTML += crafter.generateHTML();
        });

        this.crafters.forEach(crafter => crafter.assignCrafterButtonFunctionality(this.crafterModalEl));
    }

    receiveCraftedCard(card){
        this.cards.push(card);
        // saveToLocalStorage(card);
    }
   
    receiveResourceCard(cardInfo, quantity, save=true){
        let card = this.cards.find(card => card.id === cardInfo.id);
        let testCard = new Card(cardInfo, null, quantity, false)
        if (card){
            card.addQuantity(quantity);

        }
        else{
            card = new Card(cardInfo, generateGUID(), quantity, true)
            this.cards.push(card);
        }
        if (save) saveToLocalStorage(card);
        return testCard;
    }

    removeCard(card){
        card.quantity -= 1;
        if (card.quantity <= 0){
            this.cards.splice(this.cards.indexOf(card), 1);
        }
        // saveToLocalStorage(card);
    }

    saveUIElement(element, name){
        this[name] = element
    }

    displayCards(htmlElement, cardType = null){

        let tempEl = htmlElement;
        if(!htmlElement) tempEl = this.cardsEl;

        tempEl.innerHTML = this.cards
        .filter(card => cardType ? card.constructor === cardType : true)
        .map(card => {
            const cardHtml = card.generateHTML();
            const draggable = card.getAvailability() ? 'draggable-card' : '';
            return `<div class="${draggable}" draggable="${card.getAvailability()}" data-card-id="${card.GUID}">${cardHtml}</div>`;
        })
        .join('');
    
        // Add event listeners for dragstart
        tempEl.querySelectorAll('.draggable-card').forEach(cardElement => {
            cardElement.addEventListener('dragstart', (event) => {
                event.dataTransfer.setData('text/plain', event.target.dataset.cardId);
            });
        });
    }

    displayHeroes(htmlElement, heroModal){
        let tempEl = htmlElement;
        if(!htmlElement) tempEl = this.heroesEl;
        let modalEl = heroModal;
        if(!heroModal) modalEl = this.heroModalEl;

        tempEl.innerHTML = this.heroes.map(hero => hero.generateButtonHTML("preview", modalEl.id)).join('');
        this.heroes.forEach(hero => {
            const button = document.getElementById(`preview-hero-button-${hero.GUID}`);
            button.addEventListener('click', () => this.displayHeroModal(hero, modalEl))
        });
    }

    displayHeroesQuest(htmlElement){
        let tempEl = htmlElement;
        if(!htmlElement) tempEl = this.heroQuestEl;
        tempEl.innerHTML = this.heroes.map(hero => hero.generateButtonHTML("hero-quest")).join('');
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
            button.classList.remove('active');
        })
        heroButton.classList.add('active');
        this.chosenHero = hero;
    }

    startQuest(location){
        if (!this.chosenHero) {
            console.log("Please select a hero");
            return;
        }
        console.log(this.chosenHero.name + " takes a quest to " + location.name);
    }


    displayChosenHero(){
        return this.chosenHero.generateBasicHTML();
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
                        this.displayHeroModal(hero, heroModal, CardAction);
                    }
                    else if(classType == CardEquipment){
                        hero.equipEquipment(userCard);
                        this.displayHeroModal(hero, heroModal, CardEquipment);
                    }
                    this.displayHeroes();
                    saveToLocalStorage(hero);
                    
                }
            });
        });
    }

    checkCrafting(){
        this.crafters.forEach(crafter => crafter.checkCrafting());
    }

    saveCrafters(){
        this.crafters.forEach(crafter => {
            localStorage.setItem(`crafter-${crafter.id}`, crafter.serialize());
        });
    }

    sortCards(sortBy) {
        // Check if sortBy is a function for special cases such as sorting by class
        if (typeof sortBy === 'function') {
            this.cards.sort(sortBy);
        } else {
            // Sort by general properties (id, level, mana)
            this.cards.sort((a, b) => {
                if (a[sortBy] < b[sortBy]) {
                    return -1;
                }
                if (a[sortBy] > b[sortBy]) {
                    return 1;
                }
                return 0;
            });
        }
    }

    generateSortButtons(buttonContainer, cardContainer, classType = null) {

        // Sort by class if classType is not provided
        if(!classType){
            const classSortButton = document.createElement('button');
            classSortButton.classList.add('btn', 'btn-primary', 'm-1');
            classSortButton.textContent = 'Sort by Class';
            classSortButton.addEventListener('click', () => {
                this.sortCards((a, b) => a.constructor.name.localeCompare(b.constructor.name))
                this.displayCards(cardContainer, classType);
            });
            buttonContainer.appendChild(classSortButton);
        }


        // Sorty by level
        const levelSortButton = document.createElement('button');
        levelSortButton.classList.add('btn', 'btn-primary', 'm-1');
        levelSortButton.textContent = 'Sort by Level';
        levelSortButton.addEventListener('click', () => {
            this.sortCards('level');
            this.displayCards(cardContainer, classType);
        });
        buttonContainer.appendChild(levelSortButton);

        // Sort by mana
        const manaSortButton = document.createElement('button');
        manaSortButton.classList.add('btn', 'btn-primary', 'm-1');
        manaSortButton.textContent = 'Sort by Mana';
        manaSortButton.addEventListener('click', () => {
            this.sortCards('mana');
            this.displayCards(cardContainer, classType);
        });
        buttonContainer.appendChild(manaSortButton);

        // Sort by rarity
        const raritySortButton = document.createElement('button');
        raritySortButton.classList.add('btn', 'btn-primary', 'm-1');
        raritySortButton.textContent = 'Sort by Rarity';
        raritySortButton.addEventListener('click', () => {
            this.sortCards((a, b) => {
                // Assuming you have a rarityToNumber function defined somewhere that converts
                // the rarity string to a number where a higher number means a rarer card
                const rarityA = rarityToNumber(a.rarity);
                const rarityB = rarityToNumber(b.rarity);
                // For descending order, compare b with a instead of a with b
                return rarityB - rarityA;
            });
            this.displayCards(cardContainer, classType);
        });
        buttonContainer.appendChild(raritySortButton);
        
    }

}

class Crafter{

    constructor(id, data, cardType, cardsData, slotNumber){
        this.name = data.name;
        this.id = id;
        this.cardType = cardType;
        this.cardsData = cardsData;
        this.level = data.level;
        this.exp = data.exp;
        this.maxExp = this.level * this.level/2 * 100;
        this.knownCards = data.knownCards;
        this.updateMaxExp();
        this.MAX_LEVEL = 50;
        this.craftSlots = []

        for(let i = 0; i < slotNumber; i++){
            this.craftSlots.push(new CraftSlot(this, i));
        }

    }

    serialize(){
        let stringCardType;
        switch (this.cardType){
            case CardAction:
                stringCardType = 'CardAction';
                break;
            case CardEquipment:
                stringCardType = 'CardEquipment';
                break;
        }

        return JSON.stringify({
            name: this.name,
            cardType: stringCardType,
            level: this.level,
            exp: this.exp,
            knownCards: this.knownCards
        });
    }

    addCraftSlots(slots){
        this.craftSlots = slots;
        const crafter = this;
        this.craftSlots.forEach(slot => slot.assignCrafter(crafter));
    }


    calculateQuality(card, craftingCount) {
        let levelDifference = Math.max(-10, Math.min(10, this.level - card.level));
        let mastery = Math.min(10, craftingCount);
        
        // Assuming rarityToNumber is a function that converts the rarity to a numerical value.
        let rarityValue = rarityToNumber(card.rarity);
        
        // Calculate a scaling factor based on stats.
        // You can adjust the weights of each component according to your game's balance requirements.
        let scalingFactor = (levelDifference / 20 + rarityValue / 5 + mastery / 10) / 3; // Normalized to [0,1]
        
        // Generate a random number between 0 and scalingFactor. This means better stats (higher scalingFactor) 
        // have a higher chance to get closer to the maximum scaling increase.
        let randomIncrease = Math.random() * scalingFactor;
        
        // Calculate the percentage increase based on the randomIncrease, scaling from 1% to 30%.
        let scalingPercentageIncrease = 0.01 + (0.29 * randomIncrease);
        
        // Calculate the base scaling.
        let scaling = (0.4 * (levelDifference + 4) + 0.4 * rarityValue + 0.2 * mastery) * 10;
        
        // Apply the percentage increase to the scaling.
        scaling *= (1 + scalingPercentageIncrease);
        
        // Ensure the total does not exceed 100.
        return Math.max(1, Math.min(scaling, 100));
    }

    updateCardMastery(card) {
        console.log(card)
        console.log(card.id)
        if (this.knownCards.hasOwnProperty(card.id)) {
            this.knownCards[card.id]++;
        } else {
            return 0;
        }
        console.log(this);
    }

    getCraftingCount(card){
        if (this.knownCards.hasOwnProperty(card.id)) {
            return this.knownCards[card.id];
        } else {
            return 0;
        } 
    }

    getCardMastery(cardId) {
        if (this.knownCards.hasOwnProperty(cardId)) {
            return this.knownCards[cardId] - 1;
        } else {
            return 0;
        }      
    }

    levelUP(){
        if (this.level < this.MAX_LEVEL){
            this.level += 1;
            this.exp = 0;
            this.updateMaxExp();
        }
    }

    updateMaxExp(){      
        this.maxExp = this.level * this.level/2 * 100;
    }

    receiveEXP(exp){
        if (this.exp + exp >= this.maxExp){
            let remainingExp = this.maxExp - this.exp;
            this.levelUP();
            return remainingExp;
        }
        else{
            this.exp += exp;
        }
        
        return this.exp;
    }

    receiveEXPAll(exp){
        let count = 0;
        while(exp > 0){
            exp = exp - this.receiveEXP(exp);
            if (count > 100 || this.level == this.MAX_LEVEL) break;
        }
        // Return final exp
        return this.exp;
    }

    getCardExp(card, scaling){
        let exp = Math.round(card.level * Math.max(scaling/100, 0.1) * (card.level / rarityToNumber(card.rarity)) * 100)
        return exp
    }

    matchMaterialsToCard(materials) {
        materials.sort();
        // Assuming each card has a materials field that is an array of material ids
        const matchedCard = this.cardsData.find(card => {
            // Sort the card's materials array for consistent comparison
            const sortedCardMaterials = [...card.materials].sort();
            // Check if the card's materials match the materials provided exactly
            // (same elements and same length)
            return (
                sortedCardMaterials.length === materials.length &&
                sortedCardMaterials.every((material, index) => material === materials[index])
            );
        });
    
        if (matchedCard) {
            // Print the number of times the card was crafted
            return matchedCard;
        } else {
            return null; // No card found
        }
    }

    generateHTML(){
        let html = `
        <div class="col-12 row">
            <div id="crafter-${this.id}" class="crafter m-3">
                <h3>${this.name}</h3>
                <div class="text">
                    <p>Level: ${this.level}, Exp: ${this.exp}/${this.maxExp}</p>
                </div>
                <div class="slots">
                    ${this.craftSlots.map(slot => slot.generateButtonHTML()).join('')}
                </div>
            </div>
        </div>
        `;
        return html;
    }

    assignCrafterButtonFunctionality(modalBody){
        let crafterElement = document.querySelector(`#crafter-${this.id}`);
        this.craftSlots.forEach(slot => slot.assignCrafterButtonFunctionality(modalBody, crafterElement));
    }

    startCraftCard(slot, cardId){
        const card = this.cardsData.find(card => card.id === cardId);
        const craftingCount = this.getCraftingCount(card);
        let quality = this.calculateQuality(card, craftingCount);
        const serializedData = this.serializeCraft(slot.id, cardId, quality.toFixed(2), 15);
        // this.checkCrafting()

        this.checkCraftEnd(serializedData, slot)
    }

    deserializeCraft(data){
        const card = this.cardsData.find(card => card.id === data.cardId);
        let scaledData = getScaling(card, data.quality);
        let craftedCard = new this.cardType(scaledData, generateGUID(), 1, true);
        this.updateCardMastery(card);
        user.receiveCraftedCard(craftedCard);
        user.saveData();
        user.saveCrafters();
        return craftedCard;
    }

    checkCraftEnd(data, slot){
        const currentTime = new Date().getTime();
        const dataParse = JSON.parse(data);
        if (currentTime < dataParse.endTime){
            slot.getCraftingCard(data)
            slot.changeStatus('crafting');
            setTimeout(() => {
                this.checkCraftEnd(data, slot);
            }, dataParse.endTime - currentTime);
        }
        else{
            // this.deserializeCraft(dataParse);
            slot.changeStatus('rewards');
            slot.getCraftingCard(data)
        }
    }

    serializeCraft(slotId, cardId, quality, time){
        // const jsonString = JSON.stringify({
        //     slotId: slotId,
        //     cardId: cardId,
        //     quality: parseFloat(quality).toFixed(2), // Convert string to float and format to 2 decimal places
        //     endTime: new Date().getTime() + time * 500
        // });
        let qualityFlaot = parseFloat(quality)
        const jsonString = JSON.stringify({
            slotId: slotId,
            cardId: cardId,
            quality: qualityFlaot,
            endTime: new Date().getTime() + time * 500
        });

        localStorage.setItem(`craftCard-${this.id}-${slotId}`, jsonString);
        return jsonString;

    }

    checkCrafting(){
        this.craftSlots.forEach(slot => {
            let data = localStorage.getItem(`craftCard-${this.id}-${slot.id}`);
            if (!data) return;
            this.checkCraftEnd(data, slot)
        });
    }

}

class CraftSlot{
    constructor(crafter, id, data=null){
        this.id = id;
        this.materials = [];
        this.cardToCraft;
        this.crafter = crafter;
        this.status = 'available';

        this.data = data;

        this.craftSlots = {};

        // UI
        this.showModalButton;
        this.craftResultElement;
        this.craftButton;

    }

    deserialize(data){
        this.cardId = data.cardId;
        this.quality = data.quality;
        this.endTime = data.endTime;  
    }

    emptyData(){
        this.data = null;
    }


    openModal(modal){
        const modalJqueryId = "#" + $(modal).attr('id');
        if (this.status == 'rewards'){
            this.changeStatus('available');
            localStorage.removeItem(`craftCard-${this.crafter.id}-${this.id}`);
            const craftedCard = this.crafter.deserializeCraft(this.data);
            this.generateRewardHTML(modal, craftedCard);
            $(modalJqueryId).modal('show');
            user.displayCrafters();
            return;
        }

        if(this.status == 'available'){
            this.generateModal(modal);
            $(modalJqueryId).modal('show');
            return;
        } 
        else if (this.status == 'crafting') return;
        
        
    }

    changeStatus(status){
        this.status = status;
        switch (status){
            case 'available':
                this.showModalButton.innerHTML = 'Craft';
                this.cleanseButtonCSS();
                this.showModalButton.classList.add('available-button');
                break;
            case 'crafting':
                if(this.data){
                    // Set interval function that displays time left to craft
                    let secondsLeft = (this.data.endTime - Date.now()) / 1000;
                    let interval = setInterval(() => {
                        secondsLeft = (this.data.endTime - Date.now()) / 1000;
                        const minutes = Math.floor(secondsLeft / 60);
                        const seconds = Math.ceil(secondsLeft % 60);
                        this.showModalButton.innerHTML = `${minutes}m ${seconds}s`;
                    }, 1000);
                    setTimeout(() => {
                        clearInterval(interval);
                    }, (this.data.endTime - Date.now()));
                    }
                // this.showModalButton.innerHTML = 'Crafting';
                this.cleanseButtonCSS();
                this.showModalButton.classList.add('crafting-button');
                break;
            case 'rewards':
                this.showModalButton.innerHTML = 'Get Rewards';
                this.cleanseButtonCSS();
                this.showModalButton.classList.add('rewards-button');
                break;
        }
    }

    cleanseButtonCSS(){
        this.showModalButton.classList.remove('available-button');
        this.showModalButton.classList.remove('crafting-button');
        this.showModalButton.classList.remove('rewards-button'); 
    }

    generateRewardHTML(modal, card){
        
        const prevLevel = this.crafter.level;
        const prevExp = this.crafter.exp;
        const exp = this.crafter.receiveEXPAll(this.crafter.getCardExp(card, this.data.quality))
        const level = this.crafter.level;

        const maxExp = this.crafter.maxExp;

        const modalBody = modal.querySelector('.modal-body');

        let html = `
        <div class="rewards">
            <h3>${card.name}</h3>
            <p>Crafted the following card with a score of ${this.data.quality} </p>
            <div class="rewards-card">
                ${card.generateHTML()}
            </div>
            <div class="reward-exp">
            <h4>Level = <span id="hero-level">${prevLevel < level ? ` ${prevLevel} -> ` : ''}${level}</span></h4>
                <div>
                    <div class="row">
                    <p class="col-1">EXP Bar</p>
                    <p class="col-10 text-center">${prevExp} + ${this.crafter.exp} = ${exp} / ${maxExp}</p>
                    </div>
                    <div class="progress">
                        <div id="prev-exp-bar" class="progress-bar progress-bar-striped bg-success" role="progressbar" style="width: ${calculateWidth(prevExp, maxExp)}%" aria-valuenow="${prevExp}" aria-valuemin="0" aria-valuemax="${maxExp}"></div>
                        <div id="new-exp-bar" class="progress-bar progress-bar-striped bg-warning" role="progressbar" style="width: 0%" aria-valuenow="${prevExp}" aria-valuemin="${prevExp}" aria-valuemax="${maxExp}"></div>
                    </div>
                </div>
            </div>
        </div>
        `;

        modalBody.innerHTML = html;
        this.emptyData();

        user.saveData();

        // Check if the hero has leveled up
        if (prevLevel == level) {
            // Hero did not level up, just visualize the current EXP gain
            visualizeBar(exp, prevExp, maxExp, 1000, modalBody);
        } else {
            // Hero has leveled up at least once
            visualizeBar(exp, 0, maxExp, 1000, modalBody);
        }

    }


    returnUserMaterials(){
        this.materials.forEach(material => {
            user.receiveResourceCard(material, 1);
        });
        this.materials = []
    }

    getCraftingCard(data){
        this.data = JSON.parse(data);
    }

    generateButtonHTML(){
        return `<button id="crafter${this.crafter.id}-slot${this.id}" class="btn btn-primary available-button crafter-slot crafter-slot-${this.id} m-2" data-slotnumber="${this.id}">Craft</button>`
    }

    generateModal(modal){
        let html = `
        <div class="">
            <h3>${this.crafter.name}: Crafting Slot ${this.id}</h3>
            <div class="text">
                <p>Level: ${this.crafter.level}, Exp: ${this.crafter.exp}/${this.crafter.maxExp}</p>
            </div>
            <div class="crafting row mt-3">
                <div class="crafting-slots d-flex flex-wrap justify-content-center col-8">
                    <div class="text-center">
                        <h4>Slot 1</h4>
                        <div id="crafting-slot1" class="slot crafting-card crafting-slot unused">
                            <div class="card-used"></div>
                        </div>
                    </div>
                    <div class="text-center">
                        <h4>Slot 2</h4>
                        <div id="crafting-slot2" class="slot crafting-card crafting-slot unused">
                            <div class="card-used"></div>
                        </div>
                    </div>
                    <div class="text-center">
                        <h4>Slot 3</h4>
                        <div id="crafting-slot3" class="slot crafting-card crafting-slot unused">
                            <div class="card-used"></div>
                        </div>
                    </div>
                    
                </div>
                <div class="col-1 d-flex align-items-center">
                    <button id="craft-card-button" class="btn btn-primary">Craft</button>
                </div>
                <div class="col-3 d-flex">
                    <div class="text-center">
                        <h4>Result</h4>
                        <div id="result" class="crafting-card unused"> </div>
                    </div>
                    
                </div>
                <div>
                    <h3>User Cards</h3>
                    <div id="user-cards" class="user-cards d-flex flex-wrap"></div>
                </div>
                
            </div>
        </div>
        `;

        
        let modalBody = modal.querySelector('.modal-body');
        modalBody.innerHTML = html;

        let userBody = modalBody.querySelector('#user-cards');
        user.displayCards(userBody, Card);


        this.allowCraftCardDrop(modalBody, modal);

        this.craftResultElement = modal.querySelector('#result');
        this.craftButton = modal.querySelector('#craft-card-button');

        this.craftButton.addEventListener('click', () => {
            this.craftCurrentCard(modal);
        });

        // Define a named function to handle the modal close event
        const handleModalClose = () => {
            this.onCraftingClose();
            $(modal).off('hidden.bs.modal', handleModalClose); // Detach the event listener
        };

        // Attach the event listener using the named function
        $(modal).on('hidden.bs.modal', handleModalClose);

        // console.log(modalBody.innerHTML)

    }

    onCraftingClose() {
        this.returnUserMaterials();
    }

    addMaterial(material){
        this.materials.push(material);
        this.checkCraftRecipe();
        this.updateCraftingUI();
    }

    removeMaterial(material){
        this.materials.splice(this.materials.indexOf(material), 1);
        this.checkCraftRecipe();
        this.updateCraftingUI();
    }

    updateCraftingUI(){
        if(this.cardToCraft){
            const card = new this.crafter.cardType(this.cardToCraft, null, false)
            this.craftResultElement.innerHTML = card.generateHTML();
        }
        else{
            this.craftResultElement.innerHTML = 'Nothing to craft';
        }
    }

    checkCraftRecipe(){
        const matIds = this.materials.map(material => material.id);
        let card = this.crafter.matchMaterialsToCard(matIds);
        // console.log(this.materials)
        this.cardToCraft = card;
    }

    assignCrafterButtonFunctionality(modal, crafterElement){
        this.showModalButton = crafterElement.querySelector(`.crafter-slot-${this.id}`)
        // this.showModalButton.addEventListener('click', () => this.generateModal(modalBody));
        this.showModalButton.addEventListener('click', () => this.openModal(modal));
    }

    allowCraftCardDrop(htmlElement, heroModal){
        // Add drop event listeners for hero cards
        const userCardsElement = heroModal.querySelector('#user-cards');
        htmlElement.querySelectorAll('.crafting-slot').forEach(heroCardElement => {
            this.craftSlots[heroCardElement.id] = null;
            heroCardElement.addEventListener('dragover', (event) => {
                event.preventDefault(); // Necessary to allow dropping
            });
    
            heroCardElement.addEventListener('drop', (event) => {
                event.preventDefault();
                const userCardId = event.dataTransfer.getData('text/plain');
                const userCard = user.cards.find(card => card.GUID === userCardId);
                const slotClasses = heroCardElement.classList;
                let craftingSlot = slotClasses.contains('crafting-slot');
                                
                if (userCard && craftingSlot) {
                    this.addCardToSlot(heroCardElement.id, userCard);
                    let cardElement = heroCardElement.querySelector('.card-used');
                    cardElement.innerHTML = userCard.generateHTML();
                    let cardSlot = this;
                    cardElement.addEventListener('click', function clickHandler() {
                        cardElement.innerHTML = '';
                        slotClasses.add('unused');
                        cardSlot.removeCardFromSlot(heroCardElement.id);
                        user.displayCards(userCardsElement, Card);
                        cardElement.removeEventListener('click', clickHandler);
                    });
                    slotClasses.remove('unused');
                    user.displayCards(userCardsElement, Card);
                }
            });
        });
    }

    addCardToSlot(slot, card){
        this.removeCardFromSlot(slot);
        this.addMaterial(card);
        user.removeCard(card);
        this.craftSlots[slot] = card;
    }

    removeCardFromSlot(slot, save = true){
        let oldCard = this.craftSlots[slot];
        if(!oldCard) return;

        this.removeMaterial(oldCard);
        if (save)user.receiveResourceCard(oldCard, 1, false);
        this.craftSlots[slot] = null;
    }

    craftCurrentCard(modal){
        let card = this.cardToCraft;
        if(!card) return;
        user.saveData();
        this.materials = [];
        this.crafter.startCraftCard(this, card.id);
        this.changeStatus('crafting');
        this.closeModal(modal);
    }

    closeModal(modal){
        let modalJqueryId = "#" + $(modal).attr('id');
        $(modalJqueryId).modal('hide');
    }

}