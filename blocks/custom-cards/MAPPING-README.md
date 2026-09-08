# Custom Cards Mapping

## Source Mapping

The mapping is based on the supplied rendered HTML for the Insights & Impact section.

| Source element | EDS mapping | Notes |
|---|---|---|
| `.custom-cards` | `custom-cards` block | Matches the EDS block asset folder and selectors. |
| Direct child row | `custom-cards-item` | One repeatable card. |
| First cell | Variation and images | `col1_classes` prevents a separate metadata cell. Only Image 1 displays. |
| Second cell first paragraph | Badge | Category text such as VIDEO, PODCAST, or BLOGS. |
| Second cell heading | Title | Preserved as the accessible card heading. |
| Second cell description | Description | Supporting rich text. |
| Second cell link | Card Link and Card Link Text | Destination and accessible action label. |
| `.swiper-wrapper` | Slider track | Generated decoration; not authored. |
| `.swiper-slide` | Slider item | Generated decoration; not authored. |
| `.swiper-pagination` | Slider pagination | Generated decoration; not authored. |

## EDS Authoring Structure

| Row | Column 1 | Column 2 |
|---|---|---|
| Child item 1+ | Variation, Image 1, optional Image 2 | Badge, title, description, card link |

## Reuse Guidance

Reuse this block for editorial cards with category badges, illustrations, fixed color states, and a mobile slider. Swiper behavior uses its standard classes so the same slider conventions can be reused elsewhere.

## Variants

| Value | Behaviour |
|---|---|
| `featured` | Permanently applies the taller red card treatment. |
| Default | Permanently applies the light-blue card treatment. |
