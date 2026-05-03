let user = null;
let selectedMsgId = null;

function el(id){ return document.getElementById(id); }

/* 🎨 цвет */
function getUserColor(uid){
  let hash = 0;
  for(let i=0;i<uid.length;i++){
    hash = uid.charCodeAt(i) + ((hash<<5)-hash);
  }
  const h = hash % 360;
  return {
    c1:`hsl(${h},70%,45%)`,
    c2:`hsl(${(h+40)%360},70%,55%)`
  };
}

window.onload = function(){

/* AUTH */
el("loginBtn").onclick = async ()=>{
  await auth.signInWithEmailAndPassword(
    el("email").value,
    el("password").value
  );
};

el("registerBtn").onclick = async ()=>{
  const cred = await auth.createUserWithEmailAndPassword(
    el("email").value,
    el("password").value
  );

  await db.collection("users").doc(cred.user.uid).set({name:"User"});
};

el("guestBtn").onclick = ()=> auth.signInAnonymously();

/* STATE */
auth.onAuthStateChanged(async u=>{
  if(!u){
    el("auth").classList.remove("hidden");
    el("app").classList.add("hidden");
    return;
  }

  user = u;
  el("auth").classList.add("hidden");
  el("app").classList.remove("hidden");

  const ref = db.collection("users").doc(user.uid);
  if(!(await ref.get()).exists){
    await ref.set({name:"Guest"});
  }

  el("name").innerText = (await ref.get()).data().name;

  loadMessages();
});

/* SEND */
el("sendBtn").onclick = sendMessage;

async function sendMessage(){
  const text = el("msgInput").value.trim();
  if(!text) return;

  const name = (await db.collection("users").doc(user.uid).get()).data().name;

  await db.collection("messages").add({
    text,
    name,
    uid:user.uid,
    time:Date.now()
  });

  el("msgInput").value="";
}

/* LOAD (СТАБИЛЬНО) */
function loadMessages(){
  db.collection("messages")
    .orderBy("time")
    .onSnapshot(snap=>{
      const container = el("messages");
      container.innerHTML = "";

      snap.forEach(doc=>{
        const m = doc.data();
        const id = doc.id;

        const isMe = m.uid === user.uid;

        const div = document.createElement("div");
        div.className = "msg " + (isMe ? "my":"other");

        const date = new Date(m.time);
        const time =
          date.getHours().toString().padStart(2,'0')+":"+
          date.getMinutes().toString().padStart(2,'0');

        const colors = getUserColor(m.uid || m.name);
        div.style.background = `linear-gradient(135deg, ${colors.c1}, ${colors.c2})`;

        div.innerHTML = `
          <div class="name" style="color:${colors.c2}">
            ${m.name}
          </div>
          ${m.text}
          <div class="meta">${time}${isMe?" ✓✓":""}</div>
        `;

        /* КЛИК */
        div.onclick = ()=>{
          if(!isMe) return;
          selectedMsgId = id;
          el("menu").style.display="flex";
        };

        container.appendChild(div);
      });

      container.scrollTop = container.scrollHeight;
    });
}

/* MENU */
window.deleteMsg = async ()=>{
  await db.collection("messages").doc(selectedMsgId).delete();
  el("menu").style.display="none";
};

window.editMsg = async ()=>{
  const text = prompt("Новое сообщение:");
  if(!text) return;

  await db.collection("messages").doc(selectedMsgId).update({
    text
  });

  el("menu").style.display="none";
};

/* LOGOUT */
el("logoutBtn").onclick = ()=> auth.signOut();

};
