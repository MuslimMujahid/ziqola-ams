---
description: "Guidelines for frontend design"
---

# Design Guidelines

## Themes

- Primary Color: #2563EB (Blue)
- Secondary accents: Use status colors aggressively (success, warning, error, info)
- Base palette: Slate/muted colors for backgrounds and surfaces

## Color System

### Primary & Brand

- Primary: #2563EB (Blue 600)
- Primary Hover: #1D4ED8 (Blue 700)
- Primary Soft: #3B82F6 (Blue 500)

### Status Colors (Use Aggressively)

- Success: #16A34A (Green 600)
- Warning: #D97706 (Amber 600)
- Error: #DC2626 (Red 600)
- Info: #0284C7 (Sky 600)

### Surface & Background

- Background: #F8FAFC (Slate 50)
- Surface: #F1F5F9 (Slate 100)
- Surface 2: #E2E8F0 (Slate 200)
- Surface Contrast: #FFFFFF

### Ink/Text

- Ink Strong: #0F172A (Slate 900)
- Ink: #1E293B (Slate 800)
- Ink Muted: #475569 (Slate 600)
- Ink Subtle: #64748B (Slate 500)
- Ink Quiet: #94A3B8 (Slate 400)

## Design Styles

- **Modern flat design** — no borders, no shadows, no ornamental UI
- Clean, minimal aesthetic inspired by Linear, Vercel, and Stripe
- **Status-driven UI**: Use status colors (success, warning, error, info) prominently for visual feedback
- Background differentiation over borders: Use subtle surface color changes to separate elements
- Smooth, subtle Framer Motion transitions:
  - Fade-ins for modals and overlays
  - Slide transitions for page changes
  - Hover effects on buttons and interactive elements (scale, background change)
- Rounded corners (no shadows):
  - Border radius: 0.5rem (8px) for cards and containers, 0.375rem (6px) for buttons and inputs
  - No box shadows - use background color contrast instead
- Muted/slate base with subtle accent:
  - Light mode: Slate 50 (#F8FAFC) background
  - Dark mode: Slate 900 (#0F172A) background
  - Accent color used sparingly (buttons, active states, key indicators)
- Consistent spacing system (Tailwind defaults):
  - Layout padding: p-6
  - Inner card spacing: p-4 or p-5
  - Component gaps: gap-4
  - No cramped UI; everything should breathe
- Familiar & safe visual language similar to Linear, Notion, and Vercel Dashboard:
  - Clear typography hierarchy: headings, subheadings, body text
  - Standard iconography for actions (edit, delete, submit)
  - Intuitive navigation patterns (sidebar, top nav)
- Responsive-first:
  - Mobile: single-column layouts, collapsible menus
  - Tablet: two-column layouts where appropriate
  - Desktop: full multi-column layouts with sidebars
- Accessibility-friendly:
  - High contrast for text (slate colors ensure good contrast)
  - Visible focus states using the primary blue color
  - Keyboard navigation for all interactive elements
- Calm, safe interaction design:
  - No flashing, bouncing, or distracting animations
  - No sudden layout shifts
  - Smooth transitions that do not startle the user
  - Status colors are bold but not alarming

## Key Design Principles

1. **No borders, no shadows** - Use background color variations to create visual hierarchy
2. **Status colors front and center** - Badges, indicators, and alerts should use status colors prominently
3. **Flat cards** - Use solid slate backgrounds (surface-1, surface-2) without borders or shadows
4. **Muted base, accent sparingly** - Most UI should be in slate/neutral tones, with blue accent for interactive elements only
5. **Clean separation** - Use whitespace and subtle background differences instead of dividers
