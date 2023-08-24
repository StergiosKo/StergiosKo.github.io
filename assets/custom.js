let filtersContainer = document.querySelector('.filters');
let filters = filtersContainer.querySelectorAll('ul li');
let cardsContainer = document.querySelector('.mtg-cards');

filters.forEach((filter) => {
    filter.addEventListener('click', (evt) => filterPressed(filter.className.split(" ")[0]));
});

function filterPressed(color){
    filters.forEach((filter) => {
        filter.classList.remove('active');
    });
    filtersContainer.querySelector('.' + color).classList.add('active');
    cardsActive = cardsContainer.querySelectorAll('.mtg-card.' + color);
    cardsNotActive = cardsContainer.querySelectorAll('.mtg-card:not(.' + color + ')');
    cardsNotActive.forEach((card) => {card.style.display = "none"})
    cardsActive.forEach((card) => {card.style.display = "block"})
}
