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
    window.addEventListener('resize', function () { if (window.innerWidth > 1020) setMenu(false); });
  }

  // 10) Cuenta: el enlace de la barra muestra tu @ con la sesión abierta, y la descarga pide una cuenta de MasterDev
  //     (cuenta.js guarda el token del servidor oficial en md.token).
  function session() { try { var t = localStorage.getItem('md.token'); return t ? JSON.parse(localStorage.getItem('md.me') || '{}') : null; } catch (e) { return null; } }
  function paintAccount() {
    var me = session();
    document.querySelectorAll('.nav-acct').forEach(function (a) {
      a.textContent = me && me.username ? '@' + me.username : (lang === 'es' ? 'Entrar' : 'Sign in');
      a.classList.toggle('on', !!me);
    });
  }
  paintAccount();
  document.addEventListener('md-session', paintAccount);
  document.addEventListener('click', function (e) {
    var a = e.target.closest('.dl-link');
    if (!a || a.hasAttribute('data-gate-ok') || session()) return;
    e.preventDefault();
    try { sessionStorage.setItem('md.after', 'download'); } catch (err) { /* idem */ }
    location.href = 'cuenta.html#crear';
  });

  // 8) Temas (como en la app): «auto» sigue el modo claro u oscuro del sistema (Papel o Terminal)
  var tBtn = document.getElementById('theme-btn'), tMenu = document.getElementById('theme-menu');
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
  function savedTheme() { try { return localStorage.getItem('md.theme') || 'auto'; } catch (e) { return 'auto'; } }
  function applyTheme(choice) {
    var t = choice === 'auto' ? (mq && mq.matches ? 'papel' : 'terminal') : choice;
    root.setAttribute('data-theme', t);
    if (tMenu) tMenu.querySelectorAll('[data-set-theme]').forEach(function (b) { b.setAttribute('aria-checked', b.getAttribute('data-set-theme') === choice ? 'true' : 'false'); });
  }
  applyTheme(savedTheme());
  if (mq && mq.addEventListener) mq.addEventListener('change', function () { if (savedTheme() === 'auto') applyTheme('auto'); });
  function setThemeMenu(open) { if (!tBtn) return; tBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); tMenu.hidden = !open; }
  if (tBtn && tMenu) {
    tBtn.addEventListener('click', function (e) { e.stopPropagation(); setThemeMenu(tMenu.hidden); });
    tMenu.addEventListener('click', function (e) {
      var b = e.target.closest('[data-set-theme]'); if (!b) return;
      var c = b.getAttribute('data-set-theme');
      try { localStorage.setItem('md.theme', c); } catch (err) { /* sin almacenamiento */ }
      applyTheme(c); setThemeMenu(false); tBtn.focus();
    });
    document.addEventListener('click', function (e) { if (!tMenu.hidden && !e.target.closest('.theme-pick')) setThemeMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !tMenu.hidden) { setThemeMenu(false); tBtn.focus(); } });
  }

  // 9) Ilustraciones pixel art (canvas pequeño escalado): cielo, estrellas, montañas y un sprite por sección, con los
  //    colores del tema activo. Se redibujan al cambiar de tema.
  var SPRITES = {
    creadores: ['..bbbbbbbbbbbb..', '..b..........b..', '..b.gggg.....b..', '..b.....cccc.b..', '..b.ggg......b..', '..b......gg..b..', '..b.cc.ggg...b..', '..bbbbbbbbbbbb..', '.......bb.......', '.....bbbbbb.....', 'wwwwwwwwwwwwwwww'],
    jugadores: ['....bbbbbbbb....', '..bbbbbbbbbbbb..', '.bbbgbbbbbbcbbb.', '.bbgggbbbbcbcbb.', '.bbbgbbbbbbcbbb.', '.bbbbbbbbbbbbbb.', '..bbbb....bbbb..', '...bb......bb...'],
    descargar: ['......gggg......', '......gggg......', '......gggg......', '...gggggggggg...', '....gggggggg....', '.....gggggg.....', '......gggg......', '.......gg.......', '..b..........b..', '..bbbbbbbbbbbb..'],
    explora: ['...g........', '...ggg......', '...ggggg....', '...ggg......', '...g........', '...b........', '...b........', '...b........', '..bbb.......', 'bbbbbbbbbbbb']
  };
  function cssVar(n) { return getComputedStyle(root).getPropertyValue(n).trim() || '#39FF88'; }
  function drawScenes() {
    document.querySelectorAll('canvas.pixel-scene').forEach(function (cv) {
      var ctx = cv.getContext('2d'); if (!ctx) return;
      var W = cv.width, H = cv.height, seed = 7;
      function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      var sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, cssVar('--bg')); sky.addColorStop(1, cssVar('--panel-2'));
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = cssVar('--text-2');
      for (var s = 0; s < 40; s++) { ctx.globalAlpha = .25 + rnd() * .6; ctx.fillRect(Math.floor(rnd() * W), Math.floor(rnd() * H * .55), 1, 1); }
      ctx.globalAlpha = 1;
      [['--border', .45, 14], ['--border-2', .62, 9]].forEach(function (layer) {
        ctx.fillStyle = cssVar(layer[0]);
        var y = H * layer[1];
        for (var x = 0; x < W; x++) {
          y += (rnd() - .5) * 2.2; y = Math.max(H * .3, Math.min(H * .85, y));
          ctx.fillRect(x, Math.floor(y + Math.sin(x / layer[2]) * 3), 1, H);
        }
      });
      ctx.fillStyle = cssVar('--green'); ctx.globalAlpha = .55; ctx.fillRect(0, H - 2, W, 1); ctx.globalAlpha = 1;
      var sp = SPRITES[cv.getAttribute('data-scene')];
      if (sp) {
        var ox = Math.floor(W * .72), oy = H - 2 - sp.length;
        var map = { b: cssVar('--text-2'), g: cssVar('--green'), c: cssVar('--cyan'), w: cssVar('--border-2') };
        sp.forEach(function (row, y) { for (var x = 0; x < row.length; x++) { var k = row[x]; if (map[k]) { ctx.fillStyle = map[k]; ctx.fillRect(ox + x, oy + y, 1, 1); } } });
      }
    });
  }
  drawScenes();
  new MutationObserver(drawScenes).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

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
