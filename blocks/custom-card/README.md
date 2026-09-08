# Custom Cards

`custom-card` is a container block with repeatable `custom-card-item` children.

## Authoring

Each card provides:

- A card variation: Default, Featured, Horizontal, or Image Overlay.
- Image 1 and its alt text.
- Optional Image 2 and its alt text.
- Title and rich-text description.
- Destination link, CTA label, and optional accessible link title.

Image 2 is optional. When it is empty, the decorator does not create secondary-image markup.
Use empty alt text only for decorative images. Link titles should describe the destination when
the visible CTA label is ambiguous, such as "Learn more".

## Output

The block renders a semantic list. Each list item contains an `article` labelled by its heading.
CTA links remain native anchors and support keyboard focus. Variations are configured per card in
Universal Editor and require no component-code changes.