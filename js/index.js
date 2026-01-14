import { initPWA } from "./app.js";
import { getCatalog, updateUser  } from "./db.js";
import { getCurrentUser} from "./auth.js";

initPWA();

const user = await getCurrentUser();
const listEl = document.getElementById("list");
const searchEl = document.getElementById("search");

const allBtn = document.getElementById("allBtn");
const alcBtn = document.getElementById("alcBtn");
const nonBtn = document.getElementById("nonBtn");

let catalog = await getCatalog();
let filter = "all";

function render(items) {
  listEl.innerHTML = "";

  for (const c of items) {
    const a = document.createElement("a");
    a.className = "tile";
    a.href = `detail.html?cat=1&id=${c.id}`;

    const fav = document.createElement("button");
    fav.className = "fav-icon";
    fav.type = "button";

    const key = `cat:${c.id}`;
    const isFav = (user?.favorites || []).includes(key);
    fav.textContent = isFav ? "❤️" : "🤍";

    fav.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const set = new Set(user.favorites || []);
      set.has(key) ? set.delete(key) : set.add(key);
      user.favorites = [...set];
      await updateUser(user);
      fav.textContent = set.has(key) ? "❤️" : "🤍";
    };

    const img = document.createElement("img");
    img.className = "tile-img";
    img.src = c.image;

    const body = document.createElement("div");
    body.className = "tile-body";
    body.innerHTML = `
      <div class="tile-title">${c.name}</div>
      <div class="badge"><span class="badge-dot"></span>${c.category}</div>
    `;

    a.appendChild(fav);
    a.appendChild(img);
    a.appendChild(body);
    listEl.appendChild(a);
  }
}

function applyFilters() {
  const q = searchEl.value.toLowerCase();

  render(
    catalog.filter(c => {
      const matchText =
        c.name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q);

      const matchFilter =
        filter === "all" ||
        (filter === "alc" && c.category === "Alkoholowy") ||
        (filter === "non" && c.category === "Bezalkoholowy");

      return matchText && matchFilter;
    })
  );
}

searchEl.addEventListener("input", applyFilters);

allBtn.onclick = () => { filter = "all"; applyFilters(); };
alcBtn.onclick = () => { filter = "alc"; applyFilters(); };
nonBtn.onclick = () => { filter = "non"; applyFilters(); };

applyFilters();
