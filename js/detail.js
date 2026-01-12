import { initPWA } from "./app.js";
import { getCurrentUser } from "./auth.js";
import {
  getCatalogById,
  getUserCocktailById,
  deleteUserCocktail,
  updateUser,
} from "./db.js";

initPWA();

let user = await getCurrentUser();
if (!user) {
  location.href = "login.html";
  throw new Error("Not authenticated");
}

const params = new URLSearchParams(location.search);
const id = params.get("id");
const isCatalog = params.get("cat") === "1";
const isOwn = params.get("own") === "1";

const content = document.getElementById("content");
const notFound = document.getElementById("notFound");
const subtitle = document.getElementById("subtitle");
const deleteBtn = document.getElementById("deleteBtn");
const editBtn = document.getElementById("editBtn");
const backBtn = document.getElementById("backBtn");

backBtn.addEventListener("click", () => {
  if (history.length > 1) history.back();
  else location.href = "index.html";
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[m]));
}

let cocktail = null;

if (isCatalog) cocktail = await getCatalogById(id);
else if (isOwn) cocktail = await getUserCocktailById(id);

if (!cocktail) {
  content.innerHTML = "";
  notFound.hidden = false;
  deleteBtn.disabled = true;
  throw new Error("Not found");
}

notFound.hidden = true;
subtitle.textContent = cocktail.name || "Koktajl";

if (editBtn) {
  if (isOwn && cocktail.ownerId === user.id) {
    editBtn.hidden = false;
    editBtn.addEventListener("click", () => {
      location.href = `edit.html?id=${encodeURIComponent(cocktail.id)}`;
    });
  } else {
    editBtn.hidden = true;
  }
}


let imgHtml = "";
if (cocktail.imageBlob) {
  const url = URL.createObjectURL(cocktail.imageBlob);
  imgHtml = `<img class="preview-img" style="width:100%;max-height:340px;object-fit:cover" src="${url}" alt="Zdjęcie koktajlu" />`;
  setTimeout(() => URL.revokeObjectURL(url), 8000);
}

let audioHtml = `<div class="hint">Brak notatki audio.</div>`;
if (cocktail.audioBlob) {
  const aurl = URL.createObjectURL(cocktail.audioBlob);
  audioHtml = `<audio class="audio" controls src="${aurl}"></audio>`;
  setTimeout(() => URL.revokeObjectURL(aurl), 12000);
}

content.innerHTML = `
  <h2>${escapeHtml(cocktail.name || "")}</h2>
  <div class="meta">
    <span class="badge"><span class="badge-dot"></span>${escapeHtml(cocktail.category || "Bez kategorii")}</span>
    <span class="badge">📅 ${cocktail.createdAt ? new Date(cocktail.createdAt).toLocaleString() : ""}</span>
  </div>

  ${imgHtml}

  <div class="block">
    <b>Składniki</b>
    <pre>${escapeHtml(cocktail.ingredients || "(brak)")}</pre>
  </div>

  <div class="block">
    <b>Instrukcja</b>
    <pre>${escapeHtml(cocktail.instructions || "(brak)")}</pre>
  </div>

  <div class="block">
    <b>Audio</b>
    ${audioHtml}
  </div>
`;



if (!isOwn) {
  deleteBtn.hidden = true;
} else {
  deleteBtn.hidden = false;
  deleteBtn.disabled = false;

  if (cocktail.ownerId !== user.id) {
    deleteBtn.disabled = true;
  }

  deleteBtn.addEventListener("click", async () => {
    if (!confirm("Na pewno usunąć ten przepis?")) return;
    await deleteUserCocktail(cocktail.id);
    location.href = "profile.html";
  });
}
