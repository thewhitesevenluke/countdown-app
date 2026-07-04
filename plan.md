# Countdown App Implementation Plan

**Goal:** Build a local-only web countdown app where each saved countdown object appears in a right-side options list, and selecting one shows a large rounded countdown display.

**Current Context:** The project folder is currently empty. The app should be planned as a fresh, dependency-free web app that can run by opening `index.html` in a browser. No implementation should happen in this planning pass.

**Approach:** Use plain HTML, CSS, and JavaScript with `localStorage` for persistence. Keep the interface minimal, centered, practical, and warm. Everything should feel rounded: the main countdown box, option list, selected option outline, buttons, form fields, and confirmation dialog.

**Files:**
- Create: `/Users/luke/Documents/projects/Countdown app/index.html` - app shell, main countdown area, options panel, create form dialog, and delete confirmation dialog.
- Create: `/Users/luke/Documents/projects/Countdown app/styles.css` - rounded layout, responsive sizing, selected states, modal styling, and practical warm visual polish.
- Create: `/Users/luke/Documents/projects/Countdown app/app.js` - countdown state, date calculations, localStorage persistence, selection, create, edit-ready structure, and delete confirmation behavior.
- Optional create: `/Users/luke/Documents/projects/Countdown app/README.md` - short usage notes for running the static app.

## Requirements

- Local-only app with no account, backend, sync, or network dependency.
- Each saved countdown is an "object."
- Right-side options panel lists all countdown objects.
- Clicking an option selects it.
- The selected option has a visible rounded outline or highlighted state.
- Main display shows a large number and label, such as `87` and `days left`.
- Bottom controls include `Delete option` and `Create new object`.
- `Create new object` opens a more detailed create screen or modal.
- `Delete option` requires a selected countdown and opens a confirmation popup before deleting.
- Delete confirmation includes a clear cancel path and a clear yes/delete action.
- The visual style should match the user's sketch more than a calendar/dashboard layout.
- Everything should be rounded.

## Data Model

Each countdown object should use this shape:

```js
{
  id: "generated-id",
  title: "Mom's Birthday",
  targetDate: "2026-07-12",
  targetTime: "",
  repeatsYearly: true,
  createdAt: "2026-06-30T00:00:00.000Z",
  updatedAt: "2026-06-30T00:00:00.000Z"
}
```

Notes:
- `title` is required.
- `targetDate` is required.
- `targetTime` is optional.
- `repeatsYearly` is useful for birthdays and holidays.
- Do not include deadline/calendar language in the UI.

## Layout Design

Desktop layout:

```text
                 +-------------------------+   +--------------+
                 |                         |   | [selected]   |
                 |           87            |   | Birthday     |
                 |       days left         |   | Vacation     |
                 |                         |   | Holiday      |
                 +-------------------------+   |              |
                 [ Delete option ] [ Create new object ]     |
                                               +--------------+
```

Mobile layout:

```text
+---------------------------+
|          Birthday         |
|                           |
|            87             |
|        days left          |
+---------------------------+
| Delete option             |
| Create new object         |
+---------------------------+
| Options                   |
| [Birthday]                |
| Vacation                  |
| Holiday                   |
+---------------------------+
```

## Tasks

- [ ] Task 1: Create the static app shell
  - Change: Add `index.html` with a centered app container, main countdown display, right-side options panel, bottom action buttons, create dialog, and delete confirmation dialog.
  - Files: `/Users/luke/Documents/projects/Countdown app/index.html`
  - Verify: Open `/Users/luke/Documents/projects/Countdown app/index.html` and confirm the main layout appears without console errors.

- [ ] Task 2: Build the rounded visual system
  - Change: Add `styles.css` with a clean practical look, generous rounded corners, stable dimensions, selected option highlighting, responsive layout, and modal styling.
  - Files: `/Users/luke/Documents/projects/Countdown app/styles.css`
  - Verify: Resize browser from desktop to mobile widths and confirm text does not overlap, the options list remains usable, and the main countdown stays prominent.

- [ ] Task 3: Implement countdown state and persistence
  - Change: Add `app.js` to load countdown objects from `localStorage`, seed a small example list if empty, track the selected object, and save changes after create/delete.
  - Files: `/Users/luke/Documents/projects/Countdown app/app.js`
  - Verify: Create a countdown, refresh the browser, and confirm it remains in the options list.

- [ ] Task 4: Implement countdown calculations
  - Change: Calculate days left from today's local date to the selected target date. Show `Today` when the date is today, `Tomorrow` when one day remains, and `<number> days left` otherwise.
  - Files: `/Users/luke/Documents/projects/Countdown app/app.js`
  - Verify: Test dates for today, tomorrow, a future date, and a past one-time date.

- [ ] Task 5: Handle yearly repeating countdowns
  - Change: If `repeatsYearly` is enabled and the target date has passed this year, calculate the countdown to the same month/day next year.
  - Files: `/Users/luke/Documents/projects/Countdown app/app.js`
  - Verify: Add a birthday that already passed this year and confirm it counts down to next year's date.

- [ ] Task 6: Implement create new object flow
  - Change: Make `Create new object` open a rounded modal or detailed screen with fields for title, target date, optional time, repeat yearly, save, and cancel.
  - Files: `/Users/luke/Documents/projects/Countdown app/index.html`, `/Users/luke/Documents/projects/Countdown app/app.js`, `/Users/luke/Documents/projects/Countdown app/styles.css`
  - Verify: Create a valid countdown and confirm it appears in the right options panel, becomes selected, and updates the main countdown display.

- [ ] Task 7: Implement guarded delete flow
  - Change: Make `Delete option` open a confirmation popup when an object is selected. Deleting should happen only after the user confirms.
  - Files: `/Users/luke/Documents/projects/Countdown app/index.html`, `/Users/luke/Documents/projects/Countdown app/app.js`, `/Users/luke/Documents/projects/Countdown app/styles.css`
  - Verify: Click delete, cancel once and confirm nothing changes; click delete again, confirm yes, and confirm the selected object is removed.

- [ ] Task 8: Add empty and no-selection states
  - Change: If there are no countdowns, show a friendly empty state in the main display and keep `Create new object` available. If no object is selected, disable or soften `Delete option`.
  - Files: `/Users/luke/Documents/projects/Countdown app/app.js`, `/Users/luke/Documents/projects/Countdown app/styles.css`
  - Verify: Delete all objects and confirm the app still looks intentional and usable.

- [ ] Task 9: Final visual and interaction verification
  - Change: Polish spacing, button sizing, focus states, keyboard behavior, and modal dismissal.
  - Files: `/Users/luke/Documents/projects/Countdown app/index.html`, `/Users/luke/Documents/projects/Countdown app/styles.css`, `/Users/luke/Documents/projects/Countdown app/app.js`
  - Verify: Check desktop and mobile screenshots against the user's sketch: big rounded countdown box, right options panel, selected option highlight, bottom create/delete controls, and rounded visual style.

## Risks And Checks

- Date math can be confusing around time zones. Prefer local date-only calculations for `targetDate` so "days left" matches what the user expects.
- Past one-time countdowns need a clear behavior. Recommended v1 behavior: show `Past` or `0 days left` rather than auto-rolling unless `repeatsYearly` is enabled.
- The app should not become a calendar. Avoid labels like deadline, schedule, agenda, or calendar.
- Deleting is destructive, so keep the confirmation popup mandatory.
- Since storage is local browser storage, clearing browser data will remove countdowns.
- Because the app is static and dependency-free, verification should focus on browser behavior, persistence, responsive layout, and visual match.
