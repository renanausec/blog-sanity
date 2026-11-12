# Tekpixo – Blog-Vorlage (Sanity + Astro + Cloudflare Pages)

Zweisprachiger Blog (Deutsch/Englisch) über Business-Software. Gleichzeitig **Vorlage** für weitere Blogs:
Repository kopieren, neues Sanity-Projekt anlegen, Konfiguration und Theme anpassen, deployen.

| Baustein | Aufgabe |
|---|---|
| **Sanity** (eigenes Projekt, Free-Plan) | Inhalte, Studio unter `https://<name>.sanity.studio` |
| **Astro** (statischer Build) | HTML, Bilder, Sitemaps, Feeds – ohne Client-JavaScript |
| **Cloudflare Pages** | Hosting, Domain, automatischer Rebuild beim Veröffentlichen |
| **Sanity MCP** | Inhalte per KI-Assistent anlegen und veröffentlichen |

Grundprinzipien:

- **Alles Blog-Spezifische an einer Stelle:** [`site.config.ts`](site.config.ts) + `.env` (+ das Theme).
- **Keine Spuren nach außen:** Bilder werden beim Build heruntergeladen, optimiert (AVIF/WebP) und von der eigenen Domain ausgeliefert. Im HTML steht weder `cdn.sanity.io` noch Project ID. Der Build bricht ab, falls doch (`check-leaks`).
- **Austauschbares Design:** Themes bestehen aus Design-Tokens **und** eigenen Layout-Komponenten. Ein Theme-Wechsel ändert das Aussehen komplett, ohne die Inhaltskomponenten anzufassen.

---

## Inhalt

1. [Projektstruktur](#projektstruktur)
2. [Lokale Entwicklung](#lokale-entwicklung)
3. [Konfiguration](#konfiguration)
4. [Inhaltsmodell & Studio](#inhaltsmodell--studio)
5. [URLs & Mehrsprachigkeit](#urls--mehrsprachigkeit)
6. [SEO & GEO](#seo--geo)
7. [Themes](#themes)
8. [Veröffentlichung & Deploy](#veröffentlichung--deploy)
9. [Inhalte per MCP](#inhalte-per-mcp)
10. [Qualitätsprüfungen](#qualitätsprüfungen)
11. [Skripte](#skripte)
12. [Neuen Blog aus dieser Vorlage erstellen](#neuen-blog-aus-dieser-vorlage-erstellen)

---

## Projektstruktur

```
.
├─ site.config.ts          ← zentrale Konfiguration (Name, Domain, Sanity, Sprachen, Routen, Theme …)
├─ shared/routing.ts       ← URL-Logik, gemeinsam für Studio und Website
├─ .env.example            ← dokumentierte Umgebungsvariablen (Kopie → .env)
├─ studio/                 ← Sanity Studio
│  ├─ sanity.config.ts     ← Plugins, Aktionen, Vorschau-Links
│  ├─ structure.ts         ← linke Navigation (Inhalte · Glossar · Autoren · Einstellungen)
│  ├─ schemas/             ← Dokumente und Objekte
│  └─ scripts/             ← seed, demo-content, create-webhook
└─ web/                    ← Astro-Website
   ├─ astro.config.ts
   ├─ scripts/             ← postbuild, check-leaks, check-hreflang
   └─ src/
      ├─ lib/              ← Daten (GROQ), Routen, i18n, Bilder, JSON-LD, Feeds
      ├─ components/       ← Inhaltskomponenten (themeunabhängig)
      ├─ views/            ← Seitentypen (Artikel, Liste, Glossar …)
      ├─ layouts/          ← BaseLayout (<head>, SEO)
      ├─ styles/base.css   ← Basis-Styles, nur Tokens
      ├─ themes/           ← pixel/, editorial/ (Tokens, Schriften, Layout-Komponenten)
      └─ pages/            ← [...path].astro (alle Inhaltsseiten), 404, Feeds, Sitemaps
```

## Lokale Entwicklung

Voraussetzung: **Node 24** (siehe `.nvmrc`; Astro benötigt ≥ 22.23.4).

```bash
nvm use
npm install
cp .env.example .env        # SANITY_API_READ_TOKEN eintragen
npm run studio              # Studio auf http://localhost:3333
npm run dev                 # Website auf http://localhost:4321
npm run build               # statischer Build nach web/dist + alle Prüfungen
npm run preview             # Build lokal ansehen
```

## Konfiguration

### `site.config.ts`

| Feld | Bedeutung |
|---|---|
| `name`, `url`, `description` | Blogname, produktive Domain (ohne `/` am Ende), Kurzbeschreibung je Sprache |
| `locales` | Sprachen. Die **erste** ist die Hauptsprache (ohne URL-Präfix, Ziel von `x-default`) |
| `sanity` | `projectId`, `dataset`, `apiVersion`, `studioHost`, `studioAppId` |
| `routes` | übersetzte URL-Segmente (`kategorie`/`category`, `glossar`/`glossary` …) |
| `theme` | Ordnername in `web/src/themes/` |
| `pageSize` | Einträge pro Listen-Seite |
| `social` | Profile für Footer und `sameAs` |
| `adsense.enabled` | technischer Hauptschalter für AdSense (zusätzlich in den Studio-Einstellungen) |

### Umgebungsvariablen

| Variable | Wo | Zweck |
|---|---|---|
| `SANITY_API_READ_TOKEN` | `.env` **und** Cloudflare | Lesen des privaten Datasets beim Build (Rolle *Viewer*) |
| `NODE_VERSION` | Cloudflare | `24.22.2` |
| `SITE_URL` | optional, Cloudflare | abweichende Basis-URL, z. B. `https://<projekt>.pages.dev`, solange die Domain fehlt |
| `CF_DEPLOY_HOOK` | nur `.env` | Deploy-Hook-URL, wird von `npm run webhook -w studio` verwendet |
| `CF_PAGES_BRANCH` | automatisch | Builds außerhalb von `main` sind `noindex` |

**Indexierung:** Die Website ist nur indexierbar, wenn sie unter der Domain aus `site.config.ts → url` und aus dem Branch `main` gebaut wird. Auf einer Test-Domain (`SITE_URL` gesetzt) oder in Preview-Builds erhalten alle Seiten `noindex, nofollow`, und `robots.txt` sperrt alles.

## Inhaltsmodell & Studio

Studio-Navigation: **Inhalte** (je Typ und Sprache, plus Kategorien) · **Glossar** · **Autoren** · **Einstellungen**.

| Typ | Übersetzung | Besonderheiten |
|---|---|---|
| Artikel | je Sprache ein Dokument | Kurzantwort, Portable Text mit Blöcken, Autoren, Kategorie, verwandte Inhalte |
| Vergleich / Liste | je Sprache | Rangliste (Name, Kurzfazit, Pro/Contra, optionale Note, Link zum Test), Vergleichstabelle |
| Review | je Sprache | Produkt, Note 0,5–5, Pro/Contra, Fazit → `Product` + `Review` |
| Glossarbegriff | je Sprache | Kurzdefinition (direkte Antwort), ausführlicher Text, verwandte Begriffe → `DefinedTerm` |
| Landingpage | je Sprache | Abschnitte: Hero, Text, Vorteile, CTA, FAQ |
| Seite | je Sprache | Kontakt, Redaktionelle Richtlinien, Impressum, Datenschutz |
| Autor | ein Dokument, Felder übersetzt | Foto, Bio, Fachgebiet, Profile → `Person` |
| Kategorie | ein Dokument, Felder übersetzt | Name und Slug je Sprache |
| Einstellungen | Singleton | Name, Logo, Favicon, Navigation, Footer, Pflichtseiten, Herausgeber, AdSense |

- **Übersetzungen** verbindet das Plugin `@sanity/document-internationalization` (Übersetzungsmenü oben im Dokument).
- **Portable-Text-Blöcke:** Bild mit Bildunterschrift (Alt-Text Pflicht), Tabelle, Hinweisbox, Vor-/Nachteile, CTA; Links intern, extern und auf Glossarbegriffe.
- **SEO-Objekt** in allen Inhaltsdokumenten: Meta-Title/-Description mit Zeichenzähler, Canonical, noindex/nofollow, Open Graph, Sitemap-Priorität und -Frequenz.
- **Validierung:** Pflichtfelder, Längen, Slug eindeutig je Sprache und URL-Raum, reservierte Slugs, Datumslogik.
- **FAQ** ist in allen Typen optional, erscheint als Akkordeon (`<details>`) und als `FAQPage`-Schema.

Schema-Änderungen danach immer mit `npm run schema:deploy` veröffentlichen (wichtig für MCP) und das Studio mit `npm run studio:deploy` aktualisieren.

## URLs & Mehrsprachigkeit

Hauptsprache ohne Präfix, weitere Sprachen mit Präfix:

| | Deutsch | Englisch |
|---|---|---|
| Startseite | `/` · `/seite/2/` | `/en/` · `/en/page/2/` |
| Hubs | `/vergleich/` · `/test/` · `/autor/` · `/kategorie/` | `/en/comparison/` · `/en/review/` · `/en/author/` · `/en/category/` |
| Artikel, Landingpage, Seite | `/<slug>/` | `/en/<slug>/` |
| Kategorie | `/kategorie/<slug>/` | `/en/category/<slug>/` |
| Glossar | `/glossar/` · `/glossar/<slug>/` | `/en/glossary/…` |
| Vergleich | `/vergleich/<slug>/` | `/en/comparison/<slug>/` |
| Review | `/test/<slug>/` | `/en/review/<slug>/` |
| Autor | `/autor/<slug>/` | `/en/author/<slug>/` |

- **hreflang** nur zwischen existierenden, indexierbaren Sprachversionen, immer wechselseitig, plus `x-default` → Hauptsprache.
- Der **Sprachumschalter** führt zur übersetzten Seite, sonst zur Startseite der anderen Sprache.
- Alle Seiten entstehen aus einer Routentabelle ([`web/src/lib/routes.ts`](web/src/lib/routes.ts)), die auch Sitemap, hreflang und llms.txt speist.

## SEO & GEO

- **JSON-LD** (`@graph`, per `@id` verknüpft):
  - Organization (Beschreibung, knowsAbout, publishingPrinciples, contactPoint), WebSite
  - WebPage / CollectionPage / ProfilePage / AboutPage / ContactPage mit `speakable`, `reviewedBy`, `mainEntity`
  - BlogPosting/Article mit `about` (Kategorie), `mentions` (Glossarbegriffe), `citation` (Quellen), `workTranslation`/`translationOfWork`
  - Review → SoftwareApplication (oder Product) mit `offers`, `positiveNotes`/`negativeNotes`
  - ItemList (Vergleiche, Listen, Hubs), BreadcrumbList, Person, FAQPage, DefinedTerm (+ `alternateName`, `sameAs`) und DefinedTermSet
- **Interne Verlinkung:** automatische Glossar-Links (erstes Vorkommen je Begriff), „Erwähnt in“ auf Glossarseiten, verwandte Inhalte (manuell + automatisch nach Kategorie/gemeinsamen Begriffen), Begriffe auf Kategorie- und Startseite, Hubs `/vergleich/`, `/test/`, `/autor/`, `/kategorie/`, Footer-Spalten.
- **E-E-A-T:** Autorenbox mit Link auf Redaktionelle Richtlinien, „Fachlich geprüft von“, Quellenverzeichnis, Redaktionsseite.
- **Sitemaps** `/sitemap-index.xml` → `/sitemap-de.xml`, `/sitemap-en.xml` (mit `xhtml:link`-Alternativen); **robots.txt**; **RSS** `/rss.xml`, `/en/rss.xml`.
- **llms.txt** (Übersicht nach [llmstxt.org](https://llmstxt.org)) und **llms-full.txt** (Volltext).
- **Zitierfähig:** Kurzantwort am Seitenanfang, klare H2-Struktur mit Inhaltsverzeichnis, echte `<table>`, `<ul>`, `<dl>`.
- **Core Web Vitals:** statisches HTML, kein Client-JavaScript (FAQ über `<details>`), responsive AVIF/WebP mit `width`/`height`, lokale Schriften mit `preload` und `font-display: swap`, CSS inline.
- **Barrierefreiheit:** Skip-Link, sichtbarer Fokus, Tastaturbedienung, Alt-Text-Pflicht, ausreichende Kontraste.

## Themes

Aktives Theme: `site.config.ts → theme`. Zum Ausprobieren ohne Änderung: `SITE_THEME=editorial npm run build`.

Jedes Theme in `web/src/themes/<name>/` liefert (Vertrag in [`themes/types.ts`](web/src/themes/types.ts)):

| Datei | Inhalt |
|---|---|
| `tokens.css` | `@font-face` + alle CSS-Variablen (Farben, Schriften, Größen, Abstände, Radien, Schatten, Breiten) |
| `theme.ts` | vorzuladende Schriften, Favicon, `theme-color` |
| `Header.astro`, `Footer.astro` | Kopf und Fuß |
| `Card.astro` | Karte in den Varianten `lead`, `default`, `compact` |
| `Listing.astro` | Anordnung der Karten (Startseite / Archiv) |
| `ArticleLayout.astro` | Gerüst für Artikel, Glossar, Seiten (Slots: breadcrumbs, meta, lead, aside, default, after) |
| `fonts/` | WOFF2-Dateien + Lizenzen |

**Neues Theme:** Ordner eines bestehenden Themes kopieren, Tokens und Komponenten anpassen, `theme` in `site.config.ts` umstellen. Inhaltskomponenten (`components/`, `views/`) bleiben unverändert – sie nutzen nur Tokens.

Mitgeliefert: **pixel** (Tech-Magazin, Purpur, Montserrat/Roboto, eckig, dichtes Raster) und **editorial** (Fraunces/Source Sans 3, warme Töne, runde Karten, zentrierte Lesespalte).

## Veröffentlichung & Deploy

```
Studio / MCP → Veröffentlichen → Sanity-Webhook „Cloudflare Rebuild“
            → Cloudflare-Deploy-Hook → Build aus GitHub (main) → online (~1–2 Min.)
```

**Cloudflare Pages** (Projekt mit dem GitHub-Repository verbunden):

| Einstellung | Wert |
|---|---|
| Build command | `npm run build` |
| Build output directory | `web/dist` |
| Root directory | *(leer)* |
| Variablen | `NODE_VERSION=24.22.2`, `SANITY_API_READ_TOKEN=…` (als Secret), optional `SITE_URL` |

**Webhook:** Deploy-Hook in Cloudflare anlegen (Settings → Build → Deploy hooks, Branch `main`), URL als `CF_DEPLOY_HOOK` in `.env` eintragen, dann `npm run webhook -w studio`. Ausgelöst wird bei Veröffentlichen/Löschen aller Inhaltstypen (keine Entwürfe).

**Domain:** In Cloudflare Pages → Custom domains die Domain hinzufügen, danach `SITE_URL` entfernen (die Website wird indexierbar). Empfohlen: Weiterleitung von `<projekt>.pages.dev` auf die Domain (Cloudflare → Rules → Redirect Rules / Bulk Redirects).

## Inhalte per MCP

Inhalte werden vorrangig über den offiziellen **Sanity-MCP-Server** angelegt.

Der Server ist im Repository bereits eingetragen ([`.mcp.json`](.mcp.json)) – Claude Code (CLI und VS-Code-Erweiterung) erkennt ihn automatisch. Einmalig:

1. Claude Code im Projektordner neu starten und den Projekt-MCP-Server `sanity` zulassen.
2. `/mcp` → `sanity` → **Authenticate** → im Browser mit dem Sanity-Konto anmelden und das Projekt freigeben.

Ausführliche Regeln je Inhaltstyp, Feldformate und JSON-Beispiele: **[docs/REDAKTIONSLEITFADEN.md](docs/REDAKTIONSLEITFADEN.md)**.

Kurzfassung für das Anlegen per MCP:

- Schema vorher mit `npm run schema:deploy` veröffentlichen.
- Übersetzte Typen brauchen das Feld `language` (`de`/`en`).
- DE- und EN-Fassung werden über ein Dokument `translation.metadata` verbunden (siehe `studio/scripts/demo-content.ts`, Funktion `translation`).
- Veröffentlichen löst automatisch den Rebuild aus.

## Qualitätsprüfungen

Laufen bei jedem `npm run build`:

| Prüfung | Was |
|---|---|
| `check-leaks` | Kein `sanity.io`, `sanity.studio` und keine Project ID in `web/dist/` – sonst Abbruch |
| `check-hreflang` | Jede Sprachversion existiert und verweist identisch zurück; Selbstverweis und `x-default` vorhanden |
| `postbuild` | 404-Seiten der weiteren Sprachen nach `/<lang>/404.html` (für Cloudflare) |

Zusätzlich: `npm run check` (TypeScript für Website und Studio). Lighthouse (mobil): Startseite, Artikel und Glossar ≥ 95 in allen Kategorien.

## Skripte

| Befehl | Zweck |
|---|---|
| `npm run dev` / `build` / `preview` | Website |
| `npm run studio` / `studio:deploy` / `schema:deploy` | Studio |
| `npm run check` | Typprüfung |
| `npm run seed -w studio` | Kategorien + Einstellungen anlegen (idempotent) |
| `npm run demo -w studio` / `demo:remove -w studio` | Demo-Inhalte (IDs `demo-*`) anlegen / entfernen |
| `npm run webhook -w studio` | Sanity-Webhook → Cloudflare anlegen bzw. erneuern |

---

## Neuen Blog aus dieser Vorlage erstellen

> Ziel: ein komplett eigenständiger Blog – eigenes Sanity-Projekt, eigene Domain, eigenes Design – ohne Reste des Vorgängers.

### 1. Repository kopieren

```bash
git clone https://github.com/<konto>/<vorlage>.git neuer-blog
cd neuer-blog
rm -rf .git && git init -b main
rm -f .env
```

Neues, leeres GitHub-Repository anlegen und als `origin` hinzufügen. **Nicht forken** – sonst bleibt die Verbindung zum alten Repository bestehen.

### 2. Neues Sanity-Projekt anlegen

```bash
nvm use && npm install
npx sanity login
cd studio
npx sanity projects create "Neuer Blog" --dataset production --dataset-visibility private
```

Die ausgegebene **Project ID** notieren.

### 3. `site.config.ts` anpassen

- `name`, `url`, `description`
- `sanity.projectId` (neu), `sanity.dataset`, `sanity.studioHost` (neuer, freier Name), `sanity.studioAppId` **leeren** (`''`)
- `locales` und `routes`, falls andere Sprachen/Segmente
- `theme`, `social`, `pageSize`

Bei anderen Sprachen außerdem: Texte in `web/src/lib/i18n.ts` (`ui`) ergänzen und `web/src/pages/en/` (404, RSS) entsprechend umbenennen.

### 4. Kategorien & Grunddaten

In `studio/scripts/seed.ts` die Liste `categories` anpassen, dann:

```bash
npm run seed -w studio
npm run schema:deploy
npx sanity cors add http://localhost:3333 --credentials   # im Ordner studio/
```

### 5. Studio veröffentlichen

```bash
npm run studio:deploy
```

Die ausgegebene `appId` in `site.config.ts → sanity.studioAppId` eintragen.

### 6. Lese-Token & `.env`

```bash
cd studio
npx sanity tokens add "Cloudflare Build (Viewer)" --role viewer
```

Token in `.env` als `SANITY_API_READ_TOKEN` eintragen.

### 7. Theme anpassen

Bestehendes Theme kopieren (`web/src/themes/<neu>/`), Tokens, Schriften (`fonts/` + Lizenzen), Favicon und Layout-Komponenten anpassen, `theme` in `site.config.ts` setzen. Mit Demo-Inhalten prüfen:

```bash
npm run demo -w studio && npm run build && npm run preview
# später: npm run demo:remove -w studio
```

### 8. Cloudflare Pages

1. Neues Pages-Projekt, mit dem **neuen** GitHub-Repository verbinden.
2. Build-Einstellungen und Variablen wie unter [Veröffentlichung & Deploy](#veröffentlichung--deploy) (neuer `SANITY_API_READ_TOKEN`).
3. Deploy-Hook anlegen → `CF_DEPLOY_HOOK` in `.env` → `npm run webhook -w studio`.
4. Custom Domain hinzufügen (bis dahin `SITE_URL` auf die `pages.dev`-Adresse setzen).

### 9. MCP verbinden

`.mcp.json` ist bereits enthalten: Claude Code im neuen Projektordner starten, `/mcp` → `sanity` → authentifizieren und das **neue** Projekt verwenden.

### 10. Rückstände prüfen

Im Projekt darf nichts mehr auf den Vorgänger verweisen:

```bash
# alte Project ID, alter Name, alte Domain, alter Studio-Host
grep -rniE "u9pdnj82|tekpixo" --exclude-dir={node_modules,dist,.git,.astro,.sanity} .
```

Erwartet: **keine Treffer** (außer bewusst übernommenen Texten). Dann:

```bash
npm run build      # check-leaks + check-hreflang müssen grün sein
```

Abschließend prüfen:

- [ ] Studio des neuen Projekts zeigt nur eigene Inhalte
- [ ] `robots.txt`, Sitemap und Canonicals zeigen die neue Domain
- [ ] Impressum, Datenschutz, Kontakt, Redaktionelle Richtlinien im Studio angelegt und in den Einstellungen verknüpft
- [ ] Veröffentlichen im Studio löst einen Cloudflare-Build aus
- [ ] Rich Results Test und Lighthouse für Startseite, Artikel und Glossar
