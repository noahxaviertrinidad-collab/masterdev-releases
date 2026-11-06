// MasterDev · web pública. 1) Idioma (es/en): el que elegiste, o el del navegador. 2) El botón de descarga apunta al zip
// del último release de GitHub (masterdev-releases), con su versión, fecha y tamaño. Si la API falla, el enlace se queda en
// la página de releases, que siempre funciona.
(function () {
  var root = document.documentElement;
  var btn = document.getElementById('lang-btn');
  function setLang(l) {
    root.setAttribute('data-lang', l);
    root.setAttribute('lang', l);
    if (btn) btn.textContent = l === 'es' ? 'EN' : 'ES';
    try { localStorage.setItem('md.lang', l); } catch (e) { /* sin almacenamiento */ }
    fillDates();
  }
  var saved = null;
  try { saved = localStorage.getItem('md.lang'); } catch (e) { /* idem */ }
  var initial = saved || ((navigator.language || 'es').toLowerCase().indexOf('es') === 0 ? 'es' : 'en');
  if (btn) btn.addEventListener('click', function () { setLang(root.getAttribute('data-lang') === 'es' ? 'en' : 'es'); });

  var release = null;
  function fillDates() {
    if (!release) return;
    var lang = root.getAttribute('data-lang');
    var d = new Date(release.published_at);
    var date = isNaN(d) ? '' : d.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    document.querySelectorAll('.dl-date').forEach(function (el) { el.textContent = date; });
  }
  setLang(initial);

  var API = 'https://api.github.com/repos/noahxaviertrinidad-collab/masterdev-releases/releases/latest';
  fetch(API, { headers: { Accept: 'application/vnd.github+json' } })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (rel) {
      var asset = (rel.assets || []).filter(function (a) { return /^MasterDev-[\d.]+-win-x64\.zip$/.test(a.name); })[0];
      if (!asset) return;
      release = rel;
      var v = (rel.tag_name || '').replace(/^v/, '');
      document.querySelectorAll('.dl-link').forEach(function (a) { a.href = asset.browser_download_url; });
      document.querySelectorAll('.dl-version').forEach(function (el) { el.textContent = 'MasterDev ' + v; });
      document.querySelectorAll('.dl-version-num').forEach(function (el) { el.textContent = v; });
      var mb = Math.round(asset.size / 1048576);
      document.querySelectorAll('.dl-size').forEach(function (el) { el.textContent = '· ' + mb + ' MB'; });
      fillDates();
    })
    .catch(function () { /* se queda el enlace a la página de releases */ });
})();
