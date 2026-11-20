/* Landnest Turntable — hero model, build scrub, sections */
(() => {
  const FRAMES = 238;            // cut-out frames c001..c238
  const BUILD_END = 118;         // last frame of construction (0-based)
  const ORBIT_START = 118;       // turntable loop runs ORBIT_START..ORBIT_END
  const ORBIT_END = 237;
  const ORBIT_N = ORBIT_END - ORBIT_START;
  const src = (i) => `assets/cut/c${String(i + 1).padStart(3, "0")}.webp`;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- frame loading ---------- */
  const imgs = new Array(FRAMES), ok = new Uint8Array(FRAMES);
  const load = (i) => new Promise((res) => { const im = new Image(); im.decoding = "async"; im.onload = () => { imgs[i] = im; ok[i] = 1; res(); }; im.onerror = res; im.src = src(i); });
  const nearest = (f) => { f = Math.round(f); for (let d = 0; d < FRAMES; d++) { if (ok[f - d]) return imgs[f - d]; if (ok[f + d]) return imgs[f + d]; } return null; };
  async function queue(list, each, n = 6) { let k = 0; const w = async () => { while (k < list.length) { await load(list[k++]); each && each(); } }; await Promise.all(Array.from({ length: n }, w)); }
  const first = [], later = [];
  for (let i = 0; i < FRAMES; i++) (i % 3 === 0 || i === BUILD_END || i === ORBIT_END ? first : later).push(i);

  /* ---------- canvases ---------- */
  function makeView(canvas, opts) {
    const ctx = canvas.getContext("2d");
    const v = { canvas, ctx, w: 0, h: 0, frame: 0, ...opts };
    v.resize = () => { const d = Math.min(devicePixelRatio || 1, 2); v.w = canvas.clientWidth; v.h = canvas.clientHeight; canvas.width = Math.round(v.w * d); canvas.height = Math.round(v.h * d); ctx.setTransform(d, 0, 0, d, 0, 0); v.draw(v.frame, true); };
    v.draw = (f, force) => {
      if (!force && Math.abs(f - v.frame) < 0.01 && v.drawn) return;
      v.frame = f;
      const im = nearest(f); if (!im || !v.w) return;
      const s = Math.min((v.w * v.fitW) / im.width, (v.h * v.fitH) / im.height);
      const w = im.width * s, h = im.height * s;
      ctx.clearRect(0, 0, v.w, v.h);
      ctx.drawImage(im, (v.w - w) / 2, v.h * v.baseY - h, w, h);
      v.drawn = true;
    };
    addEventListener("resize", v.resize);
    return v;
  }
  const hero = makeView(document.getElementById("houseCanvas"), { fitW: 0.95, fitH: 0.64, baseY: 0.855 });
  const build = makeView(document.getElementById("buildCanvas"), { fitW: 0.95, fitH: 0.92, baseY: 0.96 });

  /* ---------- ground ring ---------- */
  const ring = document.getElementById("ring");
  (() => {
    const NS = "http://www.w3.org/2000/svg";
    let html = '<circle r="192"/><circle r="140" stroke-dasharray="2 6"/>';
    for (let a = 0; a < 360; a += 5) {
      const long = a % 15 === 0, r0 = long ? 170 : 180, rad = (a - 90) * Math.PI / 180;
      html += `<line class="t${long ? " t--l" : ""}" x1="${Math.cos(rad) * r0}" y1="${Math.sin(rad) * r0}" x2="${Math.cos(rad) * 192}" y2="${Math.sin(rad) * 192}"/>`;
    }
    ["N", "NE", "E", "SE", "S", "SW", "W", "NW"].forEach((t, k) => {
      const rad = (k * 45 - 90) * Math.PI / 180;
      html += `<text class="${t === "N" ? "north" : ""}" x="${Math.cos(rad) * 155}" y="${Math.sin(rad) * 155 + 4}" text-anchor="middle">${t}</text>`;
    });
    ring.innerHTML = html; void NS;
  })();

  /* ---------- hero turntable state ---------- */
  const stage = document.getElementById("stage");
  const degEl = document.getElementById("deg"), facingEl = document.getElementById("facing");
  const tags = [...document.querySelectorAll(".tag")].map((el) => ({ el, from: +el.dataset.from, to: +el.dataset.to }));
  const range = document.getElementById("buildRange");
  const stepBtns = [...document.querySelectorAll("#steps button")];
  const playBtn = document.getElementById("playBtn");
  const DIRS = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];

  let mode = "intro";            // intro | orbit | scrub
  let buildF = 0;                 // 0..BUILD_END
  let orbit = 0;                  // 0..ORBIT_N (wraps)
  let auto = !reduce, vel = 0, dragging = false, lastX = 0, lastT = 0, idleAt = 0;

  function angleNow() { return mode === "orbit" ? (orbit / ORBIT_N) * 360 : 0; }
  function setRangeUI(f) {
    const v = Math.round((f / BUILD_END) * 1000);
    range.value = v; range.style.setProperty("--fill", `${v / 10}%`);
    let on = 0; stepBtns.forEach((b, i) => { if (f >= +b.dataset.f - 2) on = i; });
    stepBtns.forEach((b, i) => b.classList.toggle("on", i === on));
  }
  function heroRender() {
    const f = mode === "orbit" ? ORBIT_START + ((orbit % ORBIT_N) + ORBIT_N) % ORBIT_N : buildF;
    hero.draw(f);
    const a = ((angleNow() % 360) + 360) % 360;
    ring.style.transform = `rotateX(74deg) rotateZ(${-a}deg)`;
    degEl.textContent = `${String(Math.round(a)).padStart(3, "0")}°`;
    facingEl.textContent = mode === "orbit" ? `Facing ${DIRS[Math.round(a / 45) % 8]}` : `Stage · ${stepBtns[stepBtns.findIndex((b) => b.classList.contains("on"))]?.textContent || "Plan"}`;
    tags.forEach((t) => {
      let show = false;
      if (mode === "orbit") { const lo = t.from, hi = t.to; show = (a >= ((lo + 360) % 360) && a <= hi) || (lo < 0 && (a >= lo + 360 || a <= hi)); }
      t.el.classList.toggle("on", show);
    });
  }

  let prev = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
    if (mode === "orbit" && !dragging) {
      if (Math.abs(vel) > 0.05) { orbit += vel * dt; vel *= Math.pow(0.04, dt); }
      else if (auto && now - idleAt > 1800) orbit += 9 * dt;       // ~13 s per turn
    }
    heroRender();
    requestAnimationFrame(tick);
  }

  stage.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button, input")) return;
    if (mode !== "orbit") { goOrbit(); }
    dragging = true; vel = 0; lastX = e.clientX; lastT = performance.now();
    stage.setPointerCapture(e.pointerId); stage.classList.add("is-drag");
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const now = performance.now(), dx = e.clientX - lastX;
    const df = -dx * 0.22;
    orbit += df; vel = df / Math.max(0.008, (now - lastT) / 1000) * 0.6;
    lastX = e.clientX; lastT = now;
  });
  const endDrag = () => { if (!dragging) return; dragging = false; idleAt = performance.now(); stage.classList.remove("is-drag"); };
  stage.addEventListener("pointerup", endDrag); stage.addEventListener("pointercancel", endDrag);
  stage.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { goOrbit(); orbit += e.key === "ArrowLeft" ? -4 : 4; idleAt = performance.now(); } });
  stage.tabIndex = 0;

  function goOrbit() { if (mode === "orbit") return; mode = "orbit"; buildF = BUILD_END; setRangeUI(BUILD_END); }
  range.addEventListener("input", () => {
    const f = (range.value / 1000) * BUILD_END;
    range.style.setProperty("--fill", `${range.value / 10}%`);
    if (range.value >= 1000) { goOrbit(); return; }
    mode = "scrub"; buildF = f; setRangeUI(f);
  });
  stepBtns.forEach((b) => b.addEventListener("click", () => {
    const target = +b.dataset.f;
    if (mode === "orbit") { mode = "scrub"; buildF = BUILD_END; }
    const o = { f: buildF };
    const done = () => { if (target >= BUILD_END) goOrbit(); };
    if (hasGSAP && !reduce) gsap.to(o, { f: target, duration: 1.2, ease: "power2.inOut", onUpdate: () => { buildF = o.f; mode = "scrub"; setRangeUI(o.f); }, onComplete: done });
    else { buildF = target; mode = "scrub"; setRangeUI(target); done(); }
  }));
  playBtn.addEventListener("click", () => { auto = !auto; playBtn.setAttribute("aria-pressed", auto); playBtn.setAttribute("aria-label", auto ? "Pause rotation" : "Play rotation"); if (auto) goOrbit(); });
  if (reduce) { playBtn.setAttribute("aria-pressed", "false"); playBtn.setAttribute("aria-label", "Play rotation"); }

  /* ---------- loader: five courses of blockwork ---------- */
  const wall = document.getElementById("wall");
  const COURSES = 5, PER = 6;
  for (let c = 0; c < COURSES; c++) { const row = document.createElement("div"); row.className = "course"; for (let b = 0; b < PER; b++) { const blk = document.createElement("span"); blk.className = "blk"; row.appendChild(blk); } wall.prepend(row); }
  const blocks = [...wall.querySelectorAll(".course")].reverse().flatMap((r) => [...r.children]); // bottom course first
  const ltxt = document.getElementById("loaderText"), lpct = document.getElementById("loaderPct");
  let got = 0, shown = 0;
  const t0 = performance.now(), MIN = reduce ? 200 : 2200;
  document.body.classList.add("is-loading");
  hero.resize(); build.resize();
  const firstLoad = queue(first, () => { got++; });
  function loaderTick(now) {
    const target = Math.min(got / first.length, clamp((now - t0) / MIN, 0, 1));
    shown += (target - shown) * 0.15; if (target - shown < 0.003) shown = target;
    const n = Math.round(shown * blocks.length);
    blocks.forEach((b, i) => b.classList.toggle("on", i < n));
    ltxt.textContent = `Laying course ${Math.min(COURSES, Math.floor(shown * COURSES) + 1)} of ${COURSES}`;
    lpct.textContent = `${Math.round(shown * 100)}%`;
    if (shown >= 0.999 && got >= first.length) return revealPage();
    requestAnimationFrame(loaderTick);
  }
  requestAnimationFrame(loaderTick);
  firstLoad.then(() => queue(later, () => { if (mode !== "orbit") hero.draw(buildF, true); }, 4));

  function revealPage() {
    const loader = document.getElementById("loader");
    document.body.classList.remove("is-loading");
    hero.resize(); build.resize();
    requestAnimationFrame(tick);
    if (!hasGSAP || reduce) { loader.remove(); mode = "orbit"; setRangeUI(BUILD_END); startScroll(); return; }
    const o = { f: 0 };
    gsap.timeline()
      .to(".blk", { y: 40, opacity: 0, duration: .5, ease: "power2.in", stagger: { each: .012, from: "end" } })
      .to(loader, { autoAlpha: 0, duration: .5 }, "-=.15")
      .add(() => loader.remove())
      .from(".hero__title .ln > span", { yPercent: 105, duration: 1, ease: "expo.out", stagger: .08 }, "-=.3")
      .from(".hero__copy .eyebrow, .hero__lede, .hero__cta, .hero__facts", { y: 18, opacity: 0, duration: .8, ease: "power3.out", stagger: .07 }, "-=.75")
      .from(".nav", { yPercent: -100, opacity: 0, duration: .7, ease: "power3.out" }, "<")
      .from(".plinth", { scale: .6, opacity: 0, duration: 1.2, ease: "expo.out" }, "-=1")
      .from(".stage__word", { opacity: 0, letterSpacing: "0.2em", duration: 1.6, ease: "expo.out" }, "<")
      .from(".hud, .scrub", { opacity: 0, y: 10, duration: .6, stagger: .1 }, "-=1")
      .to(o, { f: BUILD_END, duration: 4.4, ease: "power1.inOut", onUpdate: () => { buildF = o.f; setRangeUI(o.f); }, onComplete: () => { mode = "orbit"; idleAt = 0; } }, "-=1.4")
      .add(startScroll, 0.8);
  }

  /* ---------- scroll sections ---------- */
  let started = false;
  function startScroll() {
    if (started || !hasGSAP) return; started = true;
    gsap.registerPlugin(ScrollTrigger);
    let lenis = null;
    if (!reduce && window.Lenis) {
      lenis = new Lenis({ duration: 1.1 });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
    }
    document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const id = a.getAttribute("href"), el = id === "#top" ? document.body : document.querySelector(id);
      if (!el) return; e.preventDefault();
      lenis ? lenis.scrollTo(el, { duration: 1.5 }) : el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    }));

    // hero parallax: the model drifts up and the outline word slides as you leave
    gsap.to(".stage__word", { xPercent: -12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".stage__canvas", { yPercent: -10, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

    // pinned build
    const items = [...document.querySelectorAll("#buildList li")];
    const weekEl = document.getElementById("buildWeek"), bar = document.getElementById("buildBar");
    const BUILD_TAIL = 150; // end on the finished house turning a little
    ScrollTrigger.create({
      trigger: ".build", start: "top top", end: "+=260%", pin: ".build__pin", scrub: true,
      onUpdate: (st) => {
        const p = st.progress;
        build.draw(p * BUILD_TAIL);
        const idx = Math.min(items.length - 1, Math.floor(p * items.length * 0.999));
        items.forEach((li, i) => li.classList.toggle("on", i === idx));
        weekEl.textContent = `Week ${String(Math.round(p * 46)).padStart(2, "0")}`;
        bar.style.width = `${p * 100}%`;
      },
    });
    items[0].classList.add("on");

    gsap.utils.toArray(".card, .milestones li, .faq details").forEach((el) => gsap.from(el, { y: 40, opacity: 0, duration: .9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } }));

    const nav = document.getElementById("nav"); let last = 0;
    ScrollTrigger.create({ start: 0, end: "max", onUpdate: (s) => { const y = s.scroll(); nav.classList.toggle("is-solid", y > 40); nav.classList.toggle("is-hidden", y > innerHeight && y > last + 2); last = y; } });
    ScrollTrigger.refresh();
  }

  /* ---------- card tilt ---------- */
  if (!reduce && matchMedia("(hover: hover)").matches) document.querySelectorAll("[data-tilt]").forEach((c) => {
    c.addEventListener("pointermove", (e) => { const r = c.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; c.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(0)`; });
    c.addEventListener("pointerleave", () => { c.style.transform = ""; });
  });

  /* ---------- instalment calculator ---------- */
  const plan = document.getElementById("calcPlan"), out = document.getElementById("calcOut");
  const split = [["Deposit & title", .3], ["Slab", .2], ["Walls", .2], ["Roof", .2], ["Keys", .1]];
  const naira = (n) => "₦" + Math.round(n).toLocaleString("en-NG");
  const calc = () => { const v = +plan.value; out.innerHTML = split.map(([k, f]) => `<span>${k} <b>${naira(v * f)}</b></span>`).join(""); };
  plan.addEventListener("change", calc); calc();

  /* ---------- form ---------- */
  const form = document.getElementById("form"), msg = document.getElementById("formMsg");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const n = form.elements.name, em = form.elements.email; let good = true;
    [n, em].forEach((f) => { const bad = !f.value.trim() || (f.type === "email" && !/^\S+@\S+\.\S+$/.test(f.value)); f.setAttribute("aria-invalid", bad); if (bad) good = false; });
    msg.classList.toggle("ok", good);
    msg.textContent = good ? `Thanks, ${n.value.trim().split(" ")[0]}. This is a preview, so nothing was sent. On the live site this books your visit.` : "Add your name and a valid email so we can confirm the visit.";
    if (good) form.reset();
  });
})();
