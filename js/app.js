let user = null;

function el(id){ return document.getElementById(id); }

/* 🎨 цвет */
function getUserColor(uid){
  let hash = 0;
  for(let i=0;i<uid.length;i++){
    hash = uid.charCodeAt(i) + ((hash<<5)-hash);
  }
  const h = hash % 360;
  return {
    c1: `hsl(${h},70%,45%)`,
    c2: `hsl(${(h+40)%360},70%,55%)`
  };
}

/* анти-спам */
let lastSend = 0;
const SEND_DELAY = 500;

/* чтобы не дублировалось */
let loadedIds = new Set();

window.onload = function(){

el("profile").style.display = "none";

/* AUTH */

el("loginBtn").onclick = async ()=>{
  try{
    await auth.signInWithEmailAndPassword(
      el("email").value,
      el("password").value
    );
  }catch(e){
    el("error").innerText = e.message;
  }
};

el("registerBtn").onclick = async ()=>{
  try{
    const cred = await auth.createUserWithEmailAndPassword(
      el("email").value,
      el("password").value
    );

    await db.collection("users").doc(cred.user.uid).set({
      name:"User"
    });

  }catch(e){
    el("error").innerText = e.message;
  }
};

el("guestBtn").onclick = ()=>{
  auth.signInAnonymously();
};

/* STATE */

auth.onAuthStateChanged(async u=>{
  if(!u){
    user = null;
    el("auth").classList.remove("hidden");
    el("app").classList.add("hidden");
    return;
  }

  user = u;

  el("auth").classList.add("hidden");
  el("app").classList.remove("hidden");

  const ref = db.collection("users").doc(user.uid);
  const doc = await ref.get();

  if(!doc.exists){
    await ref.set({ name:"Guest" });
  }

  const data = (await ref.get()).data();
  el("name").innerText = data.name;

  loadMessages();
});

/* PROFILE */

el("profileBtn").onclick = ()=>{
  if(!user) return;
  el("profile").style.display = "flex";
};

el("closeProfile").onclick = ()=>{
  el("profile").style.display = "none";
};

el("saveName").onclick = async ()=>{
  if(!user) return;

  const name = el("newName").value.trim();
  if(!name) return;

  await db.collection("users").doc(user.uid).update({ name });

  el("name").innerText = name;
  el("profile").style.display = "none";
};

/* CHAT */

el("sendBtn").onclick = sendMessage;

el("msgInput").addEventListener("keydown", e=>{
  if(e.key === "Enter") sendMessage();
});

async function sendMessage(){
  if(!user) return;

  const now = Date.now();
  if(now - lastSend < SEND_DELAY) return;
  lastSend = now;

  const input = el("msgInput");
  const text = input.value.trim();
  if(!text) return;

  const userDoc = await db.collection("users").doc(user.uid).get();
  const name = userDoc.data().name;

  input.value = "";

  await db.collection("messages").add({
    text,
    name,
    uid: user.uid,
    time: Date.now()
  });
}

/* 🔥 ДОБАВЛЕНИЕ БЕЗ ОЧИСТКИ */

function loadMessages(){
  db.collection("messages")
    .orderBy("time")
    .onSnapshot(snap=>{
      const container = el("messages");

      snap.docChanges().forEach(change=>{
        if(change.type !== "added") return;

        const doc = change.doc;
        if(loadedIds.has(doc.id)) return;
        loadedIds.add(doc.id);

        const m = doc.data();

        const isMe =
          (m.uid && m.uid === user.uid) ||
          (!m.uid && m.name === el("name").innerText);

        const div = document.createElement("div");
        div.className = "msg " + (isMe ? "my" : "other");

        const date = new Date(m.time || Date.now());
        const time =
          date.getHours().toString().padStart(2,'0') + ":" +
          date.getMinutes().toString().padStart(2,'0');

        if(isMe){
          div.innerHTML = `
            ${m.text}
            <div class="meta">${time} ✓✓</div>
          `;
        }else{
          const uid = m.uid || m.name;
          const colors = getUserColor(uid);

          div.style.background = `linear-gradient(135deg, ${colors.c1}, ${colors.c2})`;

          div.innerHTML = `
            <div class="name" style="color:${colors.c2}">
              ${m.name}
            </div>
            ${m.text}
            <div class="meta">${time}</div>
          `;
        }

        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
      });
    });
}

/* LOGOUT */

el("logoutBtn").onclick = ()=>{
  auth.signOut();
};

};
