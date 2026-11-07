// MasterDev · web pública.
// 1) Menú del móvil. 2) El botón de descarga apunta al zip del último release de GitHub (masterdev-releases), con su versión,
//    fecha y tamaño; si la API falla, el enlace se queda en la página de releases, que siempre funciona.
// 3) Idioma: cada idioma tiene su página (/ y /en/). Se recuerda el que eliges y, la primera vez, se sugiere el otro
//    si tu navegador no está en el idioma de la página (sin redirigir: los buscadores ven las dos).
(function () {
  var root = document.documentElement;
  var lang = (root.getAttribute('lang') || 'es').slice(0, 2);

  // 1) Menú
  var btn = document.getElementById('menu-btn');
  var menu = document.getElementById('menu');
  function setMenu(open) {
    if (!btn || !menu) return;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.classList.toggle('open', open);
  }
  if (btn && menu) {
    btn.addEventListener('click', function () { setMenu(btn.getAttribute('aria-expanded') !== 'true'); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); btn.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 860) setMenu(false); });
  }

  // 3) Idioma
  function store(l) { try { localStorage.setItem('md.lang', l); } catch (e) { /* sin almacenamiento */ } }
  document.querySelectorAll('[data-lang-to]').forEach(function (a) {
    a.addEventListener('click', function () { store(a.getAttribute('data-lang-to')); });
  });
  var saved = null;
  try { saved = localStorage.getItem('md.lang'); } catch (e) { /* idem */ }
  var browser = (navigator.language || 'es').toLowerCase().indexOf('es') === 0 ? 'es' : 'en';
  var other = document.querySelector('.menu .lang');
  if (!saved && browser !== lang && other && !document.querySelector('.notfound')) {
    var bar = document.createElement('div');
    bar.className = 'lang-hint';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', browser === 'en' ? 'Language' : 'Idioma');
    bar.innerHTML = browser === 'en'
      ? '<span lang="en">This page is also available in English.</span> <a lang="en" href="' + other.href + '">View in English</a> <button type="button" lang="en">Stay in Spanish</button>'
      : '<span lang="es">Esta página también está en español.</span> <a lang="es" href="' + other.href + '">Ver en español</a> <button type="button" lang="es">Seguir en inglés</button>';
    bar.querySelector('a').addEventListener('click', function () { store(browser); });
    bar.querySelector('button').addEventListener('click', function () { store(lang); bar.remove(); });
    document.body.appendChild(bar);
  }

  // 4) Botones «Copiar»: data-copy="texto" o data-copy-from="id del elemento"
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.copy');
    if (!b) return;
    var from = b.getAttribute('data-copy-from');
    var text = from ? (document.getElementById(from) || {}).textContent : b.getAttribute('data-copy');
    if (!text || !navigator.clipboard) return;
    var label = b.textContent;
    navigator.clipboard.writeText(text.trim()).then(function () {
      b.textContent = lang === 'es' ? 'Copiado ✓' : 'Copied ✓';
      setTimeout(function () { b.textContent = label; }, 1600);
    }).catch(function () { /* el texto sigue visible para copiarlo a mano */ });
  });

  // 5) Si no estás en Windows, lo decimos junto a la descarga
  var isWin = /Windows/i.test(navigator.userAgent) || (navigator.userAgentData && navigator.userAgentData.platform === 'Windows');
  if (!isWin) document.querySelectorAll('.not-win').forEach(function (el) { el.hidden = false; });

  // 6) Galería de capturas (portada): las pestañas cambian la imagen y el pie
  document.querySelectorAll('[data-gallery]').forEach(function (g) {
    var img = g.querySelector('img'), cap = g.querySelector('.g-cap');
    var tabs = g.querySelectorAll('[role="tab"]');
    tabs.forEach(function (b, i) {
      b.addEventListener('click', function () {
        tabs.forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
        img.src = img.getAttribute('data-base') + b.getAttribute('data-shot') + '.jpg';
        if (cap) cap.textContent = b.getAttribute('data-cap');
      });
      b.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        var n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); n.click();
      });
    });
  });

  // 7) Novedades: todas las versiones de GitHub, con sus notas en texto plano
  var relBox = document.getElementById('releases');
  if (relBox) {
    fetch('https://api.github.com/repos/noahxaviertrinidad-collab/masterdev-releases/releases?per_page=30', { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (list) {
        // Solo las versiones públicas (v1.2.3); las internas para amigos (v1, v2…) no salen
        list = list.filter(function (r) { return !r.draft && /^v?\d+\.\d+\.\d+$/.test(r.tag_name || ''); })
          .sort(function (a, b) { return new Date(b.published_at) - new Date(a.published_at); });
        if (!list.length) return;
        relBox.textContent = '';
        list.forEach(function (rel, i) {
          var art = document.createElement('article'); art.className = 'rel';
          var h = document.createElement('div'); h.className = 'rel-h';
          var t = document.createElement('h2'); t.textContent = rel.name || rel.tag_name; h.appendChild(t);
          if (i === 0) { var s = document.createElement('p'); s.className = 'st ok'; s.textContent = relBox.getAttribute('data-latest'); h.appendChild(s); }
          var d = new Date(rel.published_at);
          var dt = document.createElement('p'); dt.className = 'small mono';
          dt.textContent = isNaN(d) ? '' : d.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
          h.appendChild(dt); art.appendChild(h);
          var body = document.createElement('p'); body.className = 'rel-body';
          body.textContent = (rel.body || '').replace(/\r/g, '').replace(/^#+\s*/gm, '').replace(/^\s*[-*]\s+/gm, '• ').replace(/[*_`]/g, '').trim() || relBox.getAttribute('data-empty');
          art.appendChild(body);
          var foot = document.createElement('p'); foot.className = 'rel-foot';
          var a = document.createElement('a'); a.href = rel.html_url; a.textContent = relBox.getAttribute('data-dl') + ' ' + (rel.tag_name || '') + ' →';
          foot.appendChild(a); art.appendChild(foot);
          relBox.appendChild(art);
        });
      })
      .catch(function () { /* queda el enlace a GitHub */ });
  }

  // 2) Descarga
  var API ='https://api.github.com/repos/noahxaviertrinidad-collab/masterdev-releases/releases/latest';
  if (!document.querySelector('.dl-link')) return;
  fetch(API, { headers: { Accept: 'application/vnd.github+json' } })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (rel) {
      var asset = (rel.assets || []).filter(function (a) { return /^MasterDev-[\d.]+-win-x64\.zip$/.test(a.name); })[0];
      if (!asset) return;
      var v = (rel.tag_name || '').replace(/^v/, '');
      var d = new Date(rel.published_at);
      var date = isNaN(d) ? '' : d.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      document.querySelectorAll('.dl-link').forEach(function (a) { a.href = asset.browser_download_url; });
      document.querySelectorAll('.dl-version').forEach(function (el) { el.textContent = 'MasterDev ' + v; });
      document.querySelectorAll('.dl-version-num').forEach(function (el) { el.textContent = v; });
      document.querySelectorAll('.dl-date').forEach(function (el) { el.textContent = date; });
      document.querySelectorAll('.dl-size').forEach(function (el) { el.textContent = '· ' + Math.round(asset.size / 1048576) + ' MB'; });
      document.querySelectorAll('.zip-name').forEach(function (el) { el.textContent = asset.name; });
      var cmd = document.getElementById('hash-cmd');
      if (cmd) cmd.textContent = '(Get-FileHash "$env:USERPROFILE\\Downloads\\' + asset.name + '" -Algorithm SHA256).Hash';
      // Huella SHA-256 (GitHub la calcula al subir el archivo) y su análisis en VirusTotal
      var sha = /^sha256:([0-9a-f]{64})$/i.exec(asset.digest || '');
      var shaEl = document.getElementById('sha-value');
      if (shaEl) shaEl.textContent = sha ? sha[1].toUpperCase() : (lang === 'es' ? 'Está en latest.json de la versión, en GitHub.' : "It's in the release's latest.json on GitHub.");
      if (sha) document.querySelectorAll('.vt-link').forEach(function (a) {
        a.href = 'https://www.virustotal.com/gui/file/' + sha[1].toLowerCase();
        a.hidden = false;
        var note = a.parentNode.querySelector('.vt-note');
        if (note) note.hidden = false;
      });
      // Qué hay de nuevo: las notas del release (texto plano) o, si no tiene, su nombre y fecha
      var body = (rel.body || '').replace(/\r/g, '').replace(/[#*_`>]/g, '').trim();
      document.querySelectorAll('.wn-text').forEach(function (el) {
        el.textContent = body ? (body.length > 420 ? body.slice(0, 420) + '…' : body) : (rel.name || ('MasterDev ' + v)) + (date ? ' · ' + date : '');
      });
      document.querySelectorAll('.wn-link').forEach(function (a) { if (rel.html_url) a.href = rel.html_url; });
    })
    .catch(function () { /* se queda el enlace a la página de releases */ });
})();
