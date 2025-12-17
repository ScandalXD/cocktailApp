import { initPWA } from "./app.js";
import { getCurrentUser, logout } from "./auth.js";
import { getCatalog, getUserCocktails, getUserById } from "./db.js";

initPWA();

let user = await getCurrentUser();
if (!user) {
  location.href = "login.html";
  throw new Error("Not authenticated");
}

const who = document.getElementById("who");
const listEl = document.getElementById("list");
const emptyEl = document.getElementById("empty");
const tabTitle = document.getElementById("tabTitle");

const favTab = document.getElementById("favTab");
const ownTab = document.getElementById("ownTab");
const logoutBtn = document.getElementById("logoutBtn");

let mode = "fav";

function tileHref(itemType, id) {
  return itemType === "catalog"
    ? `detail.html?cat=1&id=${encodeURIComponent(id)}`
    : `detail.html?own=1&id=${encodeURIComponent(id)}`;
}

function renderTiles(items, itemType) {
  for (const c of items) {
    const a = document.createElement("a");
    a.className = "tile";
    a.href = tileHref(itemType, c.id);

    const img = document.createElement("img");
    img.className = "tile-img";
    img.alt = c.name || "Cocktail";

    if (c.imageBlob) {
      const url = URL.createObjectURL(c.imageBlob);
      img.src = url;
      img.onload = () => URL.revokeObjectURL(url);
    } else {
      img.src = "data:image/svg+xml;base64," + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
          <rect width="100%" height="100%" fill="rgba(255,255,255,0.06)"/>
          <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
            fill="rgba(255,255,255,0.65)" font-size="28">🍸</text>
        </svg>
      `);
    }

    const body = document.createElement("div");
    body.className = "tile-body";

    const title = document.createElement("div");
    title.className = "tile-title";
    title.textContent = c.name || "(bez nazwy)";

    const badge = document.createElement("div");
    badge.className = "badge";
    badge.innerHTML = `<span class="badge-dot"></span>${c.category || "Bez kategorii"}`;

    body.appendChild(title);
    body.appendChild(badge);

    a.appendChild(img);
    a.appendChild(body);
    listEl.appendChild(a);
  }
}

async function refresh() {
  user = await getUserById(user.id);

  who.textContent = `${user.name || ""} (${user.email})`;

  listEl.innerHTML = "";
  emptyEl.hidden = true;

  if (mode === "fav") {
    tabTitle.textContent = "Ulubione";
    favTab.className = "btn btn-primary";
    ownTab.className = "btn btn-ghost";

    const favSet = new Set(user.favorites || []);

    const [catalog, owns] = await Promise.all([
      getCatalog(),
      getUserCocktails(user.id),
    ]);

    const favCatalog = catalog.filter(c => favSet.has(`cat:${c.id}`));
    const favOwns = owns.filter(c => favSet.has(`own:${c.id}`));

    if (!favCatalog.length && !favOwns.length) {
      emptyEl.hidden = false;
      return;
    }

    renderTiles(favCatalog, "catalog");
    renderTiles(favOwns, "own");
    return;
  }

  if (mode === "own") {
    tabTitle.textContent = "Owns";
    ownTab.className = "btn btn-primary";
    favTab.className = "btn btn-ghost";

    const owns = await getUserCocktails(user.id);
    if (!owns.length) {
      emptyEl.hidden = false;
      return;
    }

    renderTiles(owns, "own");
  }
}

favTab.addEventListener("click", async () => {
  mode = "fav";
  await refresh();
});

ownTab.addEventListener("click", async () => {
  mode = "own";
  await refresh();
});

logoutBtn.addEventListener("click", () => {
  logout();
  location.href = "login.html";
});

await refresh();
