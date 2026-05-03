let user=null;
let userData={};
let editingId=null;
let openedActions=null;

function el(id){return document.getElementById(id);}

function toBase64(file){
  return new Promise(res=>{
    const r=new FileReader();
    r.onload=()=>res(r.result);
    r.readAsDataURL(file);
  });
}

window.onload=function(){

document.body.onclick=()=>{
  if(openedActions){
    openedActions.style.display="none";
    openedActions=null;
  }
};

/* AUTH */
el("loginBtn").onclick=()=>auth.signInWithEmailAndPassword(el("email").value,el("password").value);

el("registerBtn").onclick=async ()=>{
  const c=await auth.createUserWithEmailAndPassword(el("email").value,el("password").value);
  await db.collection("users").doc(c.user.uid).set({name:"User",avatar:""});
};

el("guestBtn").onclick=()=>auth.signInAnonymously();
el("logoutBtn").onclick=()=>auth.signOut();

/* ПРОФИЛЬ */
el("profileBtn").onclick=(e)=>{
  e.stopPropagation();
  el("profile").classList.remove("hidden");
};

el("profile").onclick=(e)=>{
  if(e.target.id==="profile"){
    el("profile").classList.add("hidden");
  }
};

el("saveProfile").onclick=async ()=>{
  const name=el("nameInput").value.trim();
  const file=el("avatarInput").files[0];

  let avatar=userData.avatar||"";

  if(file){
    avatar=await toBase64(file);
  }

  await db.collection("users").doc(user.uid).set({name,avatar});

  userData.name=name;
  userData.avatar=avatar;

  el("profile").classList.add("hidden");
};

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

  const ref=db.collection("users").doc(user.uid);
  if(!(await ref.get()).exists){
    await ref.set({name:"User",avatar:""});
  }

  userData=(await ref.get()).data();

  loadMessages();
});

/* SEND */
el("sendBtn").onclick=async ()=>{
  const text=el("msgInput").value.trim();
  const file=el("fileInput").files[0];

  if(!text && !file) return;

  if(editingId){
    await db.collection("messages").doc(editingId).update({
      text,
      edited:true
    });

    editingId=null;
    el("sendBtn").innerText="➤";
    el("msgInput").value="";
    return;
  }

  let fileData="";
  if(file){
    fileData=await toBase64(file);
  }

  await db.collection("messages").add({
    text,
    file:fileData,
    uid:user.uid,
    name:userData.name,
    avatar:userData.avatar,
    time:Date.now(),
    edited:false
  });

  el("msgInput").value="";
  el("fileInput").value="";
};

/* EDIT */
function startEdit(id,text){
  editingId=id;
  el("msgInput").value=text;
  el("sendBtn").innerText="Сохранить";
}

/* LOAD */
function loadMessages(){
  db.collection("messages").orderBy("time")
  .onSnapshot(snap=>{
    const c=el("messages");
    c.innerHTML="";

    snap.forEach(doc=>{
      const m=doc.data();
      const isMe=m.uid===user.uid;

      const row=document.createElement("div");
      row.className="msg-row "+(isMe?"my-row":"other-row");

      const avatar=document.createElement("img");
      avatar.className="avatar";
      avatar.src=m.avatar||"https://via.placeholder.com/40";

      const msg=document.createElement("div");
      msg.className="msg";

      msg.innerHTML=`
        <div class="name">${m.name||"User"}</div>
        <div>${m.text||""}</div>
        ${
          m.file && m.file.startsWith("data:image")
          ? `<img src="${m.file}">`
          : m.file
          ? `<a href="${m.file}" target="_blank">📎 файл</a>`
          : ""
        }
        <div class="meta">
          ${new Date(m.time).toLocaleTimeString()}
          ${m.edited?"(изменено)":""}
        </div>
      `;

      /* КНОПКИ */
      if(isMe){
        const actions=document.createElement("div");
        actions.className="actions";

        const eBtn=document.createElement("button");
        eBtn.innerText="✏️";
        eBtn.onclick=(e)=>{
          e.stopPropagation();
          startEdit(doc.id,m.text);
        };

        const dBtn=document.createElement("button");
        dBtn.innerText="❌";
        dBtn.onclick=(e)=>{
          e.stopPropagation();
          db.collection("messages").doc(doc.id).delete();
        };

        actions.appendChild(eBtn);
        actions.appendChild(dBtn);
        msg.appendChild(actions);

        msg.onclick=(e)=>{
          e.stopPropagation();

          if(openedActions && openedActions!==actions){
            openedActions.style.display="none";
          }

          actions.style.display="flex";
          openedActions=actions;
        };
      }

      /* порядок: у тебя справа */
      if(isMe){
        row.appendChild(msg);
        row.appendChild(avatar);
      }else{
        row.appendChild(avatar);
        row.appendChild(msg);
      }

      c.appendChild(row);
    });

    c.scrollTop=c.scrollHeight;
  });
}
