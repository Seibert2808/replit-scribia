

## Create DESIGN-SYSTEM.md in the repository

A single Markdown file at the project root documenting all visual tokens extracted from the codebase.

### Content structure

1. **Brand** -- Name (ScribIA), tagline, terminology rules (Livebook, not ebook)
2. **Color palette** -- All CSS custom properties from `src/index.css` (light + dark), with HSL values and approximate hex equivalents for quick reference
3. **Typography** -- Inter (weights 400-800), font stack from `tailwind.config.ts`
4. **Spacing & Radius** -- `--radius: 0.75rem`, container max-width `1400px`, padding `2rem`
5. **Shadows & Effects** -- `--shadow-elegant`, `--shadow-glow`, `--gradient-primary`, `--gradient-subtle`, `--transition-smooth`
6. **Button variants** -- Table of 8 variants (default, destructive, outline, secondary, ghost, link, hero, cta) and 4 sizes from `button.tsx`
7. **Custom utilities** -- `.story-link`, `.hover-scale`, animations (fade-in, scale-in, slide-in-right, etc.)
8. **Accessibility** -- `prefers-reduced-motion` support
9. **OG / Meta** -- Standard title, description, image path

### Files changed
- `DESIGN-SYSTEM.md` (new file, root of project)

