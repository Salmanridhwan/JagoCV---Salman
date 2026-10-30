/**
 * Animasi interaktif Landing Page — satu rAF loop untuk semua efek.
 *
 * Tiga efek yang dijalankan bersama (supaya tetap 60 FPS & hemat CPU):
 *
 *   1. Parallax hero   → elemen `[data-parallax]` bergeser, berputar, dan
 *                        sedikit mengecil/membesar mengikuti scroll sehingga
 *                        terasa ada kedalaman. Elemen di sisi kiri bergeser
 *                        ke kanan dan sebaliknya (konvergen ke tengah).
 *   2. Tilt mockup CV  → `[data-tilt]` bereaksi terhadap posisi kursor:
 *                        kursor di kiri-bawah → mockup naik; kanan-atas →
 *                        mockup turun. Transform tidak memengaruhi layout,
 *                        jadi elemen tetap di tempatnya.
 *   3. Float CTA       → `[data-cta-float]` mengapung terus-menerus, dan
 *                        kecepatannya naik proporsional saat halaman digulir
 *                        (velocity scroll dihaluskan lalu meluruh kembali).
 *
 * Semua nilai di-lerp / di-decay agar gerakan halus dan tidak "kaget" saat
 * scroll berhenti. `prefers-reduced-motion: reduce` mematikan seluruh efek.
 */

interface ParallaxItem {
  el: HTMLElement;
  /** px per 100% progress scroll (negatif = naik). */
  y: number;
  /** px per 100% progress (positif = ke kanan) — untuk efek konvergen. */
  x: number;
  /** rotasi awal (deg) — mempertahankan rotasi kelas Tailwind. */
  rot: number;
  /** tambahan rotasi (deg) sepanjang progress. */
  spin: number;
  /** tambahan skala sepanjang progress. */
  scale: number;
}

interface FloatItem {
  el: HTMLElement;
  amp: number;
  speed: number;
  rot: number;
  spin: number;
  phase: number;
}

let started = false;

const num = (el: HTMLElement, key: string, fallback: number): number => {
  const raw = el.dataset[key];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
};

export function initLandingMotion(): void {
  if (started) return;

  const landing = document.getElementById("view-landing");
  const hero = document.getElementById("hero");
  if (!landing || !hero) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduceMotion.matches) return;

  started = true;

  // ── Kumpulkan target animasi ──────────────────────────────────────
  const parallax: ParallaxItem[] = Array.from(
    hero.querySelectorAll<HTMLElement>("[data-parallax]"),
  ).map((el) => {
    el.style.willChange = "transform";
    return {
      el,
      y: num(el, "parallaxY", 20),
      x: num(el, "parallaxX", 0),
      rot: num(el, "parallaxRot", 0),
      spin: num(el, "parallaxSpin", 0),
      scale: num(el, "parallaxScale", 0),
    };
  });

  const floats: FloatItem[] = Array.from(
    document.querySelectorAll<HTMLElement>("[data-cta-float]"),
  ).map((el, i) => {
    el.style.willChange = "transform";
    return {
      el,
      amp: num(el, "floatAmp", 10),
      speed: num(el, "floatSpeed", 1),
      rot: num(el, "floatRot", 0),
      spin: num(el, "floatSpin", 6),
      // Sebar fase awal supaya tidak bergerak serempak.
      phase: (i * Math.PI) / 3.5,
    };
  });

  const tiltEl = hero.querySelector<HTMLElement>("[data-tilt]");
  if (tiltEl) tiltEl.style.willChange = "transform";

  if (parallax.length === 0 && floats.length === 0 && !tiltEl) return;

  // ── State ─────────────────────────────────────────────────────────
  let heroH = Math.max(1, hero.offsetHeight);
  let smoothScroll = window.scrollY;
  let boost = 0; // 0..3 → pengali kecepatan float saat scroll
  let last = performance.now();
  let frame = 0;
  let timer = 0;

  // Tilt: nilai target vs nilai saat ini (di-lerp tiap frame).
  const tilt = { x: 0, y: 0, rx: 0, ry: 0 };
  const tiltTarget = { x: 0, y: 0, rx: 0, ry: 0 };
  let tiltActive = false;

  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  const onPointerMove = (e: PointerEvent): void => {
    if (!tiltEl) return;
    const r = tiltEl.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    // Normalisasi posisi kursor ke [-1, 1] relatif titik tengah mockup.
    const nx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
    const ny = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));

    // Kiri-bawah (ny > 0) → mockup naik; kanan-atas (ny < 0) → turun.
    tiltTarget.y = -ny * 11;
    tiltTarget.x = nx * 5;
    tiltTarget.rx = -ny * 3.4;
    tiltTarget.ry = nx * 4.6;
    tiltActive = true;
  };

  const onPointerLeave = (): void => {
    tiltTarget.x = 0;
    tiltTarget.y = 0;
    tiltTarget.rx = 0;
    tiltTarget.ry = 0;
    tiltActive = false;
  };

  if (tiltEl && finePointer.matches) {
    hero.addEventListener("pointermove", onPointerMove, { passive: true });
    hero.addEventListener("pointerleave", onPointerLeave, { passive: true });
    // Scroll bisa membuat kursor "keluar" tanpa event leave.
    window.addEventListener("blur", onPointerLeave);
  }

  const measure = (): void => {
    heroH = Math.max(1, hero.offsetHeight);
  };
  window.addEventListener("resize", measure, { passive: true });
  window.addEventListener("orientationchange", measure, { passive: true });

  // ── Loop utama ────────────────────────────────────────────────────
  const tick = (now: number): void => {
    frame = 0;

    // Jangan hitung apa pun saat landing disembunyikan / tab tidak aktif.
    if (landing.classList.contains("hidden") || document.hidden) {
      timer = window.setTimeout(() => tick(performance.now()), 250);
      return;
    }

    const dt = Math.min(2.5, Math.max(0.2, (now - last) / 16.667));
    last = now;

    // Scroll dihaluskan + velocity untuk boost kecepatan float.
    const prev = smoothScroll;
    smoothScroll += (window.scrollY - smoothScroll) * 0.16;
    const vel = Math.abs(smoothScroll - prev);
    boost += (Math.min(3, vel * 0.055) - boost) * 0.09;

    // 1) Parallax — progress 0..1.4 sepanjang tinggi hero.
    const progress = Math.max(0, Math.min(1.4, smoothScroll / heroH));
    for (const it of parallax) {
      const ty = -progress * it.y;
      const tx = progress * it.x;
      const rot = it.rot + progress * it.spin;
      const sc = 1 + progress * it.scale;
      it.el.style.transform =
        `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
    }

    // 2) Tilt mockup CV — lerp menuju target agar halus.
    if (tiltEl) {
      const ease = 0.12;
      tilt.x += (tiltTarget.x - tilt.x) * ease;
      tilt.y += (tiltTarget.y - tilt.y) * ease;
      tilt.rx += (tiltTarget.rx - tilt.rx) * ease;
      tilt.ry += (tiltTarget.ry - tilt.ry) * ease;

      const settled =
        !tiltActive &&
        Math.abs(tilt.x) < 0.01 &&
        Math.abs(tilt.y) < 0.01 &&
        Math.abs(tilt.rx) < 0.01 &&
        Math.abs(tilt.ry) < 0.01;

      if (settled) {
        if (tiltEl.style.transform !== "") tiltEl.style.transform = "";
      } else {
        tiltEl.style.transform =
          `perspective(1200px) translate3d(${tilt.x.toFixed(2)}px, ${tilt.y.toFixed(2)}px, 0) ` +
          `rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg)`;
      }
    }

    // 3) Float CTA — fase berjalan terus; kecepatan naik saat scroll.
    if (floats.length > 0) {
      const mult = 1 + boost;
      for (const f of floats) {
        // Basis ~0.019 rad/frame: satu siklus ±6 detik — cukup terlihat
        // mengapung tanpa terasa gelisah.
        f.phase += dt * 0.019 * f.speed * mult;
        const ty = Math.sin(f.phase) * f.amp;
        const tx = Math.cos(f.phase * 0.75) * f.amp * 0.45;
        const rot = f.rot + Math.sin(f.phase * 0.62 + 1) * f.spin;
        f.el.style.transform =
          `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg)`;
      }
    }

    frame = window.requestAnimationFrame(tick);
  };

  frame = window.requestAnimationFrame(tick);

  // Hentikan loop saat halaman ditinggalkan (hemat baterai di mobile).
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      if (timer) window.clearTimeout(timer);
      timer = 0;
    } else if (!frame && !timer) {
      last = performance.now();
      frame = window.requestAnimationFrame(tick);
    }
  });

  // Media query berubah → matikan efek bila pengguna mengaktifkan
  // "kurangi gerakan" dari pengaturan sistem.
  reduceMotion.addEventListener("change", (e) => {
    if (!e.matches) return;
    if (frame) window.cancelAnimationFrame(frame);
    if (timer) window.clearTimeout(timer);
    frame = 0;
    timer = 0;
    parallax.forEach((p) => (p.el.style.transform = ""));
    floats.forEach((f) => (f.el.style.transform = ""));
    if (tiltEl) tiltEl.style.transform = "";
    hero.removeEventListener("pointermove", onPointerMove);
    hero.removeEventListener("pointerleave", onPointerLeave);
  });
}
