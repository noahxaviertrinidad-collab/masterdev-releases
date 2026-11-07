// MasterDev · web pública · cuentas (2026-11-06). La web es estática: habla directamente con el servidor MasterDev oficial
// (api.masterdev.website, con CORS solo para esta web). La sesión es el token del servidor, guardado en este navegador
// (localStorage md.token). La misma cuenta sirve en la app: allí, «¿Te creaste la cuenta en masterdev.website? Entra con ella».
(function () {
  var box = document.querySelector('[data-account]');
  if (!box) return;
  var API = box.getAttribute('data-api');
  var es = (document.documentElement.getAttribute('lang') || 'es').slice(0, 2) === 'es';
  function L(a, b) { return es ? a : b; }
  var DEVICE = 'Web · masterdev.website';

  // ── sesión ──
  function token() { try { return localStorage.getItem('md.token'); } catch (e) { return null; } }
  function setSession(t, me) {
    try {
      if (t) { localStorage.setItem('md.token', t); localStorage.setItem('md.me', JSON.stringify({ username: me.username, displayName: me.displayName })); }
      else { localStorage.removeItem('md.token'); localStorage.removeItem('md.me'); }
    } catch (e) { /* sin almacenamiento: la sesión dura lo que esta página */ }
    document.dispatchEvent(new CustomEvent('md-session'));
  }

  // ── API ──
  var ERR = {
    bad_credentials: L('El @usuario o la contraseña no son correctos.', 'The @username or password is incorrect.'),
    username_taken: L('Ese @usuario ya lo usa otra persona.', 'That @username is already taken.'),
    rate_limited: L('Demasiados intentos. Espera unos minutos y vuelve a probar.', 'Too many attempts. Wait a few minutes and try again.'),
    registration_closed: L('Ahora mismo no se pueden crear cuentas nuevas.', "New accounts can't be created right now."),
    server_full: L('El servidor está lleno ahora mismo.', 'The server is full right now.'),
    network: L('No se pudo contactar con el servidor de MasterDev. Comprueba tu conexión y vuelve a probar.', "Couldn't reach the MasterDev server. Check your connection and try again."),
    generic: L('Algo falló. Vuelve a probar en un momento.', 'Something went wrong. Try again in a moment.')
  };
  function call(method, path, body, auth) {
    var h = { Accept: 'application/json' };
    if (body !== undefined) h['Content-Type'] = 'application/json';
    if (auth) h.Authorization = 'Bearer ' + token();
    return fetch(API + path, { method: method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) })
      .catch(function () { var e = new Error(ERR.network); e.code = 'network'; throw e; })
      .then(function (r) {
        return r.text().then(function (txt) {
          var data = null; try { data = txt ? JSON.parse(txt) : null; } catch (e) { /* no es JSON */ }
          if (r.ok) return data;
          var code = (data && data.code) || (r.status === 429 ? 'rate_limited' : r.status === 401 ? 'bad_credentials' : 'generic');
          var err = new Error((!es && ERR[code]) || (data && data.message) || ERR[code] || ERR.generic);
          err.code = code; err.status = r.status; err.field = data && data.field;
          throw err;
        });
      });
  }

  // ── vistas por #hash ──
  var views = box.querySelectorAll('.acct-view');
  function route() {
    var want = (location.hash || '').slice(1);
    var logged = !!token();
    if (logged) want = 'mi-cuenta';
    else if (want !== 'entrar') want = 'crear';
    views.forEach(function (v) { v.hidden = v.getAttribute('data-view') !== want; });
    if (want === 'mi-cuenta') loadMe();
  }
  window.addEventListener('hashchange', route);

  function showErr(form, msg) { var p = form.querySelector('.form-err'); p.textContent = msg; p.hidden = !msg; }
  function busy(form, on) { var b = form.querySelector('button[type="submit"]'); b.disabled = on; b.setAttribute('aria-busy', on ? 'true' : 'false'); }
  var USER_RE = /^(?!\.)(?!.*\.$)[a-z0-9_.]{2,32}$/;
  function cleanUser(v) { return (v || '').trim().replace(/^@/, '').toLowerCase(); }

  // ── legal (los textos del servidor) ──
  var legal = null;
  call('GET', '/v1/legal').then(function (d) { legal = d; }).catch(function () { /* se reintenta al abrir */ });
  var dlg = document.getElementById('legal-dlg');
  box.addEventListener('click', function (e) {
    var b = e.target.closest('[data-legal]'); if (!b) return;
    var id = b.getAttribute('data-legal');
    function open() {
      var doc = legal && (legal.docs || []).filter(function (x) { return x.id === id; })[0];
      dlg.querySelector('#legal-h').textContent = doc ? doc.title : b.textContent;
      dlg.querySelector('.legal-text').textContent = doc ? doc.text : ERR.network;
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    }
    if (legal) open(); else call('GET', '/v1/legal').then(function (d) { legal = d; open(); }).catch(open);
  });

  // ── crear cuenta ──
  var fc = document.getElementById('f-crear');
  var live = document.getElementById('c-user-live'), liveTimer = 0, lastCheck = null;
  fc.username.addEventListener('input', function () {
    clearTimeout(liveTimer);
    var v = cleanUser(fc.username.value); live.textContent = ''; lastCheck = null;
    if (!USER_RE.test(v)) return;
    liveTimer = setTimeout(function () {
      call('GET', '/v1/auth/username-check?username=' + encodeURIComponent(v)).then(function (r) {
        if (cleanUser(fc.username.value) !== v) return;
        lastCheck = r;
        live.className = 'live ' + (r.available ? 'ok' : 'bad');
        live.textContent = r.available ? L('✓ Libre', '✓ Available') : '✕ ' + (es ? r.message : L('', 'Not available')) + (r.suggestions && r.suggestions.length ? ' · ' + L('Prueba: ', 'Try: ') + r.suggestions.map(function (s) { return '@' + s; }).join(', ') : '');
      }).catch(function () { /* sin comprobación en vivo */ });
    }, 350);
  });
  fc.addEventListener('submit', function (e) {
    e.preventDefault();
    var u = cleanUser(fc.username.value), pw = fc.password.value, role = (fc.querySelector('[name=role]:checked') || {}).value;
    var msg = !USER_RE.test(u) ? L('El @usuario: minúsculas, números, «_» y «.», de 2 a 32.', 'The @username: lowercase letters, numbers, “_” and “.”, 2 to 32.')
      : lastCheck && lastCheck.username === u && !lastCheck.available ? ERR.username_taken
      : pw.length < 8 || pw.length > 128 ? L('La contraseña necesita de 8 a 128 caracteres.', 'The password needs 8 to 128 characters.')
      : pw !== fc.password2.value ? L('Las contraseñas no coinciden.', "The passwords don't match.")
      : !role ? L('Elige qué vienes a hacer.', 'Choose what you are here for.')
      : !fc.age.checked ? L('Para crear una cuenta tienes que tener 13 años o más.', 'You must be 13 or older to create an account.')
      : !fc.legal.checked ? L('Lee y acepta los Términos, la Privacidad y las Normas.', 'Read and accept the Terms, Privacy and Rules.') : '';
    showErr(fc, msg);
    if (msg) return;
    busy(fc, true);
    var body = { username: u, password: pw, device: DEVICE };
    var dn = fc.displayName.value.trim(); if (dn) body.displayName = dn;
    if (legal && legal.versions) body.legal = legal.versions;
    call('POST', '/v1/auth/register', body)
      .then(function (r) {
        setSession(r.token, r.user);
        return call('PATCH', '/v1/me', { role: role }, true).catch(function () { /* el camino se puede poner luego */ });
      })
      .then(function () { fc.reset(); location.hash = 'mi-cuenta'; route(); })
      .catch(function (err) { showErr(fc, err.message); })
      .then(function () { busy(fc, false); });
  });

  // ── entrar ──
  var fe = document.getElementById('f-entrar');
  fe.addEventListener('submit', function (e) {
    e.preventDefault();
    var u = cleanUser(fe.username.value), pw = fe.password.value;
    if (!u || !pw) { showErr(fe, L('Escribe tu @usuario y tu contraseña.', 'Enter your @username and password.')); return; }
    showErr(fe, ''); busy(fe, true);
    call('POST', '/v1/auth/login', { username: u, password: pw, device: DEVICE })
      .then(function (r) { setSession(r.token, r.user); fe.reset(); location.hash = 'mi-cuenta'; route(); })
      .catch(function (err) { showErr(fe, err.message); })
      .then(function () { busy(fe, false); });
  });

  // ── mi cuenta ──
  var fp = document.getElementById('f-perfil');
  function loadMe() {
    call('GET', '/v1/me', undefined, true).then(function (me) {
      box.querySelector('.me-name').textContent = me.displayName || me.username;
      box.querySelector('.me-user').textContent = '@' + me.username;
      box.querySelector('.me-role').textContent = me.role === 'dev' ? L('💻 Creador', '💻 Creator') : me.role === 'gamer' ? L('🎮 Jugador', '🎮 Player') : L('Sin camino elegido', 'No path chosen');
      fp.displayName.value = me.displayName || '';
      fp.querySelectorAll('[name=role]').forEach(function (r) { r.checked = r.value === me.role; });
      try { localStorage.setItem('md.me', JSON.stringify({ username: me.username, displayName: me.displayName })); } catch (e) { /* idem */ }
      var after = null; try { after = sessionStorage.getItem('md.after'); sessionStorage.removeItem('md.after'); } catch (e) { /* idem */ }
      if (after === 'download') { var c = box.querySelector('.dl-ready'); c.classList.add('pulse'); c.querySelector('.dl-link').focus(); }
    }).catch(function (err) {
      if (err.status === 401) { setSession(null); location.hash = 'entrar'; route(); }
      else box.querySelector('.me-name').textContent = '—';
    });
  }
  fp.addEventListener('submit', function (e) {
    e.preventDefault();
    var dn = fp.displayName.value.trim(), role = (fp.querySelector('[name=role]:checked') || {}).value;
    if (dn.length > 32) { showErr(fp, L('El nombre visible tiene como mucho 32 caracteres.', 'The display name is 32 characters at most.')); return; }
    var body = {}; if (dn) body.displayName = dn; if (role) body.role = role;
    showErr(fp, ''); fp.querySelector('.form-ok').hidden = true; busy(fp, true);
    call('PATCH', '/v1/me', body, true)
      .then(function () { fp.querySelector('.form-ok').hidden = false; loadMe(); })
      .catch(function (err) { showErr(fp, err.message); })
      .then(function () { busy(fp, false); });
  });
  box.querySelector('[data-logout]').addEventListener('click', function () {
    call('POST', '/v1/auth/logout', undefined, true).catch(function () { /* se borra igual */ }).then(function () {
      setSession(null); location.hash = 'entrar'; route();
    });
  });

  route();
})();
