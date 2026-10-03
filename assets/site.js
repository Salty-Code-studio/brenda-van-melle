(function () {
  'use strict';
  var still = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Header: a slightly deeper shadow once the page moves.
  var head = document.getElementById('head');
  function onScroll() { head.classList.toggle('scrolled', window.scrollY > 8); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu.
  var menuButton = document.getElementById('menuBtn');
  var menu = document.getElementById('mobileMenu');
  function toggleMenu(open) {
    menu.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuButton.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
    document.body.style.overflow = open ? 'hidden' : '';
    document.body.classList.toggle('menu-open', open);
  }
  menuButton.addEventListener('click', function () { toggleMenu(!menu.classList.contains('open')); });
  menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { toggleMenu(false); }); });

  // Phones: a calm "next step" bar once the opening section has passed,
  // out of the way again wherever a contact form or contact band is already in view.
  var bar = document.getElementById('mobileCta');
  var opening = document.querySelector('main > section');
  var contactZones = Array.from(document.querySelectorAll('.cta-band, #kennismaken, .foot'));
  if (bar && opening && 'IntersectionObserver' in window) {
    var pastOpening = false;
    var inContact = new Set();
    function syncBar() {
      var show = pastOpening && inContact.size === 0 && !document.body.classList.contains('menu-open');
      bar.classList.toggle('is-visible', show);
      bar.inert = !show;
    }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { pastOpening = !entry.isIntersecting && entry.boundingClientRect.top < 0; });
      syncBar();
    }).observe(opening);
    var contactObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { if (entry.isIntersecting) inContact.add(entry.target); else inContact.delete(entry.target); });
      syncBar();
    }, { threshold: 0.05 });
    contactZones.forEach(function (zone) { contactObserver.observe(zone); });
    menuButton.addEventListener('click', syncBar);
  }

  // "Stap nemen": the visitor takes the step themselves, then the questionnaire unfolds.
  document.querySelectorAll('.step-btn').forEach(function (button) {
    var panel = document.getElementById(button.getAttribute('aria-controls'));
    if (!panel) return;
    button.addEventListener('click', function () {
      panel.classList.add('is-open');
      panel.inert = false;
      button.setAttribute('aria-expanded', 'true');
      button.hidden = true;
      setTimeout(function () {
        var y = panel.getBoundingClientRect().top + window.scrollY - head.offsetHeight - 20;
        window.scrollTo({ top: y, behavior: still.matches ? 'auto' : 'smooth' });
        var first = panel.querySelector('input[name="naam"]');
        if (first) first.focus({ preventScroll: true });
      }, 160);
    });
  });

  // Intake questionnaire: composes a message the visitor sends from their own WhatsApp or e-mail.
  document.querySelectorAll('form.intake-card').forEach(function (form) {
    var error = form.querySelector('.intake-error');
    var done = form.querySelector('.intake-done');
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var via = event.submitter && event.submitter.dataset.via === 'email' ? 'email' : 'whatsapp';
      var value = function (name) { var el = form.elements[name]; return el ? String(el.value || '').trim() : ''; };
      var checked = function (name) { return Array.from(form.querySelectorAll('input[name="' + name + '"]:checked')).map(function (i) { return i.value; }); };
      var naam = value('naam'), wat = value('wat');
      error.hidden = !!(naam && wat);
      if (!naam || !wat) { (naam ? form.elements.wat : form.elements.naam).focus(); return; }
      var traject = checked('traject')[0] || 'Weet ik nog niet';
      var lines = ['Hallo Brenda,', '', 'Ik wil graag een kennismaking plannen.', '', 'Begeleiding: ' + traject, 'Naam: ' + naam];
      if (value('telefoon')) lines.push('Telefoon: ' + value('telefoon'));
      lines.push('', 'Wat er speelt:', wat);
      if (checked('duur').length) lines.push('', 'Hoe lang dit al speelt: ' + checked('duur')[0]);
      if (checked('moment').length) lines.push('Goed bereikbaar: ' + checked('moment').join(', ').toLowerCase());
      if (value('hoop')) lines.push('', 'Wat ik hoop:', value('hoop'));
      lines.push('', 'Groet,', naam);
      var message = lines.join('\n');
      if (via === 'whatsapp') {
        window.open('https://wa.me/31654725032?text=' + encodeURIComponent(message), '_blank', 'noopener');
        done.textContent = 'Je bericht staat klaar in WhatsApp. Verstuur het daar, dan neemt Brenda contact met je op.';
      } else {
        window.location.href = 'mailto:bjvanmelle@gmail.com?subject=' + encodeURIComponent('Kennismaking: ' + traject) + '&body=' + encodeURIComponent(message);
        done.textContent = 'Je e-mail staat klaar. Verstuur hem vanuit je mailprogramma, dan neemt Brenda contact met je op.';
      }
      done.hidden = false;
    });
  });

  // Reviews: equal-height cards; longer reviews fold open with "Lees verder".
  document.querySelectorAll('.story .quote').forEach(function (card) {
    var text = card.querySelector('.review-bubble p');
    if (!text || text.scrollHeight <= text.clientHeight + 2) return;
    var more = document.createElement('button');
    more.type = 'button';
    more.className = 'review-more';
    more.textContent = 'Lees verder';
    more.setAttribute('aria-expanded', 'false');
    more.addEventListener('click', function () {
      var open = card.classList.toggle('is-open');
      more.textContent = open ? 'Minder tonen' : 'Lees verder';
      more.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    card.querySelector('.review-bubble').insertAdjacentElement('afterend', more);
  });

  // Quiet, staggered reveals as sections come into view.
  document.querySelectorAll('.recognition-copy p,.cta-band .eyebrow,.cta-band h2,.cta-band .btn,.cta-band .script,.foot-col').forEach(function (el, i) {
    el.classList.add('reveal');
    el.style.transitionDelay = (i % 3) * 80 + 'ms';
  });
  var recognition = document.querySelector('.recognition-copy');
  if (recognition) recognition.classList.remove('reveal', 'd1');
  var revealed = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || still.matches) {
    revealed.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  document.documentElement.classList.add('has-motion');
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { entry.target.classList.add('in'); revealObserver.unobserve(entry.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
  revealed.forEach(function (el) { revealObserver.observe(el); });
})();
