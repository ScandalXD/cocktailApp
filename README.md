
## Opis

CocktailApp to aplikacja do przeglądania przepisów koktajli oraz tworzenia i zapisywania własnych receptur. Umożliwia użytkownikom porządkowanie ulubionych koktajli i korzystanie z aplikacji również bez dostępu do internetu.

---

##  Technologie

- HTML, CSS, JavaScript (bez frameworków)
- IndexedDB – lokalna baza danych
- Service Worker + Cache API
- Web App Manifest
- Web Crypto API (PBKDF2 + SHA-256)
- MediaRecorder API
- Hosting: Netlify (HTTPS)

---

##  Funkcjonalności

- Rejestracja i logowanie użytkownika
- Profil użytkownika (Ulubione, Własne koktajle)
- Dodawanie, edycja i usuwanie własnych koktajli
- Zdjęcia (kamera/galeria) oraz notatki audio zapisywane jako Blob w IndexedDB
- Katalog koktajli (alkoholowe i bezalkoholowe)
- Wyszukiwanie i dodawanie do ulubionych
- Pełne działanie w trybie offline
- Możliwość instalacji aplikacji jako PWA

---

##  Możliwy dalszy rozwój aplikacji

W przyszłości aplikacja może zostać rozbudowana m.in. o:
- synchronizację danych z backendem (API + konto użytkownika w chmurze),
- logowanie z wykorzystaniem JWT lub OAuth,
- udostępnianie koktajli innym użytkownikom,
- system ocen i komentarzy,
- powiadomienia push o nowych przepisach,
- tryb synchronizacji offline/online (Background Sync),
- wersję wielojęzyczną aplikacji.

---

## ▶ Uruchomienie aplikacji

Aplikacja nie wymaga instalacji zależności ani backendu.

1. Otwórz projekt na serwerze z HTTPS (np. Netlify).
2. Alternatywnie uruchom lokalny serwer statyczny:

```bash
npm install -g serve
serve .
```

3. Otwórz aplikację w przeglądarce.
4. (Opcjonalnie) Zainstaluj aplikację na urządzeniu jako PWA.
