# Redaktionsleitfaden – Inhalte für SEO & GEO anlegen

Dieser Leitfaden gilt für Inhalte, die im Studio **oder per MCP** angelegt werden.
Die Feldbeschreibungen im Studio (und im per `npm run studio:deploy` veröffentlichten Schema, das der MCP liest) enthalten dieselben Regeln in Kurzform.

## Grundregeln (alle Typen)

1. **Eine Seite = eine Suchfrage.** Fokus-Keyword festlegen (`seo.focusKeyword`), in Titel, Slug, Kurzantwort und einer H2 verwenden.
2. **Antwort zuerst.** Die Kurzantwort (`excerpt` bzw. `shortDefinition`) beantwortet die Frage in 1–3 Sätzen, für sich allein verständlich, mit konkreten Fakten. Keine Einleitungsfloskeln, kein „in diesem Artikel“.
3. **Zitierfähig schreiben.** Jeder Abschnitt beginnt mit dem Kernsatz. Zahlen mit Einheit und Bezug („ab 15 € pro Nutzer und Monat“). Aufzählungen als Liste, Vergleiche als Tabelle.
4. **Belegen.** Zahlen und Behauptungen über `sources` belegen (Titel, URL, Herausgeber, Datum).
5. **Verlinken.** Passende `related`-Inhalte wählen und im Text interne Links setzen. Glossarbegriffe werden automatisch beim ersten Vorkommen verlinkt – dafür im Glossar `alternateNames` pflegen.
6. **Nichts erfinden.** Keine erfundenen Tests, Zitate, Personen oder Zahlen.
7. **Sprachen getrennt.** Jede Sprachfassung ist ein eigenes Dokument mit eigenem Slug und eigenem Keyword – keine wörtliche Übersetzung von Keywords.

## Felder je Typ

### Artikel (`article`)

| Feld | Regel |
|---|---|
| `language` | `de` oder `en` (Pflicht) |
| `title` | H1, 40–80 Zeichen, Keyword vorne |
| `slug.current` | Kleinbuchstaben, Bindestriche, Keyword, ohne Füllwörter (`erp-system-auswaehlen`) |
| `excerpt` | Kurzantwort, 150–300 Zeichen |
| `keyTakeaways` | 3–5 vollständige Sätze mit Fakten |
| `mainImage` | Bild mit sachlichem `alt` |
| `body` | H2 (gern als Frage), H3, Absätze, Listen, Tabellen (`table`), Hinweisboxen (`callout`), Vor-/Nachteile (`prosCons`), CTA (`cta`) |
| `authors` | mind. eine Referenz auf `author` |
| `reviewedBy` | optional, Referenz auf `author` |
| `category` | Referenz auf `category` (IDs: `category-crm`, `category-erp`, `category-marketing`, `category-ai`, `category-cyber-security`) |
| `publishedAt` / `updatedAt` | ISO-Datum; `updatedAt` nur bei inhaltlicher Überarbeitung |
| `sources` | Belege |
| `faq` | 3–6 echte Nutzerfragen, Antworten 1–3 Sätze |
| `seo` | `metaTitle` 30–60, `metaDescription` 120–160 Zeichen, `focusKeyword` |

### Vergleich / Liste (`comparison`)

Wie Artikel, zusätzlich:

- `items[]` in Ranking-Reihenfolge: `name`, `badge` (z. B. „Testsieger“), **`bestFor`** („Ideal für …“), `summary` (1–2 Sätze), `pros`, `cons`, `rating` (0,5–5), `priceFrom`, `url`, optional `review` (Referenz auf den eigenen Test).
- `comparisonTable`: erste Zeile = Spaltenköpfe, erste Spalte = Anbieter; gleich viele Zellen pro Zeile.
- Kurzantwort nennt den Sieger und für wen er passt.

### Review (`review`)

- `product`: `name`, `brand`, `productType` (`software` → SoftwareApplication), `applicationCategory`, `operatingSystem`, `priceFrom`, `freePlan`, `url`.
- `rating` (Pflicht), `pros`, `cons`, `verdict` (2–3 Sätze, klare Empfehlung inkl. Zielgruppe).
- Nur Produkte bewerten, die tatsächlich geprüft wurden.

### Glossarbegriff (`glossaryTerm`)

- `title`: der Begriff selbst (z. B. „ERP“).
- `shortDefinition`: „<Begriff> (<Langform>) ist/bezeichnet …“, 1–2 Sätze.
- `alternateNames`: Langform, Synonyme, Schreibweisen – steuern die automatische Verlinkung.
- `sameAs`: Wikipedia- und Wikidata-URL.
- `category`: optional, verknüpft den Begriff mit der Kategorieseite.
- `body`: Erklärung mit H2 wie „Wie funktioniert …?“, „Beispiele“, „Vor- und Nachteile“.

### Kategorie (`category`)

Sprachneutral, Felder je Sprache: `title.de/en`, `slug.de/en`, `description.de/en` (120–160 Zeichen), optional `body.de/en` als Hub-Text mit Links auf die wichtigsten Artikel.

### Seite (`page`)

`pageType`: `contact`, `editorialPolicy`, `imprint`, `privacy`, `about` oder `generic`. Danach in **Einstellungen → Footer & Pflichtseiten** je Sprache verknüpfen.

## Übersetzungen verbinden (wichtig für MCP)

DE- und EN-Fassung sind zwei Dokumente. Verbunden werden sie über ein Dokument vom Typ `translation.metadata`:

```json
{
  "_id": "translation.metadata.<eindeutige-id>",
  "_type": "translation.metadata",
  "schemaTypes": ["article"],
  "translations": [
    {
      "_key": "de",
      "_type": "internationalizedArrayReferenceValue",
      "language": "de",
      "value": { "_type": "reference", "_ref": "<ID des DE-Dokuments>" }
    },
    {
      "_key": "en",
      "_type": "internationalizedArrayReferenceValue",
      "language": "en",
      "value": { "_type": "reference", "_ref": "<ID des EN-Dokuments>" }
    }
  ]
}
```

- Erst **beide Dokumente veröffentlichen**, dann das Metadaten-Dokument anlegen (Referenzen auf veröffentlichte Dokumente).
- Ergebnis: korrektes hreflang, Sprachumschalter führt zur Übersetzung, `workTranslation`/`translationOfWork` im Schema.
- hreflang-Tags erscheinen nur, solange die Website indexierbar ist (auf der Testdomain mit `noindex` fehlen sie bewusst; der Sprachumschalter funktioniert trotzdem).

## Reihenfolge beim Anlegen per MCP (Referenzen)

Referenzen dürfen nur auf **bereits veröffentlichte** Dokumente zeigen – ein Entwurf, der auf einen anderen Entwurf verweist, wird abgelehnt („references non-existent document“). Daher in dieser Reihenfolge arbeiten:

1. Autor:in und Glossarbegriffe anlegen und veröffentlichen.
2. Artikel anlegen (Verweise nur auf veröffentlichte Dokumente) und veröffentlichen.
3. Vergleiche/Reviews anlegen, die auf diese Artikel verweisen, und veröffentlichen.
4. Rückverweise (z. B. Artikel → Vergleich in `body` und `related`) per Patch ergänzen und erneut veröffentlichen.
5. Zuletzt `translation.metadata` anlegen (ist `liveEdit`, also sofort veröffentlicht).

Jeder Schritt löst einen Build aus. Feste, sprechende IDs verwenden (`article-<thema>-de`, `glossary-<begriff>-de`, `comparison-<thema>-de`), dann lassen sich Verweise vorab planen. Jedes Array-Element braucht einen eindeutigen `_key`.

## Portable Text – Blockformate

```json
{ "_type": "block", "style": "h2", "children": [{ "_type": "span", "text": "Was kostet ein ERP-System?" }] }
{ "_type": "callout", "tone": "tip", "title": "Tipp", "body": [ … Blöcke … ] }
{ "_type": "prosCons", "pros": ["…"], "cons": ["…"] }
{ "_type": "table", "caption": "…", "headerRow": true, "headerColumn": true,
  "rows": [{ "_type": "tableRow", "_key": "r1", "cells": ["Kriterium", "A", "B"] }] }
{ "_type": "cta", "title": "…", "text": "…", "link": { "label": "…", "internal": { "_type": "reference", "_ref": "<ID>" } } }
```

Interner Link als Markierung: `markDefs: [{ "_type": "internalLink", "_key": "l1", "reference": { "_type": "reference", "_ref": "<ID>" } }]`, im Span `marks: ["l1"]`.

## Veröffentlichen

Jede Veröffentlichung löst einen Cloudflare-Build aus (~1–2 Min.). **Bei vielen Dokumenten:** erst alle Inhalte vorbereiten und gesammelt veröffentlichen – jede Änderung erzeugt einen eigenen Build (Free-Plan: 500 Builds/Monat).

## Checkliste vor dem Veröffentlichen

- [ ] Fokus-Keyword in Titel, Slug, Kurzantwort, einer H2
- [ ] Kurzantwort beantwortet die Frage allein
- [ ] 3–5 Kernaussagen
- [ ] Quellen für Zahlen
- [ ] Mind. 2 interne Links + passende `related`
- [ ] FAQ mit echten Fragen
- [ ] Alt-Texte für alle Bilder
- [ ] Übersetzung angelegt und verbunden
