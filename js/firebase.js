const firebaseConfig = {
  apiKey: "AIzaSyDVbJwMeX0FTZfC7NH5ghQxEh1eRxvMxto",
  authDomain: "voidlauncher-bab33.firebaseapp.com",
  projectId: "voidlauncher-bab33",
  storageBucket: "voidlauncher-bab33.firebasestorage.app",
  messagingSenderId: "273997309805",
  appId: "1:273997309805:web:a43ce719cb30fcf9dc9c64"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
