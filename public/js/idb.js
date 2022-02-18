// variable to hold db connection
let db;
// establish a connection to IndexedDB database called 'transactions' and 
// set it to version 1
const request = indexedDB.open('transactions', 1);

request.onupgradeneeded = function(event) {
  const db = event.target.result;
  db.createObjectStore('transactions', { autoIncrement: true });
};

request.onsuccess = function(event) {
  // when db is successfully created with its object store (from onupgradedneeded event above), save reference to db in global variable
  db = event.target.result;

  // check if app is online, if yes run checkDatabase() function to send all local db data to api
  if (navigator.onLine) {
    uploadTransactions();
  }
};

request.onerror = function(event) {
  // log error here
  console.log(event.target.errorCode);
};

function saveRecord(record) {
  console.log('saveRecord');

  const transaction = db.transaction(['transactions'], 'readwrite'); 
  
  const transactionObjectStore = transaction.objectStore('transactions');

  // add record to your store with add method
  transactionObjectStore.add(record);
}  

function uploadTransactions() {
  console.log('uploadTransactions');

  // open a transaction on your pending db
  const transaction = db.transaction(['transactions'], 'readwrite');

  // access your pending object store
  const transactionObjectStore = transaction.objectStore('transactions');

  // get all records from store and set to a variable
  const getAll = transactionObjectStore.getAll();

  getAll.onsuccess = function() {
    // if there was data in indexedDb's store, let's send it to the api server
    if (getAll.result.length > 0) {
      fetch('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }

          const transaction = db.transaction(['transactions'], 'readwrite');
          const transactionObjectStore = transaction.objectStore('transactions');
          // clear all items in your store
          transactionObjectStore.clear();
        })
        .catch(err => {
          // set reference to redirect back here
          console.log(err);
        });
    }
  };
}

// listen for app coming back online
window.addEventListener('online', uploadTransactions);