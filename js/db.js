const DB_NAME = "cocktailapp_db";
const DB_VERSION = 2;

const STORES = {
  users: "users",
  cocktails: "cocktails",
  catalog: "catalog"
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

export async function seedCatalogIfEmpty() {
  const db = await openDB();
  const tx = db.transaction(STORES.catalog, "readonly");
  const s = tx.objectStore(STORES.catalog);
  const all = await reqP(s.getAll());
  db.close();

  if (all && all.length) return;

  const now = new Date().toISOString();
  const seed = [
    {
      id: "cat_mojito",
      name: "Mojito",
      category: "Classic",
      ingredients: "- Rum 50 ml\n- Limonka\n- Mięta\n- Cukier\n- Soda",
      instructions: "Ugnieć miętę z limonką i cukrem, dodaj rum, lód, dolej sodę.",
      createdAt: now
    },
    {
      id: "cat_margarita",
      name: "Margarita",
      category: "Classic",
      ingredients: "- Tequila 50 ml\n- Triple sec 25 ml\n- Sok z limonki 25 ml\n- Sól",
      instructions: "Wstrząśnij z lodem i podaj w szkle z solą na rancie.",
      createdAt: now
    }
  ];

  const db2 = await openDB();
  const tx2 = db2.transaction(STORES.catalog, "readwrite");
  const s2 = tx2.objectStore(STORES.catalog);
  for (const item of seed) await reqP(s2.put(item));
  db2.close();
}

export async function getCatalog() {
  const db = await openDB();
  const tx = db.transaction(STORES.catalog, "readonly");
  const s = tx.objectStore(STORES.catalog);
  const list = await reqP(s.getAll());
  db.close();
  return (list || []).sort((a,b)=> (a.name||"").localeCompare(b.name||""));
}

export async function getCatalogById(id) {
  const db = await openDB();
  const tx = db.transaction(STORES.catalog, "readonly");
  const s = tx.objectStore(STORES.catalog);
  const item = await reqP(s.get(id));
  db.close();
  return item || null;
}

export async function createUser(user) {
  const db = await openDB();
  const tx = db.transaction(STORES.users, "readwrite");
  const s = tx.objectStore(STORES.users);
  await reqP(s.add(user));
  db.close();
}

export async function updateUser(user) {
  const db = await openDB();
  const tx = db.transaction(STORES.users, "readwrite");
  const s = tx.objectStore(STORES.users);
  await reqP(s.put(user));
  db.close();
}

export async function getUserByEmail(email) {
  const db = await openDB();
  const tx = db.transaction(STORES.users, "readonly");
  const s = tx.objectStore(STORES.users);
  const idx = s.index("email");
  const user = await reqP(idx.get(email));
  db.close();
  return user || null;
}

export async function getUserById(id) {
  const db = await openDB();
  const tx = db.transaction(STORES.users, "readonly");
  const s = tx.objectStore(STORES.users);
  const user = await reqP(s.get(id));
  db.close();
  return user || null;
}

export async function addUserCocktail(cocktail) {
  const db = await openDB();
  const tx = db.transaction(STORES.cocktails, "readwrite");
  const s = tx.objectStore(STORES.cocktails);
  await reqP(s.put(cocktail));
  db.close();
}

export async function getUserCocktails(ownerId) {
  const db = await openDB();
  const tx = db.transaction(STORES.cocktails, "readonly");
  const s = tx.objectStore(STORES.cocktails);
  const idx = s.index("ownerId");
  const list = await reqP(idx.getAll(ownerId));
  db.close();
  return (list || []).sort((a,b)=> (b.createdAt||"").localeCompare(a.createdAt||""));
}

export async function getUserCocktailById(id) {
  const db = await openDB();
  const tx = db.transaction(STORES.cocktails, "readonly");
  const s = tx.objectStore(STORES.cocktails);
  const item = await reqP(s.get(id));
  db.close();
  return item || null;
}

export async function updateUserCocktail(cocktail) {
  const db = await openDB();
  const tx = db.transaction("cocktails", "readwrite");
  const s = tx.objectStore("cocktails");
  await reqP(s.put(cocktail));
  await tx.done?.catch?.(()=>{});
  db.close();
}

export async function deleteUserCocktail(id) {
  const db = await openDB();
  const tx = db.transaction(STORES.cocktails, "readwrite");
  const s = tx.objectStore(STORES.cocktails);
  await reqP(s.delete(id));
  db.close();
}
