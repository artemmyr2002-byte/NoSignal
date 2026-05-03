const firebaseConfig = {
  apiKey: "AIzaSyDVbJwMeX0FTZfC7NH5ghQxEh1eRxvMxto",
  authDomain: "voidlauncher-bab33.firebaseapp.com",
  projectId: "voidlauncher-bab33"
};

firebase.initializeApp(firebaseConfig);

window.auth = firebase.auth();
window.db = firebase.firestore();
