---
name: novo-conteudo
description: Legt im Tekpixo-Blog neue Inhalte per Sanity-MCP an und veröffentlicht sie – Artikel, Vergleich, Test oder Glossarbegriff, auf Wunsch DE + EN verknüpft, mit Titelbild. Auslösen bei "novo artigo", "criar artigo sobre X", "novo comparativo", "novo termo no glossário", "publicar conteúdo", "neuer Artikel", "Inhalt anlegen".
---

# Neuer Inhalt für Tekpixo

Projekt `u9pdnj82`, Dataset `production`. Regeln, Feldformate und JSON-Beispiele stehen in
[docs/REDAKTIONSLEITFADEN.md](../../../docs/REDAKTIONSLEITFADEN.md) – vor dem ersten Schreiben lesen.

## Ablauf

1. **Klären (nur wenn offen):** Typ, Thema/Keyword, Sprachen (Standard: DE + EN), Kategorie.
   Autor ist `author-redaktion`, sofern nicht anders gewünscht. Nichts erfinden: keine Preise,
   Bewertungen oder Zahlen ohne Quelle – lieber weglassen und im Bericht nennen.
2. **Bestand prüfen** per `query_documents`: gibt es das Thema/den Slug schon? Welche Glossarbegriffe
   und Artikel lassen sich intern verlinken?
3. **Anlegen in Abhängigkeitsreihenfolge** (Abschnitt „Reihenfolge beim Anlegen per MCP“):
   fehlende Glossarbegriffe/Autor zuerst veröffentlichen → Artikel → Vergleiche → Rückverweise patchen
   → `translation.metadata` für DE↔EN. Feste IDs wie `article-<slug>-de`, eindeutige `_key`s.
4. **Titelbild:** `generate_image` mit sachlichem, textfreiem Motiv; Alt-Text beschreibend (Pflicht).
5. **Veröffentlichen** mit `publish_documents`. Der Webhook baut die Seite neu.
6. **Live prüfen:** nach ~3 Min. mit
   `curl -s https://blog-sanity-6rv.pages.dev/<pfad>/ | grep -o '<title>[^<]*'` bestätigen.
   Fehlt die Seite, `npm run rebuild -- /<pfad>/` (stößt Build an und wartet).
7. **Bericht an den Nutzer (Portugiesisch, kurz):** Live-URLs, was angelegt wurde, was bewusst
   weggelassen wurde (z. B. fehlende Quellen).

## Checkliste vor dem Veröffentlichen

- Kurzantwort (2–3 Sätze, beantwortet die Suchfrage direkt), Kernaussagen, FAQ, Quellen mit URL
- Meta-Title ≤ 60, Meta-Description 120–155 Zeichen
- Mindestens 2 interne Links (Glossar/Artikel); EN-Fassung mit eigenem Keyword statt Wort-für-Wort
- Werbliche Inhalte über eigene Firmen oder Kunden: Beziehung im Text offenlegen (UWG)

## Bekannte Stolpersteine

- Starke Referenzen nur auf **veröffentlichte** Dokumente – sonst lehnt der MCP ab.
- Hinweis „schema could not be unambiguously identified“: Altschema `_.schemas.default` existiert noch
  → Nutzer bitten, `cd studio && npx sanity schema delete --ids _.schemas.default` auszuführen.
- Asset-Upload kann hängen, obwohl er geklappt hat → per `*[_type=="sanity.imageAsset"]` prüfen.
- Löschen per Skript löst keinen Build aus → `npm run rebuild`.
