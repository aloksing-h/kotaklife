# Custom Cards Mapping

## Source Mapping

The custom-cards block follows the Adobe cards component pattern for simplicity and reusability.

| Source element | EDS mapping | Notes |
|---|---|---|
| `.custom-cards` | `custom-cards` block | Matches the EDS block asset folder and selectors. |
| Direct child row | Card item (li element) | One repeatable card. |
| First div (picture) | `.custom-cards-card-image` | Image positioned absolute, bottom-right. |
| Second div (content) | `.custom-cards-card-body` | Badge, title, description, and action link. |
| Badge (short text) | `.custom-cards-card-badge` | Identified automatically: ≤ 20 character paragraph without links. |
| Link in body | `.custom-cards-card-action` | Wrapped in `.custom-cards-card-action-wrapper`. |
| `.swiper-wrapper` | Slider track | Generated only on mobile within `.custom-cards-section`. |
| `.swiper-slide` | Slider item | Generated only on mobile within `.custom-cards-section`. |
| `.custom-cards-pagination` | Slider pagination | Generated only on mobile within `.custom-cards-section`. |

## EDS Authoring Structure

| Row | Column 1 | Column 2 |
|---|---|---|
| Child item 1+ | Variation, Image 1, optional Image 2 | Badge, title, description, card link |

## Reuse Guidance

Reuse this block for editorial cards with badges, images, and action links. Swiper behavior is conditional on the section context (`.custom-cards-section`), allowing the block to be used standalone without mobile carousel.

## Variants

| Value | Behaviour |
|---|---|
| `featured` | Applies the taller red card treatment with white text. |
| Default | Applies the light-blue card treatment. |
