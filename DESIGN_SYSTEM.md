# FirmFlow Premium Design System

## Overview

FirmFlow has been redesigned with a **warm, professional, calm aesthetic** that reflects a premium accounting product. The design system is implemented globally via Tailwind CSS configuration and component utilities.

---

## Color Palette

### Primary
- **Navy (#2C3A4A)** - Main dark color for navbars, headers, primary buttons
- **Variants:** 800 (#3D4D5C), 700 (#4E5F6E)

### Accent
- **Clay (#C89B6A)** - Warm highlight color for active states, key actions, and emphasis

### Backgrounds
- **Cream (#FAF9F6)** - Page background (warm, not stark white)
- **White (#FFFFFF)** - Card backgrounds
- **Border (#E8E4DC)** - Soft, warm border color (never harsh)

### Text
- **Primary: #2C3A4A** - Main text color
- **Muted: #7A8290** - Secondary/disabled text, labels, captions

### Status Colors
- **Success (Sage Green #5B8266)** - For successful, available states
  - Light background: #E1EDE4
  - Dark text: #4A6B54
- **Error (Terracotta #B0654F)** - For errors, overdue items
  - Light background: #F5EDE0
  - Dark text: #8A6A44

---

## Typography

### Font Family
- **Inter** (imported from Google Fonts)
- Font weights used: **400 (regular)** and **500 (medium)** only
- Never use weights 600, 700, or higher (too heavy)

### Type Scale

| Level | Size | Weight | Use Case |
|-------|------|--------|----------|
| h1 | 22px | 500 | Page titles, main headings |
| h2 | 15px | 500 | Section titles |
| h3 | 15px | 500 | Subsection titles |
| stat | 26px | 500 | Large stat numbers |
| base | 14px | 400 | Body text, default |
| sm | 14px | 400 | Secondary content |
| xs | 12px | 400 | Labels, captions, help text |

### Text Formatting
- **Sentence case everywhere** - not Title Case, not ALL CAPS
- Letter spacing: -0.2px on h1 for premium feel
- Line heights optimized for readability

---

## Spacing & Layout

### Incremental Spacing Scale
- 1px = 4px
- 2px = 8px
- 3px = 12px
- 4px = 16px
- 5px = 20px
- 6px = 24px
- 7px = 28px
- 8px = 32px

### Page & Container Spacing
- **Card padding:** 18px (use `p-5`)
- **Page padding:** 28px desktop, 16px mobile (use `.page-container`)
- **Gap between cards:** 14px (use `gap-4`)
- **Section spacing (vertical):** 24-28px (use `.section-spacing`)

### Card Styling
- Border radius: 12px (`rounded-lg`)
- Border: 0.5px solid #E8E4DC (`.card`)
- Shadow: subtle, flat aesthetic (no heavy drop shadows)
- Padding: 20px inside cards

---

## Component Library

### Buttons

#### Primary Button (`.btn-primary`)
```
Background: #2C3A4A
Text: white
Border radius: 8px
Hover: slightly lighter shade
```

#### Secondary Button (`.btn-secondary`)
```
Background: transparent
Border: #E8E4DC
Text: #2C3A4A
Hover: light cream background
```

#### Accent Button (`.btn-accent`)
```
Background: #C89B6A (clay)
Text: white
Use for: warm highlights, special actions
```

#### Danger Button (`.btn-danger`)
```
Background: #B0654F (terracotta)
Text: white
Use for: destructive actions, errors
```

### Status Pills (`.pill-*`)

#### Sage (Available/Success)
```
Background: #E1EDE4 (light sage)
Text: #4A6B54 (dark sage)
Border radius: 20px (pill shape)
```

#### Terracotta (Busy/Error)
```
Background: #F5EDE0 (light terracotta)
Text: #8A6A44 (dark terracotta)
Border radius: 20px (pill shape)
```

#### Accent
```
Background: clay with 10% opacity
Text: clay color
Border radius: 20px (pill shape)
```

### Cards (`.card`)
- White background with #E8E4DC border
- 12px border radius
- Subtle shadow only
- Generous internal padding (18px)

### Stat Cards (`.stat-card`)
- Small label on top (`.stat-label`) in muted gray
- Large number below (`.stat-value`) in navy
- Optional subtext (`.stat-subtext`) in muted color

### Input Fields (`.input-base`)
- Border: #E8E4DC
- Focus state: ring in clay color (#C89B6A)
- Rounded: 8px

### Tables
- Header rows: `.table-header` - muted text, cream background
- Data cells: `.table-cell` - subtle borders
- Alternating row backgrounds for readability

---

## Dark Mode

All components include dark mode variants using Tailwind's `dark:` prefix:
- Dark backgrounds: #1F2937 (dark gray)
- Dark cards: #1F2937 with gray-700 borders
- Text inverted: light cream (#F5F3EF) on dark backgrounds
- Muted text: gray-400 on dark backgrounds

---

## Navbar

- **Background:** #2C3A4A (navy)
- **Text:** #F5F3EF (warm cream)
- **Logo:** Small clay (#C89B6A) square with icon
- **Active link:** Underlined with clay color
- **User avatar:** Circle with soft tinted background

---

## Dashboard Enhancements

### Personalized Greeting
- Displays on dashboard based on time of day
- Format: "Good morning/afternoon/evening, [Name]"
- Soft subtitle: "Welcome back. Here's your team's workload overview."
- Separated by subtle border from main content

---

## Implementation Details

### Tailwind Config Updates
- Extended color palette with `firm.*` naming convention
- Custom font sizes for typography hierarchy
- Soft box shadows (subtle, soft)
- Pill border radius (20px)

### Global CSS (`app/globals.css`)
- Imported Inter font from Google Fonts
- Applied body background: #FAF9F6 (cream)
- Created reusable component classes (buttons, cards, inputs, tables)
- Dark mode support throughout

### Component Usage

**Apply new styles by replacing:**

Old class:
```jsx
<div className="bg-white rounded-md shadow border border-gray-200">
```

New class (semantic):
```jsx
<div className="card">
```

Or use Tailwind directly with new color tokens:
```jsx
<div className="bg-firm-cream border border-firm-border rounded-lg">
```

---

## Consistency Across Pages

The design system automatically updates ALL pages because it's implemented at the Tailwind config and global CSS level:

- ✅ Dashboard
- ✅ Tasks
- ✅ Clients  
- ✅ Invoices
- ✅ Reports
- ✅ Leave Management
- ✅ Activity
- ✅ Attendance
- ✅ Checking (Level 1 & 2)
- ✅ Billing/DSC

---

## Best Practices

### Do's ✅
- Use the `.card` utility for all card-based layouts
- Use `.btn-primary`, `.btn-secondary`, `.btn-accent` for buttons
- Apply `.page-container` to main content divs
- Use the typography scale (h1, h2, .stat-value, etc.)
- Use `.text-muted` for secondary information
- Leverage the `dark:` prefix for dark mode

### Don'ts ❌
- Don't use the old blue (#1C3350) or orange/amber (#F59E0B) colors
- Don't use font weights 600+ (too heavy)
- Don't use ALL CAPS or Title Case headings
- Don't add heavy drop shadows (keep it flat)
- Don't use harsh white (#FFFFFF) as page background
- Don't forget dark mode variants

---

## Color Migration Reference

### Old → New

| Old | New | Css Class |
|-----|-----|-----------|
| `bg-blue-600` | `bg-firm-900` | `.btn-primary` |
| `bg-amber-500` | `bg-firm-accent` | `.btn-accent` |
| `bg-white` | `bg-firm-white` | `.card` |
| `border-gray-200` | `border-firm-border` | `.card` |
| `text-gray-600` | `text-firm-muted` | `.text-muted` |
| `bg-green-100` | `bg-firm-sageBg` | `.pill-sage` |
| `bg-red-100` | `bg-firm-terracottaBg` | `.pill-terracotta` |

---

## Testing Checklist

- [ ] All pages display with warm cream background
- [ ] Navy headers instead of blue
- [ ] Clay accent colors visible in buttons and links
- [ ] Cards have soft borders and subtle styling
- [ ] Typography uses Inter font
- [ ] Dark mode applies correctly across all pages
- [ ] Dashboard shows personalized greeting with time-based message
- [ ] Status pills show correct background/text color combinations
- [ ] Spacing is generous and consistent
- [ ] No jarring bright colors remain

---

## Future Enhancements

- Add animated transitions (subtle fade/slide)
- Implement toast notifications in clay color
- Add micro-interactions (hover states, focus states)
- Create component library documentation
- Add animation utilities to Tailwind

---

**Design System Version:** 1.0  
**Last Updated:** 2026-07-01  
**Status:** ✅ Implemented Globally
