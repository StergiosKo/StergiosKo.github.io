class Entity {
    constructor(name, attributes, maxStats, statusEffects) {
        this.name = name || "Uknown Entity";
        this.attributes = attributes || { "STR": 1, "DEX": 1, "INT": 20 };
        this.maxStats = maxStats || { "HP": 10, "SPEED": 0.5, "MANA": 1};
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

        action.doAction(this, opponent);
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
            const actionHtml = action.generateHTML();
            div.innerHTML += actionHtml; // Append the action's HTML to the div
        });
    }

    generateActionHTML(){
        let html = '';
        this.cardsActions.forEach(action => {
            html += action.generateHTML();
        })
        return html
    }
    
}

class Hero extends Entity {
    constructor(name, guid, cardsActions, equipmentCards, level, exp) {
        super(
            name,
            { "STR": 5, "DEX": 5, "INT": 5 }, 
            { "HP": 10, "SPEED": 0.5, "MANA": 1}
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
            currentDiv.classList.add('equipment-card', 'col-6', 'col-md-3');
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
                <h2 id="model-hero-name">${this.name}</h2>
                    <span><button class="btn hero-name-edit" id="hero-name-edit"><i class="bi bi-pencil"></i></button></span>
                    <span><button class="btn hero-name-save d-none" id="hero-name-save"><i class="bi bi-check-lg"></i></button></span>  
                <div class="row ms-2">
                    <p class="attributes">Attributes: STR: ${this.attributes.STR}, DEX: ${this.attributes.DEX}, INT: ${this.attributes.INT}</p>
                    <p class="max-stats">Max Stats: HP: ${this.maxStats.HP}, SPEED: ${this.maxStats.SPEED}, MANA: ${this.maxStats.MANA}</p>
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
                    <div id="cards" class="hero-cards row mt-1"></div>
                </div>
            </div>
        `;
    }

    generateHTML(modal) {

        const self = this;

        // Get modal body element
        const modalBody = modal.querySelector('.modal-body');
        let html = `
            <div class="hero-container d-flex flex-column">
                <div id="hero-info" class="hero-info pill-tab active d-flex justify-content-center align-items-center">
                    ${this.generateArtHTML()}
                </div>
                <div id="hero-actions" class="hero-actions pill-tab d-flex flex-column align-items-center">

                    <div class="row ms-2">
                        <p class="attributes">Attributes: STR: ${this.attributes.STR}, DEX: ${this.attributes.DEX}, INT: ${this.attributes.INT}</p>
                        <p class="max-stats">Max Stats: HP: ${this.maxStats.HP}, SPEED: ${this.maxStats.SPEED}, MANA: ${this.maxStats.MANA}</p>
                    </div>

                    <div class="hero-cards">
                        
                        <div id="hero-actions-swiper" class="swiper-container cards-swiper">
                            <div class="swiper-wrapper">`;
                            this.cardsActions.forEach(card => {
                                html += `<div class="swiper-slide d-flex justify-content-center">`+ card.generateHTML() + `</div>`;
                            });
                            html += `</div>
                            <div class="swiper-pagination pagination-actions"></div>
                        </div>  

                    `
                        
                    html += `</div>
                    <div class="user-cards"></div>
                </div>
                <div id="hero-equipment" class="hero-equipment pill-tab">

                    <div class="row ms-2">
                        <p class="attributes">Attributes: STR: ${this.attributes.STR}, DEX: ${this.attributes.DEX}, INT: ${this.attributes.INT}</p>
                        <p class="max-stats">Max Stats: HP: ${this.maxStats.HP}, SPEED: ${this.maxStats.SPEED}, MANA: ${this.maxStats.MANA}</p>
                    </div>

                    <div class="hero-cards">
        
                        <div id="hero-equipment-swiper" class="swiper-container cards-swiper">
                            <div class="swiper-wrapper">`;
                            // Loop equipment map
                            Object.keys(self.cardsEquipment).forEach( function (key) {
                                html += `<div class="swiper-slide d-flex justify-content-center">`+ self.cardsEquipment[key].generateHTML() + `</div>`
                            });
                            html += `</div>
                            <div class="swiper-pagination pagination-equipment"></div>
                        </div>  
                    </div>
                    <div class="user-cards"></div>
                </div>
            </div>

            <div class="pill-container-crafting">
                <div class="pill-switch mb-2">
                    <div class="pill active" data-tab="hero-info">Info</div>
                    <div class="pill" data-tab="hero-actions">Actions</div>
                    <div class="pill" data-tab="hero-equipment">Equipment</div>
                </div>
            </div>
        `;

        modalBody.innerHTML = html;

        // Add swiper functionality
        var heroActionSwiper = new Swiper('#hero-actions-swiper', {
            effect: "cards",
            grabCursor: true,
            pagination: {
                el: ".pagination-actions",
                type: "bullets",
                clickable: true,
            },
        });

        // Add swiper functionality
        var heroEquipmentSwiper = new Swiper('#hero-equipment-swiper', {
            effect: "cards",
            grabCursor: true,
            pagination: {
                el: ".pagination-equipment",
                type: "bullets",
                clickable: true,
            },
        });

        // Add pill switch functionality
        let pills = modalBody.querySelectorAll('.pill');
        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                togglePill(pill, modal, '.pill-tab');
                heroActionSwiper.update();
                heroEquipmentSwiper.update();
            });
        });
    }

    addButtonFunctionality(modal){
        let button = document.getElementById(`hero-button-${this.GUID}`);
        button.addEventListener('click', () => this.openModal(modal));
    }

    openModal(modal){
        const modalJqueryId = "#" + $(modal).attr('id');
        this.generateHTML(modal);

        // Code to open the modal (e.g., using jQuery's modal method)
        $(modalJqueryId).modal('show');
    }

    generateButtonHTML() {
        return `
            <div id="hero-button-${this.GUID}" class="hero-button ${this.available ? '' : 'd-none-button'}">
                ${this.generateArtHTML()}
            </div>
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
            console.log(this);
        }
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
        let basicCard = this.getBasicActionCard();
        
        for(let i=0; i < this.cardsActions.length; i++){
            if(!this.cardsActions[i]){
                this.addActionCard(new CardAction(basicCard, generateGUID(), false), i)
            }
        }
    }

    getBasicActionCard(){
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
        return basicCard
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
        this.maxStats.SPEED = 1 + this.attributes.DEX * 2;
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
        this.adjustActiontoMana();

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
        if (index !== -1 && cardEnter.mana - cardLeave.mana <= this.getAvailableMana()) {
            this.addActionCard(cardEnter, index);
        }
    }

    removeCard(index){
        if (index >= 0 && index < this.cardsActions.length) {
            let oldCard = this.cardsActions[index];
            this.cardsActions[index] = new CardAction(this.getBasicActionCard(), generateGUID(), false);
            if (oldCard) oldCard.setAvailability(true);
            return oldCard
        }
    }

    adjustActiontoMana() {
        if (this.getAvailableMana() < 0) {
            // Loop through the action cards in reverse order
            for (let i = this.cardsActions.length - 1; i >= 0; i--) {
                this.removeCard(i);
                // Check if removing the card at index i brings available mana to a non-negative value
                if (this.getAvailableMana() >= 0) break;
            }
        }
    }

    editName(nameElement, buttonEdit, buttonSave){
        nameElement.contentEditable = true;

        // UI
        nameElement.focus();
        buttonEdit.classList.add('d-none');
        buttonSave.classList.remove('d-none');     
        
    }

    saveName(nameElement, buttonEdit, buttonSave){
        this.name = nameElement.innerText;
        user.saveData();
        nameElement.contentEditable = false;

        // UI
        nameElement.blur();
        buttonEdit.classList.remove('d-none');
        buttonSave.classList.add('d-none');
    }

    generateArtHTML(){
        const html = `
        <article id="heroGUID-${this.GUID}" class="o-card hero-card ${this.available ? '' : 'card-unavailable'}" data-heroGUID="${this.GUID}" data-availability="${this.available?'1':'0'}">
            <figure class="c-bg_img o-flx_c" style="background-image: url(https://cdnb.artstation.com/p/assets/images/images/008/410/265/large/victoria-collins-black-lotus.jpg?1512581450);">
                ${generateAttributesHTML(this.attributes)}
                <figcaption class="c-bg_img_desc o-flx_el_b u-border_b">
                    <b>${this.name} Lv:<span class="hero-level">${this.level}</span></b>
                    <section class="o-card_b">
                        <div class="progress w-100">
                            <div id="exp-bar" class="progress-bar progress-bar-striped bg-success" role="progressbar" style="width: ${calculateWidth(this.exp, this.maxExp)}%" aria-valuenow="${this.exp}" aria-valuemin="0" aria-valuemax="${this.maxExp}"></div>
                            <div id="new-exp-bar" class="progress-bar progress-bar-striped bg-warning" role="progressbar" style="width: 0%" aria-valuenow="${this.exp}" aria-valuemin="${this.exp}" aria-valuemax="${this.maxExp}"></div>
                            <span class="bar-text">EXP: <span class="current-exp-text">${this.exp}</span> / ${this.maxExp}</span>
                        </div>
                    </section>
                </figcaption>
            </figure>
        </article>`;
        return html;
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
        this.gold = 1;
        this.quality = 100;
    }

    /**
     * Template string with placeholders replaced by object properties
     * Process description to include color-coded attributes
     *
     * @param {any} short - if parameter, adds short class to card
     * @return {type} returns html
     */
    generateHTML(drag = false) {
        const html = `
        <article id="cardId-${this.id}" ${drag && this.available?'draggable="true"':''} class="o-card ${this.available ? '' : 'card-unavailable'}" data-cardid="${this.GUID}">
            <figure draggable='false' class="c-bg_img o-flx_c" style="background-image: url(${this.artwork});">
                <figcaption class="c-bg_img_desc o-flx_el_b u-border_b prevent-select">
                    <b>${this.name}</b>
                    <section class="o-card_b"><span>${this.description}</section>
                </figcaption>
            </figure>
            ${this.quantity !== -1 ? `<div class="card-number-box">x${this.quantity}</div>` : ''}
        </article>`;
    
        return html;
    }

    displayCardModal(modalId){
        const modal = document.getElementById(modalId);
        const modalBody = modal.querySelector('.modal-body');
        modalBody.innerHTML = this.generateCardDetailsHTML();
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

    calculateGold(level, rarity, quality){
        return Math.floor(level * rarityToNumber(rarity) * quality/10);
    }

}

class CardAction extends Card {
    constructor(data, guid, saved = true) {
        super(data, guid, 1, saved);
        this.quality = data.quality;
        this.effects = data.effects;
        this.card_type = "Action - " + data.card_type;
        this.mana = data.mana;
        this.gold = this.calculateGold(data.level, data.rarity, data.quality);

        this.updateDesc();

    }

    updateDesc(){
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
    
    generateHTML(drag = false) {
        let processedDescription = this.description
        .replace(/STR/g, '<span class="attr-str">STR</span>')
        .replace(/DEX/g, '<span class="attr-dex">DEX</span>')
        .replace(/INT/g, '<span class="attr-int">INT</span>');
        const html = `
            <article class="o-card ${this.available ? '' : 'card-unavailable'}" data-cardid="${this.GUID}" ${drag && this.available?'draggable="true"':''}>
                <figure draggable='false' class="c-bg_img o-flx_c" style="background-image: url(${this.artwork});">
                <div class="ribbon"><span>${qualityToRank(this.quality)}</span></div>
                ${this.available ? '' : '<i class="bi bi-file-lock2 card-equipped"></i>'}
                    <header class="c-top_icons"><span class="c-icon">${this.mana}</span></header>
                    <figcaption class="c-bg_img_desc o-flx_el_b u-border_b prevent-select">
                        <b>${this.name} Lv:${this.level}</b>
                        <section class="o-card_b"><p>${processedDescription}</p>
                    </figcaption>
                </figure>
            </article>`;
        
        return html;
    }

    doAction(user, opponent){
        // Apply the effect based on its type
        this.effects.forEach(effect => {
            // Determine the target of the effect
            const target = effect.target === 0 ? user : opponent;

            const attributeValue = user.attributes[Object.keys(effect.scaling)[0]]; // e.g., "STR": 1.5
            let magnitude = attributeValue * Object.values(effect.scaling)[0];; // e.g., {"STR": 1.5} * effect magnitude

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
        this.gold = this.calculateGold(data.level, data.rarity, data.quality);

        this.updateDesc();
    }

    updateDesc(){
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
    generateHTML(drag) {
        let processedDescription = this.description
        .replace(/STR/g, '<span class="attr-str">STR</span>')
        .replace(/DEX/g, '<span class="attr-dex">DEX</span>')
        .replace(/INT/g, '<span class="attr-int">INT</span>');

        const html = `
            <article class="o-card ${this.available ? '' : 'card-unavailable'}" data-cardid="${this.GUID}" ${drag && this.available?'draggable="true"':''}>
                <figure draggable='false' class="c-bg_img o-flx_c" style="background-image: url(${this.artwork});">
                    <div class="ribbon"><span>${qualityToRank(this.quality)}</span></div>
                    ${this.available ? '' : '<i class="bi bi-file-lock2 card-equipped"></i>'}
                    <figcaption class="c-bg_img_desc o-flx_el_b u-border_b prevent-select">
                        <b>${this.name} Lv:${this.level}</b>
                        <section class="o-card_b"><span>${processedDescription}</section>
                    </figcaption>
                </figure>
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
        user.startQuest(hero);
        let score = this.startBattle(hero); // Assume this method starts the battle and returns a score
        
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
                this.currentScore = score;

            } else {
                // If the quest is not yet finished, set a timeout to check again at the estimated end time
                this.setAvailability('quest');
                this.currentHero.setAvailability(false);
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

    
    async giveRewards(htmlElement){
        localStorage.removeItem(`questData-${this.id}`);
        
        if (this.currentScore < 0){
            let html = `<div>
            <h3>Quest Failed</h3>
            </div>`;
            htmlElement.innerHTML = html;
            return;
        }

        // Get values to display
        const cards = this.receiveCards(this.currentScore);
        const prevLevel = this.currentHero.level;
        const prevExp = this.currentHero.getEXP();

        let maxExp = this.currentHero.getMaxEXP();

        let html = `
        <div class="rewards d-flex flex-column align-items-center">
            <div class="score d-flex flex-column">
                <h3>Quest Victory</h3><span> Score: ${Math.round(this.currentScore)}</span>
            </div>
            <div class="reward-exp exp pill-tab exp active">
                ${this.currentHero.generateArtHTML()}
            </div>
            <div class="cards d-flex flex-wrap items pill-tab">
                <div id="cards-swiper" class="swiper-container cards-swiper">
                    <div class="swiper-wrapper">`;
                    cards.forEach(card => {
                        html += `<div class="swiper-slide d-flex justify-content-center">`+ card.generateHTML() + `</div>`;
                    });
                    html += `</div>
                    <div class="swiper-pagination pagination-rewards"></div>
                </div>  
            </div>

            <div class="pill-container align-self-center d-flex flex-column align-items-center">
                <div class="pill-switch mb-2">
                    <div class="pill active" data-tab="exp">Exp</div>
                    <div class="pill" data-tab="items">Items</div>
                </div>
            </div>

        </div>`;

        htmlElement.innerHTML = html;

        const exp = this.currentHero.receiveEXPAll(this.exp);
        const level = this.currentHero.level;

        this.currentHero.setAvailability(true);
        saveToLocalStorage(this.currentHero);

        if (prevLevel != level) maxExp = this.currentHero.maxExp;

        var cardsSwipper = new Swiper('#cards-swiper', {
            effect: "cards",
            grabCursor: true,
            pagination: {
                el: ".pagination-rewards",
                type: "bullets",
                clickable: true,
            },
        });

        // Add pill switch functionality
        let pills = htmlElement.querySelectorAll('.pill');
        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                togglePill(pill, htmlElement, '.pill-tab');
                cardsSwipper.update(); 
            });
        });

        updateEXPUI(htmlElement, prevLevel, level, prevExp, exp, maxExp);

    }


    generateMiniHTML(){
        let html = `
        <button id="location-mini-${this.id}" class="location-mini">
            <p class="location-status w100 ${this.available}">${capitalizeWord(this.available)}</p>
            ${this.generateCardArt()}
        </button>`
        
        return html;
    }

    addMiniButtonFunctionality(modal){
        let button = document.getElementById(`location-mini-${this.id}`);
        button.addEventListener('click', async() => await this.displayLocModal(modal));
        this.availabilityUI = button.querySelector('.location-status');
    }

    updateAvailabilityUI(availability, text){
        this.availabilityUI.innerHTML = capitalizeWord(text);
        this.availabilityUI.classList.remove('available', 'quest', 'reward');
        this.availabilityUI.classList.add(availability);
    }

    async displayLocModal(modal){
        const modalBody = modal.querySelector('.modal-body');
        let modalJqueryId = "#" + $(modal).attr('id');
        if (this.available === 'reward'){
            await this.giveRewards(modalBody);
            this.setAvailability('available');
        }
        else if (this.available !== 'available'){
            console.log("Hero not selected or unavailable");
            return
        }
        else {
            modalBody.innerHTML = this.generateHTML();
            const fightButton = modal.querySelector(`#fight-button-${this.id}`);

            // Add swiper functionality
            var actionSwiper = new Swiper('#actions-swiper', {
                effect: "cards",
                grabCursor: true,
                pagination: {
                    el: ".pagination-actions",
                    type: "bullets",
                    clickable: true,
                },
            });

            var rewardsSwiper = new Swiper('#rewards-swiper', {
                effect: "cards",
                grabCursor: true,
                pagination: {
                    el: ".pagination-rewards",
                    type: "bullets",
                    clickable: true,
                },
            });

            var fightSwiper = new Swiper('#fight-swiper', {
                effect: "cards",
                grabCursor: true,
                pagination: {
                    el: ".pagination-fight",
                    type: "bullets",
                    clickable: true,
                },
            });

            fightButton.addEventListener('click', () => {

                // Get current hero from fighter swiper
                const heroCard = fightSwiper.slides[fightSwiper.activeIndex].querySelector('.o-card');
                
                let currentHeroGUID = heroCard.dataset.heroguid;
                user.chosenHero = user.heroes.find(hero => hero.GUID === currentHeroGUID);

                // If hero is not available return
                if (!user.chosenHero.isAvailable()) return;

                this.startQuest(user.chosenHero);
                this.available = 'quest';

                // get miniHTML element and change availability

                $(modalJqueryId).modal('hide');
            });

            // Add pill switch functionality
            let pills = modalBody.querySelectorAll('.pill');
            pills.forEach(pill => {
                pill.addEventListener('click', () => {
                    togglePill(pill, modalBody, '.pill-tab') 
                    actionSwiper.update();
                    rewardsSwiper.update();
                    fightSwiper.update();
                });
            });

        }
        // Code to open the modal (e.g., using jQuery's modal method)
        $(modalJqueryId).modal('show');
    }

    generateHTML() {
        let html = `
        <div class="location d-flex flex-column justify-content-center mb-3" data-location-id="${this.id}">
            <div class="row info pill-tab active">
                <div class="col-12 d-flex flex-column align-items-center">
                    ${this.generateCardArt()}
                </div>
            </div>
            <div class="d-flex flex-row">
            
                <div id="action-${this.id}" class="actions pill-tab">
                    <div id="actions-swiper" class="swiper-container cards-swiper">
                        <div class="swiper-wrapper">`;
                        this.currentMonster.getActions().forEach(card => {
                            html += `<div class="swiper-slide d-flex justify-content-center">`+ card.generateHTML() + `</div>`;
                        });
                        html += `</div>
                        <div class="swiper-pagination pagination-actions"></div>
                    </div>
                </div>
                <div id="rewards-${this.id}" class="rewards pill-tab">

                    <div id="rewards-swiper" class="swiper-container cards-swiper">
                        <div class="swiper-wrapper">`;
                        this.rewards.forEach(card => {
                            html += `<div class="swiper-slide d-flex justify-content-center">`+ card.generateHTML() + `</div>`;
                        });
                        html += `</div>
                        <div class="swiper-pagination pagination-rewards"></div>
                    </div>           
                </div>

            </div>
            <div class="fight pill-tab d-flex flex-column align-items-center">
                <h3>Choose hero</h3>
                <div class="available-heroes">
                    <div id="fight-swiper" class="swiper-container cards-swiper">
                        <div class="swiper-wrapper">`;
                        // Sort heroes by availability
                        user.sortHeroesAvailability();
                        user.heroes.forEach(hero => {
                            html += `<div class="swiper-slide d-flex justify-content-center">`+ hero.generateArtHTML() + `</div>`;
                        });
                        html += `</div>
                        </div>
                        <div class="swiper-pagination pagination-fight"></div>
                    </div>  
                    ${this.available === 'available' ? `<button id="fight-button-${this.id}" class="btn btn-danger fight-button">Fight</button>` : ''}
                </div>
            </div>
            <div class="pill-container align-self-center d-flex flex-column align-items-center">
                <div class="pill-switch mb-2">
                    <div class="pill active" data-tab="info">Info</div>
                    <div class="pill" data-tab="actions">Actions</div>
                    <div class="pill" data-tab="rewards">Rewards</div>
                    <div class="pill" data-tab="fight">Fight</div>
                </div>
            </div>
        </div>`;
    
        return html;
    }

    generateCardArt(){
        let html = `        
            <article class="o-card">
                <figure draggable='false' class="c-bg_img o-flx_c" style="background-image: url(${this.artwork});">
                    ${generateStatsHTML(this.monsterData.stats)}
                    ${generateAttributesHTML(this.monsterData.attributes)}
                    <figcaption class="c-bg_img_desc o-flx_el_b u-border_b">
                        <b>${this.name}</b>
                        <section class="o-card_b"><span>${this.description}</section>
                    </figcaption>
                </figure>
            </article>`;
        return html;
    }

}

class User {

    constructor(heroes, cards, crafters, gold){
        this.heroes = heroes;
        this.cards = cards;
        this.crafters = crafters;
        this.chosenHero = null;
        this.gold = gold
        this.hireHeroCost = 10;

        // UI
        this.heroQuestEl = null;
        this.cardsEl = null;
        this.heroesEl = null;
        this.heroModalEl = null;
        this.crafterEl = null;
        this.crafterModalEl = null;
        this.goldEl= null;
        this.heroCostEl = null;

        // User cards variables
        this.currentHoveredSellCard = null;
        this.currentSort = null;
        this.currentSortButton = null;
        
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

    addGold(amount){
        if (this.gold + amount < 0) return;
        this.gold += amount;
        localStorage.setItem("gold", this.gold);

        this.goldEl.innerHTML = this.gold;
    }

    displayCrafters(){
        this.crafters.sort((a, b) => a.id - b.id);
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

    getCard(cardId){
        return this.cards.find(card => card.id === cardId);
    }

    removeCard(card, save=false){
        card.quantity -= 1;
        if (card.quantity <= 0){
            this.cards.splice(this.cards.indexOf(card), 1);
            if (save){
                deleteFromLocalStorage("guid"+card.GUID);
            }
        }
        else{
            if (save) saveToLocalStorage(card);
        }
    }

    saveUIElement(element, name){
        this[name] = element
    }

    displayCards(htmlElement, cardType = null, drag = false) {

        let tempEl = htmlElement;
        if(!htmlElement) tempEl = this.cardsEl;

        tempEl.innerHTML = this.cards
        .filter(card => cardType ? card.constructor === cardType : true)
        .map(card => {
            return card.generateHTML(drag);
        })
        .join('');
    
        if(!drag) return;
        // Add event listeners for dragstart
        tempEl.querySelectorAll('.o-card').forEach(cardElement => {
            // Check if card is available (class contains 'card-unaivalable')
            if (cardElement.classList.contains('card-unaivalable')) return;
            
            cardElement.addEventListener('dragstart', (event) => {
                event.dataTransfer.setData('text/plain', event.target.dataset.cardid);
            });
        });
    }

    displayCardsMain(htmlElement) {
        this.displayCards(htmlElement);
    
        this.cardsEl.querySelectorAll('.o-card').forEach(cardElement => {
            let cardId = cardElement.dataset.cardid;
            let card = this.cards.find(c => c.GUID === cardId);
            if(!card) return;
            if (!card.getAvailability()) return;
            this.sellCard(card, cardElement); // Pass cardElement as the second argument
        });
    }

    sellCard(card, cardElement) {
        // Function to remove the temporary element
        const removeTempElement = () => {
            if (this.currentHoveredSellCard && this.currentHoveredSellCard.parentNode) {
                this.currentHoveredSellCard.parentNode.removeChild(this.currentHoveredSellCard);
                this.currentHoveredSellCard = null;
            }
        };

        // Append the temporary element to the card element on mouse enter
        const onMouseEnter = () => {
            // Remove the currentHoveredSellCard if it exists before creating a new one
            removeTempElement();

            // Create the temporary element
            this.currentHoveredSellCard = document.createElement('div');
            this.currentHoveredSellCard.className = 'card-sell-container';

            // Add a paragraph
            const infoParagraph = document.createElement('span');
            infoParagraph.textContent = `Sell for ${card.gold}?`;
            this.currentHoveredSellCard.appendChild(infoParagraph);

            // Add the confirm button
            const confirmButton = document.createElement('button');
            confirmButton.classList.add('btn', 'btn-primary', 'bootstrap-icon');
            confirmButton.textContent = '\uF26E';
            confirmButton.addEventListener('click', () => {
                // Handle confirm action
                console.log("Selling card")
                user.addGold(card.gold);
                user.removeCard(card, true);
                user.displayCardsMain();
                user.saveData();
                // ...
                removeTempElement(); // Call this to remove the element after confirming
            });
            this.currentHoveredSellCard.appendChild(confirmButton);

            // Append the temporary element to the card element
            cardElement.appendChild(this.currentHoveredSellCard);
        };

        // Event listener for mouse leave to remove the temporary element
        const onMouseLeave = () => {
            removeTempElement();
        };

        // Set up the event listeners for the card element
        cardElement.addEventListener('mouseenter', onMouseEnter);
        cardElement.addEventListener('mouseleave', onMouseLeave);
    }

    

    displayHeroes(htmlElement, heroModal){
        this.heroes.sort((a, b) => b.level - a.level);
        let tempEl = htmlElement;
        if(!htmlElement) tempEl = this.heroesEl;
        let modalEl = heroModal;
        if(!heroModal) modalEl = this.heroModalEl;

        tempEl.innerHTML = this.heroes.map(hero => hero.generateButtonHTML("preview")).join('');

        this.heroes.forEach(hero => {
            hero.addButtonFunctionality(modalEl);
        });
        this.setHeroCost();
    }

    sortHeroesAvailability(){
        this.heroes.sort((a, b) => b.isAvailable() - a.isAvailable());
    }

    selectHeroQuest(hero){
        if (!hero.isAvailable()) return
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

    startQuest(){
        if (!this.chosenHero) {
            console.log("Please select a hero");
            return;
        }
        this.chosenHero.setAvailability(false);
        this.chosenHero = null;
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

        // Add event listener to name buttons
        const heroName = modalBody.querySelector('#model-hero-name');
        const editNameButton = modalBody.querySelector('#hero-name-edit');
        const saveNameButton = modalBody.querySelector('#hero-name-save');

        editNameButton.addEventListener('click', () => hero.editName(heroName, editNameButton, saveNameButton));

        saveNameButton.addEventListener('click', () => {
            hero.saveName(heroName, editNameButton, saveNameButton)
            this.displayHeroes();
        });

        
        // this.allowHeroCardDrop(hero, cardElement, classType, modal);

        // Add event listeners to the action and equipment buttons
        actionButton.addEventListener('click', () => this.modalDisplayByCardtype(hero, modal, cardElement, actionButton, equipmentButton, userCards, CardAction));

        equipmentButton.addEventListener('click', () => this.modalDisplayByCardtype(hero, modal, cardElement, actionButton, equipmentButton, userCards, CardEquipment));
        
    }

    modalDisplayByCardtype(hero, modal, cardElement, actionButton, equipmentButton, userCards, classType = CardAction){
        if (classType === CardAction) {
            actionButton.classList.remove('d-none-button');
            equipmentButton.classList.add('d-none-button');
            this.displayCards(userCards, CardAction, true);
            hero.displayActions(cardElement);
        } else if (classType === CardEquipment) {
            actionButton.classList.add('d-none-button');
            equipmentButton.classList.remove('d-none-button');
            this.displayCards(userCards, CardEquipment, true);
            hero.displayEquipment(cardElement);
        }
        this.allowHeroCardDrop(hero, cardElement, classType, modal);
    }

    allowHeroCardDrop(hero, htmlElement, classType, heroModal){
        // Add drop event listeners for hero cards
        if(!hero.isAvailable()) return;
        htmlElement.querySelectorAll('.o-card').forEach(heroCardElement => {
            heroCardElement.addEventListener('dragover', (event) => {
                event.preventDefault(); // Necessary to allow dropping
            });
    
            heroCardElement.addEventListener('drop', (event) => {
                event.preventDefault();
                const userCardId = event.dataTransfer.getData('text/plain');
                const userCard = this.cards.find(card => card.GUID === userCardId);
                const heroCardId = heroCardElement.dataset.cardid;
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

    sortCards(sortBy, desc=false) {
        // Check if sortBy is a function for special cases such as sorting by class
        if (typeof sortBy === 'function') {
            this.cards.sort(sortBy);

            // Reverse the order if desc is true
            if (desc){
                this.cards.reverse();
            }
        } else {
            // Sort by general properties (id, level, mana)
            this.cards.sort((a, b) => {
                // Ascend sort
                if (!desc){
                    if (a[sortBy] < b[sortBy]) {
                        return -1;
                    }
                    if (a[sortBy] > b[sortBy]) {
                        return 1;
                    }
                    return 0;
                }
                // Descend sort
                else{
                    if (a[sortBy] < b[sortBy]) {
                        return 1;
                    }
                    if (a[sortBy] > b[sortBy]) {
                        return -1;
                    }
                    return 0;
                }

            });
        }
    }

    // Method to be called to call either ascending or descending sort
    sortCardsOrder(sortBy, string, button){
        // Remove last button icon
        if (this.currentSortButton){
            // Get button icon
            const icon = this.currentSortButton.querySelector('.added-icon');
            // Remove icon
            this.currentSortButton.removeChild(icon);
        }

        if (this.currentSort != string){
            this.sortCards(sortBy);
            this.currentSort = string;
            button.innerHTML += `<i class="bi bi-arrow-up added-icon"></i>`
        }
        else{
            this.sortCards(sortBy, true)
            this.currentSort = null;
            button.innerHTML += `<i class="bi bi-arrow-down added-icon"></i>`
        }
        this.currentSortButton = button;
    }

    createHTMLSortButton(text){
        const sortButton = document.createElement('button');
        sortButton.classList.add('w-100', 'mb-1');
        sortButton.textContent = text;
        return sortButton
    }

    generateSortButtons(buttonContainer, cardContainer, classType = null) {

        // Sort by class if classType is not provided
        if(!classType){
            const classSortButton = this.createHTMLSortButton('Class');
            classSortButton.addEventListener('click', () => {
                this.sortCardsOrder((a, b) => a.constructor.name.localeCompare(b.constructor.name), 'Class', classSortButton);
                this.displayCardsMain(cardContainer, classType);

            });
            buttonContainer.appendChild(classSortButton);
        }

        // Sorty by level
        const levelSortButton = this.createHTMLSortButton('Level');
        levelSortButton.addEventListener('click', () => {
            this.sortCardsOrder('level', 'Level', levelSortButton);
            this.displayCardsMain(cardContainer, classType);
        });
        buttonContainer.appendChild(levelSortButton);

        // Sort by mana
            const manaSortButton = this.createHTMLSortButton('Mana');
        manaSortButton.addEventListener('click', () => {
            this.sortCardsOrder('mana', 'Mana', manaSortButton);
            this.displayCardsMain(cardContainer, classType);
        });
        buttonContainer.appendChild(manaSortButton);

        // Sort by availability
        const availabilitySortButton = this.createHTMLSortButton('Availability');
        availabilitySortButton.addEventListener('click', () => {
            this.sortCardsOrder(((a, b) => {
                return (a.getAvailability() === b.getAvailability())? 0 : a.getAvailability()? -1 : 1;

            }), 'Availability', availabilitySortButton);
            this.displayCardsMain(cardContainer, classType);
        });
        buttonContainer.appendChild(availabilitySortButton);

        // Sort by rarity
        const raritySortButton = this.createHTMLSortButton('Rarity');
        raritySortButton.addEventListener('click', () => {
            this.sortCardsOrder(((a, b) => {
                // Assuming you have a rarityToNumber function defined somewhere that converts
                // the rarity string to a number where a higher number means a rarer card
                const rarityA = rarityToNumber(a.rarity);
                const rarityB = rarityToNumber(b.rarity);
                // For descending order, compare b with a instead of a with b
                return rarityB - rarityA;
            }), 'Rarity', raritySortButton);
            this.displayCardsMain(cardContainer, classType);
        });
        buttonContainer.appendChild(raritySortButton);

        // Sort by quality
        const qualitySortButton = this.createHTMLSortButton('Quality');
        qualitySortButton.addEventListener('click', () => {
            this.sortCardsOrder('quality', 'Quality', qualitySortButton);
            this.displayCardsMain(cardContainer, classType);
        });
        buttonContainer.appendChild(qualitySortButton);
        
    }

    hireHero(){
        if (this.gold < this.hireHeroCost) return;
        this.addGold(- this.hireHeroCost);
        const newHero = new Hero('New Hero', generateGUID(), [null, null, null, null, null], [], 1, 0);
        this.heroes.push(newHero);
        this.setHeroCost();
        this.saveData();
        this.displayHeroes();
    }

    setHeroCost(){
        this.hireHeroCost = (this.heroes.length * 5) ** 2 + 10;
        this.heroCostEl.textContent = this.hireHeroCost
    }

    haveMaterials(materialIds){
        let materialAmount = {};

        // For each material push to the materialAmount object
        materialIds.forEach(materialId => {
            if (!(materialId in materialAmount)) materialAmount[materialId] = 0;
            materialAmount[materialId] += 1;
        });

        // Create new map with id as key and quantity as value from this.cards
        const cardQuantities = Object.values(this.cards).map(card => card.quantity);
        const cardQuantityMap = Object.fromEntries(
            this.cards.map((card, index) => [card.id, cardQuantities[index]])
        );
        

        let matFound = true;

        // Loop through materialAmount to check if there are enough materials in cardQuantityMap
        Object.entries(materialAmount).forEach(([id,quantity]) => {
            // Check if id exists in cardQuantityMap
            if (!(id in cardQuantityMap)) matFound = false;
            // Check if quantity is enough
            if (cardQuantityMap[id] < quantity) matFound = false;
        })


        return matFound;

    }

}

class Crafter{

    constructor(id, data, cardType, cardsData, slotNumber, materialData){
        this.name = data.name;
        this.id = parseInt(id);
        this.cardType = cardType;
        this.cardsData = cardsData;
        this.level = data.level;
        this.exp = data.exp;
        this.maxExp = this.level * this.level/2 * 100;
        if (data.knownCards) this.knownCards = data.knownCards;
        else this.knownCards = {};
        this.updateMaxExp();
        this.MAX_LEVEL = 50;
        this.craftSlots = [];
        this.materialData = materialData;

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
        const stringId = card.id.toString();
        if (this.knownCards[stringId]) {
            this.knownCards[stringId]++;
        } else {
            this.knownCards[stringId] = 1;
        }
    }

    // Get the amount of known cards
    // If new card, return -1
    getCraftingCount(cardId){
        const stringId = cardId.toString();
        if (this.knownCards[stringId]) {
            return this.knownCards[stringId];
        } else {
            return -1;
        } 
    }

    getCardMastery(cardId) {
        const stringId = cardId.toString();
        if (this.knownCards[stringId]) {
            return this.knownCards[stringId] - 1;
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
        <div class="mt-3 crafter-el-container border rounded p-2">
            <div id="crafter-${this.id}" class="crafter>
                <div class="d-flex flex-column text container">
                    <div class="d-flex flex-row align-items-center justify-content-between">
                        <h4 class="m-0">${this.name}</h4>
                        <div class="slots">
                            ${this.craftSlots.map(slot => slot.generateButtonHTML()).join('')}
                        </div>
                    </div>
                    <div class="row pt-2 align-items-center">
                        <div class="col-3">
                            <p class="m-0">Lv: ${this.level}</p>
                        </div>

                        <div class="progress col-8 p-0">
                            <div id="exp-bar-${this.id}" class="progress-bar progress-bar-striped bg-success" role="progressbar" style="width: ${calculateWidth(this.exp, this.maxExp)}%" aria-valuenow="${this.exp}" aria-valuemin="0" aria-valuemax="${this.maxExp}"></div>
                            <span class="bar-text">EXP: <span class="current-exp-text">${this.exp}</span> / ${this.maxExp}</span>
                        </div>

                    </div>
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
        const craftingCount = this.getCraftingCount(cardId);
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

    isNewCard(cardId){
        if(this.getCraftingCount(cardId) == -1) return true;
        else return false;
    }

    getAllKnownCards(){
        const knownCards = [];
        this.cardsData.forEach(card => {
            if(!this.isNewCard(card.id)) knownCards.push(card);
        })
        return knownCards;
    }

    generateRecipesHTML(){

        const knownCardsIds = this.getAllKnownCards();

        // Create temp cards
        const cards = knownCardsIds.map(card => {
            return new this.cardType(card, null, false);
        })

        // Order the cards by level
        cards.sort((a, b) => a.level - b.level);

        let html = ``;

        // Generate HTML
        cards.forEach(card => {

            // Get card materials
            let tempMaterials = [];
            
            // Match cardData.id with card.id to get materials
            knownCardsIds.forEach(knownCard => {
                if(knownCard.id === card.id) tempMaterials = knownCard.materials;
            })
            
            // Generate material HTML
            let materialHTML = ``;
            tempMaterials.forEach(material => {
                let unknowned = false;
                let tempMaterial = user.getCard(material);
                if (!tempMaterial){
                    unknowned = true;
                    // Match material id with materials to get card data
                    let tempMaterialData = this.materialData.find(card => card.id === material);

                    tempMaterial = new Card(tempMaterialData, null, -1, false);
                }
                materialHTML += `<div class="card-material col-4 ${unknowned? 'unknowned': ''}">${tempMaterial.generateHTML()}</div>`
            })

            const isCraftable = user.haveMaterials(tempMaterials);

            let tempHTML = `
                <div class="crafting-recipe justify-content-start col-12 col-md-6 row container ${isCraftable? '': 'd-none'}" data-craftable="${isCraftable}">
                    <div class="col-6 col-md-6 row justify-content-start material-container">
                        <div class="material-cards row with-children-${tempMaterials.length}">${materialHTML}</div>
                    </div>
                    <div class="col-1 equal-button">
                        <div>
                            =
                        </div>
                        <div class="swap-buttons-container">
                            <button class="btn btn-primary swap-button"><i class="bi bi-arrow-counterclockwise"></i></button>
                        </div>
                    </div>
                    <div class="col-5 col-md-5 crafting-card-recipe">
                            <div class="">${card.generateHTML()}</div>                    
                    </div>
                </div>
            `;

            html += tempHTML;

        })

        return html;
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

        this.craftingSlots = {'1': null, '2': null, '3': null};

        // UI
        this.modal;
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


    async openModal(modal){
        const modalJqueryId = "#" + $(modal).attr('id');
        if (this.status == 'rewards'){
            this.changeStatus('available');
            localStorage.removeItem(`craftCard-${this.crafter.id}-${this.id}`);
            const craftedCard = this.crafter.deserializeCraft(this.data);
            await this.generateRewardHTML(modal, craftedCard);
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
                this.showModalButton.innerHTML = 'Ready';
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

    async generateRewardHTML(modal, card){
        
        const prevLevel = this.crafter.level;
        const prevExp = this.crafter.exp;
        const cardExp = this.crafter.getCardExp(card, this.data.quality);
        const exp = this.crafter.receiveEXPAll(cardExp)
        const level = this.crafter.level;

        const maxExp = this.crafter.maxExp;

        const modalBody = modal.querySelector('.modal-body');

        let html = `
        <div class="rewards d-flex flex-column">
        
            <div class="row pt-2 align-items-center">

                <div class="col-3">
                    <p class="m-0 hero-level">Lv: ${this.crafter.level}</p>
                </div>

                <div class="progress col-8 p-0">
                    <div id="prev-exp-bar" class="progress-bar progress-bar-striped bg-success" role="progressbar" style="width: ${calculateWidth(prevExp, maxExp)}%" aria-valuenow="${prevExp}" aria-valuemin="0" aria-valuemax="${maxExp}"></div>
                    <div id="new-exp-bar" class="progress-bar progress-bar-striped bg-warning" role="progressbar" style="width: 0%" aria-valuenow="${prevExp}" aria-valuemin="${prevExp}" aria-valuemax="${maxExp}"></div>
                    <span class="bar-text">EXP: <span class="current-exp-text">${this.crafter.exp}</span> / ${this.crafter.maxExp}</span>
                </div>

            </div>

            <div class="mt-2 mb-2">
                <p class="m-0">Crafted ${card.name} with a score of ${this.data.quality}</p>
            </div>
            <div class="rewards-card d-flex justify-content-center">
                ${card.generateHTML()}
            </div>
        </div>
        `;

        modalBody.innerHTML = html;
        this.emptyData();

        user.saveData();

        const htmlElement = document.querySelector('.rewards');

        updateEXPUI(htmlElement, prevLevel, level, prevExp, exp, maxExp);

    }


    returnUserMaterials(){
        // Get map values of craftingSlots
        const cardIds = Object.values(this.craftingSlots);

        // add to user cards
        cardIds.forEach(cardId => {
            if(cardId){
                user.receiveResourceCard(cardId, 1, false);
            }
        });
    }

    getCraftingCard(data){
        this.data = JSON.parse(data);
    }

    generateButtonHTML(){
        return `<button id="crafter${this.crafter.id}-slot${this.id}" class="btn btn-primary available-button crafter-slot crafter-slot-${this.id} m-2" data-slotnumber="${this.id}">Craft</button>`
    }


    generateCraftingSlotHTML(slotId){
        let html = `
        <div class="slot-container unused">
            <div id="crafting-slot${slotId}" class="slot col-12 col-md-12 crafting-card crafting-slot" data-slotnumber="${slotId}">
                <div class="card-used"></div>
                <button class="btn btn-danger col-4 remove-card-button"><i class="bi bi-x-lg"></i></button>
            </div>
        </div>
        `
        return html;
    }

    generateCraftingSlos(){
        let html = '';
        for(let i = 1; i <= 3; i++){
            html += this.generateCraftingSlotHTML(i);
        }
        return html;
    }

    generateModal(modal){
        this.modal = modal;
        let html = `
        <div class="crafting-container crafting-item">

            <div class="row pt-2 align-items-center">

                <div class="col-3">
                    <p class="m-0">Lv: ${this.crafter.level}</p>
                </div>

                <div class="progress col-8 p-0">
                    <div id="exp-bar-${this.crafter.cid}" class="progress-bar progress-bar-striped bg-success" role="progressbar" style="width: ${calculateWidth(this.crafter.exp, this.crafter.maxExp)}%" aria-valuenow="${this.crafter.exp}" aria-valuemin="0" aria-valuemax="${this.crafter.maxExp}"></div>
                    <span class="bar-text">EXP: <span class="current-exp-text">${this.crafter.exp}</span> / ${this.crafter.maxExp}</span>
                </div>

            </div>

            <div class="crafting mt-2">
                <div class="row">
                    <h5 class="col-5 col-md-8 text-center">Crafting</h5>
                    <h5 class="col-7 col-md-4 text-center">Result</h5>
                </div>
                
                <div class="row">
                    <div class="d-flex flex-wrap justify-content-center col-5 col-md-8">
                        ${this.generateCraftingSlos()}
                    </div>
                    <div class="text-center result-container col-7 col-md-4 unused">
                        <div id="result" class="crafting-card"> 
                            <div class="card-used"></div>
                            <div class="progress">
                                <div id="new-exp-bar" class="progress-bar progress-bar-striped bg-warning" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <div id="craft-card-button" class="d-none-button blink">Hold to craft</div>
                        </div>
                    </div>
                
                </div>
                <div class="pill-container-crafting">
                    <div class="pill-switch mb-2">
                        <div class="pill active" data-tab="user-cards">Cards</div>
                        <div class="pill" data-tab="crafting-recipes">Recipes</div>
                    </div>
                </div>
                <div id="user-cards" class="user-cards pill-tab active">
                    <div class="user-cards-container row scrollbar-container justify-content-center justify-content-md-start"></div>
                </div>
                <div class="crafting-recipes pill-tab">
                    <p class="text-center">Show uncraftable? <input id="show-uncraftable" type="checkbox"></p>
                    <div class="crafting-recipes-container scrollbar-container row justify-content-center justify-content-md-start">
                        ${this.crafter.generateRecipesHTML()}
                    </div>
                </div>
            </div>
        </div>
        `;

        let modalBody = modal.querySelector('.modal-body');
        modalBody.innerHTML = html;

        let userBody = modalBody.querySelector('.user-cards-container');
        user.displayCards(userBody, Card);

        // Reset crafting slots
        this.craftingSlots = {'1': null, '2': null, '3': null};

        this.addCraftingSlotFunctionality(modalBody);

        // Remove button functionality
        this.slotContainers = modalBody.querySelectorAll('.slot-container');
        this.slotContainers.forEach(slotContainer => {
            slotContainer.querySelector('.card-used').addEventListener('click', () => {
                let slotNumber = slotContainer.querySelector('.crafting-slot').dataset.slotnumber;
                if(slotNumber) this.removeCardFromSlot(slotNumber);
            })
        })

        // Add active slot style
        this.updateAvailableSlot();

        this.craftResultElement = modal.querySelector('#result');
        this.craftButton = modal.querySelector('#craft-card-button');

        // this.craftButton.addEventListener('click', () => {
        //     this.craftCurrentCard();
        // });

        this.addCraftButtonFunctionality(1500);

        // Add recipe functionality
        let recipes = modalBody.querySelectorAll('.crafting-recipe');

        recipes.forEach(recipe => {
            // Get crafting card element
            let craftingCard = recipe.querySelector('.crafting-card-recipe');
            
            // If recipe has data-craftable attribute as true
            if(recipe.getAttribute('data-craftable') === 'true'){
                // Add click event listener
                craftingCard.addEventListener('click', () => {

                    // Remove cards from crafting slots with slot id
                    for(let i = 1; i <= 3; i++){
                        this.removeCardFromSlot(i);
                    }

                    // Get material cards
                    let materialCards = recipe.querySelectorAll('.card-material .o-card');

                    // Add materials to slot
                    materialCards.forEach(materialCard => {
                        const userCard = user.cards.find(userCard => userCard.GUID === materialCard.dataset.cardid);
                        this.addCardToSlot(userCard);
                    });
                });
            }


            // Add material order swap functionality
            const swapOrderButton = recipe.querySelector('.swap-button');
            
            // Add click event listener for swap button
            swapOrderButton.addEventListener('click', () => {
                // Move the last material html element to the first position
                const lastMaterial = recipe.querySelector('.card-material:last-child');
                const firstMaterial = recipe.querySelector('.card-material:first-child');
                lastMaterial.parentNode.insertBefore(lastMaterial, firstMaterial);
            });
            
            

        });

        // Define a named function to handle the modal close event
        const handleModalClose = () => {
            this.onCraftingClose();
            $(modal).off('hidden.bs.modal', handleModalClose); // Detach the event listener
        };

        // Attach the event listener using the named function
        $(modal).on('hidden.bs.modal', handleModalClose);

        // Add pill switch functionality
        let pills = modalBody.querySelectorAll('.pill');
        pills.forEach(pill => {
            pill.addEventListener('click', () => togglePill(pill, this.modal, '.pill-tab'));
        });

        // Add recipe craftable checkbox functionality
        let showUncraftableCheckbox = modalBody.querySelector('#show-uncraftable');
        showUncraftableCheckbox.addEventListener('change', () => {
            let recipes = modalBody.querySelectorAll('.crafting-recipe');
            recipes.forEach(recipe => {
                let isCraftable = recipe.dataset.craftable === 'true';
                let shouldShow = showUncraftableCheckbox.checked || isCraftable;
                if(shouldShow) recipe.classList.remove('d-none');
                else recipe.classList.add('d-none');
            });
        });


    }

    // If user holds the element for seconds craft current card
    addCraftButtonFunctionality(time = 1500){
        let timeoutId;

        // Function to start the timeout
        const startHoldTimer = () => {

            // If craft is not craftable return
            if(!this.craftResultElement.classList.contains('craftable')) return;

            this.craftResultElement.classList.add('holding-card');

            visualizeBar(this.craftResultElement.querySelector('#new-exp-bar'), 0, 100, 100);

            timeoutId = setTimeout(() => {
                this.craftCurrentCard();
            }, time); // Set the timeout for 1.5 second
        };
        
        // Function to clear the timeout
        const clearHoldTimer = () => {
            this.craftResultElement.classList.remove('holding-card');
            // Reset bar width
            this.craftResultElement.querySelector('#new-exp-bar').style.width = '0%';
            clearTimeout(timeoutId);
        };
        
        // Add mouse event listeners
        this.craftResultElement.addEventListener('mousedown', startHoldTimer);
        document.addEventListener('mouseup', clearHoldTimer);
        
        // Add touch event listeners for mobile devices
        this.craftResultElement.addEventListener('touchstart', startHoldTimer);
        document.addEventListener('touchend', clearHoldTimer);
        
        // Cancel the timeout if the touch moves too much
        this.craftResultElement.addEventListener('touchmove', clearHoldTimer);
    }

    getAvailableSlot(){
        // search crafting slot map for null
        for (const slotId in this.craftingSlots) {
            if (this.craftingSlots[slotId] === null) {
                return slotId;
            }
        }
        return null;

    }

    addCraftingSlotFunctionality(htmlElement){
        // Get user cards
        let userCards = htmlElement.querySelectorAll('#user-cards .o-card');

        // Add click event listeners for cards
        userCards.forEach(card => {
            card.addEventListener('click', () => {
                const userCard = user.cards.find(userCard => userCard.GUID === card.dataset.cardid);
                this.addCardToSlot(userCard);
            })
        })

        return;
    }

    updateAvailableSlot(){
        const slots = this.modal.querySelectorAll('.crafting-slot');
        slots.forEach(slot => slot.classList.remove('current'));

        const slotId = this.getAvailableSlot();
        if(!slotId) return;

        let slot = this.modal.querySelector(`#crafting-slot${slotId}`);
        slot.classList.add('current');
    }

    addCardToSlot(card){
        let slotNumber = this.getAvailableSlot();
        if(!slotNumber) return;

        let slot = this.modal.querySelector(`#crafting-slot${slotNumber}`);
        let slotContainer = slot.parentNode;
        slotContainer.classList.remove('unused');
        const slotHTMLContainer = slot.querySelector('.card-used');
        slotHTMLContainer.innerHTML = card.generateHTML();
        this.craftingSlots[slotNumber] = card;
        user.removeCard(card);
        this.checkCraftRecipe();
        this.updateCraftingUI();
        this.updateAvailableSlot();
    }

    removeCardFromSlot(slotId){
        const oldCard = this.craftingSlots[slotId];
        if(!oldCard) return;

        this.craftingSlots[slotId] = null;
        let slot = this.modal.querySelector(`#crafting-slot${slotId}`);
        let slotContainer = slot.parentNode;
        slotContainer.classList.add('unused');
        const slotHTMLContainer = slot.querySelector('.card-used');
        slotHTMLContainer.innerHTML = '';
        if(oldCard) user.receiveResourceCard(oldCard, 1);
        this.checkCraftRecipe();
        this.updateCraftingUI();
        this.updateAvailableSlot();
    }

    checkCraftRecipe(){
        // Get all card ids from crafting slots
        let cards = Object.values(this.craftingSlots);

        // Remove null values
        cards = cards.filter(card => card !== null);

        // Get card ids
        const cardIds = cards.map(card => card.id);

        const card = this.crafter.matchMaterialsToCard(cardIds);
        this.cardToCraft = card;
    }

    updateCraftingUI(){

        // Get crafting resultcontainer element
        const resultElement = this.modal.querySelector('.result-container');

        // For crafting card
        const cardUsed = resultElement.querySelector('.card-used');

        // For crafting card
        if(this.cardToCraft){
            // Check if crafter has crafted the card before (if -1 then craft is not known)
            if(this.crafter.isNewCard(this.cardToCraft.id)){
                cardUsed.innerHTML = '<i class="bi bi-question-lg new-card-icon"></i>';
            }
            else{
                const card = new this.crafter.cardType(this.cardToCraft, null, false)
                cardUsed.innerHTML = card.generateHTML();
            }
            this.craftButton.classList.remove('d-none-button');
            this.craftResultElement.classList.add('craftable');    

            resultElement.classList.remove("unused");

        }
        else{
            cardUsed.innerHTML = 'Nothing to craft';
            this.craftButton.classList.add('d-none-button');
            this.craftResultElement.classList.remove('craftable');

            resultElement.classList.add("unused");
        }
        
        // For user cards
        const userCardsEl = this.modal.querySelector('.user-cards-container');
        user.displayCards(userCardsEl, Card);
        this.addCraftingSlotFunctionality(this.modal);

    }


    async assignCrafterButtonFunctionality(modal, crafterElement){
        this.showModalButton = crafterElement.querySelector(`.crafter-slot-${this.id}`)
        // this.showModalButton.addEventListener('click', () => this.generateModal(modalBody));
        this.showModalButton.addEventListener('click', async() => await this.openModal(modal));
    }

    craftCurrentCard(){
        let card = this.cardToCraft;
        if(!card) return;
        user.saveData();
        
        // reset crafting slots
        this.craftingSlots = {'1': null, '2': null, '3': null};

        this.crafter.startCraftCard(this, card.id);
        this.changeStatus('crafting');
        this.closeModal(this.modal);
    }

    closeModal(modal){
        let modalJqueryId = "#" + $(modal).attr('id');
        $(modalJqueryId).modal('hide');
    }

    onCraftingClose() {
        this.returnUserMaterials();
    }

}