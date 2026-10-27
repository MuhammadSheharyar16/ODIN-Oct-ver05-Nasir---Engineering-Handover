# ODIN Oct ver05 Nasir · deploy and preview

This zip contains:

| Folder | What it is |
|---|---|
| `preview-build/` | **Deploy this.** A ready-made static site (HTML, JS, images, sound). No server code. |
| `odin-creative/` | The full source project, with its git history. |

## Deploy the preview (no build needed)
1. Upload the **contents** of `preview-build/` to any static host: Azure Static Web Apps, S3 + CloudFront, Netlify, Vercel, Nginx or IIS.
2. Host it at the **root of a domain or subdomain**, for example `https://odin-preview.example.com/`. It loads its images and sound from root paths (`/env`, `/journey`, `/sfx`), so it won't work from a sub-folder such as `example.com/odin/`.
3. Serve `index.html` for the root. No rewrites or environment variables are needed.

Try it locally first:
```bash
cd preview-build && npx serve -s .
```

## Using it
- Open the site, then press `/` or click **Ask ODIN anything…**, and type a question or pick one from the list.
- The keys: **H** goes home, **B** goes back, **S** starts or stops ODIN's voice, **F** toggles the depth-of-field background, and **G** toggles the full background blur.
- Useful links:
  - `?view=V05` opens any screen directly (screen IDs are in the handover kit).
  - `?nointro` skips the intro.
  - `?latency=12` or `?latency=12&progressive` previews the waiting experience.
- Browsers: a recent Chrome, Edge or Safari on a machine with a GPU, for the 3D room and effects.
- **Data is demo data**, labelled "Demo data · not live" on screen.

## Rebuild from source (only if you change the code)
```bash
cd odin-creative
npm ci
npm run build        # output in dist/
npm run dev          # local dev server on http://localhost:5173
```
Node 20 or newer.
