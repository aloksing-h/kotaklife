---
name: figma-inspect
description: >-
  Inspect Figma design files, frames, and components using Figma MCP tools.
  Use when given a Figma file URL or node ID to inspect layout, typography,
  colors, spacing, and extract images/SVGs for Adobe Experience Manager Edge Delivery Services.
---

# Figma Design Inspection Guide

When implementing or styling blocks from Figma designs:

## 1. Extracting Node and File Information
- Extract the `fileKey` and `nodeId` from the Figma URL (e.g., `https://www.figma.com/design/:fileKey/:fileName?node-id=:nodeId`).
- Use the Figma MCP tools to fetch the node data or file structure.

## 2. Design-to-Code Mapping for Edge Delivery Services (EDS)
- **Colors & Tokens**: Map colors to CSS custom properties defined in `styles/styles.css` (e.g., `--color-primary`, `--text-color`, background tints).
- **Typography**: Check font family, font weight, line height, and font size. Check `fonts.css` and use existing font stacks where possible.
- **Spacing & Flex/Grid**: Inspect auto-layout padding, gaps, and direction. Convert to responsive mobile-first CSS using modern Flexbox or CSS Grid.
- **Images & Icons**: If icons or raster images are needed, download SVGs and save them into the `icons/` directory or appropriate block folder.
