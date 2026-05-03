const firebaseConfig = {
  apiKey: "AIzaSyDVbJwMeX0FTZfC7NH5ghQxEh1eRxvMxto",
  authDomain: "voidlauncher-bab33.firebaseapp.com",
  projectId: "voidlauncher-bab33"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

let me=null;
let currentChat=null;

/* AUTH */

window.googleLogin = async ()=>{
  const provider=new firebase.auth.GoogleAuthProvider();
  await auth.signInWithRedirect(provider);
};

window.guestLogin = async ()=>{
  await auth.signInAnonymously();
};

auth.getRedirectResult().catch(console.error);

auth.onAuthStateChanged(async user=>{
  if(!user) return;

  me=user;

  authDiv.style.display="none";
  app.classList.remove("hidden");

  await db.collection("users").doc(me.uid).set({
    name:user.displayName||"Guest"
  },{merge:true});

  loadChats();
});

/* CHATS */

window.createChat = async ()=>{
  await db.collection("chats").add({
    name:"Чат",
    users:[me.uid],
    created:Date.now()
  });
};

function loadChats(){
  db.collection("chats")
  .orderBy("created","desc")
  .onSnapshot(snap=>{
    chatList.innerHTML="";
    snap.forEach(doc=>{
      const c=doc.data();
      const el=document.createElement("div");
      el.innerText=c.name;
      el.onclick=()=>openChat(doc.id,c.name);
      chatList.appendChild(el);
    });
  });
}

/* OPEN */

function openChat(id,name){
  currentChat=id;
  chatTitle.innerText=name;

  db.collection("messages")
  .doc(id)
  .collection("items")
  .orderBy("time")
  .onSnapshot(snap=>{
    messages.innerHTML="";
    snap.forEach(d=>{
      const m=d.data();
      const div=document.createElement("div");
      div.className="msg "+(m.uid===me.uid?"me":"other");
      div.innerHTML=`<div class="bubble">${m.text}</div>`;
      messages.appendChild(div);
    });
    messages.scrollTop=messages.scrollHeight;
  });
}

/* SEND */

window.sendMsg=async ()=>{
  if(!currentChat) return;

  const text=msgInput.value.trim();
  if(!text) return;

  await db.collection("messages")
  .doc(currentChat)
  .collection("items")
  .add({
    text,
    uid:me.uid,
    time:Date.now()
  });

  msgInput.value="";
};

/* PROFILE */

function avatarUrl(name){
  return "https://api.dicebear.com/7.x/initials/svg?seed="+name;
}

window.openProfile=async ()=>{
  profileModal.classList.remove("hidden");

  const doc=await db.collection("users").doc(me.uid).get();
  const data=doc.data()||{};

  profileName.value=data.name||"";
  avatar.src=avatarUrl(profileName.value||"User");
};

window.closeProfile=()=>{
  profileModal.classList.add("hidden");
};

window.saveProfile=async ()=>{
  const name=profileName.value.trim();
  if(!name) return alert("Введите имя");

  await db.collection("users").doc(me.uid).set({name},{merge:true});
  closeProfile();
};

/* LOGOUT */

window.logout=()=>auth.signOut();
