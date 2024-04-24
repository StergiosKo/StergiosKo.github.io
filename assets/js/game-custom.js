const isNewUser = checkIfNewUser();

var user;
// Do something with isNewUser if needed, e.g., show welcome message or tutorial
if (isNewUser) createNewUser();
else createExistingUser();



const sizeInKB = calculateLocalStorageSizeInKB();
console.log(`LocalStorage is using approximately ${sizeInKB.toFixed(2)} KB.`);

document.addEventListener('DOMContentLoaded', (event) => {
  // Initialize Swiper
  var swiper = new Swiper('.swiper-container', {
    // Optional parameters
    slidesPerView: 1,
    spaceBetween: 300,
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
  });

  swiper.on('transitionEnd', function() {
    // If on Card list slide
    if (swiper.realIndex === 1) {
      user.displayHeroes();
    }
    else if (swiper.realIndex === 2) {
      user.displayCardsMain();
    }
    else if (swiper.realIndex === 3) {
      user.displayHeroesQuest();
    }
  });

  // Handle footer button clicks
  const footerButtons = document.querySelectorAll('.footer-btn');
  footerButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const slideIndex = btn.getAttribute('data-slide');
      swiper.slideTo(slideIndex);
    });
  });
});