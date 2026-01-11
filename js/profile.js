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

let mode = "own";

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

    if (c.imageBlob) {
      const url = URL.createObjectURL(c.imageBlob);
      img.src = url;
      img.onload = () => URL.revokeObjectURL(url);
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

      const favCatalog = catalog.filter((c) => favSet.has(`cat:${c.id}`));
      const favOwns = owns.filter((c) => favSet.has(`own:${c.id}`));

      if (!favCatalog.length && !favOwns.length) {
        emptyEl.hidden = false;
        return;
      }

      renderTiles(favCatalog, "catalog");
      renderTiles(favOwns, "own");
      return;
    }

    if (mode === "own") {
      ownTab.className = "btn btn-primary";
      favTab.className = "btn btn-ghost";

      const owns = await getUserCocktails(user.id);
      if (!owns.length) {
        emptyEl.hidden = false;
        return;
      }

      renderTiles(owns, "own");
    }
  } catch (e) {
    console.error("Profile refresh error:", e);
    listEl.innerHTML = "";
    emptyEl.hidden = false;
  }
}

favTab?.addEventListener("click", () => setMode("fav"));
ownTab?.addEventListener("click", () => setMode("own"));

logoutBtn?.addEventListener("click", () => {
  logout();
  location.href = "login.html";
});

await refresh();
