import { initPWA } from "./app.js";
import { getCurrentUser } from "./auth.js";
import { seedCatalogIfEmpty, getCatalog } from "./db.js";

initPWA();

const user = await getCurrentUser();
if (!user) {
  location.href = "login.html";
  throw new Error("Not authenticated");
}

const listEl = document.getElementById("list");
const emptyEl = document.getElementById("empty");
const qEl = document.getElementById("q");

let all = [];

function render(items) {
  listEl.innerHTML = "";
  if (!items.length) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  for (const c of items) {
    const a = document.createElement("a");
    a.href = `detail.html?cat=1&id=${encodeURIComponent(c.id)}`;
    a.className = "tile";

    const img = document.createElement("img");
    img.className = "tile-img";
    img.alt = c.name || "Cocktail";
    img.src = "data:image/svg+xml;base64," + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
        <rect width="100%" height="100%" fill="rgba(255,255,255,0.06)"/>
        <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
          fill="rgba(255,255,255,0.65)" font-size="28">🍸</text>
      </svg>
    `);

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

function applyFilter() {
  const q = (qEl.value || "").trim().toLowerCase();
  if (!q) return render(all);

  render(all.filter(c =>
    (c.name || "").toLowerCase().includes(q) ||
    (c.category || "").toLowerCase().includes(q) ||
    (c.ingredients || "").toLowerCase().includes(q)
  ));
}

qEl.addEventListener("input", applyFilter);

await seedCatalogIfEmpty();
all = await getCatalog();
applyFilter();
