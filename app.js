document.addEventListener("DOMContentLoaded", ()=>{

const firebaseConfig = {
  apiKey: "AIzaSyDVbJwMeX0FTZfC7NH5ghQxEh1eRxvMxto",
  authDomain: "voidlauncher-bab33.firebaseapp.com",
  projectId: "voidlauncher-bab33"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;

const el = id => document.getElementById(id);

function safe(id){
  const e = el(id);
  if(!e){
    console.error("НЕТ ЭЛЕМЕНТА:", id);
  }
  return e;
}

const defaultAvatar = uid =>
  "https://api.dicebear.com/7.x/identicon/svg?seed=" + uid;

/* AUTH */

safe("loginBtn")?.addEventListener("click", async ()=>{
  try{
    await auth.signInWithEmailAndPassword(
      el("email").value,
      el("password").value
    );
  }catch(e){
    el("authError").innerText = e.message;
  }
});

safe("registerBtn")?.addEventListener("click", async ()=>{
  try{
    const cred = await auth.createUserWithEmailAndPassword(
      el("email").value,
      el("password").value
    );

    await db.collection("users").doc(cred.user.uid).set({
      name:"User",
      avatar: defaultAvatar(cred.user.uid)
    });

  }catch(e){
    el("authError").innerText = e.message;
  }
});

safe("guestBtn")?.addEventListener("click", async ()=>{
  await auth.signInAnonymously();
});

/* STATE */

auth.onAuthStateChanged(async user=>{
  if(!user){
    currentUser = null;
    safe("auth")?.classList.remove("hidden");
    safe("app")?.classList.add("hidden");
    return;
  }

  currentUser = user;

  safe("auth")?.classList.add("hidden");
  safe("app")?.classList.remove("hidden");

  const ref = db.collection("users").doc(user.uid);
  const doc = await ref.get();

  if(!doc.exists){
    await ref.set({
      name: user.email || "Guest",
      avatar: defaultAvatar(user.uid)
    });
  }

  const data = (await ref.get()).data();
  safe("userName").innerText = data.name;
});

/* PROFILE */

safe("profileBtn")?.addEventListener("click", async ()=>{
  if(!currentUser) return;

  const ref = db.collection("users").doc(currentUser.uid);
  const data = (await ref.get()).data();

  safe("profileModal").classList.remove("hidden");
  safe("nameInput").value = data.name;
  safe("avatar").src = data.avatar;
});

safe("closeProfile")?.addEventListener("click", ()=>{
  safe("profileModal").classList.add("hidden");
});

safe("saveProfile")?.addEventListener("click", async ()=>{
  if(!currentUser) return alert("Не вошёл");

  const name = el("nameInput").value.trim();
  if(!name) return alert("Введите имя");

  await db.collection("users").doc(currentUser.uid).update({
    name
  });

  safe("profileModal").classList.add("hidden");
  safe("userName").innerText = name;
});

/* LOGOUT */

safe("logoutBtn")?.addEventListener("click", ()=>{
  auth.signOut();
});

});
