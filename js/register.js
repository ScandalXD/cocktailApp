import { register } from "./auth.js";

const nameEl = document.getElementById("name");
const emailEl = document.getElementById("email");
const passEl = document.getElementById("password");
const regBtn = document.getElementById("regBtn");
const msg = document.getElementById("msg");

function showMsg(text) {
  msg.textContent = text;
  msg.hidden = false;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

regBtn.addEventListener("click", async () => {
  msg.hidden = true;

  const name = (nameEl.value || "").trim();
  const email = (emailEl.value || "").trim().toLowerCase();
  const password = passEl.value || "";

  if (!name) return showMsg("Podaj imię.");
  if (!email) return showMsg("Podaj email.");
  if (!isValidEmail(email)) return showMsg("Podaj poprawny adres email.");
  if (!password) return showMsg("Hasło nie może być puste.");

  try {
    await register({ email, name, password });
    location.href = "index.html";
  } catch (e) {
    console.error(e);
    if (e?.message === "EMAIL_EXISTS") {
      showMsg("Konto z tym emailem już istnieje.");
    } else {
      showMsg("Błąd rejestracji.");
    }
  }
});
