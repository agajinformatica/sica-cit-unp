---
name: frontend-design
description: Enterprise & Institutional UI/UX Frontend Design Skill for UNP Systems. Enforces fine-stroke Lucide iconography (1.5px-1.75px), restrained institutional color palettes, tabular numerals, and zero emoji clutter.
---

# Enterprise & Institutional Frontend Design Skill (UNP Edition)

## 1. Iconography Guidelines (Lucide Vector System)
* **Library:** Use **Lucide Icons** (`stroke-linecap="round"`, `stroke-linejoin="round"`).
* **Stroke Weight Hierarchy:**
  * **Sidebar & Primary KPIs:** `stroke-width: 1.75px` (`18px–20px` size) inside soft rounded containers (`border-radius: 10px`).
  * **Data Tables, Badges & Form Controls:** `stroke-width: 1.5px` (`14px–16px` size) aligned inline (`vertical-align: -2px`).
* **Zero Emoji Rule:** Never use unicode emojis (`🏛️`, `⚠️`, `🚨`, `🔮`, `👨‍💼`) in enterprise dropdowns, navigation items, status badges, or system logs. Always use clean vector SVG icons.

## 2. Institutional Color Architecture (Universidad Nacional de Piura)
* **Primary Brand Surfaces:**
  * `--unp-navy-900`: `#0f2338` (Sidebar primary surface)
  * `--unp-navy-800`: `#16324f` (Active navigation & formal headers)
  * `--unp-blue-700`: `#1b4f72` (Primary interactive buttons & focus rings)
* **Institutional Accents (Desaturated & Sober):**
  * `--unp-ochre-600`: `#9a7b2c` (Shield book gold — subtle borders & ratings)
  * `--unp-crimson-700`: `#7b2431` (Shield inner border — critical states)
  * `--unp-emerald-700`: `#235d42` (Verified / punctual states)
* **Neutral Slate Canvas:**
  * Background: `#f6f8fa`
  * Card Surface: `#ffffff` with `1px solid #e2e8f0` and subtle elevation `0 1px 2px rgba(15, 23, 42, 0.04)`.

## 3. Typography & Data Density
* **Font Stack:** `'Inter', -apple-system, BlinkMacSystemFont, sans-serif` with `letter-spacing: -0.015em` on headings.
* **Tabular Numerals:** Apply `font-variant-numeric: tabular-nums` to all clocks, hours (`360.0 h`), percentages (`96.4%`), and IDs.
