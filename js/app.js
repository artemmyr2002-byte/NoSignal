let user=null;
let userData={};
let currentChat="global";

/* утилиты */
function el(id){return document.getElementById(id);}

function getGradient(uid){
  let h=0;
  for(let i=0;i<uid.length;i++){
    h=uid.charCodeAt(i)+((h<<5)-h);
  }
  return `hsl(${Math.abs(h%360)},70%,50%)`;
}

function getAvatar(m){
  if(m.avatar){
    const img=document.createElement("img");
    img.src=m.avatar;
    img.className="avatar";
    img.onclick=()=>openProfile(m.uid);
    return img;
  }

  const d=document.createElement("div");
  d.className="avatar-fallback";
  d.style.background=getGradient(m.uid);
  d.innerText=(m.name||"U")[0];
  d.onclick=()=>openProfile(m.uid);
  return d;
}

/* AUTH */
loginBtn.onclick=async ()=>{
  const snap=await db.collection("users")
    .where("username","==",username.value)
    .get();

  const data=snap.docs[0].data();
  await auth.signInWithEmailAndPassword(data.email,password.value);
};

registerBtn.onclick=async ()=>{
  const cred=await auth.createUserWithEmailAndPassword(email.value,password.value);

  await db.collection("users").doc(cred.user.uid).set({
    username:username.value,
    email:email.value,
    name:"User",
    bio:"",
    avatar:""
  });
};

/* STATE */
auth.onAuthStateChanged(async u=>{
  if(!u) return;

  user=u;
  el("auth").classList.add("hidden");
  el("app").classList.remove("hidden");

  userData=(await db.collection("users").doc(user.uid).get()).data();

  loadMessages();
});

/* SEND */
sendBtn.onclick=async ()=>{
  const text=msgInput.value;
  const file=fileInput.files[0];

  let fileData="";
  if(file){
    const r=new FileReader();
    r.onload=async ()=>{
      fileData=r.result;
      send(text,fileData);
    };
    r.readAsDataURL(file);
  }else{
    send(text,"");
  }

  msgInput.value="";
};

async function send(text,file){
  await db.collection("messages").add({
    text,
    file,
    uid:user.uid,
    name:userData.name,
    avatar:userData.avatar,
    time:Date.now(),
    reactions:{}
  });
}

/* PIN */
async function pin(id,text){
  await db.collection("meta").doc("global").set({
    pinned:{id,text}
  });
}

/* PROFILE */
async function openProfile(uid){
  const d=(await db.collection("users").doc(uid).get()).data();

  profileName.innerText=d.name;
  profileUsername.innerText="@"+d.username;
  profileBio.innerText=d.bio||"";

  userProfile.classList.remove("hidden");
}

/* LOAD */
function loadMessages(){

  db.collection("meta").doc("global")
  .onSnapshot(doc=>{
    const d=doc.data();
    if(!d || !d.pinned) return;

    pinnedBar.classList.remove("hidden");
    pinnedBar.innerText="📌 "+d.pinned.text;

    pinnedBar.onclick=()=>{
      document.getElementById(d.pinned.id)?.scrollIntoView();
    };
  });

  db.collection("messages")
  .orderBy("time")
  .onSnapshot(snap=>{
    messages.innerHTML="";

    snap.forEach(doc=>{
      const m=doc.data();

      const row=document.createElement("div");
      row.style.display="flex";
      row.style.gap="8px";

      const avatar=getAvatar(m);

      const msg=document.createElement("div");
      msg.className="msg "+(m.uid===user.uid?"my":"other");
      msg.style.background=getGradient(m.uid);

      let fileHTML="";
      if(m.file){
        if(m.file.startsWith("data:image")){
          fileHTML=`<img src="${m.file}">`;
        }else if(m.file.startsWith("data:video")){
          fileHTML=`<video src="${m.file}" controls></video>`;
        }
      }

      let reactionsHTML="";
      for(let r in m.reactions){
        reactionsHTML+=`<span class="reaction">${r} ${m.reactions[r]}</span>`;
      }

      msg.innerHTML=`
        <b>${m.name}</b>
        <div>${m.text}</div>
        ${fileHTML}
        <div class="reactions">${reactionsHTML}</div>
        <button onclick="pin('${doc.id}','${m.text}')">📌</button>
      `;

      if(m.uid===user.uid){
        row.appendChild(msg);
        row.appendChild(avatar);
      }else{
        row.appendChild(avatar);
        row.appendChild(msg);
      }

      messages.appendChild(row);
    });

    messages.scrollTop=messages.scrollHeight;
  });
}
