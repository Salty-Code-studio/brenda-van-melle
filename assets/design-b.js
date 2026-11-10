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
    if (form.classList.contains('is-stepped') || form.classList.contains('intake-inline')) return;
    var q = function (sel) { return form.querySelector(sel); };
    var traject = q('input[name="traject"]'), naam = q('#intakeName') || form.elements.naam,
        tel = form.elements.telefoon, wat = form.elements.wat, duur = q('input[name="duur"]'),
        moment = q('input[name="moment"]'), hoop = form.elements.hoop;
    var box = function (el) { return el ? el.closest('.q') : null; };
    var plan = [
      { title: 'Waar wil je mee aan de slag?', items: [box(traject)] },
      { title: 'Hoe kan ik je bereiken?', items: [box(naam), box(tel)], need: [naam] },
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
            error.textContent = need[k] === naam ? 'Vul even in hoe ik je mag noemen.' : 'Een paar woorden is al genoeg. Elke zin helpt Brenda je beter te begrijpen.';
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
    if (legend && !steps[0].querySelector('.ihint')) { var h = document.createElement('span'); h.className = 'ihint'; h.textContent = 'Je kunt meer dan één optie kiezen.'; legend.after(h); }
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
    var chosen = 'kennis', syncQuiz = null;
    function pick(key) {
      chosen = key; if (syncQuiz) syncQuiz();
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
      /* trial: the quiz slides out from under the price panel and takes the place of the steps */
      var card = panel.closest('.practical-card');
      var inline = card && card.querySelector('.intake-inline');
      if (inline) {
        syncQuiz = function () {
          var LABEL = { kennis: 'Kennismaken · telefonisch, 20 min', sessie: 'Losse sessie · €195', traject: 'Traject van drie sessies · €585' };
          inline.elements.investering.value = LABEL[chosen];
          var note = inline.querySelector('.iq-choice strong'); if (note) note.textContent = LABEL[chosen];
        };
        if (!inline.querySelector('.iq-left')) {
          /* three slides. 1: name + phone (left) | what you want to work on (dark).
             2: what is going on + how long (left) | best time + what you hope for (dark).
             3: summary (left) | photo + send by WhatsApp or e-mail (dark). */
          var el = function (tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html) n.innerHTML = html; return n; };
          var box = function (name) { var f = inline.elements[name]; f = f && (f.length && !f.tagName ? f[0] : f); return f ? f.closest('.q') : null; };
          var L = el('div', 'iq-left'), R = el('div', 'iq-right');
          var head = inline.querySelector('.intake-head'); if (head) head.remove();
          L.appendChild(inline.querySelector('.intake-back'));
          var title = el('h3', 'iq-title'); L.appendChild(title);
          var top = el('div', 'iq-top', '<p class="iq-choice"><span>Je keuze</span><strong></strong></p><div class="iq-dots" aria-hidden="true"></div>');
          R.appendChild(top);
          var lp = [el('div', 'iq-pane'), el('div', 'iq-pane'), el('div', 'iq-pane iq-summary')];
          var rp = [el('div', 'iq-pane'), el('div', 'iq-pane'), el('div', 'iq-pane iq-send')];
          [box('naam'), box('telefoon')].forEach(function (n) { if (n) lp[0].appendChild(n); });
          [box('duur'), box('wat')].forEach(function (n) { if (n) lp[1].appendChild(n); });
          var tr = box('traject'); if (tr) { rp[0].appendChild(tr); var lg = tr.querySelector('legend'); if (lg) lg.insertAdjacentHTML('afterend', '<span class="iq-hint">Je kunt meer dan één optie kiezen.</span>'); }
          [box('moment'), box('hoop')].forEach(function (n) { if (n) rp[1].appendChild(n); });
          rp[2].appendChild(el('div', 'iq-welcome', '<img class="iq-avatar" src="assets/img/photo/brenda-bank-lach.webp" alt=""><h3>Tot gauw!</h3>'));
          rp[2].appendChild(el('div', 'iq-photo', '<img src="assets/img/photo/brenda-bank-lach.webp" alt="" loading="lazy">'));
          var acts = inline.querySelector('.intake-actions'); if (acts) rp[2].appendChild(acts);
          lp.forEach(function (n) { L.appendChild(n); }); rp.forEach(function (n) { R.appendChild(n); });
          var err = inline.querySelector('.intake-error'), done = inline.querySelector('.intake-done');
          if (err) L.appendChild(err); if (done) R.appendChild(done);
          var nav = el('div', 'iq-nav', '<button type="button" class="iq-prev">← Terug</button><button type="button" class="btn btn-primary iq-next">Volgende →</button>');
          R.appendChild(nav);
          inline.appendChild(L); inline.appendChild(R);
          ['wat', 'hoop'].forEach(function (n) { var t = inline.elements[n]; if (t) { t.rows = 2; t.maxLength = 120; } });
          var TITLES = ['Even kennismaken', 'Wat speelt er?', 'Klopt dit zo?'];
          var val = function (n) { var f = inline.elements[n]; return f ? String(f.value || '').trim() : ''; };
          var picked = function (n) { return [].map.call(inline.querySelectorAll('input[name="' + n + '"]:checked'), function (i) { return i.value; }); };
          var esc = function (t) { return t.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
          /* summary: every answer can be changed right here (type, or tap an option) */
          inline._summary = function () {
            var box3 = lp[2]; box3.innerHTML = '';
            var dl = el('div', 'iq-sum');
            /* layout 5: the summary as a few plain sentences, with a link to adjust */
            var sen = el('div', 'iq-sentence');
            var PLAN = { kennis: 'kennismaken', sessie: 'een losse sessie', traject: 'het traject van drie sessies' };
            var upd = function () {
              var n = val('naam'), tel = val('telefoon'), w = picked('traject').map(function (x) { return x.toLowerCase(); }),
                  d = picked('duur')[0], m = picked('moment').map(function (x) { return x.toLowerCase(); }), wat = val('wat'), hoop = val('hoop');
              var join = function (a) { return a.length > 1 ? a.slice(0, -1).join(', ') + ' en ' + a[a.length - 1] : a[0]; };
              var t = '<p><strong>' + esc(n || 'Jij') + '</strong> wil graag <strong>' + PLAN[chosen] + '</strong>.</p>';
              if (w.length || d) t += '<p>' + (w.length ? 'Het gaat over <strong>' + esc(join(w)) + '</strong>' : 'Het speelt') + (d ? (w.length ? ', en het speelt ' : ' ') + '<strong>' + esc(d === 'Langer dan een jaar' ? 'al langer dan een jaar' : d.toLowerCase()) + '</strong>' : '') + '.</p>';
              if (m.length || tel) t += '<p>Bereikbaar' + (m.length ? ' in de <strong>' + esc(join(m)) + '</strong>' : '') + (tel ? ' op <strong>' + esc(tel) + '</strong>' : '') + '.</p>';
              if (wat) t += '<p class="iq-quote">“' + esc(wat) + '”</p>';
              if (hoop) t += '<p class="iq-quote iq-quote--soft">Je hoopt: “' + esc(hoop) + '”</p>';
              sen.innerHTML = t;
            };
            var adjust = el('button', 'iq-adjust', 'Iets aanpassen'); adjust.type = 'button';
            adjust.addEventListener('click', function () { var on = box3.classList.toggle('is-editing'); adjust.textContent = on ? 'Klaar' : 'Iets aanpassen'; if (!on) upd(); });
            var head = function (t, key) { var h = el('p', 'iq-group', t); h.dataset.key = key; dl.appendChild(h); };
            var row = function (key, label, node, isOpts) {
              var r = el('div', 'iq-row' + (isOpts ? ' iq-row--opts' : '')); r.dataset.key = key;
              r.appendChild(el('span', 'iq-k', label)); r.appendChild(node);
              if (isOpts) { var w = el('button', 'iq-change', 'wijzig'); w.type = 'button'; w.addEventListener('click', function () { var open = r.classList.toggle('is-open'); w.textContent = open ? 'klaar' : 'wijzig'; }); r.appendChild(w); }
              dl.appendChild(r);
            };
            /* chosen options always come first, so the choices line up like a checklist */
            var opts = function (key, label, items, isOn, onTap) {
              var wrap = el('div', 'iq-opts');
              var draw = function () {
                wrap.innerHTML = '';
                var list = items().slice().sort(function (x, y) { return (isOn(y) ? 1 : 0) - (isOn(x) ? 1 : 0); });
                list.forEach(function (it) {
                  var on = isOn(it), b = el('button', 'iq-opt' + (on ? ' is-on' : ''), esc(it.label)); b.type = 'button';
                  b.setAttribute('aria-pressed', on ? 'true' : 'false');
                  b.addEventListener('click', function () { onTap(it); draw(); upd(); });
                  wrap.appendChild(b);
                });
                wrap.classList.toggle('is-empty', !list.some(isOn));
              };
              draw(); row(key, label, wrap, true);
            };
            var inputs = function (name) { return [].map.call(inline.querySelectorAll('input[name="' + name + '"]'), function (i) { return { label: i.value, inp: i }; }); };
            var tapInput = function (it) { it.inp.checked = it.inp.type === 'radio' ? true : !it.inp.checked; };
            var text = function (name, label, multi) {
              var f = inline.elements[name]; if (!f) return;
              var i = el(multi ? 'textarea' : 'input', 'iq-edit'); if (multi) { i.rows = 2; i.maxLength = 120; } else i.type = name === 'telefoon' ? 'tel' : 'text';
              i.value = f.value; i.placeholder = 'Nog niet ingevuld'; i.setAttribute('aria-label', label);
              var fit = function () { if (!multi) return; i.style.height = 'auto'; i.style.height = Math.min(i.scrollHeight, 2 * 21 + 10) + 'px'; };
              i.addEventListener('input', function () { f.value = i.value; fit(); upd(); });
              row(name, label, i, false); requestAnimationFrame(fit); setTimeout(fit, 0);
            };
            head('Je keuzes', 'g1'); head('Over jou', 'g2');
            opts('keuze', 'Je keuze', function () { return [{ k: 'kennis', label: 'Kennismaken' }, { k: 'sessie', label: 'Losse sessie' }, { k: 'traject', label: 'Traject' }]; },
              function (it) { return chosen === it.k; }, function (it) { if (inline._pick) inline._pick(it.k); });
            text('naam', 'Naam'); text('telefoon', 'Telefoon');
            opts('traject', 'Waarmee', function () { return inputs('traject'); }, function (it) { return it.inp.checked; }, tapInput);
            text('wat', 'Wat er speelt', true);
            opts('duur', 'Hoe lang', function () { return inputs('duur'); }, function (it) { return it.inp.checked; }, tapInput);
            opts('moment', 'Bereikbaar', function () { return inputs('moment'); }, function (it) { return it.inp.checked; }, tapInput);
            text('hoop', 'Wat je hoopt', true);
            upd(); box3.appendChild(sen); box3.appendChild(dl); box3.appendChild(adjust);
          };
          var cur = 0;
          var show = function (i) {
            cur = i;
            lp.forEach(function (n, k) { n.hidden = k !== i; }); rp.forEach(function (n, k) { n.hidden = k !== i; });
            title.textContent = TITLES[i]; inline._cur = i;
            var bk = inline.querySelector('.intake-back'); if (bk) bk.textContent = i ? '← Vorige stap' : (card.classList.contains('practical-card--cta') ? '← Terug' : '← Terug naar de stappen'); if (bk) bk.style.visibility = (!i && card.classList.contains('practical-card--contact')) ? 'hidden' : '';
            var html = '<span class="iq-count">' + (i + 1) + ' van 3</span>';
            for (var d = 0; d < 3; d++) html += '<span class="iq-dot' + (d <= i ? ' is-on' : '') + '"></span>';
            top.querySelector('.iq-dots').innerHTML = html;
            nav.querySelector('.iq-prev').style.visibility = i ? 'visible' : 'hidden';
            nav.querySelector('.iq-next').hidden = i === 2;
            if (i === 2) inline._summary();
            if (err) err.hidden = true;
          };
          var need = [[inline.elements.naam], [inline.elements.wat]];
          nav.querySelector('.iq-next').addEventListener('click', function () {
            var miss = (need[cur] || []).filter(function (f) { return f && !String(f.value || '').trim(); });
            if (miss.length) { if (err) err.hidden = false; miss[0].focus(); return; }
            show(cur + 1);
            var first = lp[cur].querySelector('input, textarea'); if (first) first.focus({ preventScroll: true });
          });
          nav.querySelector('.iq-prev').addEventListener('click', function () { if (cur) show(cur - 1); });
          inline._show = show;
          show(0);
        }
        inline._pick = pick;
        syncQuiz();
        inline._show(0);
        inline.style.gridTemplateColumns = getComputedStyle(card).gridTemplateColumns;
        inline.hidden = false;
        void inline.offsetWidth; card.classList.add('is-quiz');
        setTimeout(function () { var first = inline.querySelector('.iq-pane:not([hidden]) input'); if (first) first.focus({ preventScroll: true }); }, 650);
        if (!inline.dataset.bound) {
          inline.dataset.bound = '1';
          inline.querySelector('.intake-back').addEventListener('click', function () {
            if (inline._cur) { inline._show(inline._cur - 1); return; }
            if (card.classList.contains('practical-card--cta')) { var band = card.closest('.cta-band'); if (band) { band.classList.remove('is-intake'); band.style.height = ''; } }
            card.classList.remove('is-quiz'); syncQuiz = null;
            setTimeout(function () { if (!card.classList.contains('is-quiz')) inline.hidden = true; }, 650);
            cta.focus({ preventScroll: true });
          });
        }
        return;
      }
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



/* poem written by hand: each letter, the swash and Brenda's signature draw stroke by stroke */
(function(){
  var el=document.querySelector('.book-hand'); if(!el) return;
  var glyphs=[].slice.call(el.querySelectorAll('.hand-svg path'));
  var swash=el.querySelector('.hand-swash path');
  var sig=[].slice.call(el.querySelectorAll('.hand-sig mask path'));
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function prep(p){ var L=p.getTotalLength(); p.style.strokeDasharray=L+' '+L; p.style.strokeDashoffset=L; return L; }
  function finish(){ glyphs.forEach(function(p){p.style.strokeDashoffset=0;p.style.fillOpacity=1;}); if(swash)swash.style.strokeDashoffset=0; sig.forEach(function(p){p.style.strokeDashoffset=0;}); el.classList.add('is-done'); }
  // each letter's thick pen line is clipped to the letter itself, so ink appears filled as it is traced
  var svg=el.querySelector('.hand-svg'), NS='http://www.w3.org/2000/svg';
  if(svg){ var defs=document.createElementNS(NS,'defs'); svg.insertBefore(defs,svg.firstChild);
    glyphs.forEach(function(p,i){ var c=document.createElementNS(NS,'clipPath'); c.setAttribute('id','hand-c'+i);
      var q=document.createElementNS(NS,'path'); q.setAttribute('d',p.getAttribute('d')); c.appendChild(q); defs.appendChild(c);
      p.setAttribute('clip-path','url(#hand-c'+i+')'); }); }
  var lens=glyphs.map(prep), swL=swash?prep(swash):0, sigL=sig.map(prep);
  if(reduce){ finish(); return; }
  function run(){
    var t=0, speed=0.0017; // seconds per unit of outline
    glyphs.forEach(function(p,i){
      var d=Math.max(.1,Math.min(.42,lens[i]*speed));
      p.style.transition='stroke-dashoffset '+d+'s linear '+t+'s, fill-opacity .2s ease '+(t+d)+'s';
      t+=d*.5;
    });
    t+=.05;
    if(swash){ swash.style.transition='stroke-dashoffset .4s cubic-bezier(.5,0,.3,1) '+t+'s'; t+=.35; }
    t+=.1;
    sig.forEach(function(p,i){ var d=Math.max(.25,sigL[i]/620); p.style.transition='stroke-dashoffset '+d+'s cubic-bezier(.45,.05,.55,.95) '+t+'s'; t+=d*.95; });
    requestAnimationFrame(function(){ requestAnimationFrame(function(){
      glyphs.forEach(function(p){p.style.strokeDashoffset=0;p.style.fillOpacity=1;});
      if(swash)swash.style.strokeDashoffset=0;
      sig.forEach(function(p){p.style.strokeDashoffset=0;});
    });});
    setTimeout(function(){el.classList.add('is-done');},(t+.2)*1000);
  }
  if(!('IntersectionObserver' in window)){ run(); return; }
  var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ io.disconnect(); run(); } }); },{threshold:.5});
  io.observe(el);
})();

/* Begeleiding menu: highlight the page you are on */
(function () {
  var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav-dd a, .mobile-menu a').forEach(function (a) {
    var f = (a.getAttribute('href') || '').split('#')[0].toLowerCase();
    if (f && f === here) { a.classList.add('is-here'); a.setAttribute('aria-current', 'page'); }
  });
})();

/* quiz choices made: summary layout 2, light green choices, soft photo background on the last slide */
(function () {
  if (!document.querySelector('.intake-inline')) return;
  var h = document.documentElement;
  h.setAttribute('data-sumv', '2'); h.setAttribute('data-pillc', 'licht'); h.setAttribute('data-sendv', 'c3');
})();

/* book page choices made: zine layout 1 for the poems, author section layout 1 */
(function () {
  if (!document.querySelector('.bp-inkijk')) return;
  var h = document.documentElement;
  h.setAttribute('data-inkbg', 'groen'); h.setAttribute('data-zine', '4');
  h.setAttribute('data-auteur', 'b'); h.setAttribute('data-auteurl', '1');
})();


/* contact page: the intake card opens straight into the questions */
(function () {
  var card = document.querySelector('.practical-card--contact'); if (!card) return;
  var cta = card.querySelector('.rate-cta'); if (cta) cta.click();
})();


/* "Zet de stap" from any page: land on the homepage "Zo ziet de begeleiding eruit", in its first state, centred on screen */
(function () {
  var sec = document.getElementById('begeleiding'); if (!sec) return;
  var card = sec.querySelector('.practical-card');
  function reset() {
    if (card && card.classList.contains('is-quiz')) {
      card.classList.remove('is-quiz');
      var f = card.querySelector('.intake-inline'); if (f) f.hidden = true;
    }
  }
  /* if the section's own reveal hasn't started (e.g. a background tab), play the same step-by-step reveal */
  function ensureReveal() {
    setTimeout(function () {
      if (sec.classList.contains('s1')) return;
      [0, 380, 780, 1180, 1650].forEach(function (d, i) { setTimeout(function () { sec.classList.add('s' + (i + 1)); }, d); });
    }, 700);
  }
  function go() {
    var head = (document.querySelector('.site-head') || {}).offsetHeight || 72;
    var top = (sec.querySelector('.practical-head') || sec).getBoundingClientRect().top;
    var bottom = (card || sec).getBoundingClientRect().bottom;
    var h = bottom - top, room = window.innerHeight - head;
    var y = top + window.scrollY - head - Math.max(0, (room - h) / 2);
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, Math.max(0, y));
    document.documentElement.style.scrollBehavior = '';
  }
  function open() {
    if (location.hash !== '#intake') return;
    reset(); go(); ensureReveal();
    [400, 1000, 1600, 2400, 3200].forEach(function (t) { setTimeout(go, t); });
  }
  /* the hero button on the homepage: a visible, gentle scroll down to the section */
  var glideBtns = document.querySelectorAll('.hero a[href="#intake"], .cta-band a[href="#intake"]');
  [].forEach.call(glideBtns, function (heroBtn) { heroBtn.addEventListener('click', function (e) {
    e.preventDefault(); reset();
    var head = (document.querySelector('.site-head') || {}).offsetHeight || 72;
    var top = (sec.querySelector('.practical-head') || sec).getBoundingClientRect().top;
    var bottom = (card || sec).getBoundingClientRect().bottom;
    var target = Math.max(0, top + window.scrollY - head - Math.max(0, (window.innerHeight - head - (bottom - top)) / 2));
    var from = window.scrollY, dist = target - from, t0 = null, dur = Math.min(1600, Math.max(900, Math.abs(dist) / 3));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { go(); return; }
    document.documentElement.style.scrollBehavior = 'auto';
    var ease = function (x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
    t0 = Date.now();
    var step = function () {
      var k = Math.min(1, (Date.now() - t0) / dur);
      window.scrollTo(0, from + dist * ease(k));
      if (k < 1) setTimeout(step, 16); else { document.documentElement.style.scrollBehavior = ''; go(); ensureReveal(); }
    };
    step();
  }); });
  window.addEventListener('hashchange', open);
  window.addEventListener('load', function () { if (location.hash === '#intake') setTimeout(go, 50); }, { once: true });
  if (location.hash === '#intake') setTimeout(open, 350);
})();
