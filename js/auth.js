import { createUser, getUserByEmail, getUserById } from "./db.js";

const SESSION_KEY = "cocktailapp_session_userid_v1";

export function getSessionUserId() {
  return localStorage.getItem(SESSION_KEY);
}

export async function getCurrentUser() {
  const id = getSessionUserId();
  if (!id) return null;
  return await getUserById(id);
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

function bufToB64(buf) {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function b64ToBuf(b64) {
  const s = atob(b64);
  const bytes = new Uint8Array(s.length);
  for (let i=0;i<s.length;i++) bytes[i] = s.charCodeAt(i);
  return bytes.buffer;
}

async function hashPassword(password, saltB64) {
  const salt = saltB64 ? b64ToBuf(saltB64) : crypto.getRandomValues(new Uint8Array(16)).buffer;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" },
    key,
    256
  );
  return { saltB64: bufToB64(salt), hashB64: bufToB64(bits) };
}

export async function register({ email, name, password }) {
  email = (email || "").trim().toLowerCase();

  const exists = await getUserByEmail(email);
  if (exists) throw new Error("EMAIL_EXISTS");

  const { saltB64, hashB64 } = await hashPassword(password);
  const user = {
    id: crypto.randomUUID(),
    email,
    name,
    passSalt: saltB64,
    passHash: hashB64,
    favorites: [],
    createdAt: new Date().toISOString()
  };

  await createUser(user);
  localStorage.setItem(SESSION_KEY, user.id);
  return user;
}


export async function login({ email, password }) {
  email = (email || "").trim().toLowerCase();

  const user = await getUserByEmail(email);
  if (!user) throw new Error("BAD_CREDENTIALS");

  const { hashB64 } = await hashPassword(password, user.passSalt);
  if (hashB64 !== user.passHash) throw new Error("BAD_CREDENTIALS");

  localStorage.setItem(SESSION_KEY, user.id);
  return user;
}
