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
let currentChat = null;
let selectedAvatar = "";

/* helpers */
function el(id){ return document.getElementById(id); }
function avatarUrl(name){
  return "https://api.dicebear.com/7.x/initials/svg?seed=" + name;
}

/* AUTH */
el("googleBtn").onclick = function(){
  auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider());
};

el("guestBtn").onclick = function(){
  auth.signInAnonymously();
};

auth.onAuthStateChanged(async function(user){
  if(!user) return;

  me = user;

  el("auth").style.display = "none";
  el("app").classList.remove("hidden");

  await db.collection("users").doc(me.uid).set({
    name: user.displayName || "Guest"
  }, { merge: true });

  loadChats();
});

/* PROFILE */
el("profileBtn").onclick = async function(){
  if(!me) return alert("подожди");

  el("profileModal").classList.remove("hidden");

  const d = (await db.collection("users").doc(me.uid).get()).data() || {};

  el("profileName").value = d.name || "";

  const ava = d.avatar || avatarUrl(d.name || "User");
  el("avatar").src = ava;
  selectedAvatar = ava;
};

el("closeProfileBtn").onclick = function(){
  el("profileModal").classList.add("hidden");
};

el("saveProfileBtn").onclick = async function(){
  if(!me) return alert("подожди");

  const name = el("profileName").value.trim();
  if(!name) return;

  await db.collection("users").doc(me.uid).set({
    name: name,
    avatar: selectedAvatar || el("avatar").src
  }, { merge: true });

  el("profileModal").classList.add("hidden");
};

/* AVATAR CLICK */
document.querySelectorAll(".avatarOption").forEach(function(img){
  img.onclick = function(){
    selectedAvatar = img.src;
    el("avatar").src = img.src;
  };
});

/* CHATS */
el("createChatBtn").onclick = function(){
  db.collection("chats").add({
    name: "чат",
    created: Date.now()
  });
};

function loadChats(){
  db.collection("chats").onSnapshot(function(snap){
    el("chatList").innerHTML = "";

    snap.forEach(function(doc){
      const div = document.createElement("div");
      div.innerText = doc.data().name;

      div.onclick = function(){
        openChat(doc.id, doc.data().name);
      };

      el("chatList").appendChild(div);
    });
  });
}

/* OPEN CHAT */
function openChat(id, name){
  currentChat = id;
  el("chatTitle").innerText = name;

  db.collection("messages")
    .doc(id)
    .collection("items")
    .orderBy("time")
    .onSnapshot(function(snap){

      const box = el("messages");
      box.innerHTML = "";

      snap.forEach(function(d){
        const m = d.data();

        const div = document.createElement("div");
        div.className = "msg " + (m.uid === me.uid ? "me" : "");

        div.innerHTML = `
        <div class="msgRow">
          <img src="${m.avatar}" class="msgAvatar">
          <div>
            <div>${m.name}</div>
            <div class="bubble">${m.text}</div>
          </div>
        </div>`;

        box.appendChild(div);
      });
    });
}

/* SEND */
el("sendBtn").onclick = async function(){
  if(!currentChat || !me) return;

  const text = el("msgInput").value.trim();
  if(!text) return;

  const u = (await db.collection("users").doc(me.uid).get()).data();

  await db.collection("messages")
    .doc(currentChat)
    .collection("items")
    .add({
      text: text,
      uid: me.uid,
      name: u.name,
      avatar: u.avatar || avatarUrl(u.name),
      time: Date.now()
    });

  el("msgInput").value = "";
};

});
