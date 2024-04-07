const isNewUser = checkIfNewUser();
// Do something with isNewUser if needed, e.g., show welcome message or tutorial
if (isNewUser) createNewUser();
else createExistingUser();



const sizeInKB = calculateLocalStorageSizeInKB();
console.log(`LocalStorage is using approximately ${sizeInKB.toFixed(2)} KB.`);

