/* Round 3 shared behaviour: floating menu, squeeze carousel, Egypt map with info card, accordion photos,
   scroll-grown photographs, arrivals and the Cairo clock in the footer. */
window.ACTP3 = (function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ARROW = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M8.5 3.5 13 8l-4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  const BACK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M14 8H3M7.5 3.5 3 8l4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';

  // Properties with the places they sit in, for the map and the carousels. Photos are placeholders.
  const P = [
    { id: "sheraton", name: "Sheraton Cairo Hotel & Casino", kind: "Owned", city: "Cairo", code: "CAI", gov: "Cairo", keys: 651, lon: 31.215, lat: 30.04, img: "assets/img3/sheraton-dusk.jpg",
      text: "One of Cairo's most iconic hospitality destinations, with 651 keys, contemporary luxury and premium facilities overlooking the Nile." },
    { id: "sofitel", name: "Sofitel Cairo Downtown Nile", kind: "Partnership", city: "Cairo", code: "CAI", gov: "Cairo", lon: 31.232, lat: 30.048, img: "assets/img3/sofitel.jpg",
      text: "Refined city hospitality on the Nile, extending ACTP's luxury exposure in downtown Cairo." },
    { id: "renaissance", name: "Renaissance Cairo Mirage City", kind: "Partnership", city: "New Cairo", code: "NCA", gov: "Cairo", lon: 31.44, lat: 30.1, img: "assets/img/caibr-pool-0026-hor-wide.webp",
      text: "Premium business and leisure experiences within one of New Cairo's leading destinations." },
    { id: "jw", name: "JW Marriott Cairo", kind: "Partnership", city: "New Cairo", code: "NCA", gov: "Cairo", lon: 31.4, lat: 30.075, img: "assets/img3/jw.jpg",
      text: "Elevated guest experiences and premium resort amenities in New Cairo." },
    { id: "hurghada", name: "Swiss Inn Hurghada", kind: "Owned", city: "Hurghada", code: "HRG", gov: "Red Sea", keys: 401, lon: 33.84, lat: 27.13, img: "assets/img/main-pool.jpg",
      text: "A luxury spa and wellness destination with elevated resort experiences and recreational facilities on the Red Sea." },
    { id: "hcc", name: "Hurghada City Center", kind: "Owned", city: "Hurghada", code: "HRG", gov: "Red Sea", lon: 33.8, lat: 27.26, img: "assets/img3/hcc-front.jpg",
      text: "Within Hurghada's tourism district, supporting ACTP's presence through commercial experiences and strategic location value." },
    { id: "dahab", name: "Swiss Inn Dahab", kind: "Owned", city: "Dahab", code: "DHB", gov: "South Sinai", keys: 150, lon: 34.52, lat: 28.49, img: "assets/img/Dahab.webp",
      text: "A premier Red Sea beachfront resort with water sports and a relaxed setting surrounded by natural coastal beauty." },
    { id: "swissintl", name: "Swiss Inn International Ltd", kind: "Partnership", city: "Regional", code: "SII", gov: null, img: "assets/img/r-b2.jpg",
      text: "Regional hotel management expertise strengthening ACTP's hospitality network." },
  ];
  // One pin per city on the map
  const CITIES = [
    { city: "Cairo", code: "CAI", lon: 31.235, lat: 30.044, dx: -150, dy: -26, ids: ["sheraton", "sofitel"] },
    { city: "New Cairo", code: "NCA", lon: 31.47, lat: 30.03, dx: 120, dy: -60, ids: ["renaissance", "jw"] },
    { city: "Dahab", code: "DHB", lon: 34.51, lat: 28.5, dx: 90, dy: -20, ids: ["dahab"] },
    { city: "Hurghada", code: "HRG", lon: 33.81, lat: 27.2, dx: 110, dy: 30, ids: ["hurghada", "hcc"] },
  ];
  const byId = (id) => P.find((p) => p.id === id);

  /* ---------- Arrivals ---------- */
  function arrivals() {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      (e.target._t || [e.target]).forEach((t) => t.classList.add("in"));
      io.unobserve(e.target);
    }), { threshold: 0.15, rootMargin: "0px 0px -5% 0px" });
    // clipped elements have no visible area, so they are watched through their parent
    document.querySelectorAll("[data-wipe]").forEach((el) => { const h = el.parentElement; (h._t || (h._t = [])).push(el); io.observe(h); });
    document.querySelectorAll("[data-fade], .foot3 .word").forEach((el) => io.observe(el));
  }

  /* ---------- Floating menu ---------- */
  function menu() {
    const m = document.querySelector(".menu3"), b = document.querySelector(".menu-btn");
    if (!m || !b) return;
    // focus moves into the menu only when it was opened from the keyboard (a mouse click reports detail > 0)
    const set = (o, kb) => { m.dataset.open = o; m.setAttribute("aria-hidden", !o); b.setAttribute("aria-expanded", o); if (o && kb) m.querySelector("nav a").focus({ preventScroll: true }); else if (!o) b.focus({ preventScroll: true }); };
    b.onclick = (e) => set(true, e.detail === 0);
    m.querySelector(".close").onclick = () => set(false);
    m.querySelectorAll("nav > a > span, nav .grp > a > span").forEach((s, i) => (s.style.transitionDelay = `${0.25 + i * 0.06}s`));
    m.querySelectorAll("nav a").forEach((a) => a.addEventListener("click", () => set(false)));
    addEventListener("keydown", (e) => { if (e.key === "Escape" && m.dataset.open === "true") set(false); });
  }

  /* ---------- Squeeze carousel ----------
     One wide panel, the next three narrower, the rest thin slats; widths ease over a second.
     Images keep the open panel's width and are cropped, never squashed. */
  function squeeze(root, slides, o = {}) {
    o = Object.assign({ autoplay: true, interval: 6500, label: "Featured", onChange: null, hero: 16 / 9 }, o);
    const n = slides.length, wrap = (i) => ((i % n) + n) % n;
    const slats = Math.max(1, Math.min(3, n - 4)), win = 4 + slats;
    const SH = { rest: [-0.06, 0.61, 0.3, 0.15], hov: [0, 0.71, 0.4, 0.25], other: [-0.12, 0.59, 0.28, 0.13] };
    root.classList.add("sq");
    root.innerHTML = `<div class="bar">${o.head || ""}<span class="count num" aria-hidden="true"></span><div class="arrows"><button type="button" aria-label="Previous">${BACK}</button><button type="button" aria-label="Next">${ARROW}</button></div></div>
      <div class="vp"><div class="row" role="tablist" aria-label="${o.label}"></div></div><div class="prog"><i></i></div><div class="panel" aria-live="polite"></div>`;
    const row = root.querySelector(".row"), panel = root.querySelector(".panel"), count = root.querySelector(".count"), prog = root.querySelector(".prog i");
    root.style.setProperty("--int", o.interval / 1000 + "s");
    panel.innerHTML = slides.map((s) => `<div><p><b>${s.title}</b> ${s.text || ""}</p>${s.action ? `<a class="pill" href="${s.href || "#"}"><span><span class="roll"><span>${s.action}</span><span>${s.action}</span></span></span><b>${ARROW}</b></a>` : ""}</div>`).join("");
    const pans = [...panel.children];
    let items = [], cur = 0, hover = -1, timer = 0, busy = false, inside = false;
    const make = (si) => {
      const s = slides[si], b = document.createElement("button");
      b.type = "button"; b.className = "pn"; b.setAttribute("role", "tab"); b.setAttribute("aria-label", s.title); b.dataset.si = si;
      b.innerHTML = `<img src="${s.img}" alt="" draggable="false" loading="lazy" style="object-position:${s.pos || "50% 50%"}"><span class="ov"><span>${s.mark || ""}</span><span>${s.tag || ""}</span></span>`;
      b.addEventListener("pointermove", () => { const k = items.indexOf(b); if (hover !== k) { hover = k; layout(); } });
      b.addEventListener("click", () => { const k = items.indexOf(b); if (k > 0) go(k, true); });
      return b;
    };
    const geom = () => {
      const W = row.parentElement.clientWidth, H = row.parentElement.clientHeight, cs = getComputedStyle(root);
      const gap = parseFloat(cs.getPropertyValue("--sq-gap")), sg = parseFloat(cs.getPropertyValue("--sq-slat-gap")), sw = parseFloat(cs.getPropertyValue("--sq-slat"));
      const hero = Math.min(H * o.hero, W * 0.62), room = Math.max(0, W - hero - slats * sg - 3 * gap - slats * sw);
      return { hero, room, gap, sg, sw };
    };
    const layout = () => {
      const g = geom(); root.style.setProperty("--sq-hero", g.hero + "px");
      const h = !reduce && hover >= 0 && hover <= 3;
      items.forEach((b, k) => {
        const share = (j) => !h ? SH.rest[j] : hover === j ? SH.hov[j] : SH.other[j];
        const w = k > 3 ? g.sw : k === 0 ? g.hero + g.room * share(0) : g.room * share(k);
        b.style.width = Math.max(g.sw, w) + "px";
        b.style.marginLeft = k === 0 ? "0px" : k < 4 ? g.gap + "px" : g.sg + "px";
        b.setAttribute("aria-selected", k === 0); b.tabIndex = k === 0 ? 0 : -1;
      });
    };
    const mark = () => {
      pans.forEach((p, k) => { p.classList.toggle("on", k === cur); p.setAttribute("aria-hidden", k !== cur); });
      count.textContent = `${String(cur + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;
      if (o.onChange) o.onChange(cur, slides[cur]);
    };
    const restart = () => {
      clearTimeout(timer); prog.classList.remove("run"); void prog.offsetWidth;
      if (!o.autoplay || reduce || inside || document.hidden) return;
      prog.classList.add("run"); timer = setTimeout(() => go(1), o.interval);
    };
    // step forward by d (d > 0) or back (d < 0)
    const go = (d, user) => {
      if (busy || !d) return;
      busy = true; hover = -1;
      const ms = reduce ? 0 : 1000;
      if (d > 0) {
        for (let k = 0; k < d; k++) { const last = +items[items.length - 1].dataset.si, b = make(wrap(last + 1)); b.style.width = "0px"; b.style.marginLeft = "0px"; row.appendChild(b); items.push(b); }
        void row.offsetWidth;
        const leaving = items.splice(0, d);
        leaving.forEach((b) => { b.style.width = "0px"; b.style.marginLeft = "0px"; b.style.opacity = "0"; });
        layout();
        setTimeout(() => { leaving.forEach((b) => b.remove()); items.slice(win).forEach((b) => b.remove()); items = items.slice(0, win); busy = false; }, ms + 30);
      } else {
        for (let k = 0; k < -d; k++) { const first = +items[0].dataset.si, b = make(wrap(first - 1)); b.style.width = "0px"; b.style.marginLeft = "0px"; row.prepend(b); items.unshift(b); }
        void row.offsetWidth;
        layout();
        setTimeout(() => { items.slice(win).forEach((b) => b.remove()); items = items.slice(0, win); busy = false; }, ms + 30);
      }
      cur = wrap(cur + d); mark(); restart();
      if (user === "key") items[0].focus({ preventScroll: true });
    };
    for (let k = 0; k < win; k++) { const b = make(wrap(k)); row.appendChild(b); items.push(b); }
    // first paint without animation
    items.forEach((b) => (b.style.transition = "none")); layout(); void row.offsetWidth; items.forEach((b) => (b.style.transition = ""));
    mark();
    const [prev, next] = root.querySelectorAll(".arrows button");
    prev.onclick = () => go(-1, true); next.onclick = () => go(1, true);
    row.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") { e.preventDefault(); go(1, "key"); } if (e.key === "ArrowLeft") { e.preventDefault(); go(-1, "key"); } });
    row.addEventListener("pointerleave", () => { hover = -1; layout(); });
    root.addEventListener("pointerenter", () => { inside = true; restart(); });
    root.addEventListener("pointerleave", () => { inside = false; restart(); });
    // swipe on touch screens
    let sx = null;
    row.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
    row.addEventListener("touchend", (e) => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1, true); sx = null; });
    new ResizeObserver(() => { items.forEach((b) => (b.style.transition = "none")); layout(); void row.offsetWidth; items.forEach((b) => (b.style.transition = "")); }).observe(row.parentElement);
    new IntersectionObserver(([e]) => { if (e.isIntersecting) restart(); else clearTimeout(timer); }).observe(root);
    document.addEventListener("visibilitychange", restart);
    return { go, get index() { return cur; } };
  }

  /* ---------- Egypt map with pins and the info card ---------- */
  function map(root, o = {}) {
    const E = window.ACTP_EGYPT; if (!E) return;
    o = Object.assign({ light: false, labels: true, card: null, auto: 5200, mosaic: false }, o);
    const pr = (lon, lat) => E.project(lon, lat);
    const owned = new Set(P.filter((p) => p.kind === "Owned" && p.gov).map((p) => p.gov));
    const part = new Set(P.filter((p) => p.kind === "Partnership" && p.gov).map((p) => p.gov));
    const LBL = { "Matrouh": 1, "New Valley": 1, "Red Sea": 1, "South Sinai": 1, "North Sinai": 1, "Aswan": 1, "Minya": 1 };
    const svg = `<svg class="eg" viewBox="-20 -40 ${E.w + 60} ${E.h + 60}" role="img" aria-label="Map of Egypt with ACTP's locations: Cairo, New Cairo, Hurghada and Dahab">
      <g class="govs">${E.gov.map((g) => `<path class="gov${owned.has(g.name) || part.has(g.name) ? " has" : ""}${!owned.has(g.name) && part.has(g.name) ? " part" : ""}" data-g="${g.name}" d="${g.d}"/>`).join("")}</g>
      ${o.labels ? E.gov.filter((g) => LBL[g.name]).map((g) => `<text class="gl" x="${g.cx}" y="${g.cy}">${g.name.toUpperCase()}</text>`).join("") : ""}
      <g class="pins">${CITIES.map((c, i) => { const [x, y] = pr(c.lon, c.lat); const lx = x + c.dx, ly = y + c.dy; return `<g class="pin" data-i="${i}" tabindex="0" role="button" aria-label="${c.city}"><line x1="${x}" y1="${y}" x2="${lx}" y2="${ly}"/><circle class="halo" cx="${x}" cy="${y}" r="6"/><circle class="c" cx="${x}" cy="${y}" r="6"/><text x="${lx + (c.dx < 0 ? -6 : 6)}" y="${ly + 4}" text-anchor="${c.dx < 0 ? "end" : "start"}">${c.city}</text></g>`; }).join("")}</g></svg>`;
    root.classList.add("map3"); if (o.light) root.classList.add("light");
    root.insertAdjacentHTML("afterbegin", svg);
    const pins = [...root.querySelectorAll(".pin")], govs = [...root.querySelectorAll(".gov")];
    const card = o.card;
    let cur = -1, sub = 0, timer;
    const fill = (c, p) => {
      if (!card) return;
      card.classList.add("out");
      setTimeout(() => {
        card.querySelector(".ph img").src = p.img; card.querySelector(".ph img").alt = p.name;
        card.querySelector("h3").textContent = p.name;
        card.querySelector("p").textContent = c.city + (p.keys ? ` · ${p.keys} keys` : "");
        const st = card.querySelector(".st");
        st.innerHTML = `${p.kind === "Owned" ? "Wholly owned" : "Strategic partnership"}<b>${p.kind === "Owned" ? "ACTP owns this asset." : "ACTP invests alongside."}</b>`;
        st.style.background = p.kind === "Owned" ? "var(--sandy)" : "var(--royal)"; st.style.color = p.kind === "Owned" ? "var(--ink)" : "var(--white)";
        const cd = card.querySelector(".code"); cd.textContent = c.code;
        cd.style.background = p.kind === "Owned" ? "var(--mellow)" : "var(--teal)"; cd.style.color = p.kind === "Owned" ? "var(--ink)" : "var(--off-white)";
        card.classList.remove("out");
      }, card.dataset.ready ? 260 : 0);
      card.dataset.ready = 1;
    };
    const show = (i, j = 0) => {
      const c = CITIES[i], p = byId(c.ids[j % c.ids.length]);
      cur = i; sub = j;
      pins.forEach((el, k) => el.classList.toggle("on", k === i));
      govs.forEach((g) => g.classList.toggle("on", g.dataset.g === p.gov));
      fill(c, p);
      if (o.onShow) o.onShow(c, p);
    };
    const cycle = () => {
      clearTimeout(timer); if (reduce || !o.auto) return;
      timer = setTimeout(() => {
        const c = CITIES[cur]; if (sub + 1 < c.ids.length) show(cur, sub + 1); else show((cur + 1) % CITIES.length, 0);
        cycle();
      }, o.auto);
    };
    pins.forEach((el, i) => {
      const act = () => { if (cur === i) show(i, sub + 1); else show(i, 0); cycle(); };
      el.addEventListener("click", act);
      el.addEventListener("pointerenter", () => { if (cur !== i) { show(i, 0); cycle(); } });
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); } });
    });
    show(0, 0);
    new IntersectionObserver(([e]) => { if (e.isIntersecting) cycle(); else clearTimeout(timer); }).observe(root);
    return { show, svg: root.querySelector("svg") };
  }

  // Egypt drawn as a grey source for the mosaic: assets darkest, Nile governorates mid, desert light, sea empty.
  // Drawn in the same frame as the map's SVG viewBox, so pins line up over the mosaic.
  function egyptCanvas(w = 1000) {
    const E = window.ACTP_EGYPT, VW = E.w + 60, VH = E.h + 60, s = w / VW, h = Math.round(VH * s);
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const x = c.getContext("2d"); x.scale(s, s); x.translate(20, 40);
    const nile = new Set(["Cairo", "Giza", "Qalyubia", "Monufia", "Gharbiyya", "Dakahlia", "Al Sharqia", "Kafr el-Sheikh", "Beheira", "Damietta", "Faiyum", "Beni Suef", "Minya", "Asyut", "Sohag", "Qena", "Luxor", "Alexandria", "Ismailia", "Port Said", "Suez"]);
    E.gov.forEach((g) => { x.fillStyle = nile.has(g.name) ? "#6a6a6a" : "#b4b4b4"; x.fill(new Path2D(g.d)); });
    // each city ACTP holds assets in becomes a dark cluster, kept inside the land
    x.globalCompositeOperation = "source-atop"; x.fillStyle = "#262626";
    CITIES.forEach((ct) => { const [px, py] = E.project(ct.lon, ct.lat); x.beginPath(); x.arc(px, py, ct.city === "New Cairo" ? 26 : 30, 0, Math.PI * 2); x.fill(); });
    x.globalCompositeOperation = "source-over";
    return c;
  }

  /* ---------- Accordion: one open at a time, a photo per item ---------- */
  function accordion(root, imgWrap) {
    const ds = [...root.querySelectorAll("details")], imgs = imgWrap ? [...imgWrap.querySelectorAll("img")] : [];
    ds.forEach((d, i) => d.addEventListener("toggle", () => {
      if (!d.open) { if (!ds.some((x) => x.open)) d.open = true; return; }
      ds.forEach((x) => { if (x !== d) x.open = false; });
      imgs.forEach((im, k) => im.classList.toggle("on", k === i));
    }));
  }

  /* ---------- Photograph that grows from an inset card to full bleed as you scroll ---------- */
  function grow(sec) {
    const fr = sec.querySelector(".frame");
    const tick = () => {
      const r = sec.getBoundingClientRect(), tot = r.height - innerHeight;
      const k = reduce ? 1 : Math.min(1, Math.max(0, -r.top / (tot * 0.75)));
      const e = 1 - Math.pow(1 - k, 3);
      fr.style.setProperty("--gy", `${(1 - e) * 16}%`); fr.style.setProperty("--gx", `${(1 - e) * (innerWidth < 900 ? 6 : 24)}%`);
      fr.style.setProperty("--gr", `${(1 - e) * 10 + 0}px`); fr.style.setProperty("--gs", 1.15 - e * 0.15);
      sec.style.setProperty("--go", Math.max(0, (k - 0.55) / 0.35));
      fr.parentElement.querySelector(".over") && fr.parentElement.querySelector(".over").style.setProperty("opacity", Math.min(1, Math.max(0, (k - 0.55) / 0.35)));
    };
    addEventListener("scroll", tick, { passive: true }); addEventListener("resize", tick); tick();
  }

  /* ---------- Footer clock, Cairo time ---------- */
  function clock() {
    const els = document.querySelectorAll(".clock"); if (!els.length) return;
    const f = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    const t = () => els.forEach((e) => (e.textContent = "Cairo " + f.format(new Date())));
    t(); setInterval(t, 1000);
  }

  /* ---------- Footer: the name in the mark, parting under the pointer ---------- */
  async function footerLetters(canvas, box, src = "assets/img3/sheraton-dusk.jpg") {
    if (!canvas || !window.ACTP) return;
    await document.fonts.load('700 100px "Biolinum"');
    const m = new window.ACTP.Mosaic(canvas, {
      cell: (w) => Math.max(7, Math.round(w / 140)), fg: "#fecb93", bg: "#16203a", invert: true, photo: false, highlight: 1.01,
      interact: "swell", radius: .12, hot: "#ece9de", idle: true, pointerTarget: box,
      mask: (ctx, cols, rows) => {
        ctx.textBaseline = "alphabetic"; ctx.fillStyle = "#fff"; ctx.font = "700 100px Biolinum";
        const k = Math.min(rows * 1.3, 100 * cols * .985 / ctx.measureText("ACTP").width); ctx.font = `700 ${k}px Biolinum`;
        ctx.fillText("ACTP", (cols - ctx.measureText("ACTP").width) / 2, rows * .97);
      },
    });
    await m.setSource(src);
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { m.to(.5, reduce ? 0 : 2000); o.disconnect(); } }).observe(box);
    return m;
  }

  /* ---------- Illustration drawn by the tool's rule: a clip-art image turned into the four shapes ---------- */
  // The source is fitted inside the frame with a margin (never cropped), on white, as the tool's output sits on a page.
  function art(canvas, src, o = {}) {
    const pad = o.pad ?? .08;
    const m = new window.ACTP.Mosaic(canvas, Object.assign({
      cell: (w) => Math.max(6, Math.round(w / 70)), fg: "#3e67b1", bg: null, photo: false, highlight: .9, contrast: .25,
    }, o));
    const fit = async () => {
      const r = canvas.getBoundingClientRect(); if (!r.width) return null;
      const img = await window.ACTP.loadImage((window.ACTP_SAMPLES && window.ACTP_SAMPLES[src]) || src);
      const W = 900, H = Math.round(W * r.height / r.width), c = document.createElement("canvas"); c.width = W; c.height = H;
      const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, W, H);
      const iw = img.naturalWidth, ih = img.naturalHeight, s = Math.min(W * (1 - 2 * pad) / iw, H * (1 - 2 * pad) / ih);
      x.drawImage(img, (W - iw * s) * (o.alignX ?? .5), (H - ih * s) * (o.alignY ?? .5), iw * s, ih * s);
      return c;
    };
    let lastW = 0;
    const load = async (keep) => { const c = await fit(); if (c) { lastW = canvas.getBoundingClientRect().width; await m.setSource(c, keep); if (keep) m.setProgress(m.progress); } };
    load(false).then(() => new IntersectionObserver(([e], ob) => { if (e.isIntersecting) { m.to(.5, reduce ? 0 : 1800); ob.disconnect(); } }, { threshold: .2 }).observe(canvas));
    let t; addEventListener("resize", () => { clearTimeout(t); t = setTimeout(() => { if (Math.abs(canvas.getBoundingClientRect().width - lastW) > 40) load(true); }, 250); });
    return m;
  }

  // Header titles set in one line: shrink to fit the width (long names like LEADERSHIP on a phone)
  function fit() {
    document.querySelectorAll("[data-fit]").forEach((el) => {
      el.style.fontSize = "";
      const max = parseFloat(getComputedStyle(el).fontSize), w = el.clientWidth;
      if (el.scrollWidth > w) el.style.fontSize = Math.floor(max * w / el.scrollWidth * .98) + "px";
    });
  }
  // The menu marks the page you are on
  function current() {
    const here = (location.pathname.split("/").pop() || "index.html");
    document.querySelectorAll(".menu3 nav a").forEach((a) => { const h = a.getAttribute("href") || ""; if (h === here) a.setAttribute("aria-current", "page"); });
  }

  function init() { arrivals(); menu(); clock(); current(); fit(); addEventListener("resize", fit); document.fonts && document.fonts.ready.then(fit); document.querySelectorAll(".grow").forEach(grow); }
  return { P, CITIES, byId, squeeze, map, egyptCanvas, accordion, grow, init, footerLetters, art, ARROW, reduce };
})();
