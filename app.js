const firebaseConfig = {
  apiKey: "AIzaSyBo9z598gFXbx9pH9zLGS4Uncx0hDg",
  authDomain: "voidlauncher-bab33.firebaseapp.com",
  projectId: "voidlauncher-bab33",
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();

let me = null;

/* OPEN AUTH */
window.openAuth = ()=> {
  document.getElementById("authModal").classList.remove("hidden");
};

/* CLOSE AUTH ON LOGIN */
function closeAuth(){
  document.getElementById("authModal").classList.add("hidden");
  document.getElementById("loginBtn").style.display="none";
}

/* GOOGLE */
window.googleLogin = async ()=> {
  const provider = new firebase.auth.GoogleAuthProvider();
  await auth.signInWithPopup(provider);
};

/* ANON */
window.anonLogin = async ()=> {
  await auth.signInAnonymously();
};

/* EMAIL */
window.emailLogin = async ()=> {
  const email = email.value;
  const pass = pass.value;
  await auth.signInWithEmailAndPassword(email, pass);
};

/* AUTH STATE */
auth.onAuthStateChanged(async user=>{
  if(!user) return;

  me = user;

  closeAuth();

  start();
});

/* CHAT */
document.getElementById("msgInput").addEventListener("keydown", async e=>{
  if(e.key!=="Enter") return;

  await db.collection("messages").add({
    text:e.target.value,
    uid:me.uid,
    time:Date.now()
  });

  e.target.value="";
});

/* LOAD */
function start(){

  db.collection("messages").onSnapshot(snap=>{
    const box = document.getElementById("messages");
    box.innerHTML="";

    snap.forEach(d=>{
      box.innerHTML+=`
        <div class="msg">${d.data().text}</div>
      `;
    });

  });

}

/* VOICE (заготовка) */
window.recordVoice = async ()=>{

  alert("voice recording system will be next step");

};
