document.addEventListener("DOMContentLoaded",()=>{

const firebaseConfig={
  apiKey:"AIzaSyDVbJwMeX0FTZfC7NH5ghQxEh1eRxvMxto",
  authDomain:"voidlauncher-bab33.firebaseapp.com",
  projectId:"voidlauncher-bab33"
};

firebase.initializeApp(firebaseConfig);

const auth=firebase.auth();
const db=firebase.firestore();

let me=null,currentChat=null,selectedAvatar="",typingTimeout=null,firstLoad=true;

/* ELEMENTS */
const el=id=>document.getElementById(id);

/* AUTH */
el("googleBtn").onclick=()=>auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider());
el("guestBtn").onclick=()=>auth.signInAnonymously();

auth.onAuthStateChanged(async user=>{
  if(!user) return;

  me=user;

  el("auth").style.display="none";
  el("app").classList.remove("hidden");

  await db.collection("users").doc(me.uid).set({
    name:user.displayName||"Guest"
  },{merge:true});

  loadChats();
});

/* PROFILE */
function avatarUrl(name){
  return "https://api.dicebear.com/7.x/initials/svg?seed="+name;
}

el("profileBtn").onclick=async()=>{
  if(!me) return alert("подожди");

  el("profileModal").classList.remove("hidden");

  const d=(await db.collection("users").doc(me.uid).get()).data()||{};
  el("profileName").value=d.name||"";

  const ava=d.avatar||avatarUrl(d.name||"User");
  el("avatar").src=ava;
  selectedAvatar=ava;
};

el("closeProfileBtn").onclick=()=>el("profileModal").classList.add("hidden");

el("saveProfileBtn").onclick=async()=>{
  if(!me) return alert("подожди");

  const name=el("profileName").value.trim();
  if(!name) return;

  await db.collection("users").doc(me.uid).set({
    name,
    avatar:selectedAvatar||el("avatar").src
  },{merge:true});

  el("profileModal").classList.add("hidden");
};

/* AVATAR CLICK */
document.querySelectorAll(".avatarOption").forEach(img=>{
  img.onclick=()=>{
    selectedAvatar=img.src;
    el("avatar").src=img.src;
  };
});

/* CHATS */
el("createChatBtn").onclick=()=>db.collection("chats").add({name:"чат",created:Date.now()});

function loadChats(){
  db.collection("chats").onSnapshot(s=>{
    el("chatList").innerHTML="";
    s.forEach(doc=>{
      const div=document.createElement("div");
      div.innerText=doc.data().name;
      div.onclick=()=>openChat(doc.id,doc.data().name);
      el("chatList").appendChild(div);
    });
  });
}

/* OPEN CHAT */
function openChat(id,name){
  currentChat=id;
  el("chatTitle").innerText=name;

  db.collection("messages").doc(id).collection("items").orderBy("time")
  .onSnapshot(snap=>{
    const box=el("messages");
    box.innerHTML="";

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

      box.appendChild(div);
    });

    if(!firstLoad) el("msgSound").play().catch(()=>{});
    firstLoad=false;
  });

  db.collection("chats").doc(id).onSnapshot(doc=>{
    const t=doc.data()?.typing;
    if(t && me && t.uid!==me.uid){
      el("typingStatus").classList.remove("hidden");
      el("typingName").innerText=t.name+" печатает";
    }else el("typingStatus").classList.add("hidden");
  });
}

/* SEND */
el("sendBtn").onclick=async()=>{
  if(!currentChat||!me) return;

  const text=el("msgInput").value.trim();
  if(!text) return;

  const u=(await db.collection("users").doc(me.uid).get()).data();

  await db.collection("messages").doc(currentChat).collection("items").add({
    text,
    uid:me.uid,
    name:u.name,
    avatar:u.avatar||avatarUrl(u.name),
    time:Date.now()
  });

  el("msgInput").value="";
};

/* TYPING */
el("msgInput").addEventListener("input",async()=>{
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

/* LOGOUT */
el("logoutBtn").onclick=()=>auth.signOut();

});
