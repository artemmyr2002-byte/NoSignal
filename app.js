const firebaseConfig = {
  apiKey: "AIzaSyDVbJwMeX0FTZfC7NH5ghQxEh1eRxvMxto",
  authDomain: "voidlauncher-bab33.firebaseapp.com",
  projectId: "voidlauncher-bab33"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

let me=null,currentChat=null,selectedAvatar="",firstLoad=true,typingTimeout=null;

/* AUTH */
window.googleLogin=()=>auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider());
window.guestLogin=()=>auth.signInAnonymously();
auth.getRedirectResult().catch(console.error);

auth.onAuthStateChanged(async user=>{
  if(!user) return;
  me=user;
  auth.style.display="none";
  app.classList.remove("hidden");

  await db.collection("users").doc(me.uid).set({
    name:user.displayName||"Guest"
  },{merge:true});

  loadChats();
});

/* AVATAR */
function avatarUrl(name){
  return "https://api.dicebear.com/7.x/initials/svg?seed="+name;
}
window.pickAvatar=src=>{
  selectedAvatar=src;
  avatar.src=src;
};

/* PROFILE */
window.openProfile=async()=>{
  if(!me) return;
  profileModal.classList.remove("hidden");

  const d=(await db.collection("users").doc(me.uid).get()).data()||{};
  profileName.value=d.name||"";
  avatar.src=d.avatar||avatarUrl(profileName.value||"User");
};

window.closeProfile=()=>profileModal.classList.add("hidden");

window.saveProfile=async()=>{
  if(!me) return alert("подожди");

  const name=profileName.value.trim();
  if(!name) return;

  await db.collection("users").doc(me.uid).set({
    name,
    avatar:selectedAvatar||avatar.src
  },{merge:true});

  closeProfile();
};

/* CHATS */
window.createChat=()=>db.collection("chats").add({name:"чат",created:Date.now()});

function loadChats(){
  db.collection("chats").onSnapshot(s=>{
    chatList.innerHTML="";
    s.forEach(doc=>{
      const el=document.createElement("div");
      el.innerText=doc.data().name;
      el.onclick=()=>openChat(doc.id,doc.data().name);
      chatList.appendChild(el);
    });
  });
}

/* OPEN */
function openChat(id,name){
  currentChat=id;
  chatTitle.innerText=name;

  db.collection("messages").doc(id).collection("items").orderBy("time")
  .onSnapshot(snap=>{
    messages.innerHTML="";
    snap.forEach(d=>{
      const m=d.data();
      const div=document.createElement("div");
      div.className="msg "+(m.uid===me.uid?"me":"");

      div.innerHTML=`
      <div class="msgRow">
        <img src="${m.avatar}" class="msgAvatar">
        <div>
          <div>${m.name}</div>
          <div class="bubble">${m.text}</div>
        </div>
      </div>`;

      messages.appendChild(div);
    });

    if(!firstLoad) msgSound.play().catch(()=>{});
    firstLoad=false;
  });

  db.collection("chats").doc(id).onSnapshot(doc=>{
    const t=doc.data()?.typing;
    if(t && t.uid!==me.uid){
      typingStatus.classList.remove("hidden");
      typingName.innerText=t.name+" печатает";
    }else typingStatus.classList.add("hidden");
  });
}

/* SEND */
window.sendMsg=async()=>{
  if(!currentChat||!me) return;

  const text=msgInput.value.trim();
  if(!text) return;

  const u=(await db.collection("users").doc(me.uid).get()).data();

  await db.collection("messages").doc(currentChat).collection("items").add({
    text,
    uid:me.uid,
    name:u.name,
    avatar:u.avatar||avatarUrl(u.name),
    time:Date.now()
  });

  await db.collection("chats").doc(currentChat).set({typing:null},{merge:true});

  msgInput.value="";
};

/* TYPING */
msgInput.addEventListener("input",async()=>{
  if(!currentChat||!me) return;

  const u=(await db.collection("users").doc(me.uid).get()).data();

  await db.collection("chats").doc(currentChat).set({
    typing:{uid:me.uid,name:u.name,time:Date.now()}
  },{merge:true});

  clearTimeout(typingTimeout);
  typingTimeout=setTimeout(()=>{
    db.collection("chats").doc(currentChat).set({typing:null},{merge:true});
  },1500);
});

window.logout=()=>auth.signOut();
