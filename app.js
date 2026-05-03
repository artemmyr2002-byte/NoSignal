const firebaseConfig = {
  apiKey: "AIzaSyDVbJwMeX0FTZfC7NH5ghQxEh1eRxvMxto",
  authDomain: "voidlauncher-bab33.firebaseapp.com",
  projectId: "voidlauncher-bab33"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let selectedAvatar = "";

/* элементы */
const guestBtn = document.getElementById("guestBtn");
const app = document.getElementById("app");
const authBox = document.getElementById("auth");

const modal = document.getElementById("profileModal");
const openProfile = document.getElementById("openProfile");
const closeBtn = document.getElementById("closeBtn");
const saveBtn = document.getElementById("saveBtn");

const avatar = document.getElementById("avatar");
const nameInput = document.getElementById("nameInput");

/* вход */
guestBtn.onclick = async () => {
  await auth.signInAnonymously();
};

/* отслеживание */
auth.onAuthStateChanged(user => {
  if(!user) return;

  currentUser = user;

  authBox.classList.add("hidden");
  app.classList.remove("hidden");
});

/* открыть профиль */
openProfile.onclick = async () => {
  if(!currentUser){
    alert("Сначала войди");
    return;
  }

  modal.classList.remove("hidden");

  const doc = await db.collection("users").doc(currentUser.uid).get();
  const data = doc.data() || {};

  nameInput.value = data.name || "";

  const ava = data.avatar || "https://api.dicebear.com/7.x/initials/svg?seed=User";
  avatar.src = ava;

  selectedAvatar = ava;
};

/* закрыть */
closeBtn.onclick = () => modal.classList.add("hidden");

/* выбор аватарки */
document.querySelectorAll(".ava").forEach(img=>{
  img.onclick = ()=>{
    selectedAvatar = img.src;
    avatar.src = img.src;
  };
});

/* сохранить */
saveBtn.onclick = async () => {

  const user = auth.currentUser;

  if(!user){
    alert("Ты не вошёл");
    return;
  }

  const name = nameInput.value.trim();
  if(!name){
    alert("Введите имя");
    return;
  }

  await db.collection("users").doc(user.uid).set({
    name: name,
    avatar: selectedAvatar || avatar.src
  }, { merge:true });

  alert("СОХРАНЕНО ✅");
};
