# Sharon — personal website

React (Vite) site with scroll animations (GSAP, Lenis) and a built-in editor at `/admin`.
All text, sections, projects, services, colours and fonts live in **`src/content/site.json`**.

## Run it on your computer
1. Install Node.js 18 or newer.
2. In this folder run `npm install`, then `npm run dev`.
3. Open the address it prints (usually http://localhost:5173). The editor is at `/admin`.

## Put it on Vercel
1. Create a new GitHub repository and upload this folder to it.
2. In Vercel, choose **Add New → Project**, import the repository, and keep the defaults (Vercel detects Vite). Deploy.
3. To make the **Publish** button in the editor work, add these in Vercel → Project → Settings → Environment Variables, then redeploy:
   - `ADMIN_PASSWORD` — any password you choose for `/admin`
   - `GITHUB_TOKEN` — a GitHub fine-grained personal access token with **Contents: Read and write** on this repository only
   - `GITHUB_REPO` — your repository, written as `yourusername/repository-name`
   - `GITHUB_BRANCH` — optional, defaults to `main`

## How editing works
- Go to `yoursite.com/admin`, enter your password.
- Edit text, add/remove/reorder/hide sections, change colours and fonts. Use **View site** to preview your edits before publishing.
- **Publish** saves `site.json` to GitHub; Vercel rebuilds and the live site updates in about a minute.
- **Download content file** gives you `site.json` as a backup (or to replace `src/content/site.json` by hand).

## Photos and images
Put images in `public/images/` (e.g. `public/images/sharon.jpg`), push to GitHub, then set the photo URL in the editor to `/images/sharon.jpg`.

## Contact form
In the editor, open the Contact page → Contact form → **Form webhook URL** and paste an n8n Webhook URL (or Formspree). The form sends name, email, company, message and budget as JSON. If it's empty, the form opens the visitor's email app instead.

## Files worth knowing
- `src/content/site.json` — all content and theme
- `src/sections/` — one file per section type (Hero.jsx is the scroll animation)
- `src/admin/` — the editor
- `api/save.js` — the Vercel function behind the Publish button
