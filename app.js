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
const auth = firebase.auth();

let me;

/* LOGIN */
auth.signInAnonymously().then(async u=>{
  me = u.user;

  await db.collection("users").doc(me.uid).set({
    name:"User_"+me.uid.slice(0,5),
    online:true
  },{merge:true});

  loadMessages();
  loadUsers();
});

/* SEND MESSAGE */
msgInput.addEventListener("keydown", async e=>{
  if(e.key !== "Enter") return;

  const text = msgInput.value.trim();
  if(!text) return;

  await db.collection("messages").add({
    text,
    name: me.uid,
    timestamp: Date.now()
  });

  msgInput.value="";
});

/* FILE → BASE64 */
fileInput.addEventListener("change", e=>{
  const file = e.target.files[0];

  const reader = new FileReader();

  reader.onload = async ()=>{

    await db.collection("messages").add({
      fileData: reader.result, // BASE64
      fileName: file.name,
      name: me.uid,
      timestamp: Date.now()
    });

  };

  reader.readAsDataURL(file);
});

/* LOAD MESSAGES */
function loadMessages(){

  db.collection("messages")
  .orderBy("timestamp")
  .onSnapshot(snap=>{

    messages.innerHTML="";

    snap.forEach(doc=>{
      const m = doc.data();

      if(m.fileData){

        if(m.fileData.startsWith("data:image")){
          messages.innerHTML += `
            <div>
              <b>${m.name}</b><br>
              <img src="${m.fileData}" style="max-width:200px;border-radius:10px">
            </div>
          `;
        } else {
          messages.innerHTML += `
            <div>
              <b>${m.name}</b><br>
              📄 ${m.fileName}
            </div>
          `;
        }

      } else {
        messages.innerHTML += `
          <div>
            <b>${m.name}</b>: ${m.text}
          </div>
        `;
      }

    });

    messages.scrollTop = messages.scrollHeight;
  });

}

/* USERS */
function loadUsers(){

  db.collection("users").onSnapshot(snap=>{

    users.innerHTML="";

    snap.forEach(doc=>{
      const u = doc.data();

      users.innerHTML += `
        <div>
          ${u.online ? "🟢" : "⚪"} ${u.name}
        </div>
      `;
    });

  });

}