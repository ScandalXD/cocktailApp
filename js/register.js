import { initPWA } from "./app.js";
import { register } from "./auth.js";

initPWA();

const name = document.getElementById("name");
const email = document.getElementById("email");
const pass = document.getElementById("password");
const btn = document.getElementById("regBtn");
const msg = document.getElementById("msg");

function show(t){ msg.textContent=t; msg.hidden=false; }

btn.addEventListener("click", async () => {
  msg.hidden = true;
  try{
    await register({
      name: name.value.trim(),
      email: email.value.trim().toLowerCase(),
      password: pass.value
    });
    location.href = "profile.html";
  }catch(e){
    if (e.message === "EMAIL_EXISTS") show("Email już istnieje.");
    else show("Błąd rejestracji.");
  }
});
