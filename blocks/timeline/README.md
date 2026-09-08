# Timeline

Displays an interactive year-by-year awards timeline. Clicking a year (or the prev/next
arrows) makes it active and shows that year's award cards, reusing the existing `Cards`
block for the award content nested inside each year.

## Authoring

| Field | Type | Description |
|---|---|---|
| — | — | The Timeline block has no fields of its own; add one or more `Timeline Year` items. |

### Timeline Year (child item)

| Field | Type | Description |
|---|---|---|
| Year | Text | The year label shown on the timeline marker (e.g. `2025`). |

Inside each `Timeline Year` item, add a `Cards` block and author one card per award for
that year (image/icon + rich text).

## Responsive Behaviour

| Breakpoint | Behaviour |
|---|---|
| Mobile (< 900px) | Year markers scroll horizontally; award cards wrap and stack. |
| Desktop (≥ 900px) | All year markers visible; award cards laid out in an alternating staggered row. |

## File Structure

```
blocks/timeline/
├── timeline.css
├── timeline.js
└── _timeline.json
```

Award content per year is authored as a nested `Timeline Year` container (defined in
`_timeline.json`, resourceType `block`) holding a standard `Cards` block. `timeline.js`
manually decorates/loads the nested `Cards` block since it sits deeper than the elements
AEM's default block scanner picks up.
