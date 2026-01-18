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
    window.addEventListener("load", async () => {
      try {
        const swUrl = new URL("service-worker.js", location.href);
        await navigator.serviceWorker.register(swUrl);
        console.log("SW registered:", swUrl.href);
      } catch (e) {
        console.error("SW register failed:", e);
        try { localStorage.setItem("lastError", `[SW ERROR] ${e?.message || e}`); } catch {}
      }
    });
  }
  let deferredPrompt = null;
  const installBtn = document.getElementById("installBtn");

  window.addEventListener("beforeinstallprompt", (e) => {
    if (!installBtn) return;
    e.preventDefault();
    deferredPrompt = e;
    installBtn.hidden = false;
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
