import { login } from "./auth.js";

const emailEl = document.getElementById("email");
const passEl = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const msg = document.getElementById("msg");

function showMsg(text) {
  msg.textContent = text;
  msg.hidden = false;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

loginBtn.addEventListener("click", async () => {
  msg.hidden = true;

  const email = (emailEl.value || "").trim().toLowerCase();
  const password = passEl.value || "";

  if (!email) return showMsg("Podaj email.");
  if (!isValidEmail(email)) return showMsg("Podaj poprawny adres email.");
  if (!password) return showMsg("Podaj hasło.");

  try {
    await login({ email, password });
    location.href = "index.html";
  } catch (e) {
    console.error(e);
    if (e?.message === "BAD_CREDENTIALS") {
      showMsg("Nieprawidłowy email lub hasło.");
    } else {
      showMsg("Błąd logowania.");
    }
  }
});
