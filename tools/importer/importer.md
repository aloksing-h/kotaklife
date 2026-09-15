# Importer (`importv3.js`) — Developer Guide

This document explains how `importv3.js` works, why each piece exists, and what it produces. It's meant for developers who need to maintain, debug, or extend the AEM Franklin/Helix content importer used to migrate Kotak Life blog/article pages into the block-based authoring model.

## Overview

`importv3.js` is a [Helix Importer](https://www.aem.live/docs/import-tooling) transformation script. The importer runs against a live source page (via the bookmarklet/UI or bulk import), takes the page's DOM, and returns:

1. A transformed DOM (`transformDOM`) representing the new document structure, built from AEM Blocks (rendered as HTML tables) that map to the project's block collection (Hero, Accordion, Cards, RTE V2, Embed, etc.).
2. A destination file path (`generateDocumentPath`) that mirrors the original URL structure.

The output DOM is later converted to a Word document (docx) by the importer tool, which is then processed by AEM's Word-to-Markdown pipeline.

## Entry Points

### `transformDOM({ document })`
Main transformation pipeline. Order matters — later steps often depend on earlier cleanup having already happened. See [Transformation Pipeline](#transformation-pipeline-order-matters) below.

### `generateDocumentPath({ url, params })`
Derives the destination content path from the source URL (or `params.originalURL` if provided, which is useful when bulk-importing from a spreadsheet of URLs). Strips protocol/host, query strings, and hash fragments, and maps `/` to `/index`. Uses `WebImporter.FileUtils.sanitizePath` to make the result filesystem/AEM safe.

## Transformation Pipeline (order matters)

The pipeline in `transformDOM` runs roughly in this sequence:

1. **`selectContentRoot(document)`** — Picks `.best-invest.best-invest1.outer` as the content root if present, otherwise falls back to `document.body`. This scopes all further DOM queries/mutations to the actual article content instead of the whole page (nav, footer, etc. are excluded by scope, not just by removal).

2. **`<section>` → `<div>` normalization** (inline in `transformDOM`) — Franklin renders a `---` (thematic break) between top-level `<section>` elements in the output. The source markup uses `<section>` purely for CSS/layout reasons, not to indicate a new AEM section, so every `<section>` is rewritten to a `<div>` (preserving class/id) to avoid introducing unwanted section breaks.

3. **`fixImageUrls(main)`** — Some source images resolve with an incorrect relative/intermediate path (e.g. under `/insurance-guide/protection/...`). This finds any `<img>` whose `src` contains `/assets/images/`, extracts from that point onward, and rewrites it as an absolute `https://www.kotaklife.com/assets/images/...` URL so images resolve correctly regardless of the page they were imported from.

4. **`fixMalformedHeadings(main)`** — Source HTML sometimes illegally nests block-level content (`div`, `section`, `ul`, `ol`, `table`, `article`) inside heading tags (`h1`–`h6`), e.g. an accordion or "Suggested Readings" block wrapped in an `<h2>`. This is invalid HTML and breaks downstream block detection, so any heading containing block-level children is unwrapped into a plain `<div>` (class preserved), preventing those containers from being misread as heading text.

5. **`cleanHeadingFormatting(main)`** — Strips `<b>`/`<strong>` tags found inside headings, replacing them with their text content. This prevents the markdown/docx conversion from producing escaped bold markers inside heading text (e.g. `## **Title**` artifacts).

6. **`removeGlobalNoise(main)`** — Removes known non-content chrome/noise via `WebImporter.DOMUtils.remove`: breadcrumbs, floating menus, popups, social share widgets, "also read" widgets, lead-gen forms, and raw `script`/`style`/`noscript`/`form` tags.

7. **`buildTableInsideRteBlock(main, document)`** — Wraps any real data `<table>` found in the content in an `RTE V2` block (so it round-trips through rich text rather than being interpreted some other way). Empty tables (no `<tr>`) are simply removed. **Runs early** so that later block-builders don't accidentally re-process table markup.

8. **`buildBlockquoteRteBlocks(main, document)`** — Wraps `<blockquote>` elements in an `RTE V2 (blockquote)` block so they get the blockquote-specific styling defined in the RTE V2 block CSS.

9. **`buildHeroBanner(main, document)`** — Converts `.blog-head` (title, intro paragraph, view-count/date meta, "human expertise" badge, and either a dropdown-menu of related links or a single CTA button) into a Hero container, then appends `Section Metadata` with `style = hero-banner`. This is the most complex builder — see [Hero Banner details](#hero-banner-details).

10. **`createEmbedBlocks(main, document)`** — Converts every `<iframe>` (YouTube embeds, etc.) into an `Embed (yt-video)` block containing a link to the iframe's `src`. Iframes without a `src` are simply dropped.

11. **`buildInsuranceSectionsBlocks(main, document)`** — Converts `.insuranceSections` (containing `.blogBox` cards with a heading + paragraph) into a nested bullet list, wrapped in `RTE V2 (card-border-red)`.

12. **`appendFaqAccordion(main, document)`** — Converts `.bor` (question/answer pairs, question in an `h3`/`h4`, answer in `.panel`) into an `Accordion (faq-accordion)` block. Depends on step 4 having already fixed malformed headings, otherwise the question detection can pick up broken markup. The first `.bor`'s position is used for placement (replacing `.accordion-div` wrapper if present); duplicate `.bor` elements are removed afterward.

13. **`buildPinkBulletRteBlocks(main, document)`** — Wraps `<ul class="bullet-pink">` lists in an `RTE V2 (bullet-pink)` block for the pink-bullet visual treatment.

14. **`buildProfileCards(main, document)`** — Converts `.authorBox` (author photo, "reviewed by" text, name, tooltip bio, LinkedIn link) into a `Cards (profile cards)` block with an image cell and a text cell, then tags it with `Section Metadata style = column-left-section`.

15. **`formatBookmarks(main, document)`** — Converts `.check-calculators` (quick-link lists, e.g. "check premium calculator") into `RTE V2 (bookmarks-links)` blocks, appending a `:rightarrowblack:` icon shorthand after every link. Only the last such container in the page gets a `bookmark-section` `Section Metadata` break appended, so multiple bookmark lists in sequence don't each start a new section.

16. **`buildSuggestedReadingsList(main, document)`** — Rebuilds `.suggestion` containers (numbered link paragraphs) as a real `<ol>` of links. This exists because look-alike numbered paragraphs (`1. Link text`) get incorrectly merged into a single paragraph by the docx conversion pipeline — using a genuine ordered list keeps each entry separate.

17. **`appendKotakPromos(main, document)`** — Converts `.saving-token .tokens` (promo cards: image, title, description, link) into a `Cards (financial cards)` block, appended at the end of `main` (these promos aren't necessarily in reading-order in the source).

18. **`appendDisclaimerAccordion(main, document)`** — Wraps `.abovespace .terms .content-col` in an `Accordion (disclaimer)` block with a synthetic "Disclaimer" heading, appended at the end of `main`.

19. **`appendPopularSearches(main, document)`** — Moves the `.popular_list`/`.popular_searches_new` `<ul>` to the end of `main` and tags it with `Section Metadata style = popular-search` (no trailing `<hr>`, since it's expected to be the last thing before the metadata block).

20. **`appendMetadataBlockAtBottom(main, document)`** — Reads `<title>`, meta description (or `og:description`), and `og:image` from the source `document.head` and appends the standard Franklin `Metadata` block via `WebImporter.Blocks.getMetadataBlock`. **Must run last** so the metadata block stays at the very bottom of the document.

> Note: Steps 7–8 run before the Hero/Accordion/Cards builders; steps 9–16 run in content order; steps 17–20 append fixed sections at the very end regardless of where the source content lived on the page. If you add a new builder, decide up front whether it should run in place (content order) or be appended at the end, and add it in the corresponding position.

## Hero Banner details

`buildHeroBanner` deserves extra explanation because it merges several unrelated pieces of `.blog-head` markup into one Hero block:

- **Title & description**: cloned directly from the `<h1>` and the first `<p>` inside `.text-center`.
- **Meta line**: the first `<li>` of `.blogs-ul` (typically "views • date") is combined with the "human expertise" badge (`.smile_div`/`.smile_ai`) into a single paragraph using the `:smile-grey:` icon shorthand, so both render on one line instead of two separate blocks.
- **Navigation**: if a `.drpwn-wrapper` (dropdown of related plan links) exists, it's rebuilt as a nested `<ul>` with `:chevron-down:` and `:economic-crisis:`/`:economic-crisisN:` icon shorthands prepended to each link (index-based icon naming — first item gets no suffix, subsequent items get `1`, `2`, etc.). If there's no dropdown but a `.btnLink a` CTA exists, that's used instead as a plain paragraph link.
- The original `.blog-head` element is replaced by the new hero container, and a `hero-banner` `Section Metadata` + `<hr>` break is appended immediately after it.

If Kotak Life changes the `.blog-head` markup (e.g. renames `.smile_div`, `.drpwn-wrapper`, or `.blogs-ul`), this function will need matching updates — it relies entirely on these specific class names.

## Helper: `appendSectionMetadata`

```js
appendSectionMetadata(element, style, document, addBreak = true)
```

Inserts a two-row `Section Metadata` table (`style` key/value) directly after `element`, optionally followed by an `<hr>` (which Franklin renders as a section break `---`). Centralizing this avoids duplicating the table-building/placement logic across every builder that needs to tag a section style (hero banner, profile cards, bookmarks, popular searches).

## Why noise removal happens where it does

`removeGlobalNoise` runs after image/heading fixes but before any block builder. This ordering matters because:
- Some noise selectors (e.g. `.also-read`, `#leadformem`) could otherwise be picked up by later builders if removal happened last.
- Image URL and heading fixes need to run on the full original DOM first, in case noise removal changes structure in a way that would make later `querySelector` calls miss elements (unlikely here, but kept as a safety convention — always sanitize before building blocks).

## Extending this script

When adding a new block builder:
1. Write a small pure function `build<X>(main, document)` (or `append<X>` if it should land at the end of the doc) following the existing naming convention.
2. Use `WebImporter.DOMUtils.createTable([[headerRow], [...dataRows]], document)` to produce the block table — the header row's text (optionally with a parenthesized variant, e.g. `'Cards (profile cards)'`) must match the block name registered in `component-models.json`/`component-definition.json` and the corresponding block folder under `blocks/`.
3. Call the new function from `transformDOM` in the correct position relative to the pipeline above.
4. If the block needs a specific section style, call `appendSectionMetadata(element, 'style-name', document)` after inserting it.
5. Test against a real source page and confirm the generated table headers exactly match an existing block variant, otherwise AEM will render it as an unstyled default block.
