/* Landnest landing page — scroll engine */
(() => {
  const FRAME_COUNT = 238;
  const FRAME_W = 1280, FRAME_H = 720;
  const framePath = (i) => `assets/frames/f${String(i + 1).padStart(3, "0")}.jpg`;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  // Scroll progress (0..1 of the pinned hero) → frame index. Construction gets more scroll than the orbit.
  const FRAME_MAP = [
    [0.00, 7], [0.10, 30], [0.20, 45], [0.32, 75], [0.44, 100], [0.54, 118], [0.82, 237],
  ];
  const BUILD_END = 0.82;
  const frameAt = (p) => {
    if (p <= FRAME_MAP[0][0]) return FRAME_MAP[0][1];
    for (let i = 1; i < FRAME_MAP.length; i++) {
      const [p1, f1] = FRAME_MAP[i], [p0, f0] = FRAME_MAP[i - 1];
      if (p <= p1) return f0 + (f1 - f0) * ((p - p0) / (p1 - p0));
    }
    return FRAME_MAP[FRAME_MAP.length - 1][1];
  };
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const range = (p, a, b) => clamp01((p - a) / (b - a));

  /* ---------------- frames ---------------- */
  const images = new Array(FRAME_COUNT);
  const loaded = new Uint8Array(FRAME_COUNT);
  function loadFrame(i) {
    return new Promise((res) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => { loaded[i] = 1; images[i] = img; res(); };
      img.onerror = () => res();
      img.src = framePath(i);
    });
  }
  // Priority pass: every 4th frame (enough to scrub smoothly), then fill in the rest.
  const priority = [], rest = [];
  for (let i = 0; i < FRAME_COUNT; i++) (i % 4 === 0 || i === FRAME_COUNT - 1 ? priority : rest).push(i);

  async function loadQueue(list, onEach, concurrency = 6) {
    let k = 0;
    const worker = async () => { while (k < list.length) { const i = list[k++]; await loadFrame(i); onEach && onEach(); } };
    await Promise.all(Array.from({ length: concurrency }, worker));
  }
  function nearestLoaded(i) {
    i = Math.round(i);
    for (let d = 0; d < FRAME_COUNT; d++) {
      if (loaded[i - d]) return images[i - d];
      if (loaded[i + d]) return images[i + d];
    }
    return null;
  }

  /* ---------------- canvas ---------------- */
  const canvas = document.getElementById("heroCanvas");
  const ctx = canvas.getContext("2d");
  let cw = 0, ch = 0, dpr = 1, currentP = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = canvas.clientWidth; ch = canvas.clientHeight;
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render(currentP, true);
  }

  // Blueprint dimension lines, drawn in frame space so they stay on the plan.
  function drawDims(alpha, s, ox, oy) {
    if (alpha <= 0.01) return;
    const X = (x) => ox + x * s, Y = (y) => oy + y * s;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "#0e2338"; ctx.fillStyle = "#0e2338";
    ctx.lineWidth = 1;
    ctx.font = `500 ${Math.max(10, 12 * s)}px "IBM Plex Mono", monospace`;
    ctx.textAlign = "center";
    const tick = (x, y) => { ctx.beginPath(); ctx.moveTo(X(x) - 5, Y(y) + 5); ctx.lineTo(X(x) + 5, Y(y) - 5); ctx.stroke(); };
    // overall width
    ctx.beginPath(); ctx.moveTo(X(292), Y(92)); ctx.lineTo(X(930), Y(92)); ctx.stroke();
    tick(292, 92); tick(930, 92);
    ctx.fillText("16 400", X(611), Y(82));
    // overall depth
    ctx.beginPath(); ctx.moveTo(X(972), Y(118)); ctx.lineTo(X(972), Y(598)); ctx.stroke();
    tick(972, 118); tick(972, 598);
    ctx.save(); ctx.translate(X(990), Y(358)); ctx.rotate(Math.PI / 2); ctx.fillText("12 600", 0, 0); ctx.restore();
    // grid bubbles
    const bubble = (x, y, t) => { ctx.beginPath(); ctx.arc(X(x), Y(y), 11 * s, 0, Math.PI * 2); ctx.stroke(); ctx.fillText(t, X(x), Y(y) + 4 * s); };
    [["A", 292], ["B", 455], ["C", 610], ["D", 930]].forEach(([t, x]) => bubble(x, 52, t));
    [["1", 118], ["2", 330], ["3", 598]].forEach(([t, y]) => bubble(250, y, t));
    ctx.restore();
  }

  function render(p, force) {
    currentP = p;
    const img = nearestLoaded(frameAt(p));
    if (!img || !cw) return;
    const portrait = ch > cw * 1.05;
    let s, ox, oy;
    if (portrait) {
      // On phones, fit the house to the width and let the studio backdrop extend.
      s = Math.max(cw / (FRAME_W * 0.7), ch / FRAME_H * 0.5);
      const g = ctx.createRadialGradient(cw / 2, ch / 2, 0, cw / 2, ch / 2, Math.max(cw, ch) * 0.75);
      g.addColorStop(0, "#b3b0a8"); g.addColorStop(1, "#5b5954");
      ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);
    } else {
      s = Math.max(cw / FRAME_W, ch / FRAME_H);
    }
    const w = FRAME_W * s, h = FRAME_H * s;
    ox = (cw - w) / 2; oy = (ch - h) / 2 + (portrait ? ch * 0.04 : 0);
    ctx.drawImage(img, ox, oy, w, h);
    if (portrait) {
      // feather the top and bottom edges of the frame into the backdrop
      const feather = 70;
      const top = ctx.createLinearGradient(0, oy, 0, oy + feather);
      top.addColorStop(0, "rgba(120,118,112,1)"); top.addColorStop(1, "rgba(120,118,112,0)");
      ctx.fillStyle = top; ctx.fillRect(0, oy - 1, cw, feather);
      const bot = ctx.createLinearGradient(0, oy + h - feather, 0, oy + h);
      bot.addColorStop(0, "rgba(110,108,103,0)"); bot.addColorStop(1, "rgba(110,108,103,1)");
      ctx.fillStyle = bot; ctx.fillRect(0, oy + h - feather, cw, feather + 1);
    }
    drawDims(1 - range(p, 0.07, 0.13), s, ox, oy);
  }

  /* ---------------- loader ---------------- */
  const loaderEl = document.getElementById("loader");
  const pctEl = document.getElementById("loaderPct");
  const barEl = document.getElementById("loaderBar");
  const stageEl = document.getElementById("loaderStage");
  const STAGES = ["Setting out", "Foundation", "Blockwork", "Doors & windows", "Roofing", "Handover"];
  const paths = Array.from(document.querySelectorAll(".loader__svg .draw"));
  paths.forEach((p) => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });

  function setLoader(v) {
    const n = paths.length;
    paths.forEach((p, i) => {
      const local = clamp01(v * n - i * 0.75);
      const L = parseFloat(p.style.strokeDasharray);
      p.style.strokeDashoffset = L * (1 - local);
    });
    pctEl.textContent = String(Math.round(v * 100)).padStart(3, "0");
    barEl.style.transform = `scaleX(${v})`;
    stageEl.textContent = STAGES[Math.min(STAGES.length - 1, Math.floor(v * STAGES.length))];
  }

  document.body.classList.add("is-loading");
  let target = 0, shown = 0, done = 0;
  const MIN_MS = reduceMotion ? 300 : 2600;
  const t0 = performance.now();
  const loadingPromise = loadQueue(priority, () => { done++; target = done / priority.length; });

  function finishIntro() {
    document.body.classList.remove("is-loading");
    render(0, true);
    if (!hasGSAP || reduceMotion) { loaderEl.remove(); startScroll(); return; }
    const tl = gsap.timeline({ onComplete: () => loaderEl.remove() });
    tl.to(".ld-txt", { opacity: 1, duration: .4 })
      .to(".loader__svg path", { stroke: "#ffffff", duration: .25 }, "<")
      .to(".loader__sheet", { scale: 1.08, opacity: 0, duration: .7, ease: "power2.in" }, "+=.25")
      .to(loaderEl, { clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "expo.inOut" }, "-=.2")
      .from(".hero__title .line > span", { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: .09 }, "-=.55")
      .from(".hero__intro .eyebrow, .hero__sub, .hero__scroll", { y: 16, opacity: 0, duration: .8, ease: "power3.out", stagger: .08 }, "-=.8")
      .from(".nav", { yPercent: -100, duration: .8, ease: "power3.out" }, "-=1")
      .add(startScroll, "-=.6");
  }

  function tickLoader(now) {
    const timeCap = clamp01((now - t0) / MIN_MS);
    const goal = Math.min(target, timeCap);
    shown += (goal - shown) * 0.12;
    if (goal - shown < 0.002) shown = goal;
    setLoader(shown);
    if (shown >= 0.999 && target >= 1) { setLoader(1); finishIntro(); return; }
    requestAnimationFrame(tickLoader);
  }
  // wrap title lines so they can slide up from a mask
  document.querySelectorAll(".hero__title .line").forEach((l) => { l.innerHTML = `<span>${l.innerHTML}</span>`; });
  requestAnimationFrame(tickLoader);
  loadingPromise.then(() => loadQueue(rest, null, 4));

  window.addEventListener("resize", resize);
  resize();

  /* ---------------- scroll ---------------- */
  let lenis = null;
  let started = false;
  function startScroll() {
    if (started) return; started = true;
    if (!hasGSAP) { fallbackScroll(); return; }
    gsap.registerPlugin(ScrollTrigger);

    if (!reduceMotion && typeof window.Lenis !== "undefined") {
      lenis = new Lenis({ duration: 1.15, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        const el = id === "#top" ? document.body : document.querySelector(id);
        if (!el) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(el, { offset: id === "#top" ? 0 : -10, duration: 1.6 });
        else el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      });
    });

    heroScroll();
    statementScroll();
    homesScroll();
    processScroll();
    estatesPeek();
    navBehaviour();
    ScrollTrigger.refresh();
  }

  function heroScroll() {
    const intro = document.getElementById("heroIntro");
    const grid = document.getElementById("heroGrid");
    const photo = document.getElementById("heroPhoto");
    const photoImg = photo.querySelector("img");
    const outro = document.getElementById("heroOutro");
    const stages = Array.from(document.querySelectorAll("#stages li"));
    const froms = stages.map((li) => parseFloat(li.dataset.from));
    const tape = document.querySelector(".tape");
    const tapeFill = document.getElementById("tapeFill");
    const tapeRead = document.getElementById("tapeRead");
    const nav = document.getElementById("nav");
    let activeStage = -1;

    function showStage(idx) {
      if (idx === activeStage) return;
      stages.forEach((li, i) => {
        if (i === idx) gsap.fromTo(li, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: .6, ease: "power3.out", overwrite: true });
        else if (i === activeStage) gsap.to(li, { autoAlpha: 0, y: -16, duration: .35, ease: "power2.in", overwrite: true });
        else gsap.set(li, { autoAlpha: 0 });
      });
      activeStage = idx;
    }

    function update(p) {
      render(p);
      intro.style.opacity = 1 - range(p, 0.005, 0.045);
      intro.style.transform = `translateY(${-60 * range(p, 0, 0.06)}px)`;
      grid.style.opacity = 1 - range(p, 0.08, 0.22);

      let idx = -1;
      if (p > 0.035 && p < BUILD_END - 0.015) froms.forEach((f, i) => { if (p >= Math.max(f, 0.035)) idx = i; });
      showStage(idx);

      const bp = range(p, 0, BUILD_END);
      tape.style.opacity = p > 0.03 && p < BUILD_END ? 1 : 0;
      tapeFill.style.height = `${bp * 100}%`;
      tapeRead.textContent = `WEEK ${String(Math.round(bp * 46)).padStart(2, "0")} OF 46`;

      const r = range(p, BUILD_END, 0.93);
      const eased = r < .5 ? 2 * r * r : 1 - Math.pow(-2 * r + 2, 2) / 2;
      photo.style.clipPath = `circle(${eased * 80}% at 50% 55%)`;
      photoImg.style.transform = `scale(${1.15 - 0.15 * eased})`;
      const o = range(p, 0.9, 0.97);
      outro.style.opacity = o; outro.style.visibility = o > 0 ? "visible" : "hidden";
      outro.style.transform = `translateY(${(1 - o) * 30}px)`;
      nav.classList.toggle("is-dark", p > 0.88);
    }

    ScrollTrigger.create({
      trigger: "#hero", start: "top top", end: "bottom bottom", scrub: true,
      onUpdate: (self) => update(self.progress),
    });
    update(0);
  }

  function statementScroll() {
    const el = document.getElementById("statement");
    el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
    gsap.to(el.querySelectorAll(".w"), {
      opacity: 1, stagger: 0.05, ease: "none",
      scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true },
    });
    document.querySelectorAll(".count").forEach((c) => {
      const to = parseFloat(c.dataset.to), obj = { v: 0 };
      ScrollTrigger.create({
        trigger: c, start: "top 90%", once: true,
        onEnter: () => gsap.to(obj, { v: to, duration: 2, ease: "power3.out", onUpdate: () => { c.textContent = Math.round(obj.v); } }),
      });
    });
  }

  function homesScroll() {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 900px)", () => {
      const track = document.getElementById("homesTrack");
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const tween = gsap.to(track, {
        x: () => -dist(), ease: "none",
        scrollTrigger: { trigger: ".homes__pin", start: "top top", end: () => `+=${dist()}`, pin: true, scrub: 0.6, invalidateOnRefresh: true },
      });
      track.querySelectorAll(".home__img img").forEach((img) => {
        gsap.fromTo(img, { xPercent: -6 }, { xPercent: 6, ease: "none", scrollTrigger: { trigger: img.parentElement, containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
      });
      return () => gsap.set(track, { x: 0 });
    });
    gsap.utils.toArray(".home").forEach((h) => {
      gsap.from(h, { y: 60, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".homes__track", start: "top 85%" } });
    });
  }

  function processScroll() {
    const imgs = Array.from(document.querySelectorAll(".pv"));
    const steps = Array.from(document.querySelectorAll(".step"));
    const tag = document.getElementById("processTag");
    const setStep = (i) => {
      imgs.forEach((im, k) => im.classList.toggle("is-on", k === i));
      steps.forEach((s, k) => s.classList.toggle("is-on", k === i));
      tag.textContent = steps[i].dataset.week;
    };
    setStep(0);
    steps.forEach((s, i) => {
      ScrollTrigger.create({ trigger: s, start: "top 60%", end: "bottom 60%", onToggle: (self) => self.isActive && setStep(i) });
    });
  }

  function estatesPeek() {
    const peek = document.getElementById("peek");
    if (!peek || window.matchMedia("(hover: none)").matches) return;
    const img = peek.querySelector("img");
    const xTo = gsap.quickTo(peek, "x", { duration: .5, ease: "power3" });
    const yTo = gsap.quickTo(peek, "y", { duration: .5, ease: "power3" });
    window.addEventListener("mousemove", (e) => { xTo(e.clientX + 24); yTo(e.clientY - 100); });
    document.querySelectorAll(".erow[data-img]").forEach((row) => {
      row.addEventListener("mouseenter", () => { img.src = row.dataset.img; gsap.to(peek, { opacity: 1, scale: 1, duration: .4, ease: "power3.out" }); });
      row.addEventListener("mouseleave", () => gsap.to(peek, { opacity: 0, scale: .85, duration: .3 }));
    });
  }

  function navBehaviour() {
    const nav = document.getElementById("nav");
    let last = 0;
    ScrollTrigger.create({
      start: 0, end: "max",
      onUpdate: (self) => {
        const y = self.scroll();
        const heroEnd = document.getElementById("hero").offsetHeight - window.innerHeight;
        const past = y > heroEnd;
        nav.classList.toggle("is-solid", past);
        nav.classList.toggle("is-hidden", past && y > last + 2);
        last = y;
      },
    });
  }

  function fallbackScroll() {
    // No GSAP: keep the hero scrub working with plain scroll events.
    const hero = document.getElementById("hero");
    const onScroll = () => {
      const max = hero.offsetHeight - window.innerHeight;
      render(clamp01(window.scrollY / max));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.getElementById("heroIntro").style.opacity = 1;
  }

  /* ---------------- form ---------------- */
  const form = document.getElementById("form");
  const status = document.getElementById("formStatus");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.elements.name, email = form.elements.email;
    let ok = true;
    [name, email].forEach((f) => { const bad = !f.value.trim() || (f.type === "email" && !/^\S+@\S+\.\S+$/.test(f.value)); f.setAttribute("aria-invalid", bad); if (bad) ok = false; });
    status.classList.remove("ok");
    if (!ok) { status.textContent = "Please add your name and a valid email address so we can reply."; return; }
    status.classList.add("ok");
    status.textContent = `Thanks, ${name.value.trim().split(" ")[0]}. This is a preview, so the request wasn't sent. On the live site it goes straight to the sales team.`;
    form.reset();
  });
})();
