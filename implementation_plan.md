# SimVesto Phase 2 — Sci-Fi Polish, Profile Revamp, Interactive Background

Frontend-only changes to elevate the entire app to a futuristic, Gen-Z-friendly experience.

---

## Proposed Changes

### 1. Glossary Tooltip Fix

#### [MODIFY] [GlossaryHighlighter.jsx](file:///d:/SimVesto/src/components/GlossaryHighlighter.jsx)

**Problem**: Tooltip vanishes when mouse moves from the highlighted term toward the tooltip card because `onMouseOut` fires immediately and the tooltip position follows the cursor, creating a gap.

**Fix**:
- Stop repositioning the tooltip on every `mousemove`. Instead, **anchor it once** when the term is first hovered (position it relative to the term element using `getBoundingClientRect`).
- Add a 200ms delay on `mouseout` — if the user enters the tooltip div within that window, cancel the hide timer.
- Add `onMouseEnter` on the tooltip to cancel the hide timer, and `onMouseLeave` on the tooltip to dismiss it.

---

### 2. Search Bar — Wider & Elegant

#### [MODIFY] [AppLayout.jsx](file:///d:/SimVesto/src/components/AppLayout.jsx)

- Change the search container `maxWidth` from `280px` to `420px`.
- Give it `flex: 1` so it stretches naturally in the navbar.

#### [MODIFY] [index.css](file:///d:/SimVesto/src/index.css)

- `.navbar-search` — increase `max-width` to `480px`, add subtle inner glow on focus.

---

### 3. Profile Page Overhaul

#### [MODIFY] [Profile.jsx](file:///d:/SimVesto/src/pages/Profile.jsx)

- **Profile Picture**: Add a file upload input (hidden) triggered by clicking the avatar. Store picture as base64 in localStorage (no backend needed). Show circular avatar with gradient border.
- **Editable Username**: Click-to-edit with an inline text input and save button. Uses `updateUser` from store.
- **Cards Redesign**: All stat cards get 3D perspective hover (same treatment as stat cards), gradient borders, glow effects.
- **Better Layout**: Full-width header card with avatar + info, then a 3-column grid for Fear Score, Literacy, Coins, Total P&L cards.

---

### 4. Cursor-Reactive Parallax Background (All App Pages)

#### [NEW] [ParallaxBg.jsx](file:///d:/SimVesto/src/components/ParallaxBg.jsx)

A lightweight **CSS-only** (no Three.js/Canvas) parallax background that renders on every page:
- Multiple layered shapes (circles, grid dots, subtle lines) that shift position based on cursor movement using `onMouseMove` on the root container.
- Uses CSS `radial-gradient` orbs in the theme's accent colors (green/teal) at very low opacity (~3-5%).
- **Light mode**: Subtle green-tinted gradient orbs on white.
- **Dark mode**: Subtle teal/emerald glowing orbs on dark slate.
- Extremely performant — uses CSS transforms only (GPU-accelerated), no JS animation loops.

#### [MODIFY] [AppLayout.jsx](file:///d:/SimVesto/src/components/AppLayout.jsx)

- Wrap `<Outlet />` with the `<ParallaxBg>` component so it appears behind all page content.

---

### 5. Dashboard Stat Cards — Monochromatic Icons + Gen-Z Lines

#### [MODIFY] [Dashboard.jsx](file:///d:/SimVesto/src/pages/Dashboard.jsx)

Replace emoji icons with **monochromatic inline SVG icons** matching the theme. Add a Gen-Z one-liner under each stat:

| Stat | SVG Icon | Tagline |
|------|----------|---------|
| Net Worth | Wallet icon | "Your whole bag, no cap" |
| Coins | Coin stack icon | "Liquid funds, ready to deploy" |
| Invested Capital | Chart-bar icon | "Money that's working for you" |
| Total Trades | Activity icon | "Every move counts" |

- Icons use `currentColor` and inherit the card's accent color.
- Font bumped to `font-weight: 800` for values.

---

### 6. Sci-Fi Futuristic Aesthetic — Global

#### [MODIFY] [index.css](file:///d:/SimVesto/src/index.css)

- **Neon glow on interactive elements**: Subtle `box-shadow` glow on hover for all buttons, links, cards using the green accent.
- **Glass-morphism navbar**: Add `backdrop-filter: blur(12px)` and slight transparency to `.top-navbar`.
- **Glowing border animation**: A subtle border-glow `@keyframes` that cycles the accent color opacity on focus states.
- **Ticker strip glow**: Green glow under the ticker strip.
- **Sci-fi font treatment**: Use `Space Grotesk` (already loaded) for headings to give a futuristic feel.
- **Enhanced shadows**: All elevated elements get layered colored shadows instead of plain gray.
- **Scan-line effect**: Very subtle CSS scan-line animation on card backgrounds for a "holographic" feel (opt-in class).

---

## Verification Plan

- Run `npm run dev`, verify no build errors.
- Test glossary tooltip: hover term → move mouse to tooltip → click "Learn more terms" — should work without disappearing.
- Test profile: upload picture, edit username, verify persistence after refresh.
- Test parallax bg: move cursor around — background shapes should subtly shift.
- Verify dark/light mode consistency for all changes.
