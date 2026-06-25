# BFP Work - Styling Guide

## Color Palette

### Primary Colors
- **Primary Blue (Dark)**: `#1C3350` or use `primary-600 dark:primary-800`
- **Accent (Amber/Orange)**: `#F59E0B` or use `accent-400`
- **Success (Green)**: `#10B981` or use `success-500`
- **Error (Red)**: `#EF4444` or use `error-500`

### Semantic Colors
- **Light Mode**:
  - Background Primary: White (`#ffffff`)
  - Background Secondary: Light Gray (`#f9fafb`)
  - Background Tertiary: Lighter Gray (`#f3f4f6`)
  - Text Primary: Dark Gray (`#111827`)
  - Text Secondary: Medium Gray (`#6b7280`)

- **Dark Mode** (enabled via `dark:` prefix):
  - Background Primary: Very Dark (`#111827`)
  - Background Secondary: Dark Gray (`#1f2937`)
  - Background Tertiary: Darker Gray (`#374151`)
  - Text Primary: Light Gray (`#f3f4f6`)
  - Text Secondary: Lighter Gray (`#d1d5db`)

## Component Patterns

### Cards/Containers
```jsx
<div className="bg-white dark:bg-gray-700 rounded-md shadow border border-gray-200 dark:border-gray-600 p-6">
  {children}
</div>
```

### Buttons
```jsx
// Primary Button
<button className="px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-md hover:bg-primary-700 dark:hover:bg-primary-800 transition font-semibold min-h-[44px]">

// Secondary Button
<button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition font-semibold">

// Danger Button
<button className="px-4 py-2 bg-error-500 dark:bg-red-700 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-800 transition font-semibold">
```

### Form Inputs
```jsx
<input 
  type="text"
  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-400 dark:bg-gray-700 dark:text-white text-sm"
/>

<select 
  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-400 dark:bg-gray-700 dark:text-white text-sm cursor-pointer"
>
```

### Tables
```jsx
<table className="w-full">
  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
    <tr>
      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300">Header</th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">Cell</td>
    </tr>
    {/* Alternating rows for readability */}
    <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">Cell</td>
    </tr>
  </tbody>
</table>
```

### Headings
```jsx
<h1 className="text-3xl font-bold text-gray-900 dark:text-white">Heading 1</h1>
<h2 className="text-2xl font-bold text-gray-900 dark:text-white">Heading 2</h2>
<h3 className="text-xl font-bold text-gray-900 dark:text-white">Heading 3</h3>
```

### Labels
```jsx
<label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
  Label Text
</label>
```

## Spacing Standards

- **Padding**: `p-4` (16px) for cards, `p-6` (24px) for larger sections
- **Gaps**: `gap-4` (16px) for flex items, `gap-6` (24px) for major sections
- **Margins**: `mb-4` (16px) between sections, `mb-6` (24px) for major breaks
- **Space between items**: `space-y-4` for vertical lists

## Mobile Responsiveness

### Breakpoints
- `xs`: 400px (small phones)
- `sm`: 640px (larger phones)
- `md`: 768px (tablets)
- `lg`: 1024px (desktop)

### Grid Patterns
```jsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

// Mobile-first for forms
<div className="flex flex-col sm:flex-row gap-4">

// Hide on mobile
<div className="hidden sm:block">
```

### Button Heights
Ensure all interactive elements are at least **44px** in height on mobile:
```jsx
<button className="min-h-[44px] px-4 py-2">
```

### Tables on Mobile
Make tables scrollable on mobile instead of squishing:
```jsx
<div className="overflow-x-auto">
  <table className="w-full min-w-[600px]">
    {/* table content */}
  </table>
</div>
```

## Border Radius
- **Small**: `rounded-md` (8px) - Default for most elements
- **Medium**: `rounded-lg` (12px) - For larger cards
- **Large**: `rounded-xl` (16px) - For very large containers

## Shadow Depth
- **Subtle**: `shadow` - Default card shadows
- **Elevated**: `shadow-lg` - Hover states, important cards
- **None**: No shadow for nested elements

## Dark Mode Implementation

All pages should support dark mode. Pattern:
1. Light color first: `bg-white text-gray-900`
2. Dark mode override: `dark:bg-gray-700 dark:text-white`
3. Always test both modes

Example:
```jsx
<div className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
```

## Pages Updated with New Styling

✅ **Task Detail Page** (`app/tasks/[id]/page.tsx`)
- Updated color scheme and dark mode support
- Improved spacing and layout
- Better visual hierarchy
- Consistent button styling

✅ **SubtaskChecklist Component** (`app/tasks/[id]/components/SubtaskChecklist.tsx`)
- Reorganized layout with clear visual sections
- Side-by-side timer and manual input
- Larger, more usable notes textarea
- Numbered circles with gradient background
- Dark mode support throughout

✅ **Navbar Component** (`components/Navbar.tsx`)
- Mobile responsive with hamburger menu
- Minimum 44px tap targets
- Better color contrast
- Smooth transitions

✅ **Dashboard** (`app/dashboard/page.tsx`)
- Updated with dark mode classes
- Consistent card styling
- Removed redundant link sections (navigation in navbar)

✅ **Global Styles** (`app/globals.css`)
- CSS variables for light/dark modes
- Base input and button styles
- Table row alternation
- Tailwind component classes

✅ **Tailwind Config** (`tailwind.config.js`)
- Custom color palette
- Consistent spacing scale
- Dark mode configuration
- Extended theme

## Pages Still Need Updates

The following pages should be updated using the patterns above:
- [ ] `/employees` - Employee Master
- [ ] `/clients` - Client Master
- [ ] `/billing` - Billing page
- [ ] `/tasks` - Tasks list
- [ ] `/calendar` - Calendar
- [ ] `/leave` - Leave Management
- [ ] `/reports` - Reports
- [ ] `/invoices` - Invoice Generator
- [ ] `/dsc` - DSC Register
- [ ] `/activity` - Activity Log
- [ ] `/attendance` - Attendance

### Quick Update Template

For each page, replace:
```jsx
// OLD
<div className="min-h-screen bg-gray-50">
  <div className="bg-[#1C3350] text-white">
    <h1 className="text-3xl font-bold">Title</h1>
  </div>
  <div className="max-w-7xl mx-auto px-4 py-8">
    <div className="bg-white rounded-lg shadow p-6">
```

```jsx
// NEW
<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
  <div className="bg-primary-600 dark:bg-primary-800 text-white">
    <h1 className="text-3xl font-bold">Title</h1>
  </div>
  <div className="max-w-7xl mx-auto px-4 py-8">
    <div className="bg-white dark:bg-gray-700 rounded-md shadow border border-gray-200 dark:border-gray-600 p-6">
```

## Testing Checklist

- [ ] Test all pages in **light mode**
- [ ] Test all pages in **dark mode** (click moon icon)
- [ ] Test on **mobile** (max-width 640px)
- [ ] Test on **tablet** (max-width 1024px)
- [ ] Check that all text is **readable** in both modes
- [ ] Verify **44px minimum tap targets** on mobile
- [ ] Ensure **no text squishing** on tables (use horizontal scroll)
- [ ] Confirm **color contrast** meets WCAG standards

## Notes

- Always use Tailwind classes instead of inline styles (except for dynamic colors like `style={{ backgroundColor: color }}`)
- Maintain consistent indentation and formatting
- Use semantic HTML (button, input, select, etc.)
- Avoid hardcoded colors; use the color palette
- Test dark mode toggle frequently
- Keep mobile-first approach in CSS
