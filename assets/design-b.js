/* Design B: measure where the thin line above the "Soms vraagt het leven" quote sits,
   so the leaf texture in the first section stops exactly there. */
(function () {
  var section = document.querySelector('.values');
  if (!section) return;
  var line = section.querySelector('.herken-banner') || section.querySelector('.herken-quote');
  if (!line) return;
  function measure() {
    var top = line.getBoundingClientRect().top - section.getBoundingClientRect().top;
    section.style.setProperty('--herken-line', Math.round(top) + 'px');
  }
  measure();
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(section);
})();

/* Design B: gentle scroll-linked depth in "Herken je dit?" (leaf drift + cards floating at their own pace). */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var section = document.querySelector('.values');
  if (!section) return;
  var cards = Array.prototype.slice.call(section.querySelectorAll('.herken-list li'));
  var speeds = [-18, -34, -24];      // px of float across the section, a different pace per card
  var ticking = false;
  function update() {
    ticking = false;
    var r = section.getBoundingClientRect();
    var vh = window.innerHeight;
    if (r.bottom < 0 || r.top > vh) return;
    var p = (vh - r.top) / (vh + r.height);   // 0 when section enters, 1 when it leaves
    p = Math.max(0, Math.min(1, p)) - 0.5;
    section.style.setProperty('--leaf-y', ((p + 0.5) * 40).toFixed(1) + 'px');
    if (window.innerWidth > 680) {
      cards.forEach(function (c, i) { c.style.setProperty('--py', (p * speeds[i % speeds.length]).toFixed(1) + 'px'); });
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();

/* Design B: wrap the words of "Herken je dit?" so they can animate in one by one. */
(function () {
  var h = document.querySelector('.values .herken-intro h2');
  if (!h || h.querySelector('.w')) return;
  var words = h.textContent.trim().split(/\s+/);
  h.setAttribute('aria-label', h.textContent.trim());
  h.innerHTML = words.map(function (w, i) {
    return '<span class="w" aria-hidden="true" style="--w:' + i + '">' + w + '</span>';
  }).join(' ');
})();

/* Design B: the tree-canopy photo in the dark band pans from top to bottom as the band scrolls past. */
(function () {
  var band = document.querySelector('.herken-banner');
  if (!band) return;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still) { band.style.setProperty('--band-pos', '45%'); return; }
  var ticking = false;
  function update() {
    ticking = false;
    var r = band.getBoundingClientRect(), vh = window.innerHeight;
    if (r.bottom < -200 || r.top > vh + 200) return;
    var p = (vh - r.top) / (vh + r.height);          // 0 entering at the bottom, 1 leaving at the top
    p = Math.max(0, Math.min(1, p));
    band.style.setProperty('--band-pos', (10 + p * 80).toFixed(2) + '%');
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();

/* Design B: highlight the current chapter in the Over Brenda menu. */
(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll('.bio-toc a'));
  if (!links.length || !('IntersectionObserver' in window)) return;
  var map = {};
  links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        links.forEach(function (a) { a.classList.remove('is-active'); });
        var a = map[e.target.id]; if (a) a.classList.add('is-active');
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
})();

/* Design B: the intake form becomes a short step-by-step card (2-3 questions per step).
   Fields stay inside the same <form>, so the existing WhatsApp / e-mail handler keeps working. */
(function () {
  document.querySelectorAll('form.intake-card').forEach(function (form) {
    if (form.classList.contains('is-stepped')) return;
    var q = function (sel) { return form.querySelector(sel); };
    var traject = q('input[name="traject"]'), naam = q('#intakeName') || form.elements.naam,
        tel = form.elements.telefoon, wat = form.elements.wat, duur = q('input[name="duur"]'),
        moment = q('input[name="moment"]'), hoop = form.elements.hoop;
    var box = function (el) { return el ? el.closest('.q') : null; };
    var plan = [
      { title: 'Waar wil je mee aan de slag?', items: [box(traject)] },
      { title: 'Hoe kan Brenda je bereiken?', items: [box(naam), box(tel)], need: [naam] },
      { title: 'Wat speelt er?', items: [box(wat), box(duur)], need: [wat] },
      { title: 'Nog twee kleine vragen', items: [box(moment), box(hoop)] }
    ];
    var actions = q('.intake-actions'), error = q('.intake-error'), done = q('.intake-done');
    var steps = [];
    var wrap = document.createElement('div'); wrap.className = 'isteps';
    plan.forEach(function (p, i) {
      var s = document.createElement('div'); s.className = 'istep'; s.dataset.i = i;
      p.items.forEach(function (el) { if (el) s.appendChild(el); });
      if (i === plan.length - 1 && actions) s.appendChild(actions);
      wrap.appendChild(s); steps.push(s);
    });
    var head = q('.intake-head');
    var prog = document.createElement('div'); prog.className = 'iprog';
    prog.innerHTML = '<span class="iprog-label"></span><span class="iprog-bar"><span></span></span>';
    var nav = document.createElement('div'); nav.className = 'inav';
    nav.innerHTML = '<button type="button" class="inav-back">← Terug</button><button type="button" class="btn btn-primary inav-next">Volgende →</button>';
    head.after(prog); prog.after(wrap); wrap.after(nav);
    if (error) nav.before(error); if (done) nav.after(done);
    form.classList.add('is-stepped');
    var cur = 0;
    function show(i) {
      cur = i;
      steps.forEach(function (s, k) { s.hidden = k !== i; });
      prog.querySelector('.iprog-label').textContent = 'Stap ' + (i + 1) + ' van ' + steps.length + ' · ' + plan[i].title;
      prog.querySelector('.iprog-bar span').style.width = ((i + 1) / steps.length * 100) + '%';
      nav.querySelector('.inav-back').style.visibility = i === 0 ? 'hidden' : 'visible';
      nav.querySelector('.inav-next').hidden = i === steps.length - 1;
      if (error) error.hidden = true;
    }
    function ok(i) {
      var need = plan[i].need || [];
      for (var k = 0; k < need.length; k++) {
        if (need[k] && !String(need[k].value || '').trim()) {
          var holder = need[k].closest('.q');
          if (error) {
            error.textContent = need[k] === naam ? 'Vul even in hoe Brenda je mag noemen.' : 'Een paar woorden is al genoeg. Elke zin helpt Brenda je beter te begrijpen.';
            error.hidden = false;
            if (holder) holder.appendChild(error);
          }
          need[k].classList.add('is-missing');
          need[k].addEventListener('input', function clear() { this.classList.remove('is-missing'); if (error) error.hidden = true; this.removeEventListener('input', clear); });
          need[k].focus(); return false;
        }
      }
      return true;
    }
    nav.querySelector('.inav-next').addEventListener('click', function () { if (ok(cur)) { show(cur + 1); var f = steps[cur].querySelector('input,textarea'); if (f && f.type !== 'radio' && f.type !== 'checkbox') f.focus(); } });
    nav.querySelector('.inav-back').addEventListener('click', function () { show(Math.max(0, cur - 1)); });
    form.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && cur < steps.length - 1) { e.preventDefault(); nav.querySelector('.inav-next').click(); }
    });
    /* step 1 allows several choices: add a hint; "Weet ik nog niet" clears the others */
    var legend = steps[0].querySelector('legend');
    if (legend && !steps[0].querySelector('.ihint')) { var h = document.createElement('span'); h.className = 'ihint'; h.textContent = 'Je kunt meer dan één kiezen.'; legend.after(h); }
    var boxes = Array.prototype.slice.call(form.querySelectorAll('input[name="traject"]'));
    boxes.forEach(function (b) {
      b.addEventListener('change', function () {
        if (!b.checked) return;
        var unsure = /weet ik nog niet/i.test(b.value);
        boxes.forEach(function (o) { if (o !== b && (unsure || /weet ik nog niet/i.test(o.value))) o.checked = false; });
      });
    });
    /* on a topic page, that topic is already chosen and the form starts at step 2 */
    var page = location.pathname.split('/').pop();
    var pre = { 'rouw-en-verlies.html': 'Levend verlies', 'innerlijke-groei.html': 'Patronen', 'richting-en-zingeving.html': 'Richting' }[page];
    var start = 0;
    if (pre) boxes.forEach(function (b) { if (b.value.indexOf(pre) === 0) { b.checked = true; start = 1; } });
    show(start);
  });
})();

/* Investering: choose a plan; the button opens WhatsApp with that choice for Brenda */
(function () {
  var PLANS = { sessie: 'Losse sessie (€195)', traject: 'Traject van drie sessies (€585)' };
  var EXTRAS = { opstelling: 'Familieopstelling erbij (€195)', factuur: 'Graag een factuur' };
  document.querySelectorAll('.rate-panel').forEach(function (panel) {
    var rows = Array.prototype.slice.call(panel.querySelectorAll('.rate-row'));
    var cta = panel.querySelector('.rate-cta');
    if (rows.length < 2 || !cta) return;
    var group = document.createElement('div');
    group.className = 'rate-choice'; group.setAttribute('role', 'radiogroup'); group.setAttribute('aria-label', 'Kies je investering');
    rows[0].before(group);
    rows.forEach(function (r, i) {
      group.appendChild(r);
      if (!r.dataset.plan) r.dataset.plan = ['sessie', 'traject'][i]; r.setAttribute('role', 'radio'); r.tabIndex = 0;
      r.insertAdjacentHTML('afterbegin', '<span class="rate-tick" aria-hidden="true"></span>');
    });
    var chosen = 'kennis';
    function pick(key) {
      chosen = key;
      rows.forEach(function (r) { var on = r.dataset.plan === key; r.classList.toggle('is-chosen', on); r.setAttribute('aria-checked', on ? 'true' : 'false'); });
      var label = cta.querySelector('.rate-cta-label');
      if (!label) { label = document.createElement('span'); label.className = 'rate-cta-label'; cta.insertBefore(label, cta.firstChild); cta.childNodes.forEach(function (n) { if (n.nodeType === 3) n.textContent = ''; }); }
      label.textContent = { kennis: 'Plan een kennismaking ', sessie: 'Boek een losse sessie ', traject: 'Boek het traject ' }[key];
    }
    rows.forEach(function (r) {
      r.addEventListener('click', function () { pick(r.dataset.plan); });
      r.addEventListener('keydown', function (e) {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); pick(r.dataset.plan); }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); var o = rows[(rows.indexOf(r) + 1) % rows.length]; o.focus(); pick(o.dataset.plan); }
      });
    });
    pick(panel.querySelector('.rate-row[data-plan="kennis"]') ? 'kennis' : 'traject');
    cta.addEventListener('click', function (e) {
      e.preventDefault();
      var msg = 'Hallo Brenda,\n\n' + (chosen === 'kennis' ? 'Ik wil graag kennismaken met een telefonisch gesprek van 20 minuten.' : 'Ik wil graag ' + (chosen === 'traject' ? 'het traject van drie sessies (€585)' : 'een losse sessie (€195)') + ' boeken.') + ' Wanneer komt het je uit?\n\nGroet,';
      window.open('https://wa.me/31654725032?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    });
  });

  /* contact page: show the choice in the form and pass it into the message */
  var form = document.querySelector('form.intake-card');
  if (!form) return;
  var p = new URLSearchParams(location.search);
  var key = p.get('keuze');
  if (!PLANS[key]) return;
  var ex = (p.get('extra') || '').split(',').filter(function (k) { return EXTRAS[k]; });
  var add = function (name, val) { var i = document.createElement('input'); i.type = 'hidden'; i.name = name; i.value = val; form.appendChild(i); };
  add('investering', PLANS[key]);
  if (ex.length) add('aanvulling', ex.map(function (k) { return EXTRAS[k]; }).join(', '));
  var note = document.createElement('div');
  note.className = 'intake-choice';
  note.innerHTML = '<span class="intake-choice-k">Je keuze</span><strong>' + PLANS[key] + '</strong>' +
    (ex.length ? '<span class="intake-choice-x">+ ' + ex.map(function (k) { return EXTRAS[k]; }).join(' · ') + '</span>' : '') +
    '<a href="werkwijze.html#investering">Wijzig</a>';
  var anchor = form.querySelector('.iprog') || form.querySelector('.intake-head');
  if (anchor) anchor.after(note); else form.prepend(note);
})();



/* Daan's long review: "Lees verder" opens it in full on the Lezersreacties page */
(function () {
  if (/getuigenissen\.html$/.test(location.pathname)) {
    if (location.hash === '#daan') setTimeout(function () { var d = document.getElementById('daan'); var b = d && d.querySelector('.review-more'); if (b && !d.classList.contains('is-open')) b.click(); if (d) d.scrollIntoView({ block: 'center' }); }, 350);
    return;
  }
  document.querySelectorAll('.quote').forEach(function (q) {
    if (!/Daan Timmerman/.test(q.textContent)) return;
    var go = function () {
      var b = q.querySelector('.review-more');
      if (!b) return false;
      var a = document.createElement('a');
      a.className = b.className; a.href = 'getuigenissen.html#daan'; a.textContent = 'Lees verder';
      b.replaceWith(a); return true;
    };
    if (!go()) setTimeout(go, 300);
  });
})();


