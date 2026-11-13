---
name: auditoria-seo
description: Prüft den Tekpixo-Blog auf SEO, GEO, UX und Performance (Build-Audit, Lighthouse, mobile Darstellung, JSON-LD, llms.txt) und behebt Befunde. Auslösen bei "otimizar", "continue otimizando", "auditoria SEO", "verificar o site", "checar SEO/GEO".
---

# SEO/GEO-Audit

1. `npm run build && npm run audit` – listet Title-/Description-Längen, H1, Überschriften-Sprünge,
   Bilder ohne alt, kaputte interne Links. `--verbose` zeigt Titel und JSON-LD-Typen, `--all` auch noindex-Seiten.
2. Befunde trennen:
   - **Code** (Vorlagen in `web/src/views`, Texte in `web/src/lib/i18n.ts`, `<head>` in
     `web/src/layouts/BaseLayout.astro`): direkt beheben.
   - **Inhalt** (Meta-Felder eines einzelnen Dokuments): dem Nutzer nennen oder nach Zustimmung per MCP patchen.
3. Lighthouse mobil für Start-, Artikel-, Vergleichs- und Glossarseite gegen `npx astro preview`
   (Ziel 100/100/100/100, CLS 0). Mobile Breite 360 px auf horizontales Scrollen prüfen.
4. GEO: `web/dist/llms.txt` (nur indexierbare Seiten), Kurzantwort/FAQ/Quellen in den Inhalten,
   JSON-LD (Article/BlogPosting, ItemList, FAQPage, DefinedTerm, BreadcrumbList).
5. `npx astro check` muss 0 Fehler haben. Nicht pushen – Veröffentlichen nur über `publicar-site`.
6. Bericht auf Portugiesisch: was behoben wurde (vorher → nachher), was offen ist.
