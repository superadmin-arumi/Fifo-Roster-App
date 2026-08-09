# FIFO Roster — putting it on your phone

**What this folder is:** the same app, split into the files a web host needs. Once it's online you open the link once on your iPhone, add it to your home screen, and it behaves like a real app — full screen, own icon, works with no signal.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole app. Everything is inside it. |
| `manifest.webmanifest` | Tells the phone the name, icon and that it should open full screen. |
| `sw.js` | Makes it work offline and pick up new versions automatically. |
| `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` | The home screen icon. |

Keep all six together in the same folder. Don't rename anything.

---

## Option A — GitHub Pages (free, permanent, easy to update)

1. Go to **github.com/new**. Name it `fifo-roster`. Set it to **Public**. Create it.
2. On the new repo page click **uploading an existing file**, drag in all six files, then **Commit changes**.
3. Go to **Settings → Pages**. Under *Branch* choose **main** and **/ (root)**, then **Save**.
4. Wait about a minute. Your link appears at the top of that page — something like
   `https://YOURNAME.github.io/fifo-roster/`

**To update later:** open the repo, click `index.html`, click the pencil… or simpler, use **Add file → Upload files** and drop the new `index.html` in. It overwrites, and the phone picks it up next time you open it with signal.

## Option B — Netlify Drop (fastest, no account needed to try)

1. Go to **app.netlify.com/drop**
2. Drag this whole folder onto the page.
3. You get a link straight away.

Free without an account, but the site is temporary and you get a **new link every time you re-upload**. Sign in with GitHub and you keep the same link and can drag-and-drop to update.

---

## Adding it to your iPhone home screen

1. Open the link in **Safari** (it has to be Safari, not Chrome).
2. Tap the **Share** button (square with an arrow).
3. Scroll down and tap **Add to Home Screen**.
4. Name it *Roster* and tap **Add**.

It now opens full screen with no browser bars. Your roster is stored on the phone, so it works on a plane or on site with no reception.

## Two things worth knowing

- **Your roster lives on each device separately.** The phone and the laptop don't sync. Load the PDF on the phone too, or use **Data → Download backup** on one and **Restore backup** on the other.
- **Don't use Private Browsing** when you first set it up — Safari throws the saved data away when you close the tab.
