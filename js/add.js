import { initPWA } from "./app.js";
import { getCurrentUser } from "./auth.js";
import { addUserCocktail } from "./db.js";

initPWA();

const user = await getCurrentUser();
if (!user) { location.href = "login.html"; throw new Error("Not authenticated"); }

const nameEl = document.getElementById("name");
const categoryEl = document.getElementById("category");
const ingredientsEl = document.getElementById("ingredients");
const instructionsEl = document.getElementById("instructions");
const saveBtn = document.getElementById("saveBtn");
const photoEl = document.getElementById("photo");
const photoPreviewWrap = document.getElementById("photoPreviewWrap");
const photoPreview = document.getElementById("photoPreview");
const clearPhotoBtn = document.getElementById("clearPhotoBtn");
const recordBtn = document.getElementById("recordBtn");
const stopBtn = document.getElementById("stopBtn");
const clearAudioBtn = document.getElementById("clearAudioBtn");
const audioPreview = document.getElementById("audioPreview");
const msg = document.getElementById("msg");
const backBtn = document.getElementById("backBtn");

let imageBlob = null;
let audioBlob = null;
let mediaRecorder = null;
let chunks = [];
let streamRef = null;
let audioPreviewUrl = null;
let photoPreviewUrl = null;

if (backBtn) {
  backBtn.addEventListener("click", () => {
    history.back();
  });
}

function showMsg(t){ msg.textContent=t; msg.hidden=false; setTimeout(()=>msg.hidden=true, 2200); }

photoEl.addEventListener("change", () => {
  const file = photoEl.files?.[0];
  if (!file) return;
  imageBlob = file;

  if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
  photoPreviewUrl = URL.createObjectURL(imageBlob);
  photoPreview.src = photoPreviewUrl;
  photoPreviewWrap.hidden = false;
});

clearPhotoBtn.addEventListener("click", () => {
  imageBlob = null;
  photoEl.value = "";
  photoPreviewWrap.hidden = true;
  if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
  photoPreviewUrl = null;
});

recordBtn.addEventListener("click", async () => {
  try{
    streamRef = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(streamRef);
    chunks = [];

    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      audioBlob = new Blob(chunks, { type: mediaRecorder.mimeType || "audio/webm" });

      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
      audioPreviewUrl = URL.createObjectURL(audioBlob);

      audioPreview.src = audioPreviewUrl;
      audioPreview.hidden = false;
      clearAudioBtn.disabled = false;

      streamRef?.getTracks().forEach(t => t.stop());
      streamRef = null;
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
  audioBlob = null;
  audioPreview.hidden = true;
  audioPreview.removeAttribute("src");
  clearAudioBtn.disabled = true;

  if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
  audioPreviewUrl = null;
});

saveBtn.addEventListener("click", async () => {
  const name = (nameEl.value || "").trim();
  if (!name) { showMsg("Podaj nazwę koktajlu."); return; }

  const cocktail = {
    id: crypto.randomUUID(),
    ownerId: user.id,
    name,
    category: (categoryEl.value || "").trim(),
    ingredients: (ingredientsEl.value || "").trim(),
    instructions: (instructionsEl.value || "").trim(),
    imageBlob,
    audioBlob,
    createdAt: new Date().toISOString()
  };

  try{
    await addUserCocktail(cocktail);
    location.href = "profile.html?tab=own";
  }catch(e){
    console.error(e);
    showMsg("Błąd zapisu.");
  }
});
