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
let username = null;
let currentServer = "global";

/* =========================
   SAFE AUTH SYSTEM
========================= */

auth.onAuthStateChanged(async user=>{

  if(user){

    me = user;
    username = user.displayName || "User_" + user.uid.slice(0,5);

    await db.collection("users").doc(me.uid).set({
      name: username,
      online: true,
      avatar: user.photoURL || null
    }, {merge:true});

    startApp();

  }

});

/* GOOGLE LOGIN */
window.googleLogin = async function(){

  const provider = new firebase.auth.GoogleAuthProvider();

  try{
    await auth.signInWithRedirect(provider);
  } catch(e){
    console.log("google fail", e);
    anonymousLogin();
  }

};

/* REDIRECT HANDLER */
auth.getRedirectResult()
.then(res=>{
  if(res.user){
    me = res.user;
    startApp();
  }
})
.catch(()=>{
  anonymousLogin();
});

/* ANONYMOUS FALLBACK */
window.anonymousLogin = async function(){

  const res = await auth.signInAnonymously();

  me = res.user;
  username = "Guest_" + me.uid.slice(0,5);

  await db.collection("users").doc(me.uid).set({
    name: username,
    online: true,
    type:"anon"
  }, {merge:true});

  startApp();

};

/* =========================
   APP CORE
========================= */

function startApp(){

  renderProfile();
  loadServers();
  loadUsers();
  loadMessages();

}

/* PROFILE */
function renderProfile(){

  document.getElementById("profile").innerHTML = `
    <b>${username}</b><br>
    <small>${me.uid.slice(0,6)}</small>
  `;

}

/* =========================
   SERVERS
========================= */

window.createServer = async function(){

  const name = prompt("server name");
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
    name: username,
    serverId: currentServer,
    time: Date.now()
  });

  e.target.value = "";

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
        <div class="msg">
          <b>${m.name}</b><br>
          ${m.text}
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

/* keep alive */
setInterval(()=>{

  if(me){
    db.collection("users").doc(me.uid).update({
      online:true,
      last:Date.now()
    });
  }

},5000);
