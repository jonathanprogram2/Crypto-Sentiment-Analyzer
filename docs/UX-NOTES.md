# UX Notes (Iteration 2)

## Nielsen Heuristics — (what's true today vs. what I'm planning)

- **Visibility of system status**
 - *Planned:* loading skeletons for cards/chart, clear empty + error states.
 - *Today:* simple "Loading..." and error text already show up.

- **Match between system & the real world**
 - *Today:* coin names/symbols, price labels, and "Why this score?" match crypto language.
 - *Next:* write a plainer explanation of how the score is calculated.

- **User control & freedom**
 - *Today:* Back + breadcrumbs, modal has a clear close button.
 - *Next:* quick "reset filters" (lightweight undo).

- **Consistencey & standards**
 - *Today:* Tailwind tokens, same badge styles, consistent spacing on cards.
 - *Next:* small spacing audit so sections line up perfectly.

- **Error prevention**
 - *Next:* disable buttons while loading, simple validation on any future inputs.

- **Recognition rather than recall**
 - *Today:* visible filters and time toggles instead of buried settings.
 - *Next:* presets (ex., "All / News / Reddit").

- **Flexibility & efficiency of use**
 -*Next:* keyboard shortcuts ( `/` to focus search later, `?` for help), tighter focus styles.

- **Aesthetic and minimalist design**
 - *Today:* clean dark theme, restrained color usage.
 - *Next:* pass to remove any extra chrome and tighten paddings.

- **Help users recognize, diagnose, recover from errors**
 - *Planned:* friendly error messages with a retry.

- **Help & documentation**
 - *Today:* "Why this score?" link exists.
 - *Next:* add a short "How it works" section or tooltip in plain language


## QoL backlog (near-term polish)
- Keyboard navigation & focus rings
- Loading skeletons for cards/chart
- Empty & error states for Evidence feed
- Responsive breakpoints reviews on the Detail layout
- Wire filters into real data (or do simple client filtering first)