let user=null;
let userData={};

let editingId=null; // 🔥 редактируемое сообщение

function el(id){return document.getElementById(id);}

/* base64 */
function toBase64(file){
  return new Promise(res=>{
    const r=new FileReader();
    r.onload=()=>res(r.result);
    r.readAsDataURL(file);
  });
}

window.onload=function(){

/* AUTH */
el("loginBtn").onclick=()=>auth.signInWithEmailAndPassword(el("email").value,el("password").value);

el("registerBtn").onclick=async ()=>{
  const c=await auth.createUserWithEmailAndPassword(el("email").value,el("password").value);
  await db.collection("users").doc(c.user.uid).set({
    name:"User",
    avatar:""
  });
};

el("guestBtn").onclick=()=>auth.signInAnonymously();

el("logoutBtn").onclick=()=>auth.signOut();

/* PROFILE */
el("profileBtn").onclick=()=>{
  el("profile").classList.remove("hidden");
};

el("saveProfile").onclick=async ()=>{
  const name=el("nameInput").value;
  const file=el("avatarInput").files[0];

  let avatar=userData.avatar || "";

  if(file){
    avatar=await toBase64(file);
  }

  await db.collection("users").doc(user.uid).set({
    name,
    avatar
  });

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

/* 🔥 ОТПРАВКА / РЕДАКТИРОВАНИЕ */
el("sendBtn").onclick=async ()=>{

  const text=el("msgInput").value.trim();
  const file=el("fileInput").files[0];

  if(!text && !file) return;

  /* 🔥 ЕСЛИ РЕДАКТИРУЕМ */
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

  /* обычная отправка */
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

/* 🔥 НАЧАТЬ РЕДАКТИРОВАНИЕ */
function startEdit(id, text){
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
      const d=document.createElement("div");

      const isMe = m.uid===user.uid;

      d.className="msg "+(isMe?"my":"other");
      d.style.background="linear-gradient(135deg,#00a884,#008069)";

      d.innerHTML=`
        <div class="name">${m.name||"User"}</div>

        ${m.avatar?`<img src="${m.avatar}" width="30">`:""}

        <div>${m.text||""}</div>

        ${m.file?`<a href="${m.file}" target="_blank">📎 файл</a>`:""}

        <div class="meta">
          ${new Date(m.time).toLocaleTimeString()}
          ${m.edited?"(изменено)":""}
        </div>
      `;

      /* 🔥 КНОПКИ У СООБЩЕНИЯ */
      if(isMe){
        const editBtn=document.createElement("button");
        editBtn.innerText="✏️";
        editBtn.onclick=(e)=>{
          e.stopPropagation();
          startEdit(doc.id, m.text);
        };

        const delBtn=document.createElement("button");
        delBtn.innerText="❌";
        delBtn.onclick=(e)=>{
          e.stopPropagation();
          db.collection("messages").doc(doc.id).delete();
        };

        const box=document.createElement("div");
        box.style.display="flex";
        box.style.gap="5px";

        box.appendChild(editBtn);
        box.appendChild(delBtn);

        d.appendChild(box);
      }

      c.appendChild(d);
    });

    c.scrollTop=c.scrollHeight;
  });
}

};
