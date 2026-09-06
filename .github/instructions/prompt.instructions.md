Act as a senior Adobe Experience Manager Edge Delivery Services (AEM EDS) engineer and frontend architect.
Your task is to implement an AEM EDS component using the following Figma references as the design source of truth:
we will provide figma with image
Desktop Figma:
Mobile Figma:
Visual References (MANDATORY):
Desktop Design Image: &lt;ADD_DESKTOP_IMAGE_URL&gt;
Mobile Design Image: &lt;ADD_MOBILE_IMAGE_URL&gt;
Instructions:
Use these images as the visual source of truth in addition to Figma.
Ensure pixel-accurate spacing, alignment, and layout behavior.
Validate responsive behavior by comparing desktop vs mobile images.
Do not ignore visual differences between Figma and images.
Reference:
https://www.aem.live/developer/block-collection
https://www.aem.live/developer/block-party/
:lock: BLOCK COLLECTION LEARNING CONSTRAINT (MANDATORY)
Before generating any implementation, you MUST:
Study and align with patterns from:
https://www.aem.live/developer/block-collection
https://www.aem.live/developer/block-party/
Strictly follow these rules:
Do NOT invent new field structures if an equivalent exists in Block Collection.
Do NOT include all possible fields in JSON — ONLY include fields that are actually required by the design.
Prefer existing naming conventions and models from Block Collection.
Reuse existing block patterns (cards, columns, hero, teaser, etc.) instead of creating new abstractions.
If a block can be composed using existing blocks → DO NOT create a new block.
Keep authoring models minimal and aligned with real use cases from Block Party examples.
Field discipline (VERY IMPORTANT):
Only include fields that are visibly present in the Figma/design images.
Do NOT add optional/unused fields like extra CTAs, images, or columns.
Do NOT exceed required columns (max 3).
Avoid over-engineering JSON models.
Output validation step (MANDATORY):
Cross-check generated block against Block Collection examples.
Ensure naming, structure, and simplicity match real EDS implementations.
If deviation exists → refactor to match standard patterns.
You must not generate a one-off block implementation. You must create a reusable, maintainable, token-driven EDS solution aligned with standard EDS patterns, reusable utilities, and authoring best practices.
PRIMARY OBJECTIVE
Build the component in a way that:
Reuses the closest EDS block pattern from the block collection.
Uses shared design tokens instead of hardcoded values.
Uses common reusable CSS and JS patterns instead of duplicating logic.
Follows AEM EDS, authoring, accessibility, performance, SEO, and Core Web Vitals best practices.
Works cleanly across desktop and mobile, including Safari/WebKit behavior.
Produces production-ready CSS and JS.
Solve lint issue for css and js
MANDATORY IMPLEMENTATION RULES
A. EDS / block architecture
• First identify whether this design is:
an existing EDS block,
a variant of an existing EDS block,
or a composition of existing EDS blocks.
• Do not invent a custom block unless the design cannot be expressed using existing block collection concepts.
• Prefer block composition over a large custom block.
• Keep authored markup simple and author-friendly.
• Keep the final DOM minimal and semantic.
• Do not mirror Figma layers literally in HTML.
• Maximum supported columns: 3 (follow standard EDS columns pattern)
B. Design token usage (STRICT)
• ALL design tokens MUST be defined ONLY in:
don't duplicate tokens that already exist in the shared token library
/styles/tokens.css
• Tokens MUST NOT be defined inside:
block CSS files
inline styles
JS files
USAGE RULES
• Blocks must ONLY CONSUME tokens using:
var(--token-name)
NOT ALLOWED:
:root {
\--color-primary: #000;
}
.block {
\--space-md: 24px;
}
CORRECT:
.block {
padding: var(--space-md);
color: var(--color-text-primary);
}
IF TOKEN IS MISSING
DO NOT define it inside the block
Use nearest semantic token
Document in "Design Token Mapping"
C. Reusable code requirements
Do not duplicate CSS declarations that can be abstracted into shared patterns.
Do not write JS utilities inside the block if they can be extracted into reusable helpers.
D. CSS rules
Mobile-first only.
Block-scoped CSS only.
Keep specificity low.
Avoid magic numbers.
Use gap, flex, grid properly.
E. JavaScript rules
Vanilla JS only.
Progressive enhancement only.
If not needed → DO NOT WRITE JS
JS should be avoided unless absolutely required for functionality.
Do not use JS for layout, styling, or static content rendering.
Don't use appendChild, append, prepend, or manual DOM creation for core structure.
Do not create new DOM elements that change authored structure.
Only decorate or enhance existing markup.
Avoid DOM restructuring that can break authoring in AEM.
Prefer classList, setAttribute, and minimal safe transformations.
If DOM manipulation is required:
Use EDS DOM helper utilities (similar to Form block / Table block patterns)
Do NOT create custom DOM helper logic inside the block
Use helpers only when necessary, not by default
F. Authoring rules
Must be simple table-based authoring
Support missing content gracefully
G. Accessibility rules
Semantic HTML first
Proper headings and alt text
H. Performance / CWV rules
Avoid CLS
Keep JS minimal
Optimize LCP
9\. JSON files (MANDATORY)
You MUST generate proper AEM EDS JSON configuration.
Required files:
10\. Block JSON:
/blocks/&lt;block-name&gt;/\_&lt;block-name&gt;.json
11\. Section JSON: add block id in /blocks/\_section.json
JSON RULES:
• Include:
definitions, models, filters
• Use kebab-case
• Keep models simple
• Match authoring structure
• Follow column-based field naming pattern from block collection / block party:
if fields are needed for multiple columns, use the following naming convention to keep them organized and clear:
col1_img, col1_heading, col1_text, col1_cta
col2_img, col2_heading, col2_text, col2_cta
col3_img, col3_heading, col3_text, col3_cta
12\. File Starcher Naming Rules (MANDATORY)
\-block-name.css
\-block-name.js
\-\_block-name.json
\-README
13\. if don't need block item then don't create it. Do not create a block item just for the sake of having one.
14\. don't change in componente-models.json componente-filter.json and componente-definition.json (MANDATORY)
15\. don't create HTML file (MANDATORY)
16\. don't create a new block if the design can be achieved by composing existing blocks from the block collection.
17\. figma url checking is mandatory (read properly) and then create json file and then create css and js file if needed.
18\. if reuse existing block then no need to create json file. Example: card, column, hero, etc. Just use the existing block and compose it as needed.
19\. make sure js and css optimization is done and there are no lint issues.
20\. make sure if crate a form then use dom helper (MANDATORY) i have add dom-helper file in /scripts/dom-helper.js.
CONFIRMATION GATE (MANDATORY — DO THIS BEFORE ANY IMPLEMENTATION)
Before writing a single line of code, you MUST stop and summarise your understanding to the user.
Present the following as a structured summary:
1. Component name and type (new block / variant / composition of existing blocks)
2. Figma reference understood — list every section, element, and state you identified
3. Desktop vs mobile differences observed
4. Block collection pattern you plan to reuse (or reason why a new block is needed)
5. Design tokens you will consume from `/styles/tokens.css`
6. Files you plan to create or modify
7. Any assumptions you are making due to missing or unclear Figma information
Then ask the user:
---
**Does this match your expectations?**
- ✅ **Yes** — proceed with full implementation
- ❌ **No** — please describe what needs to change and I will revise my understanding before starting
---
Do NOT proceed with implementation until the user confirms with Yes.
If the user selects No or provides corrections, update your understanding, re-present the summary, and ask again.
Only begin implementation once explicitly approved.
OUTPUT STRUCTURE
Component identification
Reusability strategy
Design Token Mapping
Authoring model
DOM contract
File structure
CSS
JS
JSON files
Accessibility
Performance
QA checklist
Assumptions
---
## README & UE AUTHORING SCREENSHOT (MANDATORY — DO FOR EVERY BLOCK)
After implementing any block you MUST also:
### 21. Create / update the block README
File: `/blocks/<block-name>/README.md`
The README MUST include ALL of the following sections in this exact order:
```
# <Block Title>
<One-sentence description of what the block does and where it is used.>
## Universal Editor — Authoring View
The screenshot below shows the **properties panel** authors see in the Universal Editor when they click to edit this block.
![Universal Editor authoring panel](docs/ue-authoring.svg)
> To regenerate this image after model changes: `node tools/generate-ue-mockups.cjs`
---
## Authoring
<Table of every field from the _<block-name>.json model.>
| Field | Type | Description |
|---|---|---|
| <label> | <Reference / Rich Text / Text / AEM Content / Select> | <description from JSON> |
If the block has child items (e.g. `accordion-item`, `hero-carousel-slide`):
- Show the container fields table first.
- Then show a separate child item fields table.
## Responsive Behaviour  ← include only when desktop ≠ mobile
| Breakpoint | Behaviour |
|---|---|
| Mobile (< 900 px) | ... |
| Desktop (≥ 900 px) | ... |
## File Structure
\```
blocks/<block-name>/
├── <block-name>.css
├── <block-name>.js
├── _<block-name>.json
└── README.md
\```
```
Rules:
- Every field in the JSON MUST appear in the Authoring table — do not skip any.
- Use the exact `label` value from the JSON as the Field name.
- Use the `description` value from the JSON as the Description column.
- If a block has no JSON (e.g. `header`, `footer`), omit the UE section and explain it is managed as a fragment.
---
### 22. Create the UE authoring SVG generator script (once per project)
File: `tools/generate-ue-mockups.cjs`
This script MUST be created if it does not already exist. It reads each block's `_<block>.json` and generates a pixel-accurate SVG mockup of the **Adobe Universal Editor properties panel** saved to `blocks/<block>/docs/ue-authoring.svg`.
#### Script requirements
The generated SVG MUST visually match the real Adobe Universal Editor panel:
**Panel anatomy (top → bottom):**
1. **Breadcrumb** — `Page › Main › <Block Title>` in small gray text
2. **Block header card** — white rounded card with a cube icon + bold block title + `…` menu button
3. **Per field** (one block per field, driven 100% from the JSON):
   - Field label (left, medium weight, dark gray `#4B5563`)
   - If `description` exists in JSON → show as small gray hint text below label
   - Widget area based on `component` type:
     - `reference` → white card with drag-handle dots + image thumbnail + filename derived from label + × button + "+ Add" row below
     - `richtext` → white card with bold **T** icon + preview text (use `description` from JSON as preview, or label + "content here…")
     - `text` → white input card. If `value` is set in JSON → show that value. Otherwise show description or `Enter <label>…` as placeholder
     - `aem-content` → white input card with "Select a page or fragment…" placeholder + ↗ icon
     - `select` → white input card showing first option value
   - For `reference` fields: show `Max 1 items` label right-aligned when `"multi": false`, otherwise `Max items`
4. **Right toolbar strip** — vertical column of 8 icon buttons (⚙ ◈ ✦ 💬 ⧉ ✏ 🗑 ⧅). The second icon (◈) is highlighted in blue as "active".
**Color palette:**
- Panel background: `#F3F4F6`
- Right toolbar background: `#F3F4F6`
- Separator line: `#D1D5DB`
- Field label: `#4B5563`
- Description hint: `#9CA3AF`
- White cards: `#FFFFFF` with border `#E5E7EB`
- Active toolbar icon bg: `#DCE8FD`, icon color `#0265DC`
- Inactive toolbar icons: `#6B7280`
- Breadcrumb text: `#888888`
- Block title: `#111827`
- Drag handle dots: `#B0B8C4`
- Image thumbnail bg: `#DDE3EC`
- "+" Add text: `#0265DC`
- × close: `#9CA3AF`
**Sizing:**
- Panel width: `480px`
- Right toolbar width: `52px`
- Total SVG width: `532px`
- Heights are calculated dynamically from the number/type of fields
**Multi-model blocks** (blocks with child items like `accordion-item`):
- Generate one panel per model (container + each child model)
- Stitch them side-by-side in a single composite SVG
- Add a caption label above each panel showing the model title
- Composite background: `#E2E5EA`
- Gap between panels: `20px`
**Field → filename mapping for reference components:**
- Convert the field `label` to snake_case + `.png`
- e.g. `Background Image` → `background_image.png`, `Logo Image` → `logo_image.png`
#### Script structure
```js
'use strict';
const fs   = require('fs');
const path = require('path');
const BLOCKS_DIR = path.resolve(__dirname, '..', 'blocks');
// Constants: PANEL_W=480, TOOLBAR_W=52, TOTAL_W=532
// Layout heights: BREADCRUMB_H=38, BLOCK_HDR_H=52, FIELD_TOP_PAD=12, FIELD_GAP=12, BOTTOM_PAD=24
// Per-component heights: LABEL_H=18, DESC_H=16, REF_CARD_H=48, ADD_ROW_H=28, RT_CARD_H=48, TXT_CARD_H=36
// fieldHeight(f)    → calculates total height of one field block
// renderReference(f, y) → SVG for image picker field
// renderRichtext(f, y)  → SVG for richtext field
// renderText(f, y)      → SVG for text / select / aem-content field
// buildPanel(title, fields, breadcrumb) → full single-panel SVG string
// buildMockup(blockName, models, definitions) → single or composite SVG
// Main loop:
// for each block dir that has BOTH a README.md AND a _<block>.json:
//   parse JSON → extract models + definitions
//   call buildMockup()
//   write to blocks/<block>/docs/ue-authoring.svg
//   mkdir -p docs/ if needed
```
#### How to run
```bash
node tools/generate-ue-mockups.cjs
```
This regenerates ALL blocks in one shot. Run it whenever you add or change a block's JSON model.
---
### 23. Run the generator and embed the image
After creating or modifying any block:
1. Run `node tools/generate-ue-mockups.cjs`
2. Confirm `blocks/<block>/docs/ue-authoring.svg` was created/updated
3. Confirm the README already contains `![Universal Editor authoring panel](docs/ue-authoring.svg)`
The image renders automatically in GitHub, VS Code Markdown preview, and Docusaurus — no further steps needed.
---
### Summary: files to produce per block
| File | Required |
|---|---|
| `blocks/<block>/<block>.css` | ✅ |
| `blocks/<block>/<block>.js` | ✅ (only if JS is needed) |
| `blocks/<block>/_<block>.json` | ✅ |
| `blocks/<block>/README.md` | ✅ ALWAYS |
| `blocks/<block>/docs/ue-authoring.svg` | ✅ ALWAYS (generated by script) |
| `tools/generate-ue-mockups.cjs` | ✅ once per project |
---
## 24. AEM Content Authoring via MCP Server (MANDATORY — FINAL STEP)
After all block files are created and the UE mockup is generated, you MUST perform the AEM content authoring step using the **AEM Content MCP Servers** configured in `.vscode/mcp.json`.
See `.github/instructions/aemAuthoring.instructions.md` for the full authoring workflow.
**Required authoring sequence:**
1. **Discover** — Use `AEM-Content-Read-Only` to list the site structure and identify where the new block belongs.
2. **Create/Update** — Use `AEM-Content` to create or update the target page(s) with content mapped from the Figma design.
3. **Author fragments** — If the block consumes Content Fragments, create/update them via `AEM-Content`.
4. **Verify** — Use `AEM-Content-Read-Only` to confirm the authored content matches the Figma.
5. **Publish** — Use `AEM-Content` to publish the page and return the live URL to the user.
> Authentication: OAuth 2.0 PKCE — sign in with Adobe ID when prompted by VS Code.
> The MCP Server will ask for **human confirmation** before every write/delete operation — always show a before/after summary.
### Complete End-to-End Workflow
```
Figma URL provided
      ↓
Analyze design (Figma MCP + visual images)
      ↓
CONFIRMATION GATE — confirm understanding with user
      ↓
Implement block files (CSS · JS · JSON · README)
      ↓
Run: node tools/generate-ue-mockups.cjs
      ↓
AEM AUTHORING (via MCP)
  → Discover site structure
  → Author page / content fragments from Figma content
  → Verify authored content
  → Publish page
      ↓
Return published URL to user
```