/*
 * ACTP mosaic engine.
 * A browser port of the ACTP Shape-Mapper rule: every grid cell's luminance
 * (Y = .299R + .587G + .114B) is binned darkest-first into the logo's four
 * shapes (square, circle, diamond, four-point star). Cells at or above the
 * highlight cutoff stay blank, as in the tool.
 *
 * `progress` drives the brand story, Investment + Destinations -> Transformation -> Landmark:
 *   0      nothing drawn
 *   0..0.5 the logo shapes assemble, cell by cell
 *   0.5..1 the photograph arrives underneath and the shapes give way to it
 */
(function () {
  const SVG = {
    astroid: { vb: 360.2189632, d: "M178.7068973,356.3209468l1.8353925,3.9027805,1.8213168-3.9121643c35.744209-76.8244606,97.3031588-138.6862895,173.9573401-174.7993527l3.8980165-1.8402287-3.9075446-1.8165528C279.4822661,142.1112198,217.6205816,80.5570341,181.5120659,3.8980165l-1.8401565-3.8980165-1.8213168,3.9121643C142.1063835,80.7367693,80.5521978,142.5936897,3.8980165,178.7068973l-3.8980165,1.8402287,3.9074724,1.8165528c76.8292247,35.744209,138.6862173,97.3031588,174.7994249,173.957268Z" },
  };
  const SHAPES = ["square", "circle", "diamond", "astroid"]; // darkest -> lightest, as in the tool

  function drawShape(ctx, kind, size) {
    const s = size, h = s / 2;
    ctx.beginPath();
    if (kind === "square") ctx.rect(-h, -h, s, s);
    else if (kind === "circle") ctx.arc(0, 0, h, 0, Math.PI * 2);
    else if (kind === "diamond") { ctx.moveTo(0, -h); ctx.lineTo(h, 0); ctx.lineTo(0, h); ctx.lineTo(-h, 0); ctx.closePath(); }
    else {
      const p = new Path2D(SVG.astroid.d);
      ctx.save(); ctx.scale(s / SVG.astroid.vb, s / SVG.astroid.vb); ctx.translate(-SVG.astroid.vb / 2, -SVG.astroid.vb / 2);
      ctx.fill(p); ctx.restore(); return;
    }
    ctx.fill();
  }

  // Exposed so pages can draw single logo shapes (legends, bullets, markers).
  function shapeSVG(kind, color) {
    const fill = color || "currentColor";
    if (kind === "square") return `<svg viewBox="0 0 10 10" aria-hidden="true"><rect x="0.6" y="0.6" width="8.8" height="8.8" fill="${fill}"/></svg>`;
    if (kind === "circle") return `<svg viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="4.4" fill="${fill}"/></svg>`;
    if (kind === "diamond") return `<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M5 .6 9.4 5 5 9.4 .6 5Z" fill="${fill}"/></svg>`;
    return `<svg viewBox="0 0 ${SVG.astroid.vb} ${SVG.astroid.vb}" aria-hidden="true"><path d="${SVG.astroid.d}" fill="${fill}"/></svg>`;
  }

  const imageCache = new Map();
  function loadImage(src) {
    if (src instanceof HTMLCanvasElement || src instanceof HTMLImageElement) return Promise.resolve(src);
    if (!imageCache.has(src)) {
      imageCache.set(src, new Promise((res, rej) => { const i = new Image(); i.decoding = "async"; i.onload = () => res(i); i.onerror = rej; i.src = src; }));
    }
    return imageCache.get(src);
  }

  function coverRect(iw, ih, w, h, px, py) {
    const s = Math.max(w / iw, h / ih), dw = iw * s, dh = ih * s;
    return { x: (w - dw) * px, y: (h - dh) * py, w: dw, h: dh };
  }

  class Mosaic {
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.o = Object.assign({
        src: null, cell: 14, fg: "#293959", bg: null, photo: true,
        posX: 0.5, posY: 0.5, highlight: 0.85, contrast: 0.15, brightness: 0,
        equalize: true, scale: 0.88, jitter: 0, mask: null, invert: false,
        interact: null,      // "lens" (pointer reveals the other state) or "swell" (shapes grow and part around the pointer)
        radius: 0.16,        // pointer reach, as a share of the canvas's longer side
        pointerTarget: null, // element that listens for the pointer (defaults to the canvas's parent)
        hot: null,           // colour shapes take near the pointer ("swell" only)
        idle: false,         // a slow wave runs through the shapes while the canvas is on screen
      }, opts);
      this.progress = 0;
      this.ready = false;
      (window.__mosaics || (window.__mosaics = [])).push(this); // handle for testing
      this._ro = new ResizeObserver(() => this.layout());
      this._ro.observe(canvas);
      if (this.o.src) this.setSource(this.o.src);
      if (this.o.interact) this._bindPointer();
      if (this.o.idle && !matchMedia("(prefers-reduced-motion: reduce)").matches) this._idle();
    }

    _idle() {
      let on = false;
      new IntersectionObserver(([e]) => { on = e.isIntersecting; if (on) loop(); }).observe(this.canvas);
      const loop = () => {
        if (!on) return;
        this._t = performance.now() / 1000;
        if (!this._ploop) this.draw();
        requestAnimationFrame(loop);
      };
    }

    _bindPointer() {
      const el = this.o.pointerTarget || this.canvas.parentElement;
      this.ptr = { x: -9999, y: -9999, tx: -9999, ty: -9999, hover: 0, target: 0 };
      const move = (e) => {
        const r = this.canvas.getBoundingClientRect();
        this.ptr.tx = e.clientX - r.left; this.ptr.ty = e.clientY - r.top;
        if (this.ptr.target === 0) { this.ptr.x = this.ptr.tx; this.ptr.y = this.ptr.ty; }
        this.ptr.target = 1;
        if (this.o.interact === "paint") this.paintAt(this.ptr.tx, this.ptr.ty); else this._kick();
      };
      el.addEventListener("pointermove", move, { passive: true });
      el.addEventListener("pointerdown", move, { passive: true });
      el.addEventListener("pointerleave", () => { this.ptr.target = 0; this._kick(); });
    }

    // Paint-to-reveal: cells near (x, y) turn into the photograph, then slowly re-form into the mark.
    paintAt(x, y, radius) {
      const g = this.grid; if (!g) return;
      if (!this.reveal || this.reveal.length !== g.cols * g.rows) this.reveal = new Float32Array(g.cols * g.rows);
      const R = radius || Math.max(this.w, this.h) * this.o.radius, cell = this.cellPx;
      const c0 = Math.max(0, Math.floor((x - R) / cell)), c1 = Math.min(g.cols - 1, Math.ceil((x + R) / cell));
      const r0 = Math.max(0, Math.floor((y - R) / cell)), r1 = Math.min(g.rows - 1, Math.ceil((y + R) / cell));
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const d = Math.hypot(c * cell + cell / 2 - x, r * cell + cell / 2 - y);
        if (d < R) { const i = r * g.cols + c; this.reveal[i] = Math.max(this.reveal[i], smooth(1 - d / R) * 1.4); }
      }
      if (!this._paintLoop) {
        const step = () => {
          let any = false;
          for (let i = 0; i < this.reveal.length; i++) { if (this.reveal[i] > 0.002) { this.reveal[i] *= 0.982; any = true; } else this.reveal[i] = 0; }
          this.draw();
          this._paintLoop = any ? requestAnimationFrame(step) : 0;
        };
        this._paintLoop = requestAnimationFrame(step);
      }
    }

    // Slide change: the shapes dissolve along the sweep, the next image's shapes form.
    async swap(src, opts = {}) {
      const rest = opts.rest ?? 0.5;
      if (opts.posX != null) this.o.posX = opts.posX;
      if (opts.posY != null) this.o.posY = opts.posY;
      await this.to(0, opts.out ?? 650);
      await this.setSource(src, true);
      await this.to(rest, opts.in ?? 1100);
    }

    _kick() {
      if (this._ploop) return;
      const step = () => {
        const q = this.ptr;
        q.x += (q.tx - q.x) * 0.22; q.y += (q.ty - q.y) * 0.22;
        q.hover += (q.target - q.hover) * 0.12;
        this.draw();
        const moving = Math.abs(q.tx - q.x) > 0.5 || Math.abs(q.ty - q.y) > 0.5 || Math.abs(q.target - q.hover) > 0.005;
        if (moving) this._ploop = requestAnimationFrame(step); else { q.hover = q.target; this.draw(); this._ploop = 0; }
      };
      this._ploop = requestAnimationFrame(step);
    }

    async setSource(src, keepProgress) {
      // Tones are read from an embedded small copy when one exists, so the page also works when opened
      // straight from disk (file://), where browsers refuse to let a canvas read pixels of local files.
      const small = typeof src === "string" && window.ACTP_SAMPLES && window.ACTP_SAMPLES[src];
      const [img, sm] = await Promise.all([loadImage(src), small ? loadImage(small) : null]);
      this.img = img; this.sampleImg = sm || img;
      this.ready = true;
      this.layout();
      if (!keepProgress) this.draw();
    }

    layout() {
      const r = this.canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = r.width; this.h = r.height; this.dpr = dpr;
      this.canvas.width = Math.round(r.width * dpr);
      this.canvas.height = Math.round(r.height * dpr);
      if (this.img) this.sample();
      this.draw();
    }

    // Downsample the source to one pixel per cell, then bin luminance into shapes.
    sample() {
      const cell = typeof this.o.cell === "function" ? this.o.cell(this.w) : this.o.cell;
      this.cellPx = cell;
      const cols = Math.ceil(this.w / cell), rows = Math.ceil(this.h / cell);
      const off = document.createElement("canvas");
      off.width = cols; off.height = rows;
      const octx = off.getContext("2d", { willReadFrequently: true });
      const si = this.sampleImg || this.img;
      const iw = this.img.naturalWidth || this.img.width, ih = this.img.naturalHeight || this.img.height;
      const cr = coverRect(si.naturalWidth || si.width, si.naturalHeight || si.height, cols, rows, this.o.posX, this.o.posY);
      octx.drawImage(si, cr.x, cr.y, cr.w, cr.h);
      let data;
      try { data = octx.getImageData(0, 0, cols, rows).data; }
      catch (e) { // pixels unreadable: fall back to an even field of the mark so nothing is left blank
        console.warn("ACTP mosaic: could not read image pixels", e);
        data = new Uint8ClampedArray(cols * rows * 4).map((_, j) => (j % 4 === 3 ? 255 : 90 + ((j * 37) % 120)));
      }
      const n = cols * rows, lum = new Float32Array(n), rgb = new Uint8ClampedArray(n * 3), alpha = new Float32Array(n);
      const c = 1 + this.o.contrast, b = this.o.brightness;
      for (let i = 0; i < n; i++) {
        const R = data[i * 4], G = data[i * 4 + 1], B = data[i * 4 + 2];
        rgb[i * 3] = R; rgb[i * 3 + 1] = G; rgb[i * 3 + 2] = B; alpha[i] = data[i * 4 + 3] / 255;
        let y = (0.299 * R + 0.587 * G + 0.114 * B) / 255;
        if (this.o.invert) y = 1 - y; // light ink on a dark ground: bright tones carry the big shapes
        lum[i] = Math.min(1, Math.max(0, (y - 0.5) * c + 0.5 + b));
      }
      // Thresholds: equal luminance mass per shape (the tool's "equalize histogram"), or equal width.
      let th;
      const hl = this.o.highlight;
      if (this.o.equalize) {
        const vals = Array.from(lum).filter((v, i) => v < hl && alpha[i] > 0.5).sort((a, z) => a - z);
        th = vals.length > 8 ? [vals[Math.floor(vals.length * 0.25)], vals[Math.floor(vals.length * 0.5)], vals[Math.floor(vals.length * 0.75)], hl] : [hl * .25, hl * .5, hl * .75, hl];
      } else th = [hl * 0.25, hl * 0.5, hl * 0.75, hl];
      const bin = new Int8Array(n), seed = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        let k = 0; while (k < 4 && lum[i] >= th[k]) k++;
        bin[i] = alpha[i] < 0.5 ? -1 : (k >= 4 ? -1 : k);
        const x = i % cols, yy = (i / cols) | 0;
        // Stagger: a sweep plus noise, so the assembly reads as a wave, not static.
        const sweep = this.o.sweep === "radial"
          ? Math.hypot(x / cols - 0.5, yy / rows - 0.5) * 1.3
          : (x / cols) * 0.7 + (yy / rows) * 0.3;
        seed[i] = Math.min(1, sweep * 0.75 + Math.random() * 0.25);
      }
      // Optional mask (for example, letters): cells outside it stay empty.
      if (typeof this.o.mask === "function") {
        const m = document.createElement("canvas"); m.width = cols; m.height = rows;
        const mctx = m.getContext("2d", { willReadFrequently: true });
        this.o.mask(mctx, cols, rows, cell);
        const md = mctx.getImageData(0, 0, cols, rows).data;
        for (let i = 0; i < n; i++) if (md[i * 4 + 3] < 128) bin[i] = -1;
      }
      this.grid = { cols, rows, bin, seed, rgb };
      this.cover = coverRect(iw, ih, this.w, this.h, this.o.posX, this.o.posY);
    }

    setProgress(p) { this.progress = Math.max(0, Math.min(1, p)); this.draw(); }

    draw() {
      const g = this.grid;
      if (!g || !this.w) return;
      const q = this.ptr, live = q && q.hover > 0.01;
      const R = Math.max(this.w, this.h) * this.o.radius * (live ? q.hover : 0);
      this._render(this.progress, live && this.o.interact === "swell" ? { x: q.x, y: q.y, R } : null);
      if (live && this.o.interact === "lens" && R > 2) {
        // Inside the lens the image shows its other state: shapes over a photograph, the photograph under shapes.
        const ctx = this.ctx;
        ctx.save(); ctx.beginPath(); ctx.arc(q.x, q.y, R, 0, Math.PI * 2); ctx.clip();
        this._render(this.progress >= 0.75 ? 0.5 : 1, { x: q.x, y: q.y, R, lens: true }, true);
        ctx.restore();
        ctx.save(); ctx.beginPath(); ctx.arc(q.x, q.y, R, 0, Math.PI * 2);
        ctx.lineWidth = 2; ctx.strokeStyle = typeof this.o.fg === "string" && this.o.fg !== "source" ? this.o.fg : "#fecb93";
        ctx.globalAlpha = 0.9 * q.hover; ctx.stroke(); ctx.restore();
      }
    }

    _render(p, ptr, inLens) {
      const ctx = this.ctx, g = this.grid, { dpr, w, h } = this;
      if (!inLens) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (this.o.bg) { ctx.fillStyle = this.o.bg; ctx.fillRect(0, 0, w, h); }
      const paint = this.o.interact === "paint" && !inLens;
      const photoA = paint ? 1 : this.o.photo ? smooth((p - 0.5) / 0.5) : 0;
      if (photoA > 0) {
        ctx.globalAlpha = photoA;
        ctx.drawImage(this.img, this.cover.x, this.cover.y, this.cover.w, this.cover.h);
        ctx.globalAlpha = 1;
      }
      const cell = this.cellPx, base = cell * this.o.scale;
      const fg = this.o.fg, rv = paint ? this.reveal : null;
      if (paint) {
        // Cover the photograph cell by cell; painted cells shrink their cover and let it through.
        ctx.fillStyle = this.o.bg || "#293959";
        for (let i = 0, n = g.cols * g.rows; i < n; i++) {
          const open = rv ? Math.min(1, rv[i]) : 0;
          const inT = smooth((p * 2 - g.seed[i] * 0.8) / 0.2);   // during load the photo shows through until shapes form
          const cover = Math.min(1, inT) * (1 - open);
          if (cover <= 0.01) continue;
          const sz = (cell + 0.6) * cover, cx = (i % g.cols) * cell + cell / 2, cy = ((i / g.cols) | 0) * cell + cell / 2;
          ctx.fillRect(cx - sz / 2, cy - sz / 2, sz, sz);
        }
      }
      for (let i = 0, n = g.cols * g.rows; i < n; i++) {
        const k = g.bin[i];
        if (k < 0) continue;
        const s = inLens ? 0 : g.seed[i];
        // assemble: 0..0.5 ; give way: 0.5..1 (each cell on its own clock)
        const inT = smooth((p * 2 - s * 0.8) / 0.2);
        const outT = this.o.photo ? smooth(((p - 0.5) * 2 - s * 0.8) / 0.2) : 0;
        let sc = paint ? inT * (1 - Math.min(1, rv ? rv[i] : 0)) : inT * (1 - outT);
        if (sc <= 0.02) continue;
        let x = (i % g.cols) * cell + cell / 2, y = ((i / g.cols) | 0) * cell + cell / 2, kk = k, hot = false;
        if (this._t && !inLens) sc *= 0.8 + 0.2 * Math.sin(this._t * 1.6 - x * 0.012 + y * 0.008);
        if (ptr && ptr.R > 0) {
          const dx = x - ptr.x, dy = y - ptr.y, d = Math.hypot(dx, dy);
          if (ptr.lens) sc *= 1.1;
          else if (d < ptr.R) {
            const f = smooth(1 - d / ptr.R);
            kk = (k + Math.round(f * 3)) % 4;                    // shapes turn into their neighbours in the mark
            if (this.o.hot && f > 0.35) hot = true;
            sc *= 1 + f * 0.7;                                   // shapes swell toward the pointer
            const push = f * cell * 3.4 / (d || 1);              // and part around it
            x += dx * push; y += dy * push;
          }
        }
        ctx.fillStyle = hot ? this.o.hot : fg === "source" ? `rgb(${g.rgb[i * 3]},${g.rgb[i * 3 + 1]},${g.rgb[i * 3 + 2]})` : (Array.isArray(fg) ? fg[k] : fg);
        ctx.save(); ctx.translate(x, y);
        drawShape(ctx, SHAPES[kk], base * sc);
        ctx.restore();
      }
    }

    // Animate progress to a target over `ms`.
    to(target, ms = 1800) {
      cancelAnimationFrame(this._raf);
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) { this.setProgress(target); return Promise.resolve(); }
      const from = this.progress, t0 = performance.now();
      return new Promise((res) => {
        const step = (t) => {
          const k = Math.min(1, (t - t0) / ms);
          this.setProgress(from + (target - from) * easeInOut(k));
          if (k < 1) this._raf = requestAnimationFrame(step); else res();
        };
        this._raf = requestAnimationFrame(step);
      });
    }
  }

  function smooth(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  /*
   * Egypt as a source image for the mosaic: land in mid tones, the Nile and
   * its delta dark, the sea blank. Coordinates are lon/lat, simplified.
   */
  const EGYPT = [[25.0, 31.6], [27.3, 31.35], [29.0, 30.85], [29.9, 31.2], [30.6, 31.5], [31.8, 31.55], [32.3, 31.27], [34.22, 31.32], [34.9, 29.5], [34.25, 27.75], [33.6, 28.25], [33.1, 29.0], [32.55, 29.95], [32.65, 29.1], [33.1, 28.35], [33.8, 27.25], [33.95, 26.75], [34.3, 26.1], [34.9, 25.07], [35.5, 23.9], [36.9, 22.0], [31.4, 22.0], [25.0, 22.0]];
  const NILE = [[31.4, 22.0], [31.9, 22.6], [32.9, 24.1], [32.85, 25.0], [32.65, 25.7], [32.7, 26.15], [31.85, 26.6], [31.2, 27.2], [30.75, 28.1], [31.1, 29.1], [31.24, 30.05]];
  const DELTA = [[31.24, 30.05], [29.95, 31.25], [31.85, 31.55]];
  const BOUNDS = { minLon: 24.6, maxLon: 37.2, minLat: 21.6, maxLat: 31.9 };
  function project(lon, lat, w, h, b = BOUNDS) {
    return [((lon - b.minLon) / (b.maxLon - b.minLon)) * w, ((b.maxLat - lat) / (b.maxLat - b.minLat)) * h];
  }
  function egyptSource(w = 900, h = 740, b = BOUNDS) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const x = c.getContext("2d");
    const path = (pts) => { x.beginPath(); pts.forEach(([lo, la], i) => { const [px, py] = project(lo, la, w, h, b); i ? x.lineTo(px, py) : x.moveTo(px, py); }); };
    // Four tones, one per shape: desert (lightest), coast, the Nile valley, the river itself (darkest).
    path(EGYPT); x.closePath(); x.fillStyle = "#d0d0d0"; x.fill();
    x.save(); path(EGYPT); x.closePath(); x.clip();
    x.lineCap = "round"; x.lineJoin = "round";
    x.lineWidth = w * 0.022; x.strokeStyle = "#999"; path(EGYPT); x.closePath(); x.stroke();
    x.lineWidth = w * 0.05; x.strokeStyle = "#555"; path(NILE); x.stroke();
    path(DELTA); x.closePath(); x.fillStyle = "#555"; x.fill();
    x.lineWidth = w * 0.014; x.strokeStyle = "#111"; path(NILE); x.stroke();
    x.lineWidth = w * 0.008; path([[31.24, 30.05], [30.4, 31.0], [29.95, 31.3]]); x.stroke(); path([[31.24, 30.05], [31.5, 30.9], [31.85, 31.45]]); x.stroke();
    x.restore();
    return c;
  }

  window.ACTP = { Mosaic, shapeSVG, SHAPES, egyptSource, project, BOUNDS, loadImage, smooth };
})();
