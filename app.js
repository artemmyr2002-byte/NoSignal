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

/* ================= AUTH ================= */

/* GOOGLE (REDIRECT — НАДЁЖНЫЙ) */
window.googleLogin = async ()=>{
  try{
    const provider = new firebase.auth.GoogleAuthProvider();
    await auth.signInWithRedirect(provider);
  }catch(e){
    alert("Google ошибка: " + e.message);
  }
};

/* ГОСТЬ */
window.guestLogin = async ()=>{
  try{
    await auth.signInAnonymously();
  }catch(e){
    alert("Гость ошибка: " + e.message);
  }
};

/* ВОЗВРАТ ПОСЛЕ GOOGLE */
auth.getRedirectResult()
.then(result=>{
  if(result.user){
    console.log("Google login success");
  }
})
.catch(e=>{
  alert("Redirect error: " + e.message);
});

/* СОСТОЯНИЕ ПОЛЬЗОВАТЕЛЯ */
auth.onAuthStateChanged(async user=>{

  if(!user) return;

  me = user;

  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  /* сохраняем пользователя */
  await db.collection("users").doc(me.uid).set({
    name: user.displayName || "Guest",
    last: Date.now()
  },{merge:true});

  loadChats();
});

/* ================= CHATS ================= */

window.createChat = async ()=>{
  if(!me) return;

  await db.collection("chats").add({
    users:[me.uid],
    name:"Чат " + Math.floor(Math.random()*1000),
    created: Date.now()
  });
};

function loadChats(){

  db.collection("chats")
  .orderBy("created","desc")
  .onSnapshot(snap=>{

    chatList.innerHTML="";

    snap.forEach(doc=>{

      const c = doc.data();

      const el = document.createElement("div");
      el.style.padding="10px";
      el.style.cursor="pointer";
      el.style.borderBottom="1px solid #222";

      el.innerText = c.name;

      el.onclick = ()=>{
        openChat(doc.id, c.name);
      };

      chatList.appendChild(el);

    });

  });

}

/* ================= OPEN CHAT ================= */

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

      messages.scrollTop = messages.scrollHeight;

    });

}

/* ================= SEND ================= */

window.sendMsg = async ()=>{

  if(!currentChat) return;

  const text = msgInput.value.trim();
  if(!text) return;

  try{

    await db.collection("messages")
      .doc(currentChat)
      .collection("items")
      .add({
        text,
        uid: me.uid,
        time: Date.now()
      });

  }catch(e){
    alert("Ошибка отправки: " + e.message);
  }

  msgInput.value="";
};

/* ================= LOGOUT ================= */

window.logout = ()=>{
  auth.signOut();
};
