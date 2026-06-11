/* prezentation.js
   ─────────────────────────────────────────────────────────────
   Lava-lamp / liquid blob background  +  slide presentation
   Everything scoped under the  prez  namespace.
   ─────────────────────────────────────────────────────────────
   Controls:
     • Left-click / Wheel-Down / ArrowRight  → Next Slide
     • Right-click / Wheel-Up / ArrowLeft    → Previous Slide
     • Esc                                   → Close Deck
*/

(function () {
  'use strict';

  /* ── Colour palettes per slide ──────────────────────────────── */
  const SLIDE_PALETTES = [
    // 0 — The Issue  (deep crimson / ember)
    ['#7a0e1e', '#b52230', '#e84040', '#ff7043', '#ffb347'],
    // 1 — History    (indigo / electric blue)
    ['#0a0a3a', '#1a237e', '#283593', '#1565c0', '#42a5f5'],
    // 2 — My Action  (forest / lime)
    ['#0a2010', '#1b5e20', '#2e7d32', '#43a047', '#a5d6a7'],
    // 3 — Photo 1    (navy / gold)
    ['#050d1a', '#0d2340', '#163355', '#c8992a', '#e8b84b'],
    // 4 — Photo 2    (same)
    ['#050d1a', '#0d2340', '#163355', '#c8992a', '#e8b84b'],
    // 5 — Photo 3    (same)
    ['#050d1a', '#0d2340', '#163355', '#c8992a', '#e8b84b'],
    // 6 — Photo 4    (same)
    ['#050d1a', '#0d2340', '#163355', '#c8992a', '#e8b84b'],
    // 7 — Photo 5    (same)
    ['#050d1a', '#0d2340', '#163355', '#c8992a', '#e8b84b'],
    // 8 — Photo 6    (same)
    ['#050d1a', '#0d2340', '#163355', '#c8992a', '#e8b84b'],
  ];

  /* ── Blob state ─────────────────────────────────────────────── */
  class Blob {
    constructor(canvas, color) {
      this.canvas = canvas;
      this.color  = color;
      this.reset();
    }

    reset() {
      const w = this.canvas.width;
      const h = this.canvas.height;
      this.x   = Math.random() * w;
      this.y   = Math.random() * h;
      this.r   = 80 + Math.random() * 180;
      this.vx  = (Math.random() - 0.5) * 1.6;
      this.vy  = (Math.random() - 0.5) * 1.6;
      // metaball style: random morph offsets
      this.pts = Array.from({ length: 8 }, () => ({
        angle: Math.random() * Math.PI * 2,
        speed: 0.008 + Math.random() * 0.018,
        amp:   0.12  + Math.random() * 0.25,
        phase: Math.random() * Math.PI * 2,
      }));
      this.t = 0;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.t += 0.016;

      // Soft bounce
      const w = this.canvas.width;
      const h = this.canvas.height;
      if (this.x < -this.r)   this.x = w + this.r;
      if (this.x > w + this.r) this.x = -this.r;
      if (this.y < -this.r)   this.y = h + this.r;
      if (this.y > h + this.r) this.y = -this.r;
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);

      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.r * 1.8);
      gradient.addColorStop(0,   this.color + 'aa');
      gradient.addColorStop(0.5, this.color + '66');
      gradient.addColorStop(1,   this.color + '00');
      ctx.fillStyle = gradient;

      // Draw morphing blob shape
      ctx.beginPath();
      const steps = 64;
      for (let i = 0; i <= steps; i++) {
        const angle = (i / steps) * Math.PI * 2;
        let rad = this.r;
        for (const p of this.pts) {
          rad += this.r * p.amp * Math.sin(angle * 3 + p.phase + this.t * p.speed * 60);
        }
        const x = Math.cos(angle) * rad;
        const y = Math.sin(angle) * rad;
        if (i === 0) ctx.moveTo(x, y);
        else         ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  /* ── Canvas renderer ────────────────────────────────────────── */
  class LavaRenderer {
    constructor(canvas) {
      this.canvas  = canvas;
      this.ctx     = canvas.getContext('2d');
      this.blobs   = [];
      this.targetPalette  = null;
      this.currentPalette = null;
      this.lerpT   = 1;
      this.raf     = null;
      this._resize = this._resize.bind(this);
      window.addEventListener('resize', this._resize);
      this._resize();
    }

    _resize() {
      this.canvas.width  = window.innerWidth;
      this.canvas.height = window.innerHeight;
      if (this.blobs.length) {
        this.blobs.forEach(b => {
          b.x = Math.random() * this.canvas.width;
          b.y = Math.random() * this.canvas.height;
        });
      }
    }

    setPalette(colors) {
      if (!this.currentPalette) this.currentPalette = colors;
      this.targetPalette = colors;
      this.lerpT = 0;

      // Rebuild blobs with new palette
      this.blobs = colors.map(c => new Blob(this.canvas, c));
    }

    _hexToRgb(hex) {
      const r = parseInt(hex.slice(1,3),16);
      const g = parseInt(hex.slice(3,5),16);
      const b = parseInt(hex.slice(5,7),16);
      return [r, g, b];
    }

    _lerpColor(a, b, t) {
      const ra = this._hexToRgb(a), rb = this._hexToRgb(b);
      const r = Math.round(ra[0] + (rb[0]-ra[0])*t);
      const g = Math.round(ra[1] + (rb[1]-ra[1])*t);
      const bl = Math.round(ra[2] + (rb[2]-ra[2])*t);
      return `rgb(${r},${g},${bl})`;
    }

    start() {
      const loop = () => {
        this._draw();
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    }

    stop() {
      if (this.raf) cancelAnimationFrame(this.raf);
    }

    _draw() {
      const { canvas, ctx } = this;

      // Lerp bg colour
      if (this.lerpT < 1) this.lerpT = Math.min(1, this.lerpT + 0.02);
      const bgA = this.currentPalette ? this.currentPalette[0] : '#050d1a';
      const bgB = this.targetPalette  ? this.targetPalette[0]  : '#050d1a';
      const bg  = this._lerpColor(bgA, bgB, this.lerpT);

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalCompositeOperation = 'screen';

      this.blobs.forEach(b => { b.update(); b.draw(ctx); });

      ctx.globalCompositeOperation = 'source-over';

      // Vignette
      const vg = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, canvas.height * 0.2,
        canvas.width/2, canvas.height/2, canvas.height * 0.85
      );
      vg.addColorStop(0, 'transparent');
      vg.addColorStop(1, 'rgba(0,0,0,0.62)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  /* ── Ripple helper ──────────────────────────────────────────── */
  function spawnRipple(overlay, color) {
    const el = document.createElement('div');
    el.className = 'prez-ripple-circle';
    const size = Math.max(window.innerWidth, window.innerHeight) * 0.6;
    Object.assign(el.style, {
      width:  size + 'px',
      height: size + 'px',
      left:   (window.innerWidth  / 2 - size / 2) + 'px',
      top:    (window.innerHeight / 2 - size / 2) + 'px',
      background: color,
    });
    overlay.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }

  /* ── Slide data ─────────────────────────────────────────────── */
  const SLIDES = [
    {
      type:    'text',
      eyebrow: 'Slide 01',
      title:   'The Issue',
      body:    `Minority students face a deeply unequal playing field when it comes to funding higher education. Despite the existence of hundreds of scholarships specifically created to support them, most go unfound — buried under complex search processes and inaccessible databases. Financial barriers continue to push talented students away from the futures they deserve.`,
    },
    {
      type:    'text',
      eyebrow: 'Slide 02',
      title:   'History of the Issue',
      body:    `For decades, systemic inequalities in education funding have disadvantaged minority communities. While affirmative policies and dedicated scholarships emerged through the civil rights era, access to that information remained gatekept by institutional networks. Without the right connections or guidance counsellors, many students simply never heard about the money that existed for them.`,
    },
    {
      type:    'text',
      eyebrow: 'Slide 03',
      title:   'My Action',
      body:    `For my Social Justice Culminating, I built this scholarship website — a centralised, free resource listing minority scholarships in a clean, searchable format. My goal: make sure no student wastes hours digging for funding that should be easy to find. I promoted it across libraries and schools, and I'll keep it updated so the information stays accurate and useful.`,
    },
    {
      type:    'image',
      eyebrow: 'Promotion',
      title:   'Spreading the Word',
      src:     'images/IMG_4899_(1).jpg',
      caption: "Ms. Calpu's Room",
    },
    {
      type:    'image',
      eyebrow: 'Promotion',
      title:   'Spreading the Word',
      src:     '/images/IMG_4902_(1).jpg',
      caption: 'Albion Library',
    },
    {
      type:    'image',
      eyebrow: 'Promotion',
      title:   'Spreading the Word',
      src:     'images/IMG_4906_(1).jpg',
      caption: 'Albion Library',
    },
    {
      type:    'image',
      eyebrow: 'Promotion',
      title:   'Spreading the Word',
      src:     'images/IMG_4909_(1).jpg',
      caption: 'Northen Elm Library',
    },
    {
      type:    'image',
      eyebrow: 'Promotion',
      title:   'Spreading the Word',
      src:     'images/IMG_4914_(1).jpg',
      caption: 'Rexdale Library',
    },
    {
      type:    'image',
      eyebrow: 'Promotion',
      title:   'Spreading the Word',
      src:     'images/IMG_4915_(1).jpg',
      caption: 'Rexdale Library',
    },
  ];

  /* ── Main controller ────────────────────────────────────────── */
  let currentIndex  = 0;
  let renderer      = null;
  let isAnimating   = false;
  let lastWheelTime = 0;

  function buildOverlay() {
    if (document.getElementById('prez-overlay')) return;

    /* ── CSS link ──────────────────────────────────────────────── */
    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = 'css/prezentation.css';
    document.head.appendChild(link);

    /* ── Overlay shell ─────────────────────────────────────────── */
    const overlay = document.createElement('div');
    overlay.id = 'prez-overlay';

    /* ── Canvas ─────────────────────────────────────────────────── */
    const canvas = document.createElement('canvas');
    canvas.id = 'prez-blob-canvas';
    overlay.appendChild(canvas);

    /* ── Slides wrap ─────────────────────────────────────────────── */
    const wrap = document.createElement('div');
    wrap.id = 'prez-slides-wrap';

    SLIDES.forEach((s, i) => {
      const slide = document.createElement('div');
      slide.className = 'prez-slide';
      slide.dataset.index = i;
      if (s.type === 'text') {
        slide.innerHTML = `
          <span class="prez-eyebrow">${s.eyebrow}</span>
          <h2 class="prez-title">${s.title}</h2>
          <div class="prez-divider"></div>
          <p class="prez-body">${s.body}</p>
        `;
      } else {
        slide.innerHTML = `
          <span class="prez-eyebrow">${s.eyebrow}</span>
          <h2 class="prez-title">${s.title}</h2>
          <div class="prez-img-frame">
            <img src="${s.src}" alt="${s.caption}">
            <div class="prez-img-caption">${s.caption}</div>
          </div>
        `;
      }
      wrap.appendChild(slide);
    });

    overlay.appendChild(wrap);

    /* ── Dots ─────────────────────────────────────────────────────── */
    const dots = document.createElement('div');
    dots.id = 'prez-dots';
    SLIDES.forEach((_, i) => {
      const d = document.createElement('div');
      d.className = 'prez-dot';
      d.dataset.index = i;
      dots.appendChild(d);
    });
    overlay.appendChild(dots);

    /* ── Counter ─────────────────────────────────────────────────── */
    const counter = document.createElement('div');
    counter.id = 'prez-counter';
    overlay.appendChild(counter);

    /* ── Hint ────────────────────────────────────────────────────── */
    const hint = document.createElement('div');
    hint.id = 'prez-hint';
    hint.textContent = 'Scroll / Arrows / Click';
    overlay.appendChild(hint);

    /* ── Close btn ───────────────────────────────────────────────── */
    const closeBtn = document.createElement('button');
    closeBtn.id = 'prez-close';
    closeBtn.setAttribute('aria-label', 'Close presentation');
    closeBtn.innerHTML = '&times;';
    overlay.appendChild(closeBtn);

    document.body.appendChild(overlay);

    /* ── Renderer ─────────────────────────────────────────────────── */
    renderer = new LavaRenderer(canvas);

    /* ── Events ──────────────────────────────────────────────────── */
    overlay.addEventListener('click', e => {
      if (e.target === closeBtn || closeBtn.contains(e.target)) return;
      navigate(1);
    });

    overlay.addEventListener('contextmenu', e => {
      e.preventDefault();
      navigate(-1);
    });

    // Premium Scroll Trigger with timing lock
    overlay.addEventListener('wheel', e => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheelTime < 950) return; // Matches execution pipeline length

      if (Math.abs(e.deltaY) > 12) {
        lastWheelTime = now;
        navigate(e.deltaY > 0 ? 1 : -1);
      }
    }, { passive: false });

    closeBtn.addEventListener('click', e => {
      e.stopPropagation();
      closePresentation();
    });

    document.addEventListener('keydown', onKey);
  }

  function onKey(e) {
    if (!document.getElementById('prez-overlay')?.classList.contains('prez-visible')) return;
    if (e.key === 'Escape')      { closePresentation(); return; }
    if (e.key === 'ArrowRight')  navigate(1);
    if (e.key === 'ArrowLeft')   navigate(-1);
  }

  function updateUI() {
    const counter = document.getElementById('prez-counter');
    const dots    = document.querySelectorAll('#prez-dots .prez-dot');

    counter.textContent = `${currentIndex + 1} / ${SLIDES.length}`;

    dots.forEach((d, i) => {
      d.classList.toggle('prez-dot-active', i === currentIndex);
    });
  }

  function goToSlide(index, direction) {
    if (isAnimating) return;
    isAnimating = true;

    const overlay   = document.getElementById('prez-overlay');
    const allSlides = document.querySelectorAll('.prez-slide');
    const prevSlide = allSlides[currentIndex];
    const nextSlide = allSlides[index];

    // Wipe out residual architecture lifecycle classes
    allSlides.forEach(s => {
      s.classList.remove('prez-exit-next', 'prez-exit-prev', 'prez-enter-next', 'prez-enter-prev');
    });

    // Handle 3D Layered Separation Pipeline
    if (direction > 0) {
      prevSlide.classList.add('prez-exit-next');
      nextSlide.classList.add('prez-enter-next');
    } else {
      prevSlide.classList.add('prez-exit-prev');
      nextSlide.classList.add('prez-enter-prev');
    }

    // Force DOM processing layer repaint execution 
    nextSlide.offsetHeight;

    // Displace index states safely
    prevSlide.classList.remove('prez-active');
    currentIndex = index;
    nextSlide.classList.add('prez-active');

    // Switch dynamic aesthetic context variables
    renderer.setPalette(SLIDE_PALETTES[currentIndex]);
    spawnRipple(overlay, SLIDE_PALETTES[currentIndex][2] + '33');

    updateUI();

    // Release global UI transition hooks safely once pipeline clears
    setTimeout(() => {
      isAnimating = false;
    }, 850);
  }

  function navigate(direction) {
    let next = currentIndex + direction;
    if (next < 0)               next = SLIDES.length - 1;
    if (next >= SLIDES.length)  next = 0;
    goToSlide(next, direction);
  }

  function openPresentation() {
    buildOverlay();
    const overlay = document.getElementById('prez-overlay');
    currentIndex = 0;

    document.querySelectorAll('.prez-slide').forEach((s, i) => {
      s.classList.remove('prez-exit-next', 'prez-exit-prev', 'prez-enter-next', 'prez-enter-prev');
      s.classList.toggle('prez-active', i === 0);
    });

    overlay.classList.add('prez-visible');
    document.body.style.overflow = 'hidden';

    renderer.setPalette(SLIDE_PALETTES[0]);
    renderer.start();
    updateUI();
  }

  function closePresentation() {
    const overlay = document.getElementById('prez-overlay');
    overlay.classList.remove('prez-visible');
    document.body.style.overflow = '';
    renderer.stop();
    document.removeEventListener('keydown', onKey);
  }

  function init() {
    const btn = document.getElementById('prez-launch-btn');
    if (btn) {
      btn.addEventListener('click', openPresentation);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();