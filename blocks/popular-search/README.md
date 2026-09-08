# Popular Search

Displays a "Popular searches" heading with a short description alongside a wrapping list of pill-shaped search tag links.

## Authoring

| Field | Type | Description |
|---|---|---|
| Heading & Description | Rich Text | Author the heading as a Heading 2 (e.g. Popular searches) followed by a short description paragraph. |
| Search Tags | Rich Text | Author a bullet list of links, one per popular search tag, e.g. #Critical illness |

## Responsive Behaviour

| Breakpoint | Behaviour |
|---|---|
| Mobile (< 900 px) | Heading/description stacked above the wrapping tag list, full width. |
| Desktop (≥ 900 px) | Two-column layout: heading/description in a fixed-width left column, tag list wraps in the remaining space. |

## File Structure

```
blocks/popular-search/
├── popular-search.css
├── _popular-search.json
└── README.md
```
