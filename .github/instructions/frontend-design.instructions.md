---
description: "Guidelines for frontend design"
---

# Design Guidelines

## Themes

- Accent Color: #61822C

## Design Styles

- **Minimalist and flat interface**, inspired by Linear, Vercel, and Supabase — no skeuomorphism, no ornamental UI, but not too flat that it causes confussions in navigating.
- Smooth, subtle Framer Motion transitions:
  - Fade-ins for modals and overlays.
  - Slide transitions for page changes.
  - Hover effects on buttons and interactive elements.
- Rounded corners & soft shadows:
  - Border radius: 8px for cards and containers, 6px for buttons and inputs.
  - Soft shadows for depth without heaviness.
- Subtle accent color, low-contrast backgrounds:
  - Light mode: off-white (#FAFAFA) or very light gray (#F5F5F5).
  - Dark mode: very dark gray (#121212) or charcoal (#1E1E1E).
  - Accent color used sparingly (buttons, active states, progress)
- Consistent spacing system (Tailwind defaults):
  - Layout padding: p-6
  - Inner card spacing: p-4
  - Component gaps: gap-4
  - No cramped UI; everything should breathe.
- Familiar & safe visual language similar to Google Classroom, Canvas, and Microsoft Teams:
  - Clear typography hierarchy: headings, subheadings, body text.
  - Standard iconography for actions (edit, delete, submit).
  - Intuitive navigation patterns (sidebar, top nav).
- Responsive-first:
  - Mobile: single-column layouts, collapsible menus.
  - Tablet: two-column layouts where appropriate.
  - Desktop: full multi-column layouts with sidebars.
- Accessibility-friendly:
  - High contrast for text.
  - Visible focus states using the accent color.
  - Keyboard navigation for all interactive elements.
- Calm, safe interaction design:
  - No flashing, bouncing, or distracting animations.
  - No sudden layout shifts.
  - Smooth transitions that do not startle the user.
  - Alerts use color sparingly and intentionally
