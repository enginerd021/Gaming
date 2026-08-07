# Shakti Gaming Theme & Style Guidelines

To ensure consistency, readability, and correct video frame styling in both Dark (Neon) and Light themes, follow these rules:

## 1. Universal Theme Variable Rules
- Always use theme CSS variables (`var(--bg-primary)`, `var(--text-primary)`, `var(--border-color)`) for container backgrounds, text, and borders.
- Avoid hardcoding absolute colors (e.g. `color: '#ffffff'`, `background: '#fff'`) inline for buttons, text, and list items. This prevents them from blending invisibly into the light background.

## 2. Hero & Media-Heavy Sections
- Hero sections (e.g. `.zentry-hero-wrapper`, `.cockpit-hero-section`) that display dark video loops or dark graphic backgrounds should be explicitly set to a dark background (`backgroundColor: '#02040a'`).
- Reset CSS variables inside dark hero sections back to their dark-theme neon values (e.g. `--text-primary: #EDF4FF`) so all nested child components automatically remain readable and bright over dark video overlays.

## 3. Video & Bento Cards
- Do not apply light theme white backgrounds (`#FFFFFF`) to cards containing semi-transparent background videos (like bento cards with video loops). White backgrounds wash out the videos.
- Style bento cards with videos (e.g. `.bento-card:has(video)`, `.zentry-bento-card`) to remain dark in both light and dark themes, ensuring high-contrast rendering of background videos and white overlay text/badges.

## 4. Transparent Header Overrides
- When a page uses a transparent sticky/absolute header over a dark background (such as on the Homepage), force navigation links, action buttons, and logos to use white (`#EDF4FF`) and neon accent colors, regardless of the active global theme.
- For inner pages with standard white headers in light theme, ensure header link text colors dynamically flip to `var(--text-primary)` (dark slate) and the mobile toggle hamburger remains dark and visible.

## 5. Text Gradients
- Ensure text-gradient classes (`.text-gradient-cyan`, `.text-gradient-violet`, `.text-gradient-gold`) have light theme overrides that start with a dark contrasting color (like `#1E1B4B` or `#78350F`) instead of `#ffffff`, preventing invisible headings on white subpage backgrounds.
