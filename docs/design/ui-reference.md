# UI Design Reference: Light Neumorphism / Soft UI

The source of truth for the web app's visual layer. The reference mock is [`reference.png`](./reference.png).
The design was supplied by the developer (Dhanyatha Corry). Its placeholder content ("Nexora", "Projects", "Analytics") is replaced by the dealership app's own branding and navigation.

## Principles

- One cool light-grey surface everywhere (`#E7EAF0`). Depth comes **only** from soft dual shadows: raised elements cast a dark shadow to the bottom-right and a white highlight to the top-left; inset elements are recessed.
- No gradients, dark theme, heavy borders, pure-white cards or harsh shadows.
- The font is Inter. Icons are thin outline icons. Nav labels are small uppercase text with letter-spacing. Blue accents are restrained.
- The look is premium and precise, with generous spacing and exact alignment. It must not look like a generic dashboard template.

## Tokens (starting values)

```css
:root {
  --surface: #e7eaf0;
  --text: #253142; /* dark slate */
  --muted: #8993a4; /* secondary text, inactive icons */
  --accent: #087ebb; /* active nav, active icons, primary actions */
}
.raised {
  /* cards, header, sidebar, buttons at rest */
  background: var(--surface);
  border-radius: 24px;
  box-shadow:
    7px 7px 16px rgba(163, 171, 187, 0.6),
    -7px -7px 16px rgba(255, 255, 255, 0.85);
}
.inset {
  /* inputs, search fields, active/pressed states */
  background: var(--surface);
  border-radius: 12px;
  box-shadow:
    inset 3px 3px 7px rgba(163, 171, 187, 0.55),
    inset -3px -3px 7px rgba(255, 255, 255, 0.85);
}
```

## Layout

- **Top bar:** a floating raised bar about 68px tall with rounded corners and an outer margin, as in the mock.
  - Left: a blue outline logo icon and the brand name.
  - Center: uppercase nav links. The active link is blue with a thin blue underline.
  - Right: outline icons and a circular raised avatar.
- **Left sidebar:** a floating raised column about 85px wide below the top bar, holding vertically stacked outline icons with tiny uppercase labels.
  - The active item sits in a soft rounded-square tile with a blue icon and label.
  - Inactive items are muted grey.
  - On mobile it collapses to a bottom tab bar.
- **Content:** raised cards with 24px radius and comfortable spacing. Inputs and search fields are inset pills.

## Mapping to the dealership app

- Nav items: Inventory (dashboard), Search, My Purchases, and Admin (admin only).
- Vehicle cards use the raised style. Filter fields are inset.
- The purchase button is raised at rest and pressed (inset) when active. When disabled (quantity is 0) it is flat with muted text, plus an "Out of stock" badge.
