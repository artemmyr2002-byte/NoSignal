window.showAuth = function(){
  document.getElementById("auth").classList.remove("hidden");
  document.getElementById("app").classList.add("hidden");
};

window.showApp = function(){
  document.getElementById("auth").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
};

window.setupUI = function(){

document.getElementById("profileBtn").onclick = async ()=>{
  if(!currentUser) return;

  const ref = db.collection("users").doc(currentUser.uid);
  const data = (await ref.get()).data();

  profileModal.classList.remove("hidden");
  nameInput.value = data.name;
  avatar.src = data.avatar;
};

document.getElementById("closeProfile").onclick = ()=>{
  profileModal.classList.add("hidden");
};

document.getElementById("saveProfile").onclick = async ()=>{
  if(!currentUser) return alert("Не вошёл");

  const name = nameInput.value.trim();
  if(!name) return alert("Введите имя");

  await db.collection("users").doc(currentUser.uid).update({ name });

  userName.innerText = name;
  profileModal.classList.add("hidden");
};

document.getElementById("logoutBtn").onclick = ()=>{
  auth.signOut();
};

};
