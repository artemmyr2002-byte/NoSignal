const firebaseConfig = {
  apiKey: "AIzaSyDVbJwMeX0FTZfC7NH5ghQxEh1eRxvMxto",
  authDomain: "voidlauncher-bab33.firebaseapp.com",
  projectId: "voidlauncher-bab33"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;

/* helpers */
const el = id => document.getElementById(id);
const defaultAvatar = (uid) =>
  "https://api.dicebear.com/7.x/identicon/svg?seed=" + uid;

/* ================= AUTH ================= */

el("loginBtn").onclick = async ()=>{
  try{
    await auth.signInWithEmailAndPassword(
      el("email").value,
      el("password").value
    );
  }catch(e){
    el("authError").innerText = e.message;
  }
};

el("registerBtn").onclick = async ()=>{
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
};

el("guestBtn").onclick = async ()=>{
  await auth.signInAnonymously();
};

/* ================= STATE ================= */

auth.onAuthStateChanged(async user=>{
  if(!user){
    currentUser = null;
    el("auth").classList.remove("hidden");
    el("app").classList.add("hidden");
    return;
  }

  currentUser = user;

  el("auth").classList.add("hidden");
  el("app").classList.remove("hidden");

  const ref = db.collection("users").doc(user.uid);
  const doc = await ref.get();

  if(!doc.exists){
    await ref.set({
      name: user.email || "Guest",
      avatar: defaultAvatar(user.uid)
    });
  }

  const data = (await ref.get()).data();

  el("userName").innerText = data.name;
});

/* ================= PROFILE ================= */

el("profileBtn").onclick = async ()=>{
  const ref = db.collection("users").doc(currentUser.uid);
  const data = (await ref.get()).data();

  el("profileModal").classList.remove("hidden");

  el("nameInput").value = data.name;
  el("avatar").src = data.avatar;
};

el("closeProfile").onclick = ()=>{
  el("profileModal").classList.add("hidden");
};

el("saveProfile").onclick = async ()=>{
  const name = el("nameInput").value.trim();
  if(!name) return alert("Введите имя");

  await db.collection("users").doc(currentUser.uid).update({
    name
  });

  el("profileModal").classList.add("hidden");
  el("userName").innerText = name;
};

/* ================= LOGOUT ================= */

el("logoutBtn").onclick = ()=>auth.signOut();
