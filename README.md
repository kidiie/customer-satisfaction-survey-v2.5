# Manyara Regional Referral Hospital Laboratory — Patient Satisfaction Survey (v2.5)

## What's new in v2.5
- **Progress bar** — a sticky bar under the header fills up as each of the
  7 required questions is answered, with a live "X of 7 answered" count.
- **Encouraging messages** — a small "heart" toast pops up at a few
  milestones (starting, halfway, near the end, finished), and again if
  someone rates the overall service 5★ (celebration) or 1★ (a caring "tell
  us more" nudge). Messages are bilingual (English / Kiswahili) and never
  repeat mid-fill.
- `firebase-config.js` now correctly defines `auth` and
  `RESPONSES_COLLECTION`, which `admin.js`/`survey.js` need — these were
  missing in v2.4 and were the cause of the login page and submit button
  spinning forever.

⚠️ **Before you deploy:** `firebase-config.js` still has placeholder values
copied from an old project. Open Firebase Console → your
`mrrhl-survey-form-fcc37` project → ⚙️ Project settings → "Your apps", copy
the real `firebaseConfig` values, and paste them in. See
`FIREBASE-SETUP-GUIDE.md` for the full click-by-click walkthrough.

## Earlier notes (v2.4)
- New file: **`FIREBASE-SETUP-GUIDE.md`** — a plain-language, click-by-click
  guide for finishing the Firebase setup, written for someone with no coding
  background. **Start there.**
- Survey questions match the official paper form exactly (Document No.
  MRRHL/F/020, Version 4).

## Start here
Open **`FIREBASE-SETUP-GUIDE.md`** and follow it top to bottom before doing
anything else. It covers Firestore, security rules, login setup, your admin
account, and putting the site online — in that order.

## Files
- `index.html` — public survey (patients/customers fill this in)
- `admin.html` — admin login + dashboard
- `styles.css` — shared design system
- `firebase-config.js` — already configured, do not edit unless told to
- `js/survey.js` — survey logic + Firestore submission
- `js/admin.js` — admin auth, data loading, stats, chart, table
- `js/export.js` — CSV / Excel / PDF export
- `FIREBASE-SETUP-GUIDE.md` — step-by-step setup for non-programmers

## Notes
- Each response is stored in Firestore under the `responses` collection with:
  `ratings` (the 6 category scores), `averageRating`, `bestLiked`,
  `improvementSuggestion`, `turnaroundSatisfied`, `turnaroundSpecify`,
  optional `interviewerName` / `contactPhone` / `contactEmail`, and
  `submittedAt`.
- The admin dashboard is fully separate from the public survey and always
  requires login.
- Chart.js, SheetJS, and jsPDF load from CDN — no build step required, works
  directly on GitHub Pages.
