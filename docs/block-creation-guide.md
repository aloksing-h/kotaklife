# Block Creation Guide

How to create new blocks in this AEM Edge Delivery project.

---

## 0. Before You Create a Block — Reuse First

**Always analyze the design against existing blocks before creating anything new.**

When you receive a UI screenshot or design mockup, break it down into patterns and map each pattern to an existing block. Only create a custom block if no existing block can handle it.

### UI Pattern → Existing Block Mapping

| If you see... | Use this block | How |
|---------------|---------------|-----|
| Title + paragraph text | `rte` or `rte-v2` | Write content directly in the RTE |
| Heading + subheading | `rte` | Use `<h2>` + `<p>` inside the richtext |
| Image with caption | `rte` | Insert image + text in the RTE |
| Background image with text overlay | `hero` | Image reference + richtext content |
| Banner with CTA | `banner` | Background image + button |
| Grid of cards (image + text) | `cards` | Add card children with image + text |
| Profile cards (photo + name + role) | `cards` | Use "Profile Cards" variant |
| Financial cards (icon + number + label) | `cards` | Use "Financial Cards" variant |
| Image + text side by side | `columns` | 2-column layout with image + RTE |
| Multi-column content | `columns` | 2, 3, or 4 column layout |
| Tabbed content | `tabs` | Add tab-item children with richtext |
| Accordion / FAQ | `accordion` | Add accordion-item children |
| Quote with attribution | `quote` | Quotation + attribution richtext fields |
| Video embed | `video` | YouTube or embed URL |
| External content / iframe | `embed` | oEmbed URL or iframe |
| Data table | `table` | HTML table markup |
| Form | `form` | Form fields configuration |
| Reusable content block | `fragment` | Reference to another content fragment |
| Popup / modal | `modal` | Triggered by click on another element |
| Search bar | `search` | Gemini AI powered search |

### Example analysis

**Design shows:** A section with a heading, description, grid of 4 plan cards (each with badge, name, image, description, link), and a "Browse All Plans" button.

**Breakdown:**
- Heading + description → `rte` block
- Grid of cards → `cards` block (image + text per card)
- Button → button component below the block

**Result:** No new block needed. Use existing `rte` + `cards` + button.

### When to create a new block

Create a custom block only when:
- The pattern has **no match** in the table above
- The pattern needs **specific JS behavior** that existing blocks don't provide (e.g., animated counters, Swiper.js carousel)
- The pattern requires **nested child components** that existing blocks can't represent (e.g., tabs containing cards)
- The pattern needs a **unique layout** that can't be achieved with columns + CSS

### Decision flow

```
1. Break design into visual sections
2. For each section, check the mapping table above
3. If existing block matches → use it
4. If partially matches → can you add a CSS variant class to the existing block?
5. If nothing matches → create a new block
```

---

## File Structure

Every block lives in `blocks/{blockname}/` and needs **3 files**:

```
blocks/{blockname}/
  _{blockname}.json    # Component definition + model + filter
  {blockname}.js       # DOM decoration logic
  {blockname}.css      # Block-scoped styles
```

---

## 1. JSON Model (`_{blockname}.json`)

Three sections: `definitions`, `models`, `filters`.

### Simple block (no children) — e.g. quote:

```json
{
  "definitions": [
    {
      "title": "Quote",
      "id": "quote",
      "plugins": {
        "xwalk": {
          "page": {
            "resourceType": "core/franklin/components/block/v1/block",
            "template": {
              "name": "Quote",
              "model": "quote"
            }
          }
        }
      }
    }
  ],
  "models": [
    {
      "id": "quote",
      "fields": [
        {
          "component": "richtext",
          "name": "quotation",
          "label": "Quotation",
          "valueType": "string"
        },
        {
          "component": "richtext",
          "name": "attribution",
          "label": "Attribution",
          "valueType": "string"
        }
      ]
    }
  ],
  "filters": []
}
```

### Block with children — e.g. accordion:

```json
{
  "definitions": [
    {
      "title": "Accordion",
      "id": "accordion",
      "plugins": {
        "xwalk": {
          "page": {
            "resourceType": "core/franklin/components/block/v1/block",
            "template": {
              "name": "Accordion",
              "filter": "accordion",
              "model": "accordion"
            }
          }
        }
      }
    },
    {
      "title": "Accordion Item",
      "id": "accordion-item",
      "plugins": {
        "xwalk": {
          "page": {
            "resourceType": "core/franklin/components/block/v1/block/item",
            "template": {
              "name": "Accordion Item",
              "model": "accordion-item"
            }
          }
        }
      }
    }
  ],
  "models": [
    {
      "id": "accordion",
      "fields": [
        {
          "component": "multiselect",
          "name": "classes",
          "label": "Style",
          "options": [
            { "name": "FAQ", "value": "faq-accordion" },
            { "name": "Disclaimer", "value": "disclaimer" }
          ]
        }
      ]
    },
    {
      "id": "accordion-item",
      "fields": [
        {
          "component": "richtext",
          "name": "label",
          "label": "Label",
          "valueType": "string"
        },
        {
          "component": "richtext",
          "name": "body",
          "label": "Body",
          "valueType": "string"
        }
      ]
    }
  ],
  "filters": [
    {
      "id": "accordion",
      "components": ["accordion-item"]
    }
  ]
}
```

### Field types reference

| `component` | Use for | Example |
|-------------|---------|---------|
| `richtext` | Text with formatting (bold, italic, links, headings) | titles, descriptions, quotes |
| `text` | Plain text, no formatting | alt text, labels, short values |
| `reference` | Image/asset picker | `image` fields |
| `aem-content` | Link picker | button links, card links |
| `select` | Single dropdown | button type, heading level |
| `multiselect` | Multi-select dropdown | style variants |

### Key rules

- `definitions[].id` must match the block directory name
- Parent block uses `resourceType: ".../block/v1/block"`
- Child items use `resourceType: ".../block/v1/block/item"`
- `template.filter` links to a filter that lists allowed child component IDs
- `template.model` links to a model that defines editable fields
- `filters[].components` lists which child IDs are allowed inside the block

---

## 2. JavaScript (`{blockname}.js`)

Must export a default `decorate` function. Can be sync or async.

### Minimal pattern:

```js
export default function decorate(block) {
  // Transform authored DOM into final rendered structure
  [...block.children].forEach((row) => {
    // row = each div the author created inside the block
  });
}
```

### With imports:

```js
import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.replaceChildren(ul);
}
```

### Common imports

| What | Import from |
|------|-------------|
| `createOptimizedPicture` | `../../scripts/aem.js` |
| `toClassName` | `../../scripts/aem.js` |
| `decorateIcons` | `../../scripts/aem.js` |
| `moveInstrumentation` | `../../scripts/scripts.js` |
| `decorateButtons` | `../../scripts/scripts.js` |
| `dom-helpers` (div, span, button, etc.) | `../../scripts/dom-helpers.js` |

### Rules

- Always include `.js` extension in imports
- Use `moveInstrumentation(from, to)` to preserve `data-aue-*` attributes for Universal Editor
- For async blocks (needs fetching), use `export default async function decorate(block)`

---

## 3. CSS (`{blockname}.css`)

### Rules

- **Scope every selector** with the block class: `.blockname .child` — never bare `.child`
- **Mobile-first**: base styles are for mobile, use `@media (width >= 600px)` for tablet, `(width >= 900px)` for desktop
- **Use CSS custom properties** from `styles/styles.css`: `var(--background-color)`, `var(--text-color)`, etc.
- **No `{blockname}-container` or `{blockname}-wrapper`** classes — those conflict with section layout

### Example:

```css
.tabs .tabs-list {
  display: flex;
  gap: 0.5ch;
  overflow-x: auto;
}

@media (width >= 600px) {
  .tabs .tabs-list {
    font-size: var(--body-font-size-s);
  }
}

.tabs .tabs-list button {
  flex: 0 0 max-content;
  padding: 0.5em;
  border: 1px solid var(--dark-color);
  background-color: #949494;
}

.tabs .tabs-panel[aria-hidden='true'] {
  display: none;
}
```

### Variant styling

Use additional classes on the block element for style variants:

```css
.accordion.faq-accordion .accordion-item { /* FAQ variant */ }
.accordion.disclaimer .accordion-item { /* Disclaimer variant */ }
```

---

## 4. Registration

### Step 1: Add block to section filter

Edit `models/_section.json` → `filters[0].components[]` and add your block ID:

```json
"components": [
  "text", "image", "button", "title",
  "accordion", "banner", "cards", "carousel", "columns", "embed",
  "form", "fragment", "hero", "quote", "search", "rte", "rteV2",
  "tabs", "video",
  "your-new-block"
]
```

### Step 2: Build aggregated JSON

```bash
npm run build:json
```

This runs `merge-json-cli` which picks up all `blocks/*/_*.json` files automatically via glob. It generates:
- `component-definition.json` — all component registrations
- `component-models.json` — all field models
- `component-filters.json` — all child component filters

### Step 3: Lint

```bash
npm run lint
```

---

## 5. Testing Locally

```bash
# Install deps (one-time)
npm install

# Start dev server
npx -y @adobe/aem-cli up --no-open --forward-browser-logs
```

Server runs at `http://localhost:3000` with auto-reload.

### Create test content

1. Make a `drafts/` folder at the project root
2. Add HTML files following AEM markup structure:

```html
<!DOCTYPE html>
<html>
<head><title>Test Page</title></head>
<body>
  <header></header>
  <main>
    <div>
      <!-- Section with your block -->
      <div>
        <!-- Block starts here — div with block class -->
        <div class="your-block">
          <div>Row 1 content</div>
          <div>Row 2 content</div>
        </div>
      </div>
    </div>
  </main>
  <footer></footer>
</body>
</html>
```

3. Start with: `npx -y @adobe/aem-cli up --no-open --html-folder drafts`

### Inspect content

```bash
curl http://localhost:3000/test-page              # rendered HTML
curl http://localhost:3000/test-page.plain.html   # raw HTML without decoration
```

---

## 6. HTML Content Rules

### What TO add inside a block div

Each direct child `div` of the block becomes a row in the `block.children` array. Authors write content inside these rows.

```html
<div class="my-block">
  <div>
    <h2>Title here</h2>
    <p>Description text</p>
    <a href="/page">Link text</a>
  </div>
  <div>
    <picture><img src="/media/image.png" alt="alt text"></picture>
    <p>More content</p>
  </div>
</div>
```

**Valid content inside rows:**
- Headings: `<h1>` through `<h6>`
- Paragraphs: `<p>`
- Links: `<a href="...">`
- Images: `<picture><img src="..." alt="..."></picture>`
- Lists: `<ul>`, `<ol>`, `<li>`
- Inline formatting: `<strong>`, `<em>`, `<span>`
- Divs with content (the UE wraps authored content in divs)

### What NOT to add

- **No block wrapper divs** — the block element itself is the wrapper
- **No `{blockname}-container` or `{blockname}-wrapper` divs** — sections handle layout
- **No inline styles** — use CSS classes instead
- **No `<style>` or `<script>` tags** — styles go in `{blockname}.css`, logic in `{blockname}.js`
- **No nested blocks inside block rows** — blocks are siblings, not nested (except via fragment)
- **No empty divs without content** — each row should have meaningful content for the author

### Authoring markup example (what the UE produces)

For a block with `richtext` fields, the UE delivers:

```html
<div class="my-block">
  <div>
    <div>
      <h2>Find a plan that fits you</h2>
      <p>Explore across protection, savings, health, and retirement</p>
    </div>
  </div>
  <div>
    <div>
      <picture><img src="/media/plan.png" alt="Plan image"></picture>
    </div>
    <div>
      <span class="badge">BEST SELLING</span>
      <strong>Kotak e-Term Plan</strong>
      <p>Simple, affordable protection for your loved ones.</p>
      <a href="/plans/kotak-e-term">View Details</a>
    </div>
  </div>
</div>
```

The JS then transforms this into the final rendered structure.

---

## 7. Checklist

- [ ] Create `blocks/{blockname}/` directory
- [ ] Create `_{blockname}.json` with definitions, models, filters
- [ ] Create `{blockname}.js` with `export default function decorate(block) {}`
- [ ] Create `{blockname}.css` with scoped selectors
- [ ] Add block ID to `models/_section.json` → `filters[0].components[]`
- [ ] Run `npm run build:json`
- [ ] Run `npm run lint`
- [ ] Test at `http://localhost:3000`

---

## Existing Blocks

| Block | Type | Notes |
|-------|------|-------|
| accordion | Children with label+body | FAQ/disclaimer variants |
| banner | Image + CTA | Background banner |
| cards | Image + text children | Profile/financial variants |
| carousel | Slides with image+text | Swiper.js powered |
| columns | Multi-column layout | |
| embed | External content | Iframe/oEmbed |
| footer | Global footer | Structural, no JSON |
| form | Form fields | Dynamic form builder |
| fragment | Content fragment | Reusable content |
| header | Global header | Structural, no JSON |
| hero | Hero banner | Image + text overlay |
| modal | Dialog popup | Triggered by click |
| quote | Quote + attribution | |
| rte | Rich text content | |
| rte-v2 | Rich text v2 | Updated RTE |
| search | Search functionality | Gemini AI powered |
| table | Data table | |
| tabs | Tabbed panels | Tab items as children |
| video | Video player | YouTube/embed |
