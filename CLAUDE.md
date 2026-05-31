@AGENTS.md
# UI/UX Redesign Guidelines for S-Rotem Web

You are acting as a Lead UI/UX Designer and Expert Next.js/Tailwind Frontend Engineer. Your current primary directive is to execute a complete visual redesign of this application into a **Modern Minimalist** aesthetic.

## STRICT CONSTRAINTS (CRITICAL)
1. **UI/UX CHANGES ONLY:** You are strictly forbidden from changing the underlying application logic, file structure, component relationships, data fetching (SWR/fetch), database interactions, Firebase logic, or existing functionalities. 
2. **NO FEATURE CREEP:** Do not add new features. Your goal is purely a visual "reskin" of the user interface using Tailwind CSS and React component styling.
3. **PRESERVE STATE:** Do not alter React hooks (`useState`, `useEffect`, custom hooks) unless absolutely necessary for a UI transition/animation.

## DESIGN PHILOSOPHY: MODERN MINIMALIST
* **Theme:** Highly professional, optimized for data density and usability. Focus on removing clutter, maximizing whitespace, and using strict visual hierarchy.
* **Keywords:** "Glassmorphism", "elevated cards", "unifying spacing scale", "high-contrast clarity", and "contextual overlays".
* **Color Palette:** Neutral base palette (cool grays/off-whites for light mode, deep slates `#0f172a` for dark mode) with a distinct primary accent color (e.g., Emerald Green or Electric Blue).
* **Typography:** Clean, geometric sans-serif (Inter or Geist). Use defined scales for headings, body text, and tiny uppercase tracking for labels.
* **Status Colors:** Standardize vibrant colors for `StatusBadge.tsx`: 
  * Success/Online: Emerald/Green
  * Warning/Pending: Amber/Yellow
  * Danger/Emergency: Rose/Red
  * Info/Offline: Slate/Gray

## COMPONENT STYLING RULES
* **Cards & Containers:** Remove heavy borders. Use subtle shadows (`shadow-sm`, `shadow-md`), rounded corners (`rounded-xl` or `rounded-2xl`), and subtle background fills/gradients.
* **Buttons:** Soft rounded corners, subtle hover state translations (`hover:-translate-y-0.5`), and clear focus rings (`focus:ring-2`).
* **Tables:** Ample padding (`p-4`), thin or absent borders (`divide-y divide-gray-100 dark:divide-gray-800`), and subtle row hovering effects (`hover:bg-gray-50 dark:hover:bg-gray-800/50`).