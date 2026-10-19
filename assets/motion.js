/* ACTP motion layer. Wires itself to data attributes:
 *   data-split        headline words rise and sharpen in, one after another
 *   data-reveal       picture wipes in and settles from a slight zoom
 *   data-count        number counts up from zero when it arrives
 *   data-magnetic     button leans toward the pointer
 *   data-speed="0.1"  gentle parallax
 *   data-cursor="Move" cursor becomes a labelled disc over this element
 *   data-marquee      filled with the portfolio names, scroll-speed aware
 * Plus a preloader built from the mark's four shapes and smooth scrolling (Lenis, when it loads).
 */
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const shapes = window.ACTP ? window.ACTP.SHAPES.map((s) => window.ACTP.shapeSVG(s)) : [];

  // ---- Preloader ----
  if (!reduce && shapes.length) {
    const pre = document.createElement("div");
    pre.className = "preload"; pre.setAttribute("aria-hidden", "true");
    pre.innerHTML = `<div class="marks">${shapes.map((s) => `<span>${s}</span>`).join("")}</div>`;
    document.body.appendChild(pre);
    const lift = () => setTimeout(() => { pre.classList.add("done"); setTimeout(() => pre.remove(), 1000); }, 650);
    if (document.readyState === "complete") lift(); else addEventListener("load", lift);
    setTimeout(lift, 3500); // never hold the page hostage
  }

  // ---- Smooth scroll ----
  let lenis = null;
  if (!reduce && !navigator.webdriver) {
    const s = document.createElement("script");
    s.src = "https://unpkg.com/lenis@1.1.13/dist/lenis.min.js";
    s.onload = () => {
      if (!window.Lenis) return;
      lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
      document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
        const id = a.getAttribute("href"); if (id.length < 2) return;
        const t = document.querySelector(id); if (!t) return;
        e.preventDefault(); lenis.scrollTo(t, { offset: 0 });
      }));
    };
    document.head.appendChild(s);
  }

  // ---- Split headlines into words ----
  document.querySelectorAll("[data-split]").forEach((el) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement("span"); w.className = "w";
            const inner = document.createElement("span"); inner.textContent = part; inner.style.setProperty("--i", i++);
            w.appendChild(inner); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
      });
    };
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    walk(el);
    el.querySelectorAll(".w").forEach((w) => w.setAttribute("aria-hidden", "true"));
  });

  // ---- Count up ----
  const runCount = (el) => {
    const raw = el.dataset.countText || el.textContent;
    el.dataset.countText = raw;
    const m = raw.match(/[\d,.]+/); if (!m) return;
    const target = parseFloat(m[0].replace(/,/g, "")), dec = (m[0].split(".")[1] || "").length, comma = m[0].includes(",");
    const fmt = (v) => { let s = v.toFixed(dec); if (comma) s = Number(s).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }); return raw.replace(m[0], s); };
    if (reduce || target === 1990) { el.textContent = raw; return; }
    const t0 = performance.now(), dur = 1600;
    const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4); el.textContent = fmt(target * e); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };

  // ---- One observer for every arrival ----
  // A clipped element has no visible area, so reveals are watched through a stand-in: the parent.
  const proxy = new Map();
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const targets = proxy.get(e.target) || [e.target];
    targets.forEach((t) => { t.classList.add("in"); if (t.hasAttribute("data-count")) runCount(t); });
    io.unobserve(e.target);
  }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  document.querySelectorAll("[data-split], [data-count]").forEach((el) => io.observe(el));
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    const host = el.parentElement || el;
    if (!proxy.has(host)) proxy.set(host, []);
    proxy.get(host).push(el); io.observe(host);
  });

  // ---- Magnetic buttons ----
  if (fine && !reduce) document.querySelectorAll("[data-magnetic]").forEach((b) => {
    b.addEventListener("pointermove", (e) => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.32}px)`;
    });
    b.addEventListener("pointerleave", () => { b.style.transform = ""; });
  });

  // ---- Cursor ----
  if (fine && !reduce) {
    const c = document.createElement("div"); c.className = "cursor"; c.innerHTML = "<span></span>"; c.setAttribute("aria-hidden", "true");
    document.body.appendChild(c);
    let x = -100, y = -100, tx = -100, ty = -100;
    const state = (target) => {
      if (!target || !target.closest) return;
      const lab = target.closest("[data-cursor]");
      const link = target.closest("a, button, input, summary, label");
      c.classList.toggle("big", !!lab && !link);
      c.classList.toggle("link", !!link);
      if (lab) c.firstChild.textContent = lab.dataset.cursor;
    };
    addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; state(e.target); }, { passive: true });
    addEventListener("scroll", () => { if (tx > 0) state(document.elementFromPoint(tx, ty)); }, { passive: true });
    document.addEventListener("pointerleave", () => { tx = ty = -100; });
    const loop = () => { x += (tx - x) * 0.2; y += (ty - y) * 0.2; c.style.transform = `translate(${x}px, ${y}px)`; requestAnimationFrame(loop); };
    loop();
  }

  // ---- Marquee ----
  const props = (window.ACTP_DATA && window.ACTP_DATA.properties) || [];
  document.querySelectorAll("[data-marquee]").forEach((m) => {
    const items = props.map((p, i) => `<span class="item">${p.short}${shapes[i % 4] || ""}</span>`).join("");
    m.setAttribute("aria-label", "Portfolio: " + props.map((p) => p.name).join(", "));
    m.innerHTML = `<div class="track" aria-hidden="true">${items}</div><div class="track" aria-hidden="true">${items}</div>`;
    if (reduce) return;
    const tracks = m.querySelectorAll(".track");
    let off = 0, last = scrollY, vel = 0;
    const loop = () => {
      const w = tracks[0].offsetWidth || 1;
      const d = scrollY - last; last = scrollY;
      vel += (Math.abs(d) * 0.35 - vel) * 0.08;
      off = (off + 0.6 + vel) % w;
      tracks.forEach((t) => (t.style.transform = `translateX(${-off}px)`));
      requestAnimationFrame(loop);
    };
    loop();
  });

  // ---- Parallax ----
  const par = [...document.querySelectorAll("[data-speed]")];
  if (par.length && !reduce) {
    const tick = () => {
      par.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        const mid = r.top + r.height / 2 - innerHeight / 2;
        el.style.transform = `translateY(${mid * -parseFloat(el.dataset.speed)}px)`;
      });
      requestAnimationFrame(tick);
    };
    tick();
  }
})();
