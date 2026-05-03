let user=null;
let openedMenu=null;

function el(id){return document.getElementById(id);}

function getUserColor(uid){
  if(!uid) uid="x";
  let hash=0;
  for(let i=0;i<uid.length;i++){
    hash=uid.charCodeAt(i)+((hash<<5)-hash);
  }
  return `hsl(${Math.abs(hash%360)},70%,50%)`;
}

window.onload=function(){

document.body.onclick=()=>{
  if(openedMenu){
    openedMenu.style.display="none";
    openedMenu=null;
  }
};

el("loginBtn").onclick=()=>auth.signInWithEmailAndPassword(el("email").value,el("password").value);

el("registerBtn").onclick=async ()=>{
  const c=await auth.createUserWithEmailAndPassword(el("email").value,el("password").value);
  await db.collection("users").doc(c.user.uid).set({name:"User"});
};

el("guestBtn").onclick=()=>auth.signInAnonymously();

/* ВАЖНО — УБРАЛИ name */
auth.onAuthStateChanged(async u=>{
  if(!u){
    el("auth").classList.remove("hidden");
    el("app").classList.add("hidden");
    return;
  }

  user=u;

  el("auth").classList.add("hidden");
  el("app").classList.remove("hidden");

  loadMessages();

  setTimeout(()=>{
    el("messages").scrollTop=999999;
  },200);
});

/* ОТПРАВКА */
el("sendBtn").onclick=async ()=>{
  const text=el("msgInput").value.trim();
  if(!text) return;

  await db.collection("messages").add({
    text,
    uid:user.uid,
    time:Date.now()
  });

  el("msgInput").value="";
};

/* ЗАГРУЗКА */
function loadMessages(){
  db.collection("messages").orderBy("time")
  .onSnapshot(snap=>{
    const c=el("messages");

    const atBottom=c.scrollHeight-c.scrollTop<=c.clientHeight+50;

    c.innerHTML="";

    snap.forEach(doc=>{
      const m=doc.data();
      const d=document.createElement("div");

      d.className="msg "+(m.uid===user.uid?"my":"other");
      d.style.background=getUserColor(m.uid);

      d.innerHTML=`
        ${m.text}
        <div class="meta">${new Date(m.time).toLocaleTimeString()}</div>
      `;

      if(m.uid===user.uid){
        const menu=document.createElement("div");
        menu.className="msg-menu";

        const edit=document.createElement("button");
        edit.innerText="✏️";
        edit.onclick=(e)=>{
          e.stopPropagation();
          const t=prompt("Новое сообщение");
          if(t){
            db.collection("messages").doc(doc.id).update({text:t});
          }
        };

        const del=document.createElement("button");
        del.innerText="❌";
        del.onclick=(e)=>{
          e.stopPropagation();
          db.collection("messages").doc(doc.id).delete();
        };

        menu.appendChild(edit);
        menu.appendChild(del);
        d.appendChild(menu);

        d.onclick=(e)=>{
          e.stopPropagation();

          if(openedMenu && openedMenu!==menu){
            openedMenu.style.display="none";
          }

          menu.style.display="flex";
          openedMenu=menu;
        };
      }

      c.appendChild(d);
    });

    if(atBottom){
      setTimeout(()=>{
        c.scrollTop=c.scrollHeight;
      },50);
    }
  });
}

};
