window.currentUser = null;

function defaultAvatar(uid){
  return "https://api.dicebear.com/7.x/identicon/svg?seed=" + uid;
}

window.setupAuth = function(){

document.getElementById("loginBtn").onclick = async ()=>{
  try{
    await auth.signInWithEmailAndPassword(
      email.value,
      password.value
    );
  }catch(e){
    authError.innerText = e.message;
  }
};

document.getElementById("registerBtn").onclick = async ()=>{
  try{
    const cred = await auth.createUserWithEmailAndPassword(
      email.value,
      password.value
    );

    await db.collection("users").doc(cred.user.uid).set({
      name:"User",
      avatar: defaultAvatar(cred.user.uid)
    });

  }catch(e){
    authError.innerText = e.message;
  }
};

document.getElementById("guestBtn").onclick = ()=>{
  auth.signInAnonymously();
};

auth.onAuthStateChanged(async user=>{
  if(!user){
    currentUser = null;
    showAuth();
    return;
  }

  currentUser = user;

  showApp();

  const ref = db.collection("users").doc(user.uid);
  const doc = await ref.get();

  if(!doc.exists){
    await ref.set({
      name:user.email || "Guest",
      avatar: defaultAvatar(user.uid)
    });
  }

  const data = (await ref.get()).data();
  document.getElementById("userName").innerText = data.name;
});

};
