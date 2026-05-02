const msgInput = document.getElementById("msgInput");
const messages = document.getElementById("messages");
const users = document.getElementById("users");

let user = "User_" + Math.floor(Math.random()*9999);

/* LOAD */
function load(){

  let data = JSON.parse(localStorage.getItem("msgs") || "[]");

  messages.innerHTML = "";

  data.forEach(m=>{
    messages.innerHTML += `
      <div><b>${m.user}</b>: ${m.text}</div>
    `;
  });

  messages.scrollTop = messages.scrollHeight;
}

load();

/* SEND */
msgInput.addEventListener("keydown", e=>{
  if(e.key !== "Enter") return;

  let text = msgInput.value.trim();
  if(!text) return;

  let data = JSON.parse(localStorage.getItem("msgs") || "[]");

  data.push({
    user,
    text
  });

  localStorage.setItem("msgs", JSON.stringify(data));

  msgInput.value = "";

  load();
});

/* USERS (фейковые) */
users.innerHTML = `
  <div>🟢 ${user}</div>
  <div>🟢 Friend_1</div>
  <div>⚪ Friend_2</div>
`;
