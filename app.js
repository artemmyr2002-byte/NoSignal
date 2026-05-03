document.addEventListener("DOMContentLoaded", function(){

const firebaseConfig = {
  apiKey: "AIzaSyDVbJwMeX0FTZfC7NH5ghQxEh1eRxvMxto",
  authDomain: "voidlauncher-bab33.firebaseapp.com",
  projectId: "voidlauncher-bab33"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

let me = null;
let selectedAvatar = "";

/* helpers */
function el(id){ return document.getElementById(id); }
function avatarUrl(name){
  return "https://api.dicebear.com/7.x/initials/svg?seed=" + name;
}

/* ================= AUTH ================= */

el("googleBtn").onclick = () => {
  auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider());
};

el("guestBtn").onclick = () => {
  auth.signInAnonymously();
};

/* ВАЖНО: обрабатываем возврат */
auth.getRedirectResult().then(res=>{
  console.log("redirect:", res);
}).catch(console.error);

/* ГЛАВНОЕ СОБЫТИЕ */
auth.onAuthStateChanged(async (user)=>{
  console.log("AUTH:", user);

  if(!user){
    me = null;
    return;
  }

  me = user;

  el("auth").style.display = "none";
  el("app").classList.remove("hidden");

  await db.collection("users").doc(me.uid).set({
    name: user.displayName || "Guest"
  }, { merge: true });

});

/* ================= PROFILE ================= */

el("profileBtn").onclick = async () => {
  if(!me){
    alert("Ты не вошёл в аккаунт");
    return;
  }

  el("profileModal").classList.remove("hidden");

  const doc = await db.collection("users").doc(me.uid).get();
  const data = doc.data() || {};

  el("profileName").value = data.name || "";

  const ava = data.avatar || avatarUrl(data.name || "User");
  el("avatar").src = ava;

  selectedAvatar = ava;
};

el("closeProfileBtn").onclick = () => {
  el("profileModal").classList.add("hidden");
};

el("saveProfileBtn").onclick = async () => {
  if(!me){
    alert("Сначала войди в аккаунт");
    return;
  }

  const name = el("profileName").value.trim();
  if(!name){
    alert("Введите имя");
    return;
  }

  await db.collection("users").doc(me.uid).set({
    name: name,
    avatar: selectedAvatar || el("avatar").src
  }, { merge: true });

  alert("Сохранено");
  el("profileModal").classList.add("hidden");
};

/* ================= AVATAR ================= */

document.querySelectorAll(".avatarOption").forEach(img=>{
  img.onclick = ()=>{
    selectedAvatar = img.src;
    el("avatar").src = img.src;
  };
});

});
