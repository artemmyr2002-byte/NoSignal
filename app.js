const firebaseConfig = {
  apiKey: "AIzaSyBo9z598gFXbx9pH9zLGS4Uncx0hDg",
  authDomain: "voidlauncher-bab33.firebaseapp.com",
  projectId: "voidlauncher-bab33",
  storageBucket: "voidlauncher-bab33.firebasestorage.app",
  messagingSenderId: "273997309805",
  appId: "1:273997309805:web:a43ce719cb30fcf9dc9c64"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

/* простой пользователь */
const username = "User_" + Math.floor(Math.random()*10000);

/* отправка */
window.sendMsg = async function(){

  const input = document.getElementById("msgInput");
  const text = input.value.trim();

  if(!text) return;

  try{
    await db.collection("messages").add({
      text,
      user: username,
      time: Date.now()
    });
  }catch(e){
    console.log("send error", e);
  }

  input.value="";
};

/* enter */
document.getElementById("msgInput").addEventListener("keydown", e=>{
  if(e.key==="Enter") sendMsg();
});

/* загрузка */
db.collection("messages")
.orderBy("time")
.onSnapshot(snap=>{

  const box = document.getElementById("messages");
  box.innerHTML="";

  snap.forEach(doc=>{

    const m = doc.data();
    const isMe = m.user === username;

    box.innerHTML += `
      <div class="msg ${isMe ? "right" : ""}">
        <div class="bubble ${isMe ? "gradient" : "orange"}">
          ${m.text}
        </div>
      </div>
    `;
  });

  box.scrollTop = box.scrollHeight;

});
