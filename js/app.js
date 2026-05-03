let user = null;
let selectedMsgId = null;

function el(id){ return document.getElementById(id); }

function getUserColor(uid){
  let hash = 0;
  for(let i=0;i<uid.length;i++){
    hash = uid.charCodeAt(i) + ((hash<<5)-hash);
  }
  const h = Math.abs(hash % 360);
  return {
    c1:`hsl(${h},70%,45%)`,
    c2:`hsl(${(h+40)%360},70%,55%)`
  };
}

window.onload = function(){

/* AUTH */
el("loginBtn").onclick = async ()=>{
  try{
    await auth.signInWithEmailAndPassword(el("email").value, el("password").value);
  }catch(e){ alert(e.message); }
};

el("registerBtn").onclick = async ()=>{
  try{
    const cred = await auth.createUserWithEmailAndPassword(el("email").value, el("password").value);
    await db.collection("users").doc(cred.user.uid).set({name:"User"});
  }catch(e){ alert(e.message); }
};

el("guestBtn").onclick = ()=>auth.signInAnonymously();

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
el("sendBtn").onclick = async ()=>{
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
};

/* LOAD */
function loadMessages(){
  db.collection("messages").orderBy("time")
  .onSnapshot(snap=>{
    const c = el("messages");
    c.innerHTML="";

    snap.forEach(doc=>{
      const m = doc.data();
      const id = doc.id;
      const isMe = m.uid===user.uid;

      const d = document.createElement("div");
      d.className="msg "+(isMe?"my":"other");

      const colors = getUserColor(m.uid||m.name);
      d.style.background=`linear-gradient(135deg,${colors.c1},${colors.c2})`;

      d.innerHTML = `
        <div class="name" style="color:${colors.c2}">${m.name}</div>
        ${m.text}
        <div class="meta">${new Date(m.time).toLocaleTimeString()} ${isMe?"✓✓":""}</div>
      `;

      if(isMe){
        d.onclick=()=>{
          selectedMsgId=id;
          el("menu").style.display="block";
        };
      }

      c.appendChild(d);
    });

    c.scrollTop=c.scrollHeight;
  });
}

/* MENU */
window.deleteMsg = async ()=>{
  await db.collection("messages").doc(selectedMsgId).delete();
  el("menu").style.display="none";
};

window.editMsg = async ()=>{
  const t = prompt("Новое сообщение");
  if(!t) return;
  await db.collection("messages").doc(selectedMsgId).update({text:t});
  el("menu").style.display="none";
};

};
