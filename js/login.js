import { initPWA } from "./app.js";
import { login, getCurrentUser } from "./auth.js";

initPWA();

const email = document.getElementById("email");
const pass = document.getElementById("password");
const btn = document.getElementById("loginBtn");
const msg = document.getElementById("msg");

function show(t) {
  msg.textContent = t;
  msg.hidden = false;
}

(async () => {
  const u = await getCurrentUser();
  if (u) location.href = "profile.html";
})();

btn.addEventListener("click", async () => {
  msg.hidden = true;
  try {
    await login({
      email: email.value.trim().toLowerCase(),
      password: pass.value,
    });
    location.href = "profile.html";
  } catch (e) {
    show("Błędny email lub hasło.");
  }
});
