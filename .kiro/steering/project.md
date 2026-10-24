# FocusTab – Project Steering

## Project Overview
FocusTab is a browser-based productivity dashboard built with vanilla HTML, CSS, and JavaScript. No frameworks, no build tools, no backend — just open `index.html` in a browser.

## Tech Stack
- **Structure:** HTML5 (`index.html`)
- **Styling:** CSS3 (`css/style.css`) — one file only
- **Logic:** Vanilla JavaScript (`js/app.js`) — one file only
- **Storage:** Browser `localStorage` API (client-side only)
- **Compatibility:** Modern browsers — Chrome, Firefox, Edge, Safari

## Folder Structure
```
index.html          ← entry point
css/
  style.css         ← all styles (only 1 CSS file allowed)
js/
  app.js            ← all logic (only 1 JS file allowed)
.kiro/
  steering/
    project.md      ← this file
README.md
```

## Features (MVP)
1. **Greeting & Clock** — live clock (12H/24H toggle), date, time-of-day greeting, editable user name
2. **Focus Timer** — circular SVG countdown, 25m/5m/15m session tabs, Start/Stop/Reset, session counter, sound toggle
3. **To-Do List** — add, edit, delete, mark done; filter by All/Active/Done; persisted in localStorage
4. **Quick Links** — icon grid cards, add via modal, delete on hover; persisted in localStorage

## Code Conventions
- All JS modules wrapped in IIFEs to avoid global scope pollution
- `'use strict'` at top of `app.js`
- localStorage keys prefixed with `ft_` (FocusTab) or `dashboard_`
- No external libraries or CDN dependencies
- CSS uses custom properties (`:root` variables) for theming; supports light and dark modes via `[data-theme="dark"]`

## Running the Project
No build step required. Simply open `index.html` in any modern browser.
