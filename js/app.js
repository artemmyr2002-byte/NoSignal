let user=null;
let currentChat=null;

function el(id){return document.getElementById(id);}

/* AUTH */
loginBtn.onclick=async ()=>{
  const u=username.value;
  const p=password.value;

  const snap=await db.collection("users")
    .where("username","==",u).get();

  const data=snap.docs[0].data();
  await auth.signInWithEmailAndPassword(data.email,p);
};

registerBtn.onclick=async ()=>{
  const u=username.value;
  const e=email.value;
  const p=password.value;

  const cred=await auth.createUserWithEmailAndPassword(e,p);

  await db.collection("users").doc(cred.user.uid).set({
    username:u,
    email:e
  });
};

/* STATE */
auth.onAuthStateChanged(u=>{
  if(!u) return;
  user=u;
  loadChats();
});

/* ЧАТЫ */
function loadChats(){
  db.collection("chats")
  .where("users","array-contains",user.uid)
  .onSnapshot(snap=>{
    chatList.innerHTML="";

    snap.forEach(doc=>{
      const d=doc.data();

      const div=document.createElement("div");
      div.className="chat-item";
      div.innerText="Чат";

      div.onclick=()=>{
        currentChat=doc.id;
        loadMessages();
      };

      chatList.appendChild(div);
    });
  });
}

/* ОТПРАВКА */
sendBtn.onclick=async ()=>{
  const text=msgInput.value;

  await db.collection("chats")
    .doc(currentChat)
    .collection("messages")
    .add({
      text,
      uid:user.uid,
      time:Date.now()
    });

  msgInput.value="";
};

/* ЗАКРЕП */
async function pinMessage(id,text){
  await db.collection("chats").doc(currentChat).update({
    pinned:{id,text}
  });
}

function loadPinned(){
  db.collection("chats").doc(currentChat)
  .onSnapshot(doc=>{
    const d=doc.data();

    if(d.pinned){
      pinnedBar.classList.remove("hidden");
      pinnedBar.innerText="📌 "+d.pinned.text;

      pinnedBar.onclick=()=>{
        document.getElementById(d.pinned.id)?.scrollIntoView();
      };
    }else{
      pinnedBar.classList.add("hidden");
    }
  });
}

/* СООБЩЕНИЯ */
function loadMessages(){
  loadPinned();

  db.collection("chats")
    .doc(currentChat)
    .collection("messages")
    .orderBy("time")
    .onSnapshot(snap=>{
      messages.innerHTML="";

      snap.forEach(doc=>{
        const m=doc.data();

        const div=document.createElement("div");
        div.className="msg "+(m.uid===user.uid?"my":"other");
        div.id=doc.id;

        div.innerHTML=`
          ${m.text}
          <br>
          <button onclick="pinMessage('${doc.id}','${m.text}')">📌</button>
        `;

        messages.appendChild(div);
      });

      messages.scrollTop=messages.scrollHeight;
    });
}
