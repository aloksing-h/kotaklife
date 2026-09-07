# Advisor CTA

Promotional call-to-action block inviting visitors to join Kotak Life Insurance as a life advisor, pairing a decorative image with a heading, supporting copy, and a "Join Now" button.

## Authoring

| Field | Type | Description |
|---|---|---|
| Image | Reference | Decorative composite image |
| Alt | Text | Alt text for the image |
| Heading | Text | e.g. Join kotak life insurance as a life advisor |
| Subheading | Text | e.g. Start a successful work-from-home career. (desktop only) |
| Button | Rich Text | Author a bold link, e.g. **[Join Now](https://example.com)** |

## Responsive Behaviour

| Breakpoint | Behaviour |
|---|---|
| Mobile (< 900 px) | Stacked: Heading → Image → Button. Subheading is hidden to match the mobile design. |
| Desktop (≥ 900 px) | Two-column layout: Image on the left; Heading, Subheading, and Button stacked on the right, vertically centered. |

## File Structure

```
blocks/advisor-cta/
├── advisor-cta.css
├── advisor-cta.js
├── _advisor-cta.json
└── README.md
```
