---
name: publicar-site
description: Prüft, committet und pusht Code-Änderungen am Tekpixo-Blog nach main und bestätigt, dass Cloudflare die neue Version live hat. Auslösen bei "pode fazer o push", "faz o deploy", "publicar o site", "subir as mudanças", "commit und push".
---

# Code-Änderungen veröffentlichen

Nur auf ausdrücklichen Wunsch des Nutzers ausführen (z. B. „pode fazer o push“).

1. `source ~/.nvm/nvm.sh && nvm use` (Node 24), dann `npm run verify`
   (Typprüfung, Build mit Leak- und hreflang-Prüfung, SEO-Audit). Bei Fehlern: stoppen und berichten.
2. `git status` und `git diff --stat` ansehen; nur zugehörige Dateien stagen (nie `.env` oder `dist/`).
3. Commit-Nachricht auf Deutsch, kurz: was sich für Leser ändert. Danach `git push origin main`.
4. Cloudflare baut automatisch (1–2 Min.). Prüfen, dass eine geänderte Seite live ist, z. B.
   `curl -s https://blog-sanity-6rv.pages.dev/<pfad>/ | grep -c '<erwarteter Text>'` alle 20 s, max. 5 Min.
5. Kurzer Bericht auf Portugiesisch: Commit-Hash, was live ist, offene Punkte.
