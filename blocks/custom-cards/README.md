# Custom Cards

The Custom Cards block displays cards with images, badges, and action links. Cards render in a desktop grid and mobile Swiper carousel when within a `.custom-cards-section`.

## Universal Editor — Authoring View

The screenshot below shows the **properties panel** authors see in the Universal Editor when they click to edit this block.

![Universal Editor authoring panel](docs/ue-authoring.svg)

---

## Authoring

The container has no authored fields. Add one or more Custom Card child items.

### Custom Card Item

| Field | Type | Description |
|---|---|---|
| Card Variation | Multi Select | Grouped into column 1; Featured applies the fixed red treatment. |
| Image 1 | Reference | Fixed display artwork for the card. |
| Image 1 Alt Text | Text | Describe the image, or leave empty only when decorative. |
| Image 2 | Reference | Optional legacy image; it is not displayed. |
| Image 2 Alt Text | Text | Describe Image 2 when it conveys information. |
| Title | Text | Card heading. |
| Description | Rich Text | Card supporting copy. |
| Card Link | AEM Content | Destination opened by the circular card action. |
| Card Link Text | Text | Accessible label for the card action link. |

The item renders as two authored columns: variation and images in column 1, then badge, title, description, and card link in column 2.

## Responsive Behaviour

| Breakpoint | Behaviour |
|---|---|
| Mobile (< 600px) | 280 x 260 cards use Swiper with accessible pagination when within `.custom-cards-section`. |
| Desktop (>= 600px) | Cards display in a flexible grid layout. |

## Styling & Variants

- **Featured variant**: Apply the `featured` class to a card to display the red treatment (height 382px on desktop).
- **Badge**: Identified automatically as short text (≤ 20 characters) in the body without links.
- **Action**: Identified automatically as any link in the body, displayed as a circular button at bottom-left.

## File Structure

```text
blocks/custom-cards/
|-- custom-cards.css
|-- custom-cards.js
|-- _custom-cards.json
|-- MAPPING-README.md
|-- README.md
`-- docs/
    `-- ue-authoring.svg
```
