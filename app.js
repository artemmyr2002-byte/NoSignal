/* закрытие по кнопке */
window.closeModal = function(id){
  document.getElementById(id).classList.add("hidden");
};

/* открыть */
window.openModal = function(id){
  document.getElementById(id).classList.remove("hidden");
};

/* клик вне окна */
document.addEventListener("click", e=>{
  document.querySelectorAll(".modal").forEach(modal=>{
    if(e.target === modal){
      modal.classList.add("hidden");
    }
  });
});

/* ESC закрытие */
document.addEventListener("keydown", e=>{
  if(e.key === "Escape"){
    document.querySelectorAll(".modal").forEach(m=>{
      m.classList.add("hidden");
    });
  }
});
