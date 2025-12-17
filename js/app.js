export function initPWA() {
  const banner = document.getElementById("offlineBanner");
  const updateBanner = () => {
    if (!banner) return;
    banner.hidden = navigator.onLine;
  };
  window.addEventListener("online", updateBanner);
  window.addEventListener("offline", updateBanner);
  updateBanner();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js");
  }

  let deferredPrompt = null;
  const installBtn = document.getElementById("installBtn");

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.hidden = false;
  });

  if (installBtn) {
    installBtn.addEventListener("click", async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      installBtn.hidden = true;
    });
  }
}
