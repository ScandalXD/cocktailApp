import { initPWA } from "./app.js";
import { getCurrentUser } from "./auth.js";
import { getUserCocktailById, updateUserCocktail } from "./db.js";

initPWA();

const user = await getCurrentUser();
if (!user) { location.href = "login.html"; throw new Error("Not authenticated"); }

const params = new URLSearchParams(location.search);
const id = params.get("id");
if (!id) { location.href = "profile.html?tab=own"; throw new Error("Missing id"); }

const backBtn = document.getElementById("backBtn");
const cancelBtn = document.getElementById("cancelBtn");
const saveBtn = document.getElementById("saveBtn");

const nameEl = document.getElementById("name");
const categoryEl = document.getElementById("category");
const ingredientsEl = document.getElementById("ingredients");
const instructionsEl = document.getElementById("instructions");

const photoEl = document.getElementById("photo");
const photoPreviewWrap = document.getElementById("photoPreviewWrap");
const photoPreview = document.getElementById("photoPreview");
const clearPhotoBtn = document.getElementById("clearPhotoBtn");

const recordBtn = document.getElementById("recordBtn");
const stopBtn = document.getElementById("stopBtn");
const clearAudioBtn = document.getElementById("clearAudioBtn");
const audioPreview = document.getElementById("audioPreview");

const msg = document.getElementById("msg");

let cocktail = await getUserCocktailById(id);
if (!cocktail) { location.href = "profile.html?tab=own"; throw new Error("Not found"); }
if (cocktail.ownerId !== user.id) { location.href = "profile.html?tab=own"; throw new Error("Not owner"); }

let mediaRecorder = null;
let chunks = [];
let streamRef = null;
let audioPreviewUrl = null;
let photoPreviewUrl = null;

function showMsg(t){ msg.textContent=t; msg.hidden=false; setTimeout(()=>msg.hidden=true, 2200); }

const original = {
  name: cocktail.name || "",
  category: cocktail.category || "",
  ingredients: cocktail.ingredients || "",
  instructions: cocktail.instructions || "",
  imageBlob: cocktail.imageBlob || null,
  audioBlob: cocktail.audioBlob || null,
};

let current = {
  imageBlob: original.imageBlob,
  audioBlob: original.audioBlob,
};

function norm(s){ return (s || "").trim().replace(/\s+/g, " "); }

function isDirty() {
  const changedText =
    norm(nameEl.value) !== norm(original.name) ||
    norm(categoryEl.value) !== norm(original.category) ||
    norm(ingredientsEl.value) !== norm(original.ingredients) ||
    norm(instructionsEl.value) !== norm(original.instructions);

  const changedPhoto = current.imageBlob !== original.imageBlob;
  const changedAudio = current.audioBlob !== original.audioBlob;

  return changedText || changedPhoto || changedAudio;
}

function updateSaveState() {
  saveBtn.disabled = !isDirty();
}

function goBackSmart() {
  if (isDirty()) {
    const ok = confirm("Masz niezapisane zmiany. Na pewno wyjść?");
    if (!ok) return;
  }
  if (history.length > 1) history.back();
  else location.href = `detail.html?own=1&id=${encodeURIComponent(cocktail.id)}`;
}

backBtn?.addEventListener("click", goBackSmart);
cancelBtn?.addEventListener("click", goBackSmart);

nameEl.value = original.name;
categoryEl.value = original.category;
ingredientsEl.value = original.ingredients;
instructionsEl.value = original.instructions;

if (original.imageBlob) {
  photoPreviewUrl = URL.createObjectURL(original.imageBlob);
  photoPreview.src = photoPreviewUrl;
  photoPreviewWrap.hidden = false;
}

if (original.audioBlob) {
  audioPreviewUrl = URL.createObjectURL(original.audioBlob);
  audioPreview.src = audioPreviewUrl;
  audioPreview.hidden = false;
  clearAudioBtn.disabled = false;
}

updateSaveState();

[nameEl, categoryEl, ingredientsEl, instructionsEl].forEach((el) => {
  el.addEventListener("input", updateSaveState);
});

photoEl.addEventListener("change", () => {
  const file = photoEl.files?.[0];
  if (!file) return;

  current.imageBlob = file;

  if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
  photoPreviewUrl = URL.createObjectURL(current.imageBlob);

  photoPreview.src = photoPreviewUrl;
  photoPreviewWrap.hidden = false;

  updateSaveState();
});

clearPhotoBtn.addEventListener("click", () => {
  current.imageBlob = null;
  photoEl.value = "";
  photoPreviewWrap.hidden = true;

  if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
  photoPreviewUrl = null;

  updateSaveState();
});

recordBtn.addEventListener("click", async () => {
  try{
    streamRef = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(streamRef);
    chunks = [];

    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      current.audioBlob = new Blob(chunks, { type: mediaRecorder.mimeType || "audio/webm" });

      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
      audioPreviewUrl = URL.createObjectURL(current.audioBlob);

      audioPreview.src = audioPreviewUrl;
      audioPreview.hidden = false;
      clearAudioBtn.disabled = false;

      streamRef?.getTracks().forEach(t => t.stop());
      streamRef = null;

      updateSaveState();
    };

    mediaRecorder.start();
    recordBtn.disabled = true;
    stopBtn.disabled = false;
    showMsg("Nagrywanie…");
  } catch {
    showMsg("Brak dostępu do mikrofonu.");
  }
});

stopBtn.addEventListener("click", () => {
  if (!mediaRecorder) return;
  mediaRecorder.stop();
  recordBtn.disabled = false;
  stopBtn.disabled = true;
});

clearAudioBtn.addEventListener("click", () => {
  current.audioBlob = null;
  audioPreview.hidden = true;
  audioPreview.removeAttribute("src");
  clearAudioBtn.disabled = true;

  if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
  audioPreviewUrl = null;

  updateSaveState();
});

window.addEventListener("beforeunload", (e) => {
  if (!isDirty()) return;
  e.preventDefault();
  e.returnValue = "";
});

saveBtn.addEventListener("click", async () => {
  if (!isDirty()) return;

  const name = (nameEl.value || "").trim();
  if (!name) { showMsg("Podaj nazwę koktajlu."); return; }

  const updated = {
    ...cocktail,
    name,
    category: (categoryEl.value || "").trim(),
    ingredients: (ingredientsEl.value || "").trim(),
    instructions: (instructionsEl.value || "").trim(),

    imageBlob: current.imageBlob,
    audioBlob: current.audioBlob,

    updatedAt: new Date().toISOString(),
  };

  try {
    await updateUserCocktail(updated);
    cocktail = updated;
    original.name = updated.name;
    original.category = updated.category;
    original.ingredients = updated.ingredients;
    original.instructions = updated.instructions;
    original.imageBlob = updated.imageBlob;
    original.audioBlob = updated.audioBlob;
    current.imageBlob = updated.imageBlob;
    current.audioBlob = updated.audioBlob;

    updateSaveState();
    location.href = `detail.html?own=1&id=${encodeURIComponent(updated.id)}`;
  } catch (e) {
    console.error(e);
    showMsg("Błąd zapisu.");
  }
});
