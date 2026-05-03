const firebaseConfig = {
  apiKey: "AIzaSyBo9z598gFXbx9pH9zLGS4Uncx0hDg",
  authDomain: "voidlauncher-bab33.firebaseapp.com",
  projectId: "voidlauncher-bab33"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

let me = null;
let currentChat = null;

/* AUTH */

window.googleLogin = async ()=>{
  const provider = new firebase.auth.GoogleAuthProvider();
  await auth.signInWithPopup(provider);
};

window.guestLogin = async ()=>{
  await auth.signInAnonymously();
};

auth.onAuthStateChanged(async user=>{

  if(!user) return;

  me = user;

  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  await db.collection("users").doc(me.uid).set({
    name: user.displayName || "Guest",
    last: Date.now()
  },{merge:true});

  loadChats();
});

/* CREATE CHAT */

window.createChat = async ()=>{
  const chat = await db.collection("chats").add({
    users:[me.uid],
    name:"Чат"
  });
};

/* LOAD CHATS */

function loadChats(){

  db.collection("chats")
  .onSnapshot(snap=>{

    chatList.innerHTML="";

    snap.forEach(doc=>{

      const c = doc.data();

      const el = document.createElement("div");
      el.innerText = c.name;

      el.onclick = ()=>{
        openChat(doc.id, c.name);
      };

      chatList.appendChild(el);

    });

  });

}

/* OPEN CHAT */

function openChat(id,name){

  currentChat = id;
  chatTitle.innerText = name;

  db.collection("messages")
    .doc(id)
    .collection("items")
    .orderBy("time")
    .onSnapshot(snap=>{

      messages.innerHTML="";

      snap.forEach(d=>{

        const m = d.data();

        const div = document.createElement("div");
        div.className = "msg " + (m.uid===me.uid?"me":"other");

        div.innerHTML = `
          <div class="bubble">
            ${m.text}
          </div>
        `;

        messages.appendChild(div);

      });

    });

}

/* SEND */

window.sendMsg = async ()=>{

  if(!currentChat) return;

  const text = msgInput.value.trim();
  if(!text) return;

  await db.collection("messages")
    .doc(currentChat)
    .collection("items")
    .add({
      text,
      uid: me.uid,
      time: Date.now()
    });

  msgInput.value="";
};

/* LOGOUT */

window.logout = ()=>{
  auth.signOut();
};
