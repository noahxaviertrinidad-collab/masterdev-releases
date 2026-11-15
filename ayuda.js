// MasterDev · web pública · Build 171 (GU44): el buscador del centro de ayuda (ayuda.html). Sin red fuera de esta web: lee
// ayuda-index.json (lo genera tools/ayuda.ts desde la Guía de la app) y busca en el navegador. Lo que escribes no sale de aquí.
(function () {
  var box = document.querySelector('[data-help]');
  if (!box) return;
  var es = (document.documentElement.getAttribute('lang') || 'es').slice(0, 2) === 'es';
  var q = box.querySelector('input[type=search]');
  var out = box.querySelector('.help-results');
  var count = box.querySelector('.help-count');
  var lvBtns = box.querySelectorAll('[data-lv]');
  var level = '';
  var items = null;

  // <search>: puntuación por palabras, sin acentos; título > sección > palabras clave > texto.
  var STOP = { de: 1, la: 1, el: 1, en: 1, y: 1, a: 1, un: 1, una: 1, los: 1, las: 1, que: 1, como: 1, se: 1, mi: 1, me: 1, the: 1, to: 1, how: 1, do: 1, i: 1, my: 1, of: 1, and: 1, in: 1, is: 1, what: 1, can: 1 };
  function fold(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function words(s) { return (fold(s).match(/[a-z0-9ñ]+/g) || []).filter(function (w) { return !STOP[w] && w.length > 1; }); }
  function score(it, ws) {
    var t = fold(it.t), c = fold(it.c), k = fold(it.kw), x = fold(it.x), n = 0, hit = 0;
    for (var i = 0; i < ws.length; i++) {
      var w = ws[i], stem = w.length > 4 ? w.slice(0, w.length - 1) : w, s = 0;
      if (t.indexOf(stem) >= 0) s += 6;
      if (c.indexOf(stem) >= 0) s += 3;
      if (k.indexOf(stem) >= 0) s += 3;
      if (x.indexOf(stem) >= 0) s += 1;
      if (s) hit++;
      n += s;
    }
    if (!hit) return 0;
    return n * (hit / ws.length) + (it.k === 'faq' ? 1 : 0);
  }
  function search(text, lv, list) {
    var ws = words(text);
    if (!ws.length) return [];
    return list.map(function (it) { return { it: it, s: (!lv || it.lv === lv) ? score(it, ws) : 0 }; })
      .filter(function (r) { return r.s > 0; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 12).map(function (r) { return r.it; });
  }
  // </search>
  window.mdHelpSearch = search; // para las pruebas de la web

  function paint() {
    var text = q.value.trim();
    if (!items || text.length < 2) { out.hidden = true; out.textContent = ''; count.textContent = ''; return; }
    var res = search(text, level, items);
    out.textContent = '';
    res.forEach(function (it) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = it.h;
      a.textContent = it.t;
      var ctx = document.createElement('span');
      ctx.className = 'small';
      ctx.textContent = ' · ' + (it.k === 'faq' ? (es ? 'Pregunta frecuente' : 'FAQ') : it.c);
      var p = document.createElement('p');
      p.className = 'small';
      p.textContent = it.x.length > 160 ? it.x.slice(0, 157) + '…' : it.x;
      li.appendChild(a); li.appendChild(ctx); li.appendChild(p);
      out.appendChild(li);
    });
    out.hidden = res.length === 0;
    count.textContent = res.length ? (es ? res.length + ' resultados' : res.length + ' results') : (es ? 'Nada con esas palabras. Prueba con otras, o mira el índice de abajo.' : 'Nothing with those words. Try others, or check the index below.');
  }

  lvBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      level = b.getAttribute('data-lv') || '';
      lvBtns.forEach(function (x) { x.classList.toggle('on', x === b); });
      document.querySelectorAll('.help-list li[data-lv]').forEach(function (li) { li.hidden = !!level && li.getAttribute('data-lv') !== level; });
      paint();
    });
  });
  var timer = null;
  q.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(paint, 120); });
  fetch(box.getAttribute('data-index'), { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (j) {
    items = Array.isArray(j) ? j : [];
    var pre = new URLSearchParams(location.search).get('q');
    if (pre) { q.value = pre; }
    paint();
  }).catch(function () { count.textContent = es ? 'No se pudo cargar el buscador.' : 'The search could not be loaded.'; });
})();
