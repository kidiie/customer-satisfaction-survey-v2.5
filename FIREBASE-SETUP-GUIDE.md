# Firebase Setup Guide (v2.4) — For Non-Programmers

This guide walks you through everything, one click at a time. No coding needed.
Your project is already picked: **mrrhl-survey-form-fcc37**. Do not create a
new project — just follow these steps inside that one.

Do the steps **in this exact order**. Do not skip ahead.

---

## STEP 1 — Open your project

1. Go to https://console.firebase.google.com in your browser.
2. Sign in with the Google account you used to create the project.
3. Click on the project card named **mrrhl-survey-form-fcc37**.
4. You should now see a left-hand menu with items like "Build", "Release & Monitor", etc.

If you don't see this project in your list, stop here and tell me — it means
you're signed into the wrong Google account.

---

## STEP 2 — Turn on Firestore (the database that stores survey answers)

1. In the left menu, click **Build**, then click **Firestore Database**.
2. If you see a button that says **Create database**, click it.
   - If it instead already shows a screen with tabs like "Data", "Rules",
     "Indexes" — Firestore is already created, skip to Step 3.
3. A window pops up asking for a location. Pick the one closest to Tanzania
   (for example `eur3 (europe-west)`). Click **Next**.
4. Choose **Start in production mode**. Click **Create** (or **Enable**).
5. Wait about 30–60 seconds. You'll land on a page with an empty "Data" tab.

✅ Checkpoint: You should now see tabs at the top: **Data | Rules | Indexes | Usage**.

---

## STEP 3 — Set the security rules (controls who can read/write data)

1. Still inside Firestore Database, click the **Rules** tab (next to "Data").
2. You'll see a box full of code. **Select all the text inside that box and delete it.**
3. Copy the block below exactly and paste it into that now-empty box:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /responses/{responseId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
  }
}
```

4. Click the blue **Publish** button (top right of that box).
5. You should see a confirmation message like "Rules published successfully."

⚠️ This step is the #1 reason surveys fail to save. If you skip Publish, nothing works.

---

## STEP 4 — Turn on the login system (Authentication)

1. In the left menu, click **Build**, then click **Authentication**.
2. If you see a button **Get started**, click it.
3. You'll see a list of sign-in methods (Google, Email/Password, Phone, etc.)
4. Click on **Email/Password**.
5. Toggle the first switch (labeled "Email/Password") to **ON** (blue).
6. Click **Save**.

✅ Checkpoint: On the "Sign-in method" tab, "Email/Password" should now say **Enabled**.

---

## STEP 5 — Create your admin login (the account YOU will use to log into the dashboard)

1. Still in Authentication, click the **Users** tab (next to "Sign-in method").
2. Click **Add user**.
3. Type in:
   - **Email**: the email you want to use to log in (e.g. `admin@mrrhl.go.tz`, or any email — it doesn't need to be real, it's just a login ID)
   - **Password**: a password you'll remember (at least 6 characters)
4. Click **Add user**.
5. You should now see that email appear in the Users list.

📝 Write down this email + password somewhere safe — this is what you'll type
into `admin.html` to see the dashboard.

---

## STEP 6 — Confirm the config file matches (already done for you)

The file `firebase-config.js` in this v2.4 package is **already filled in**
with your project's real values. You don't need to touch it. If someone
asks you to "check the config", just confirm the `projectId` inside that
file says `mrrhl-survey-form-fcc37` — if it does, you're good.

---

## STEP 7 — Put the files online (GitHub Pages)

If you haven't already:

1. Go to https://github.com and open your repository for this project.
2. Delete the old files in the repository and upload **all files from this
   v2.4 zip**, keeping the same folder structure (including the `js` folder).
3. Go to **Settings** (top menu of the repo) → **Pages** (left menu).
4. Under "Build and deployment", set **Source** to **Deploy from a branch**.
5. Set **Branch** to `main` and folder to `/ (root)`. Click **Save**.
6. Wait 1–2 minutes. Your site will be live at:
   `https://<your-github-username>.github.io/<your-repo-name>/`
   and the admin dashboard at:
   `https://<your-github-username>.github.io/<your-repo-name>/admin.html`

---

## STEP 8 — Test it

1. Open your live survey link (not a file on your computer — it must start with `https://`).
2. Fill in the form and click **Submit Feedback**. You should see the thank-you screen.
3. Go to Firebase Console → Firestore Database → **Data** tab. You should now
   see a collection called `responses` with one entry inside it.
4. Open your live admin link (`.../admin.html`).
5. Log in with the email + password you created in Step 5.
6. You should see the dashboard with your one test response in it.

---

## If something still doesn't work

Open the page that's failing, press **F12** on your keyboard (or right-click
→ Inspect), click the **Console** tab, and try the action again (submit or
log in). Copy the red text you see there and send it to me — that error
message tells us exactly what's wrong, instead of guessing.

Common ones:
- **"Missing or insufficient permissions"** → go back to Step 3, make sure you clicked Publish.
- **"auth/invalid-credential" or "auth/user-not-found"** → the email/password typed on the login page doesn't match Step 5. Double check spelling.
- **Page stuck loading forever, no error shown** → you're opening the file directly from your computer instead of the `https://` GitHub Pages link. Always use the `https://` link.
- **"Cannot use import statement outside a module"** → something got pasted into `firebase-config.js` that shouldn't be there. Re-upload the one from this v2.4 zip untouched.
