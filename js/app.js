let user=null;
let openedMenu=null;

function el(id){return document.getElementById(id);}

/* 🔥 ГРАДИЕНТ */
function getUserGradient(uid){
  if(!uid) uid="x";

  let hash=0;
  for(let i=0;i<uid.length;i++){
    hash=uid.charCodeAt(i)+((hash<<5)-hash);
  }

  const h=Math.abs(hash%360);

  return `linear-gradient(135deg, hsl(${h},70%,45%), hsl(${(h+40)%360},70%,55%))`;
}

window.onload=function(){

/* закрытие меню */
document.body.onclick=()=>{
  if(openedMenu){
    openedMenu.style.display="none";
    openedMenu=null;
  }
};

/* 🔥 ВЫХОД */
el("logoutBtn").onclick=()=>{
  auth.signOut();
};

/* AUTH */
el("loginBtn").onclick=()=>auth.signInWithEmailAndPassword(el("email").value,el("password").value);

el("registerBtn").onclick=async ()=>{
  const c=await auth.createUserWithEmailAndPassword(el("email").value,el("password").value);
  await db.collection("users").doc(c.user.uid).set({name:"User"});
};

el("guestBtn").onclick=()=>auth.signInAnonymously();

/* STATE */
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

  /* 🔥 СРАЗУ ВНИЗ */
  setTimeout(()=>{
    const c=el("messages");
    c.scrollTop=c.scrollHeight;
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

  /* 🔥 ВНИЗ ПОСЛЕ ОТПРАВКИ */
  const c=el("messages");
  setTimeout(()=>{
    c.scrollTop=c.scrollHeight;
  },50);
};

/* ЗАГРУЗКА */
function loadMessages(){
  db.collection("messages").orderBy("time")
  .onSnapshot(snap=>{
    const c=el("messages");

    const atBottom=c.scrollHeight-c.scrollTop<=c.clientHeight+80;

    c.innerHTML="";

    snap.forEach(doc=>{
      const m=doc.data();
      const d=document.createElement("div");

      const isMe = m.uid===user.uid;

      d.className="msg "+(isMe?"my":"other");

      /* 🔥 ГРАДИЕНТ */
      d.style.background = getUserGradient(m.uid);

      d.innerHTML=`
        ${m.text}
        <div class="meta">${new Date(m.time).toLocaleTimeString()} ${isMe?"✓✓":""}</div>
      `;

      /* МЕНЮ */
      if(isMe){
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

    /* 🔥 УМНЫЙ СКРОЛЛ */
    if(atBottom){
      setTimeout(()=>{
        c.scrollTop=c.scrollHeight;
      },50);
    }
  });
}

};
