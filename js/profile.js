import { initPWA } from "./app.js";
import { getCurrentUser, logout } from "./auth.js";
import { getCatalog, getUserCocktails, getUserById, updateUser } from "./db.js";

initPWA();

let user = await getCurrentUser();
if (!user) {
  location.href = "login.html";
  throw new Error("Not authenticated");
}

const who = document.getElementById("who");
const listEl = document.getElementById("list");
const emptyEl = document.getElementById("empty");
const favTab = document.getElementById("favTab");
const ownTab = document.getElementById("ownTab");
const logoutBtn = document.getElementById("logoutBtn");
const allBtn = document.getElementById("allBtn");
const alcBtn = document.getElementById("alcBtn");
const nonBtn = document.getElementById("nonBtn");

let mode = "own";
let filter = "all";
let currentCatalog = [];
let currentOwn = [];

const tab = new URLSearchParams(location.search).get("tab");
if (tab === "fav") mode = "fav";
if (tab === "own") mode = "own";

function setMode(next) {
  mode = next;

  const url = new URL(location.href);
  url.searchParams.set("tab", mode);
  history.replaceState(null, "", url.toString());

  refresh();
}

function setFilter(next) {
  filter = next;

  allBtn?.classList.toggle("btn-primary", filter === "all");
  allBtn?.classList.toggle("btn-ghost", filter !== "all");

  alcBtn?.classList.toggle("btn-primary", filter === "alc");
  alcBtn?.classList.toggle("btn-ghost", filter !== "alc");

  nonBtn?.classList.toggle("btn-primary", filter === "non");
  nonBtn?.classList.toggle("btn-ghost", filter !== "non");

  applyFiltersAndRender();
}

function applyFilterArr(arr) {
  return arr.filter(
    (c) =>
      filter === "all" ||
      (filter === "alc" && c.category === "Alkoholowy") ||
      (filter === "non" && c.category === "Bezalkoholowy")
  );
}

function applyFiltersAndRender() {
  listEl.innerHTML = "";
  emptyEl.hidden = true;

  if (mode === "fav") {
    const favCatalog = applyFilterArr(currentCatalog);
    const favOwn = applyFilterArr(currentOwn);

    if (!favCatalog.length && !favOwn.length) {
      emptyEl.hidden = false;
      return;
    }

    renderTiles(favCatalog, "catalog");
    renderTiles(favOwn, "own");
    return;
  }

  const ownFiltered = applyFilterArr(currentOwn);
  if (!ownFiltered.length) {
    emptyEl.hidden = false;
    return;
  }

  renderTiles(ownFiltered, "own");
}

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

    const fav = document.createElement("button");
    fav.type = "button";
    fav.className = "fav-icon";

    const key = itemType === "catalog" ? `cat:${c.id}` : `own:${c.id}`;

    const isFav = (user.favorites || []).includes(key);
    fav.textContent = isFav ? "❤️" : "🤍";
    fav.classList.toggle("active", isFav);

    fav.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const set = new Set(user.favorites || []);
      if (set.has(key)) set.delete(key);
      else set.add(key);

      user.favorites = [...set];
      await updateUser(user);

      const nowFav = set.has(key);
      fav.textContent = nowFav ? "❤️" : "🤍";
      fav.classList.toggle("active", nowFav);
    });

    a.appendChild(fav);

    const img = document.createElement("img");
    img.className = "tile-img";
    img.alt = c.name || "Cocktail";

    if (c.imageBase64) {
      img.src = c.imageBase64;
    } else if (c.image) {
      img.src = c.image;
    } else {
      const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
      <rect width="100%" height="100%" fill="rgba(255,255,255,0.06)"/>
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
        fill="rgba(255,255,255,0.65)" font-size="28">🍸</text>
    </svg>
  `;
      img.src = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
    }

    const body = document.createElement("div");
    body.className = "tile-body";

    const title = document.createElement("div");
    title.className = "tile-title";
    title.textContent = c.name || "(bez nazwy)";

    const badge = document.createElement("div");
    badge.className = "badge";
    badge.innerHTML = `<span class="badge-dot"></span>${
      c.category || "Bez kategorii"
    }`;

    body.appendChild(title);
    body.appendChild(badge);

    a.appendChild(img);
    a.appendChild(body);
    listEl.appendChild(a);
  }
}

async function refresh() {
  try {
    user = await getUserById(user.id);
    who.textContent = `${user.name || ""} (${user.email})`;

    listEl.innerHTML = "";
    emptyEl.hidden = true;

    if (mode === "fav") {
      favTab.className = "btn btn-primary";
      ownTab.className = "btn btn-ghost";

      const favSet = new Set(user.favorites || []);
      const [catalog, owns] = await Promise.all([
        getCatalog(),
        getUserCocktails(user.id),
      ]);

      currentCatalog = catalog.filter((c) => favSet.has(`cat:${c.id}`));
      currentOwn = owns.filter((c) => favSet.has(`own:${c.id}`));

      applyFiltersAndRender();
      return;
    }

    if (mode === "own") {
      ownTab.className = "btn btn-primary";
      favTab.className = "btn btn-ghost";

      currentCatalog = [];
      currentOwn = await getUserCocktails(user.id);

      applyFiltersAndRender();
      return;
    }
  } catch (e) {
    console.error("Profile refresh error:", e);
    listEl.innerHTML = "";
    emptyEl.hidden = false;
  }
}

favTab?.addEventListener("click", () => setMode("fav"));
ownTab?.addEventListener("click", () => setMode("own"));

allBtn?.addEventListener("click", () => setFilter("all"));
alcBtn?.addEventListener("click", () => setFilter("alc"));
nonBtn?.addEventListener("click", () => setFilter("non"));

logoutBtn?.addEventListener("click", () => {
  logout();
  location.href = "login.html";
});

setFilter(filter);
await refresh();
