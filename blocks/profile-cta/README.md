# Profile CTA

Flexible image + rich text + button card. Supports both a marketing call-to-action (heading + short subheading + button) and a leadership/profile card (name + role + bio + button) using the same JSON model - content variations require no code changes.

## Authoring

| Field | Type | Description |
|---|---|---|
| Image | Reference | Photo or decorative composite image |
| Alt | Text | Alt text for the image |
| Heading & Description | Rich Text | Format the first line as a Heading (e.g. H2/H3). Add further paragraphs as needed (e.g. role, description) - all optional. |
| Button | Rich Text | Author a link, e.g. Join Now |

### Content variations (no code changes required)

| Use case | Heading & Description content |
|---|---|
| Marketing CTA (e.g. "Join as a Life Advisor") | Heading + one short paragraph (subheading) |
| Leadership / profile card (e.g. "Mr. Uday Kotak") | Heading (name) + one short paragraph (role/title) + one or more longer paragraphs (bio) |

The first paragraph after the heading is styled as a subheading/role line; any additional paragraphs are styled as body copy.

## Responsive Behaviour

| Breakpoint | Behaviour |
|---|---|
| Mobile (< 900 px) | Stacked: Heading & Description -> Image -> Button. |
| Desktop (>= 900 px) | Two-column layout: Image on the left spanning both rows; Heading & Description and Button stacked on the right. |

## File Structure

```
blocks/profile-cta/
+-- profile-cta.css
+-- profile-cta.js
+-- _profile-cta.json
+-- README.md
```