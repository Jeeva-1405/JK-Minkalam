(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  $('[data-year]').textContent = new Date().getFullYear();

  // Footer: local time at the Erode office
  const clock = $('[data-clock]');
  const fmt = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' });
  const tick = () => { clock.textContent = fmt.format(new Date()); };
  tick();
  setInterval(tick, 20000);

  // Nav: transparent at the top, white with a hairline once the page moves
  const hdr = $('[data-hdr]');
  const onScroll = () => hdr.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Active section gets the underline
  const navLinks = $$('[data-nav] a');
  const secs = navLinks.map((a) => document.querySelector(a.getAttribute('href')));
  const spy = () => {
    const y = window.innerHeight * 0.4;
    let hit = null;
    secs.forEach((s, i) => { const r = s.getBoundingClientRect(); if (r.top <= y && r.bottom > y) hit = navLinks[i]; });
    navLinks.forEach((l) => l.classList.toggle('is-on', l === hit));
  };
  spy();
  window.addEventListener('scroll', spy, { passive: true });

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

  // Hero: simulated mains failure. The load keeps running.
  const hero = $('[data-hero]');
  const sim = $('[data-sim]');
  const labels = $$('.status__item b');
  const setOut = (out) => {
    hero.classList.toggle('is-out', out);
    labels.forEach((b) => { b.textContent = out ? b.dataset.out : b.dataset.ok; });
  };
  const runOutage = () => {
    if (hero.classList.contains('is-out')) return;
    sim.disabled = true;
    setOut(true);
    setTimeout(() => { setOut(false); sim.disabled = false; }, 4200);
  };
  sim.addEventListener('click', runOutage);
  if (!still) setTimeout(runOutage, 2600);

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
    if (missing.length) { f[missing[0]].focus(); note.textContent = 'Please add your name and phone number.'; return; }

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
    note.textContent = 'Opening your email app. If nothing happens, write to minkalamjm@gmail.com.';
  });
})();
