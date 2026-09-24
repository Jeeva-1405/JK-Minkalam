(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  $('[data-year]').textContent = new Date().getFullYear();

  // Footer: local time at the Erode office
  const clock = $('[data-clock]');
  if (clock) {
    const fmt = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' });
    const tick = () => { clock.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 20000);
  }

  // Nav: open bar at the top, a floating cell once the page moves
  const hdr = $('[data-hdr]');
  const onScroll = () => hdr.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Oscilloscope nav: a burst of signal travels along the wire to the hovered link and ripples under the current section
  const nav = $('[data-nav]');
  const navLinks = $$('[data-nav] a');
  const secs = navLinks.map((a) => document.querySelector(a.getAttribute('href')));
  navLinks.forEach((a) => { const t = a.textContent; a.innerHTML = `<span class="roll"><span data-t="${t}">${t}</span></span>`; });
  const wave = $('[data-wave]');
  const wire = $('.hdr__wire', wave);
  const sig = $('.hdr__sig', wave);
  const wireGrad = $('#wire');
  const spark = $('#spark');
  const H = 14;
  const K = (Math.PI * 2) / 15; // one cycle every 15px
  let W = 0;
  let c = 0, s = 30, a = 0, ph = 0; // burst centre, spread, height, phase
  let tc = 0, ts = 30, ta = 0; // where it is heading
  let running = false;
  const draw = () => {
    const surge = 1 + Math.min(Math.abs(tc - c) / 50, 1.2); // taller while it travels
    let d = '';
    for (let x = 0; x <= W; x += 2) {
      const e = Math.exp(-(((x - c) / s) ** 2));
      d += `${x ? 'L' : 'M'}${x} ${(H / 2 - a * surge * e * Math.sin(x * K - ph)).toFixed(2)}`;
    }
    wire.setAttribute('d', d);
    sig.setAttribute('d', d);
    spark.setAttribute('x1', c - s * 2.2);
    spark.setAttribute('x2', c + s * 2.2);
    sig.style.opacity = Math.min(a / 2, 1);
  };
  const frame = () => {
    c += (tc - c) * 0.1;
    s += (ts - s) * 0.1;
    a += (ta - a) * 0.08;
    ph += 0.12;
    draw();
    if (ta || a > 0.02) requestAnimationFrame(frame);
    else { a = 0; draw(); running = false; }
  };
  const size = () => {
    W = nav.clientWidth;
    wave.setAttribute('viewBox', `0 0 ${W} ${H}`);
    wireGrad.setAttribute('x2', W);
  };
  let active = null;
  const aim = (link) => {
    if (link) {
      const nc = link.offsetLeft + link.offsetWidth / 2;
      if (a < 0.3) c = nc; // a fresh burst starts where it is needed
      tc = nc; ts = link.offsetWidth / 2.8; ta = 4;
    } else ta = 0;
    if (still) { c = tc; s = ts; a = ta; draw(); return; }
    if (!running) { running = true; requestAnimationFrame(frame); }
  };
  size();
  draw();
  const spy = () => {
    const y = window.innerHeight * 0.4;
    let hit = null;
    secs.forEach((sec, i) => { const r = sec.getBoundingClientRect(); if (r.top <= y && r.bottom > y) hit = navLinks[i]; });
    navLinks.forEach((l) => l.classList.toggle('is-on', l === hit));
    if (hit !== active) { active = hit; if (!nav.matches(':hover')) aim(active); }
  };
  spy();
  window.addEventListener('scroll', spy, { passive: true });
  window.addEventListener('resize', () => { size(); aim(active); });
  nav.addEventListener('mouseover', (e) => { const l = e.target.closest('a'); if (l) aim(l); });
  nav.addEventListener('focusin', (e) => { const l = e.target.closest('a'); if (l) aim(l); });
  nav.addEventListener('mouseleave', () => aim(active));
  nav.addEventListener('focusout', () => aim(active));

  // Mobile menu
  const burger = $('[data-burger]');
  const mnav = $('[data-mnav]');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', open);
    mnav.hidden = !open;
    document.body.classList.toggle('menu-open', open);
    hdr.classList.toggle('is-menu', open);
  };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !mnav.hidden) { setMenu(false); burger.focus(); } });
  burger.addEventListener('click', () => setMenu(mnav.hidden));
  mnav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });

  // Hero: a simulated mains failure plays once. The load keeps running.
  const hero = $('[data-hero]');
  // On narrow screens the facts wrap onto several rows, so the phase waves sit just above wherever they end up
  const facts = $('.hero__facts', hero);
  const seatPhases = () => hero.style.setProperty('--facts', `${hero.getBoundingClientRect().bottom - facts.getBoundingClientRect().top}px`);
  seatPhases();
  window.addEventListener('resize', seatPhases);
  if (!still) {
    setTimeout(() => hero.classList.add('is-out'), 2600);
    setTimeout(() => hero.classList.remove('is-out'), 6800);
  }

  // Problem → answer tabs (desktop); on small screens every answer is shown
  const tabs = $$('[data-fix] [role="tab"]');
  const pick = (tab, focus) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).classList.toggle('is-on', on);
    });
    if (focus) tab.focus();
  };
  tabs.forEach((t, i) => {
    t.tabIndex = i ? -1 : 0;
    t.addEventListener('click', () => pick(t));
    t.addEventListener('keydown', (e) => {
      const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (d) { e.preventDefault(); pick(tabs[(i + d + tabs.length) % tabs.length], true); }
    });
  });

  // Process: the step nearest the middle of the screen is lit, and the sticky counter rolls to it
  const proc = $('[data-proc]');
  const stps = $$('[data-stp]', proc);
  let at = -1;
  const lightStep = () => {
    const mid = window.innerHeight / 2;
    let best = 0;
    let dist = Infinity;
    stps.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - mid);
      if (d < dist) { dist = d; best = i; }
    });
    if (best === at) return;
    at = best;
    proc.dataset.at = at;
    proc.style.setProperty('--at', at);
    stps.forEach((s, i) => s.classList.toggle('is-on', i === at));
  };
  lightStep();
  window.addEventListener('scroll', lightStep, { passive: true });
  window.addEventListener('resize', lightStep);

  // Client marquee: duplicate each row once so it loops seamlessly
  if (!still) {
    $$('.marq__row').forEach((row) => {
      $$('li', row).forEach((li) => {
        const c = li.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        row.appendChild(c);
      });
    });
  }

  // Reveal on scroll
  const els = $$('.fix__head, .fix__ui, .trust__head, .oem__lead, .oem__wall, .iso__doc, .iso__txt, .talk__h, .lib, .talk__side');
  if ('IntersectionObserver' in window && !still) {
    const io = new IntersectionObserver((ents) => ents.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => { el.classList.add('rv'); io.observe(el); });
  }

  // Enquiry → prefilled email
  const form = $('[data-form]');
  const note = $('[data-note]', form);
  const say = (t) => { if (note) note.textContent = t; };
  const area = form.elements.area;
  const syncSel = () => area.classList.toggle('is-empty', !area.value);
  area.addEventListener('change', syncSel);
  syncSel();
  $$('[data-pick]').forEach((a) => a.addEventListener('click', () => { area.value = a.dataset.pick; syncSel(); }));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = form.elements;
    const missing = ['name', 'phone'].filter((n) => !f[n].value.trim());
    ['name', 'phone'].forEach((n) => f[n].classList.toggle('is-bad', missing.includes(n)));
    if (missing.length) { f[missing[0]].focus(); say('Please add your name and phone number.'); return; }

    const subject = `Enquiry: ${f.area.value || 'General'} from ${f.name.value}`;
    const body = [
      `Name: ${f.name.value}`,
      `Phone: ${f.phone.value}`,
      `Company / site: ${f.company.value || '-'}`,
      `Requirement: ${f.area.value || '-'}`,
      '',
      f.msg.value,
    ].join('\n');
    window.location.href = `mailto:minkalamjm@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    say('Opening your email app. If nothing happens, write to minkalamjm@gmail.com.');
  });
})();
