const firebaseConfig = {
  apiKey: "AIzaSyBo9z598gFXbx9pH9zLGS4Uncx0hDg",
  authDomain: "voidlauncher-bab33.firebaseapp.com",
  projectId: "voidlauncher-bab33",
  storageBucket: "voidlauncher-bab33.firebasestorage.app",
  messagingSenderId: "273997309805",
  appId: "1:273997309805:web:a43ce719cb30fcf9dc9c64"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();

let me = null;
let userProfile = null;
let currentServer = "global";

/* =========================
   GOOGLE LOGIN
========================= */
window.googleLogin = async function(){

  const provider = new firebase.auth.GoogleAuthProvider();

  try{
    const result = await auth.signInWithPopup(provider);
    me = result.user;

    await db.collection("users").doc(me.uid).set({
      name: me.displayName,
      avatar: me.photoURL,
      online: true,
      last: Date.now()
    }, {merge:true});

    init();

  } catch(e){
    console.log("google login error", e);
  }

};

/* fallback anonymous */
auth.onAuthStateChanged(async user=>{
  if(user && !me){
    me = user;

    await db.collection("users").doc(me.uid).set({
      name: "User_" + me.uid.slice(0,5),
      online: true
    }, {merge:true});

    init();
  }
});

/* =========================
   INIT
========================= */
function init(){
  loadProfile();
  loadServers();
  loadMessages();
  loadUsers();
}

/* PROFILE */
function loadProfile(){

  db.collection("users").doc(me.uid).onSnapshot(doc=>{
    const u = doc.data();

    document.getElementById("profile").innerHTML = `
      <b>${u.name}</b><br>
      <img src="${u.avatar || ''}" width="40" style="border-radius:50%">
    `;
  });

}

/* =========================
   SERVERS (UNLIMITED)
========================= */
window.createServer = async function(){

  const name = prompt("Server name:");
  if(!name) return;

  await db.collection("servers").add({
    name,
    owner: me.uid,
    time: Date.now()
  });

};

function loadServers(){

  db.collection("servers").onSnapshot(snap=>{

    const box = document.getElementById("servers");
    box.innerHTML = "";

    snap.forEach(d=>{
      const s = d.data();

      box.innerHTML += `
        <div onclick="switchServer('${d.id}')">
          # ${s.name}
        </div>
      `;
    });

  });

}

window.switchServer = function(id){
  currentServer = id;
  loadMessages();
}

/* =========================
   CHAT
========================= */
document.getElementById("msgInput").addEventListener("keydown", async e=>{
  if(e.key !== "Enter") return;

  const text = e.target.value.trim();
  if(!text) return;

  await db.collection("messages").add({
    text,
    uid: me.uid,
    serverId: currentServer,
    time: Date.now()
  });

  e.target.value="";
});

function loadMessages(){

  db.collection("messages")
  .where("serverId","==",currentServer)
  .orderBy("time")
  .onSnapshot(snap=>{

    const box = document.getElementById("messages");
    box.innerHTML = "";

    snap.forEach(d=>{
      const m = d.data();

      box.innerHTML += `
        <div>
          <b>${m.uid.slice(0,5)}</b>: ${m.text}
        </div>
      `;
    });

    box.scrollTop = box.scrollHeight;

  });

}

/* =========================
   USERS
========================= */
function loadUsers(){

  db.collection("users").onSnapshot(snap=>{

    const box = document.getElementById("users");
    box.innerHTML = "";

    snap.forEach(d=>{
      const u = d.data();

      box.innerHTML += `
        <div>
          ${u.online ? "🟢" : "⚪"} ${u.name}
        </div>
      `;
    });

  });

}

/* keep online */
setInterval(()=>{
  if(me){
    db.collection("users").doc(me.uid).update({
      online:true,
      last:Date.now()
    });
  }
},5000);
