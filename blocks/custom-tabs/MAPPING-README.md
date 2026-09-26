# Custom Tabs Mapping

## Source Mapping

This is a new Universal Editor component; no existing live-page source markup was provided.

| Source element | EDS component | Notes |
|---|---|---|
| Custom tab navigation | `custom-tabs` block | Generated from titled panel sections; CSS/JS only |
| Tab panel | `custom-tabs-panel` section | Section title supplies the tab label |
| Panel body | Any component allowed by the `section` filter | Authored inside the panel section |

## Authoring Structure

1. Add a `custom-tabs` block.
2. Add one or more `Custom Tab` sections immediately after it.
3. Enter the tab title and add the panel's components inside that section.

| Order | Component | Authored fields |
|---|---|---|
| 1 | `custom-tabs` | `Style` (optional multiselect) |
| 2+ | `custom-tabs-panel` | `Tab Title` (required) |
| Inside each panel | Section-filter components | Any allowed block/component |

Navigation controls, ARIA attributes, and panel wrappers are CSS/JS-only; authors do not create
them.

## Page Usage

No page usage is recorded yet.

## Reuse Guidance

Use `custom-tabs` when each tab needs an independently authored panel containing EDS components.
Use `tab-list` for the existing section-based tab pattern and `tabs` for title/description items.

## Variants

No authored variants are defined.