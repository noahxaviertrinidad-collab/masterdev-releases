// MasterDev · web pública · página Explora: recorrido por la ventana (capturas reales con números), barra de comandos de
// prueba y test «¿Cuál es tu camino?». Textos en los dos idiomas; se usa el de <html lang>.
(function () {
  var es = (document.documentElement.getAttribute('lang') || 'es').slice(0, 2) === 'es';
  function L(a, b) { return es ? a : b; }

  // ── 1) Recorrido ── x/y en % de la captura de 1440×900
  var VIEWS = [
    { id: 'centro', ico: '▦', name: L('Centro', 'Home'),
      desc: L('Tu día de un vistazo: lo siguiente que conviene hacer, tus números y accesos rápidos.', 'Your day at a glance: the next best step, your numbers and quick actions.'),
      pins: [[15, 19, L('Saludo, hora y tu perfil: nivel, motores y estilo.', 'Greeting, time and your profile: level, engines and style.')],
             [58, 20, L('Crear un proyecto, una idea o una tarea para Claude.', 'Create a project, an idea or a task for Claude.')],
             [30, 43, L('El siguiente paso sugerido, según lo que tienes a medias.', 'The suggested next step, based on what you have in progress.')],
             [22, 66, L('Estadísticas: proyectos, ideas, tareas y lo que llevas gastado con Claude.', 'Stats: projects, ideas, tasks and what you have spent on Claude.')],
             [28, 97, L('La barra de comandos: escribe / y aparecen todos.', 'The command bar: type / and every command shows up.')]] },
    { id: 'proyectos', ico: '🎮', name: L('Proyectos', 'Projects'),
      desc: L('Todos tus juegos, con su motor, resolución y estado.', 'All your games, with engine, resolution and status.'),
      pins: [[12, 27, L('Filtra por estado o busca por nombre.', 'Filter by status or search by name.')],
             [79, 21, L('Vincula un juego que ya tienes o crea uno nuevo.', 'Link a game you already have or create a new one.')],
             [17, 40, L('Cada tarjeta: motor, etiquetas y en qué punto está.', 'Each card: engine, tags and where it stands.')]] },
    { id: 'proyecto', ico: '◆', name: L('Un proyecto', 'A project'),
      desc: L('La ficha de un juego: su documento de diseño, su estudio y ▶ Jugar.', 'A game page: its design document, its studio and ▶ Play.'),
      pins: [[24, 17, L('Nombre, motor, resolución y estado.', 'Name, engine, resolution and status.')],
             [80, 22, L('▶ Jugar, publicar, abrir un playtest, la carpeta o VS Code.', '▶ Play, publish, open a playtest, the folder or VS Code.')],
             [22, 40, L('Pestañas: documento de diseño, estudio, referencias, archivos y tareas.', 'Tabs: design document, studio, references, files and tasks.')],
             [87, 42, L('«¿Qué construimos?»: pide algo a Claude sobre este juego.', '“What shall we build?”: ask Claude for something on this game.')]] },
    { id: 'ideas', ico: '💡', name: 'Ideas',
      desc: L('La libreta: ideas en bruto que se convierten en conceptos.', 'The notebook: raw ideas that become concepts.'),
      pins: [[15, 25, L('Filtra: en bruto, refinadas, con proyecto o archivadas.', 'Filter: raw, refined, with a project or archived.')],
             [93, 12, L('Apunta una idea nueva en segundos.', 'Jot down a new idea in seconds.')],
             [14, 35, L('Cada idea con su número, su frase y su estado.', 'Each idea with its number, logline and status.')]] },
    { id: 'tareas', ico: '⌁', name: L('Tareas', 'Tasks'),
      desc: L('Lo que le pides a Claude y lo que está haciendo, en directo.', 'What you ask Claude and what it is doing, live.'),
      pins: [[10, 34, L('Historial de tareas, por proyecto.', 'Task history, by project.')],
             [64, 25, L('Escribe lo que quieres; Claude lo hace en la carpeta del proyecto.', 'Write what you want; Claude does it in the project folder.')],
             [55, 55, L('Elige proyecto, skills y plantilla antes de enviar.', 'Pick a project, skills and template before sending.')]] },
    { id: 'cartas', ico: '🃏', name: L('Cartas', 'Cards'),
      desc: L('Cartas coleccionables: sobres, misiones y colecciones.', 'Collectible cards: packs, missions and collections.'),
      pins: [[94, 14, L('Tus chispas, la moneda de las cartas.', 'Your sparks, the card currency.')],
             [30, 25, L('Sobres, misiones, álbum, intercambios y crear las tuyas.', 'Packs, missions, album, trades and making your own.')],
             [50, 75, L('Sobres raros, épicos y legendarios.', 'Rare, epic and legendary packs.')]] },
    { id: 'perfil', ico: '☺', name: L('Perfil', 'Profile'),
      desc: L('Cómo te ven los demás: nombre, foto, estilo, tablero y juegos.', 'How others see you: name, picture, style, board and games.'),
      pins: [[25, 38, L('Tu nombre, @usuario, pronombres y «Sobre mí».', 'Your name, @username, pronouns and “About me”.')],
             [80, 47, L('Vista previa de tu tarjeta, en vivo.', 'A live preview of your card.')],
             [40, 25, L('Pestañas: tarjeta, estilo, tablero, juegos y más.', 'Tabs: card, style, board, games and more.')]] }
  ];
  var tour = document.querySelector('[data-tour]');
  if (tour) {
    var side = tour.querySelector('.tour-side'), img = tour.querySelector('img'), pins = tour.querySelector('.tour-pins');
    var title = tour.querySelector('.tour-title'), desc = tour.querySelector('.tour-desc'), notes = tour.querySelector('.tour-notes');
    var base = tour.getAttribute('data-base');
    var btns = VIEWS.map(function (v, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab'); b.id = 'tour-' + v.id;
      b.innerHTML = '<span aria-hidden="true">' + v.ico + '</span><span></span>';
      b.lastChild.textContent = v.name;
      b.addEventListener('click', function () { show(i); });
      b.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
        if (d) { e.preventDefault(); var n = (i + d + VIEWS.length) % VIEWS.length; btns[n].focus(); show(n); }
      });
      side.appendChild(b);
      return b;
    });
    function show(i) {
      var v = VIEWS[i];
      btns.forEach(function (b, k) { b.setAttribute('aria-selected', k === i ? 'true' : 'false'); b.tabIndex = k === i ? 0 : -1; });
      img.src = base + v.id + '.jpg';
      img.alt = L('Captura de MasterDev: ', 'MasterDev screenshot: ') + v.name;
      title.textContent = v.name; desc.textContent = v.desc;
      pins.textContent = ''; notes.textContent = '';
      v.pins.forEach(function (p, k) {
        var s = document.createElement('span'); s.className = 'pin'; s.textContent = String(k + 1);
        s.style.left = p[0] + '%'; s.style.top = p[1] + '%'; s.title = p[2];
        pins.appendChild(s);
        var li = document.createElement('li'); li.textContent = p[2]; notes.appendChild(li);
      });
    }
    show(0);
  }

  // ── 2) Barra de comandos ──
  var CMDS = [
    ['/ideas', L('Abre la libreta de ideas. Con un número (/ideas 007) abre esa idea; con texto, apunta una nueva.', 'Opens the idea notebook. With a number (/ideas 007) it opens that idea; with text, it jots down a new one.'), 0],
    ['/new-project', L('Asistente de 4 pasos para crear un juego: nombre, motor, resolución y estilo. Claude crea el documento de diseño y el código inicial.', '4-step wizard to create a game: name, engine, resolution and style. Claude creates the design document and starter code.'), 1],
    ['/link', L('Vincula un juego que ya tienes en otra carpeta, sin copiarlo ni tocarlo.', 'Links a game you already have in another folder, without copying or changing it.'), 0],
    ['/build', L('Encarga a Claude trabajo sobre un proyecto: «/build mi-juego añade un menú de pausa».', 'Hands Claude work on a project: “/build my-game add a pause menu”.'), 1],
    ['/builds', L('Abre Builds: versiones, preguntas que Claude te deja, su plan y tus notas de voz.', 'Opens Builds: versions, questions Claude leaves you, its plan and your voice notes.'), 0],
    ['/roblox', L('Abre la vista Roblox Studio: todos tus juegos, crear uno con plantilla y Studio en vivo.', 'Opens the Roblox Studio view: all your games, create one from a template and Studio live.'), 0],
    ['/notas', L('Abre tus notas (tu vault de Obsidian), y con texto salta a esa frase.', 'Opens your notes (your Obsidian vault); with text it jumps to that phrase.'), 0],
    ['/voz', L('Empieza o para una nota de voz mientras juegas (también con Ctrl + Alt + R).', 'Starts or stops a voice note while you play (also with Ctrl + Alt + R).'), 0],
    ['/theme', L('Cambia el tema: /theme set synthwave, /theme list o /theme reset.', 'Changes the theme: /theme set synthwave, /theme list or /theme reset.'), 0],
    ['/friend', L('Amigos: /friend add @usuario, /friend list, /friend accept @usuario.', 'Friends: /friend add @user, /friend list, /friend accept @user.'), 0],
    ['/msg', L('Manda un mensaje a un amigo o grupo: /msg @usuario hola.', 'Sends a message to a friend or group: /msg @user hi.'), 0],
    ['/group', L('Crea un grupo eligiendo amigos.', 'Creates a group by picking friends.'), 0],
    ['/call', L('Llama a un amigo (por ahora, en la misma red).', 'Calls a friend (for now, on the same network).'), 0],
    ['/stream', L('Comparte tu pantalla con un amigo (por ahora, en la misma red).', 'Shares your screen with a friend (for now, on the same network).'), 0],
    ['/discover', L('Abre Descubrir: juegos publicados y playtesters.', 'Opens Discover: published games and playtesters.'), 0],
    ['/profile', L('Abre tu perfil.', 'Opens your profile.'), 0],
    ['/musica', L('Modo música: MasterDev como una app de música a pantalla completa.', 'Music mode: MasterDev as a full-screen music app.'), 0],
    ['/mini', L('Mini reproductor de música, también fuera de MasterDev.', 'Mini music player, also outside MasterDev.'), 0],
    ['/ambiente', L('Modo ambiente: el fondo animado del tema a pantalla completa.', 'Ambient mode: the theme’s animated background in full screen.'), 0],
    ['/navegador', L('Abre el navegador integrado.', 'Opens the built-in browser.'), 0],
    ['/analytics', L('Cifras del mercado de videojuegos; con texto, Claude investiga tu pregunta.', 'Video game market figures; with text, Claude researches your question.'), 1],
    ['/personalizar', L('Skills en tareas y proyectos, y rutinas que corren solas.', 'Skills for tasks and projects, and routines that run on their own.'), 0],
    ['/setup', L('Rehace tu perfil: camino, nivel, motores y estilo.', 'Redoes your profile: path, level, engines and style.'), 0],
    ['/guide', L('La guía de MasterDev, adaptada a lo que tienes.', 'The MasterDev guide, adapted to what you have.'), 0],
    ['/help', L('Todos los comandos, agrupados y con buscador.', 'Every command, grouped and searchable.'), 0],
    ['/intro', L('Vuelve a ver la presentación.', 'Watch the intro again.'), 0],
    ['/logout', L('Cierra sesión y bloquea la ventana.', 'Signs out and locks the window.'), 0]
  ];
  var bar = document.querySelector('[data-cmdbar]');
  if (bar) {
    var input = bar.querySelector('input'), list = bar.querySelector('.cmd-list'), out = bar.querySelector('.cmd-out');
    var matches = [], active = -1;
    function render() {
      var q = input.value.trim().toLowerCase().split(/\s+/)[0];
      matches = q && q[0] === '/' ? CMDS.filter(function (c) { return c[0].indexOf(q) === 0; }) : [];
      list.textContent = '';
      active = matches.length ? 0 : -1;
      matches.slice(0, 8).forEach(function (c, i) {
        var li = document.createElement('li'); li.setAttribute('role', 'option'); li.id = 'cmd-opt-' + i;
        li.innerHTML = '<span class="mono"></span> <span class="small"></span>';
        li.firstChild.textContent = c[0]; li.lastChild.textContent = c[2] ? L('Requiere Claude', 'Needs Claude') : '';
        li.addEventListener('mousedown', function (e) { e.preventDefault(); input.value = c[0]; run(c); });
        list.appendChild(li);
      });
      mark();
    }
    function mark() {
      [].forEach.call(list.children, function (li, i) { li.setAttribute('aria-selected', i === active ? 'true' : 'false'); });
      input.setAttribute('aria-expanded', list.children.length ? 'true' : 'false');
      if (active >= 0) input.setAttribute('aria-activedescendant', 'cmd-opt-' + active); else input.removeAttribute('aria-activedescendant');
    }
    function run(c) {
      list.textContent = ''; mark();
      out.textContent = '';
      var h = document.createElement('p'); h.className = 'cmd-res';
      h.innerHTML = '<span class="tag ok mono">[OK]</span> <span class="mono"></span>';
      h.lastChild.textContent = c[0];
      var p = document.createElement('p'); p.textContent = c[1];
      out.appendChild(h); out.appendChild(p);
      if (c[2]) { var n = document.createElement('p'); n.className = 'st opt'; n.textContent = L('Requiere Claude', 'Needs Claude'); out.appendChild(n); }
    }
    input.addEventListener('input', render);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' && matches.length) { e.preventDefault(); active = Math.min(active + 1, list.children.length - 1); mark(); }
      else if (e.key === 'ArrowUp' && matches.length) { e.preventDefault(); active = Math.max(active - 1, 0); mark(); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        var q = input.value.trim().toLowerCase().split(/\s+/)[0];
        var c = CMDS.filter(function (x) { return x[0] === q; })[0] || matches[active];
        if (c) { input.value = c[0]; run(c); }
        else {
          out.textContent = '';
          var p = document.createElement('p');
          p.innerHTML = '<span class="tag alert mono">[??]</span> ';
          p.appendChild(document.createTextNode(q && q[0] === '/' ? L('Ese comando no existe. Prueba /help.', "That command doesn't exist. Try /help.") : L('Sin barra, en la app el texto va a Claude como una tarea (si lo tienes conectado).', 'Without a slash, in the app the text goes to Claude as a task (if connected).')));
          out.appendChild(p);
        }
      } else if (e.key === 'Escape') { list.textContent = ''; mark(); }
    });
  }

  // ── 3) Test de camino ──
  var quiz = document.querySelector('[data-quiz]'), qout = document.querySelector('.quiz-out');
  if (quiz && qout) {
    quiz.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = new FormData(quiz), score = { c: 0, p: 0, b: 0, r: 0 };
      ['q1', 'q2', 'q3'].forEach(function (k) { var v = f.get(k); if (v) score[v]++; });
      var pick = score.r && score.c + score.r >= 2 ? 'r' : score.c >= 2 ? 'c' : score.p >= 2 ? 'p' : 'b';
      if (score.c + score.r >= 2 && !score.r) pick = 'c';
      qout.hidden = false; qout.textContent = '';
      var h = document.createElement('h3'); h.textContent = qout.getAttribute('data-' + pick + '-title');
      var p = document.createElement('p'); p.textContent = qout.getAttribute('data-' + pick + '-text');
      var a = document.createElement('a'); a.className = 'btn ghost small'; a.href = qout.getAttribute('data-' + pick + '-link'); a.textContent = qout.getAttribute('data-more') + ' →';
      qout.appendChild(h); qout.appendChild(p); qout.appendChild(a);
      qout.scrollIntoView({ block: 'nearest' });
    });
  }
})();
