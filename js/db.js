const DB_NAME = "cocktailapp_db";
const DB_VERSION = 3;

const STORES = {
  users: "users",
  cocktails: "cocktails",
  catalog: "catalog",
};

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;

      if (!db.objectStoreNames.contains(STORES.users)) {
        const s = db.createObjectStore(STORES.users, { keyPath: "id" });
        s.createIndex("email", "email", { unique: true });
      }

      if (!db.objectStoreNames.contains(STORES.cocktails)) {
        const s = db.createObjectStore(STORES.cocktails, { keyPath: "id" });
        s.createIndex("ownerId", "ownerId");
        s.createIndex("createdAt", "createdAt");
      }

      if (!db.objectStoreNames.contains(STORES.catalog)) {
        const s = db.createObjectStore(STORES.catalog, { keyPath: "id" });
        s.createIndex("category", "category");
        s.createIndex("name", "name");
        s.createIndex("createdAt", "createdAt");
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function reqP(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function createUser(user) {
  const db = await openDB();
  const tx = db.transaction(STORES.users, "readwrite");
  await reqP(tx.objectStore(STORES.users).add(user));
  db.close();
}

export async function updateUser(user) {
  const db = await openDB();
  const tx = db.transaction(STORES.users, "readwrite");
  await reqP(tx.objectStore(STORES.users).put(user));
  db.close();
}

export async function getUserByEmail(email) {
  const db = await openDB();
  const tx = db.transaction(STORES.users, "readonly");
  const s = tx.objectStore(STORES.users).index("email");
  const user = await reqP(s.get(email));
  db.close();
  return user || null;
}

export async function getUserById(id) {
  const db = await openDB();
  const tx = db.transaction(STORES.users, "readonly");
  const user = await reqP(tx.objectStore(STORES.users).get(id));
  db.close();
  return user || null;
}

export async function addUserCocktail(cocktail) {
  const db = await openDB();
  const tx = db.transaction(STORES.cocktails, "readwrite");
  await reqP(tx.objectStore(STORES.cocktails).put(cocktail));
  db.close();
}

export async function getUserCocktails(ownerId) {
  const db = await openDB();
  const tx = db.transaction(STORES.cocktails, "readonly");
  const idx = tx.objectStore(STORES.cocktails).index("ownerId");
  const list = await reqP(idx.getAll(ownerId));
  db.close();
  return (list || []).sort((a, b) =>
    (b.createdAt || "").localeCompare(a.createdAt || "")
  );
}

export async function getUserCocktailById(id) {
  const db = await openDB();
  const tx = db.transaction(STORES.cocktails, "readonly");
  const item = await reqP(tx.objectStore(STORES.cocktails).get(id));
  db.close();
  return item || null;
}

export async function updateUserCocktail(cocktail) {
  return addUserCocktail(cocktail);
}

export async function deleteUserCocktail(id) {
  const db = await openDB();
  const tx = db.transaction(STORES.cocktails, "readwrite");
  await reqP(tx.objectStore(STORES.cocktails).delete(id));
  db.close();
}

const CATALOG = [
  {
    id: "mojito",
    name: "Mojito",
    category: "Alkoholowy",
    image: "icons/alcoholic/mojito.jpg",
    ingredients: `50 ml białego rumu
1 limonka
2 łyżeczki cukru trzcinowego
kilka listków mięty
woda gazowana
kruszony lód`,
    instructions: `Ugnieć limonkę z cukrem.
Dodaj miętę i kruszony lód.
Wlej rum, dopełnij wodą gazowaną.
Delikatnie wymieszaj.`,
  },
  {
    id: "margarita",
    name: "Margarita",
    category: "Alkoholowy",
    image: "icons/alcoholic/margarita.jpg",
    ingredients: `50 ml tequili
25 ml triple sec
25 ml soku z limonki`,
    instructions: `Wstrząśnij składniki z lodem.
Przelej do kieliszka z solonym brzegiem.`,
  },
  {
    id: "martini",
    name: "Martini",
    category: "Alkoholowy",
    image: "icons/alcoholic/martini.jpg",
    ingredients: `60 ml ginu
10 ml wermutu
oliwka`,
    instructions: `Wymieszaj składniki z lodem.
Przecedź do schłodzonego kieliszka.
Udekoruj oliwką.`,
  },
  {
    id: "bloody-mary",
    name: "Bloody Mary",
    category: "Alkoholowy",
    image: "icons/alcoholic/bloody-mary.jpg",
    ingredients: `50 ml wódki
100 ml soku pomidorowego
sok z cytryny
sól, pieprz`,
    instructions: `Wymieszaj wszystkie składniki z lodem.
Dopraw do smaku.`,
  },
  {
    id: "jagerbomb",
    name: "Jägerbomb",
    category: "Alkoholowy",
    image: "icons/alcoholic/jagerbomb.jpg",
    ingredients: `40 ml Jägermeister
napój energetyczny`,
    instructions: `Wrzuć kieliszek Jägermeister do szklanki z energetykiem.`,
  },
  {
    id: "cranberry-spritzer",
    name: "Cranberry Spritzer",
    category: "Bezalkoholowy",
    image: "icons/non-alcoholic/cranberry-spritzer.jpg",
    ingredients: `sok żurawinowy
woda gazowana
limonka`,
    instructions: `Wlej sok do szklanki z lodem.
Dopełnij wodą gazowaną.
Dodaj limonkę.`,
  },
  {
    id: "ginger-ale",
    name: "Ginger Ale",
    category: "Bezalkoholowy",
    image: "icons/non-alcoholic/ginger-ale.jpg",
    ingredients: `ginger ale
cytryna`,
    instructions: `Wlej ginger ale do szklanki z lodem.
Dodaj plaster cytryny.`,
  },
  {
    id: "hot-chocolate",
    name: "Hot Chocolate",
    category: "Bezalkoholowy",
    image: "icons/non-alcoholic/hot-chocolate.jpg",
    ingredients: `mleko
kakao
cukier`,
    instructions: `Podgrzej mleko.
Dodaj kakao i cukier.
Wymieszaj do uzyskania gładkiej konsystencji.`,
  },
  {
    id: "lynchburg-lemonade",
    name: "Lynchburg Lemonade",
    category: "Bezalkoholowy",
    image: "icons/non-alcoholic/lynchburg-lemonade.jpg",
    ingredients: `lemoniada
sok z cytryny`,
    instructions: `Wlej lemoniadę do szklanki z lodem.
Dodaj sok z cytryny.`,
  },
  {
    id: "milkshake",
    name: "Milkshake",
    category: "Bezalkoholowy",
    image: "icons/non-alcoholic/milkshake.jpg",
    ingredients: `mleko
lody waniliowe`,
    instructions: `Zblenduj mleko z lodami.
Podawaj schłodzone.`,
  },
];

export async function seedCatalog() {
  const db = await openDB();
  const tx = db.transaction(STORES.catalog, "readwrite");
  const s = tx.objectStore(STORES.catalog);
  for (const item of CATALOG) {
      s.put({
        ...item,
        createdAt: item.createdAt || new Date().toISOString(),
    });
  }
  await new Promise((resolve, reject)=> {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  })
  db.close();
}

export async function getCatalog() {
  const db = await openDB();
  const tx = db.transaction(STORES.catalog, "readonly");
  const s = tx.objectStore(STORES.catalog);
  const list = await reqP(s.getAll());
  db.close();
  return (list || []).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
}

export async function getCatalogById(id) {
  const db = await openDB();
  const tx = db.transaction(STORES.catalog, "readonly");
  const item = await reqP(tx.objectStore(STORES.catalog).get(id));
  db.close();
  return item || null;
}
