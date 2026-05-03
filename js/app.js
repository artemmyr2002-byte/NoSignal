let user = null;

function el(id){ return document.getElementById(id); }

window.onload = function(){

/* ===== AUTH ===== */

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

/* ===== STATE ===== */

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

  loadMessages(); // 👉 старт чата
});

/* ===== PROFILE ===== */

el("profileBtn").onclick = ()=>{
  if(!user) return;
  el("profile").classList.remove("hidden");
};

el("closeProfile").onclick = ()=>{
  el("profile").classList.add("hidden");
};

el("saveName").onclick = async ()=>{
  if(!user) return;

  const name = el("newName").value.trim();
  if(!name) return;

  await db.collection("users").doc(user.uid).update({ name });

  el("name").innerText = name;
  el("profile").classList.add("hidden");
};

/* ===== CHAT ===== */

el("sendBtn").onclick = sendMessage;

el("msgInput").addEventListener("keydown", e=>{
  if(e.key === "Enter") sendMessage();
});

async function sendMessage(){
  if(!user) return;

  const text = el("msgInput").value.trim();
  if(!text) return;

  const userDoc = await db.collection("users").doc(user.uid).get();
  const name = userDoc.data().name;

  await db.collection("messages").add({
    text,
    name,
    time: Date.now()
  });

  el("msgInput").value = "";
}

function loadMessages(){
  db.collection("messages")
    .orderBy("time")
    .onSnapshot(snap=>{
      el("messages").innerHTML = "";

      snap.forEach(doc=>{
        const m = doc.data();

        const div = document.createElement("div");
        div.className = "msg";
        div.innerText = m.name + ": " + m.text;

        el("messages").appendChild(div);
      });

      el("messages").scrollTop = el("messages").scrollHeight;
    });
}

/* ===== LOGOUT ===== */

el("logoutBtn").onclick = ()=>{
  auth.signOut();
};

};
