// MasterDev · web pública · Build 171 (GU51): la página de estado (estado.html). Pregunta al servidor público si responde
// (GET /v1/status: versión, cuánto lleva encendido y los fallos conocidos abiertos, solo títulos; nada de nadie) y a GitHub por la
// última versión. Si el servidor no contesta en 5 s: «no responde». Todo se pinta con textContent: lo de fuera son datos.
// En la vista previa local (127.0.0.1) se pueden cambiar las direcciones con ?api=…&gh=… (solo a 127.0.0.1), para las pruebas.
(function () {
  var box = document.querySelector('[data-status]');
  if (!box) return;
  var es = (document.documentElement.getAttribute('lang') || 'es').slice(0, 2) === 'es';
  function L(a, b) { return es ? a : b; }
  var API = box.getAttribute('data-api');
  var GH = box.getAttribute('data-gh');
  if (location.hostname === '127.0.0.1') {
    var qs = new URLSearchParams(location.search);
    var local = function (u) { try { return new URL(u).hostname === '127.0.0.1' ? u : null; } catch (e) { return null; } };
    if (qs.get('api') && local(qs.get('api'))) API = qs.get('api');
    if (qs.get('gh') && local(qs.get('gh'))) GH = qs.get('gh');
  }
  var $ = function (s) { return box.querySelector(s); };
  function get(url, ms) {
    var ctl = typeof AbortController === 'function' ? new AbortController() : null;
    var t = setTimeout(function () { if (ctl) ctl.abort(); }, ms);
    var t0 = Date.now();
    return fetch(url, { cache: 'no-store', signal: ctl ? ctl.signal : undefined, headers: { Accept: 'application/json' } })
      .then(function (r) { clearTimeout(t); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json().then(function (j) { return { j: j, ms: Date.now() - t0 }; }); })
      .catch(function (e) { clearTimeout(t); throw e; });
  }
  function fmtUp(s) {
    s = Math.max(0, Number(s) || 0);
    var d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600);
    return d > 0 ? L(d + ' d ' + h + ' h', d + ' d ' + h + ' h') : (h > 0 ? h + ' h' : Math.floor(s / 60) + ' min');
  }
  var STATUS = { investigating: L('Lo estamos mirando', "We're looking into it"), working: L('Arreglándolo', 'Fixing it'), next: L('En la próxima versión', 'In the next version') };

  function check() {
    var srv = $('[data-st=server]'), dot = $('[data-st=dot]'), ver = $('[data-st=version]'), up = $('[data-st=uptime]'), list = $('[data-st=known]');
    srv.textContent = L('Comprobando…', 'Checking…'); dot.className = 'st-dot';
    get(API.replace(/\/$/, '') + '/v1/status', 5000).then(function (r) {
      var j = r.j || {};
      dot.className = 'st-dot ok'; box.setAttribute('data-state', 'ok');
      srv.textContent = L('Responde', 'Up') + ' · ' + r.ms + ' ms';
      ver.textContent = j.version ? String(j.version) : '—';
      up.textContent = fmtUp(j.uptimeS);
      list.textContent = '';
      var known = Array.isArray(j.known) ? j.known.slice(0, 10) : [];
      if (!known.length) { var li0 = document.createElement('li'); li0.textContent = L('Ningún fallo abierto ahora mismo.', 'No open issues right now.'); list.appendChild(li0); }
      known.forEach(function (k) {
        var li = document.createElement('li');
        li.textContent = String(k.title || '').slice(0, 160);
        var s = document.createElement('span'); s.className = 'small'; s.textContent = ' · ' + (STATUS[k.status] || String(k.status || ''));
        li.appendChild(s); list.appendChild(li);
      });
    }).catch(function () {
      dot.className = 'st-dot down'; box.setAttribute('data-state', 'down');
      srv.textContent = L('No responde', 'Not responding');
      ver.textContent = '—'; up.textContent = '—';
      list.textContent = '';
      var li = document.createElement('li'); li.textContent = L('No se pueden ver mientras el servidor no responde.', "They can't be seen while the server isn't responding."); list.appendChild(li);
    });
    var rel = $('[data-st=release]'), when = $('[data-st=released]');
    get(GH, 8000).then(function (r) {
      var j = r.j || {};
      rel.textContent = String(j.name || j.tag_name || '—').slice(0, 60);
      var d = j.published_at ? new Date(j.published_at) : null;
      when.textContent = d && !isNaN(d) ? d.toLocaleDateString(es ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
      box.setAttribute('data-release', 'ok');
    }).catch(function () { rel.textContent = L('No se pudo mirar', "Couldn't check"); when.textContent = ''; box.setAttribute('data-release', 'down'); });
  }
  var again = $('[data-st=again]');
  if (again) again.addEventListener('click', check);
  check();
})();
