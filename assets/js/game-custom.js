async function readyGame(){
    let actionData = await loadJSONFile("assets/json/gameActionCards.json");
    let equipmentData = await loadJSONFile("assets/json/gameEquipmentCards.json");
    let basicCardsData = await loadJSONFile("assets/json/gameBasicCards.json");

    let cardsArray = deserializeAllGUIDs(actionData, equipmentData, basicCardsData);

    let heroesArray = deserializeAllHeroes(cardsArray);

    const cardsContainer = document.getElementById('cardsContainer');

    cardsArray.forEach(card => {
        cardsContainer.innerHTML += card.generateHTML();
    });

    let locations = await createLocations("assets/json/locations.json", "assets/json/gameRewards.json");

    const locationHTML = locations[0].generateHTML();

    // Find the element with the id 'location-container'
    const locationContainer = document.getElementById('location-container');
    locationContainer.innerHTML = locationHTML;

    // locations[0].startQuest(heroesArray[0]);
    // checkOngoingQuests(locations, heroesArray);

}

readyGame();

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

const sizeInKB = calculateLocalStorageSizeInKB();
console.log(`LocalStorage is using approximately ${sizeInKB.toFixed(2)} KB.`);

function byteCount(s) {
    return encodeURI(s).split(/%..|./).length - 1;
}

// console.log(1024 * 1024 * 5 - escape(encodeURIComponent(JSON.stringify(localStorage))).length);