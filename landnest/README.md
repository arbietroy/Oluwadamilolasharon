# Landnest landing page (concept)

Static site, no build step. Open `index.html` through any static server (e.g. `npx serve landnest`).

- `index.html` – landing page: blueprint loader, scroll-scrubbed construction hero (canvas frame sequence), homes gallery, process, estates, testimonial, contact.
- `tour.html` – one-shot 3D walkthrough (Three.js): compound → porch → front door → living room → kitchen → main bedroom, driven by scroll.
- `assets/frames/` – 238 colour-graded JPEG frames of the construction film. To swap in a new film, re-extract with the same names (`f001.jpg`…) and adjust `FRAME_COUNT` / `FRAME_MAP` in `js/main.js`.
- `assets/img/` – reference home photos.

Libraries load from CDNs: GSAP 3.12.5 + ScrollTrigger, Lenis 1.1.13, Three.js 0.160.0.
