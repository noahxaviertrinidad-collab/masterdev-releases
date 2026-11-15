// MasterDev · web pública · Build 171 (GU44): el centro de ayuda, sacado de LA MISMA Guía que la app (una sola fuente).
// Lee la Guía con gc3-app/src/wwwroot/js/guia/exportar.js (datos puros) y escribe:
//   _src/pages/ayuda.html              índice por guía, área y nivel + buscador (generado: no editar a mano)
//   _src/pages/ayuda/<guía>-<id>.html  una página por capítulo (artículo), con sus secciones como anclas (generadas)
//   ayuda-index.json, en/ayuda-index.json   el índice del buscador de la página (ayuda.js), en es y en
// Los enlaces a rutas de la app ({{#/ruta|texto}}) se vuelven «En la app: texto». Después: deno run -A tools/build.ts
// Uso (desde masterdev-web):  deno run --allow-read --allow-write tools/ayuda.ts [--app ../gc3-app/src/wwwroot]
// La app se carga con un DOM mínimo de mentira: algunos módulos lo tocan al importarse (no se pinta nada).

type Sec = { id: string; title: string; level: string; p: string[]; steps: string[]; list: string[]; tip: string; code: string; try: string | null };
type Chap = { id: string; icon: string; title: string; lead: string; level: string; keywords: string[]; easy: string; sections: Sec[] };
type Guide = { title: string; lead: string; chapters: Chap[] };
type Export = { jugador: Guide; dev: Guide; faq: { g: string; q: string; a: string }[] };

const argApp = Deno.args.indexOf("--app");
const dirUrl = (p: string) => {
  const s = p.replace(/\\/g, "/").replace(/\/?$/, "/");
  return /^[A-Za-z]:\//.test(s) ? new URL("file:///" + s) : new URL(s, "file:///" + Deno.cwd().replace(/\\/g, "/") + "/");
};
const appRoot = argApp >= 0 ? dirUrl(Deno.args[argApp + 1]) : new URL("../../gc3-app/src/wwwroot/", import.meta.url);
const web = new URL("../", import.meta.url);

// ── DOM mínimo (solo para que los módulos de la app se importen) ──
const noop = () => {};
class E { addEventListener() {} removeEventListener() {} append() {} setAttribute() {} classList = { add: noop, remove: noop, toggle: noop }; style = {}; dataset = {}; }
Object.assign(globalThis, {
  Element: E, DocumentFragment: E, HTMLElement: E, Node: E,
  document: { documentElement: { getAttribute: () => "es", setAttribute: noop, dataset: {}, style: {}, classList: { add: noop, remove: noop, toggle: noop } },
    addEventListener: noop, createElement: () => new E(), createTextNode: () => new E(), querySelector: () => null, querySelectorAll: () => [], body: new E(), head: new E() },
  window: globalThis, location: { hash: "", search: "", href: "http://127.0.0.1/" }, navigator: { userAgent: "deno", language: "es" },
  matchMedia: () => ({ matches: false, addEventListener: noop }),
});

const { exportGuide } = await import(new URL("js/guia/exportar.js", appRoot).href);
const EN: Record<string, string> = (await import(new URL("js/i18n/en.js", appRoot).href)).default;
const tr = (s: string) => (typeof EN[s] === "string" && EN[s].length ? EN[s] : s);
const DATA: Record<"es" | "en", Export> = { es: exportGuide(), en: exportGuide({ tr }) };

// ── texto ──
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const plain = (s: string) => s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1").replace(/\[\[([^\]]+)\]\]/g, "$1").replace(/\{\{[^|}]+\|([^}]+)\}\}/g, "$1");
const IN_APP = { es: "En la app: ", en: "In the app: " };

/** El mismo marcado que views/guia.js › rich(), en HTML escapado. */
function rich(text: string, lang: "es" | "en", who: string): string {
  const re = /\*\*(.+?)\*\*|`([^`]+)`|\[\[([^\]]+)\]\]|\{\{([^|}]+)\|([^}]+)\}\}/g;
  let out = "", last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    out += esc(text.slice(last, m.index));
    if (m[1]) out += `<strong>${rich(m[1], lang, who)}</strong>`;
    else if (m[2]) out += `<code>${esc(m[2])}</code>`;
    else if (m[3]) out += m[3].split("+").filter(Boolean).map(k => `<kbd>${esc(k === "Shift" ? (lang === "es" ? "Mayús" : "Shift") : k)}</kbd>`).join("+");
    else if (m[4] && m[4].startsWith("@")) out += `<a href="ayuda/${esc(who)}-${esc(m[4].slice(1))}.html">${esc(m[5])}</a>`;
    else if (m[4]) out += `<span class="in-app" title="${esc(m[4])}">${IN_APP[lang]}${esc(m[5])}</span>`;
    last = re.lastIndex;
  }
  return out + esc(text.slice(last));
}

const LV = { basico: ["Básico", "Basic"], intermedio: ["Intermedio", "Intermediate"], avanzado: ["Avanzado", "Advanced"] } as Record<string, [string, string]>;
const WHO = { jugador: ["Para jugadores", "For players"], dev: ["Para creadores", "For creators"] } as Record<string, [string, string]>;
const both = (es: string, en: string) => `<es>${es}</es><en>${en}</en>`;
const lvChip = (lv: string) => both(`<span class="lv lv-${lv}">${LV[lv]?.[0] ?? lv}</span>`, `<span class="lv lv-${lv}">${LV[lv]?.[1] ?? lv}</span>`);

function secHtml(s: Sec, lang: "es" | "en", who: string): string {
  let h = `<section class="help-sec" id="${esc(s.id)}"><h2>${rich(s.title, lang, who)} <a class="anchor" href="ayuda/${who}-CHAP.html#${esc(s.id)}" aria-label="#">#</a></h2>`;
  for (const p of s.p) h += `<p>${rich(p, lang, who)}</p>`;
  if (s.steps.length) h += `<ol>${s.steps.map(x => `<li>${rich(x, lang, who)}</li>`).join("")}</ol>`;
  if (s.list.length) h += `<ul class="bullets">${s.list.map(x => `<li>${rich(x, lang, who)}</li>`).join("")}</ul>`;
  if (s.code) h += `<pre><code>${esc(s.code)}</code></pre>`;
  if (s.tip) h += `<p class="tip">💡 ${rich(s.tip, lang, who)}</p>`;
  return h + `</section>`;
}

// ── páginas ──
const pagesDir = new URL("_src/pages/", web);
const helpDir = new URL("_src/pages/ayuda/", web);
try { await Deno.remove(helpDir, { recursive: true }); } catch { /* no existía */ }
await Deno.mkdir(helpDir, { recursive: true });
const GEN = "<!-- Generado por tools/ayuda.ts desde la Guía de la app (gc3-app/src/wwwroot/js/guia/exportar.js). No lo edites a mano. -->\n";

let pages = 0;
const index: Record<"es" | "en", unknown[]> = { es: [], en: [] };
for (const who of ["jugador", "dev"] as const) {
  const n = DATA.es[who].chapters.length;
  for (let i = 0; i < n; i++) {
    const ce = DATA.es[who].chapters[i], cn = DATA.en[who].chapters[i];
    const file = `${who}-${ce.id}.html`;
    const body = (c: Chap, lang: "es" | "en") => {
      const secs = c.sections.map(s => secHtml(s, lang, who).replaceAll("-CHAP.html", "-" + c.id + ".html")).join("\n");
      const toc = c.sections.length > 1 ? `<nav class="help-toc" aria-label="${lang === "es" ? "En esta página" : "On this page"}"><ul>${c.sections.map(s => `<li><a href="ayuda/${file}#${esc(s.id)}">${esc(plain(s.title))}</a></li>`).join("")}</ul></nav>` : "";
      return `<p class="kicker"><a href="ayuda.html">${lang === "es" ? "Centro de ayuda" : "Help center"}</a> · ${WHO[who][lang === "es" ? 0 : 1]}</p>
    <h1>${esc(c.icon)} ${esc(plain(c.title))}</h1>
    ${c.lead ? `<p class="sub">${rich(c.lead, lang, who)}</p>` : ""}
    ${c.easy ? `<p class="help-easy"><b>${lang === "es" ? "En corto:" : "In short:"}</b> ${rich(c.easy, lang, who)}</p>` : ""}
    ${toc}
    ${secs}`;
    };
    const titleEs = plain(ce.title), titleEn = plain(cn.title);
    const desc = (c: Chap) => esc(plain(c.lead || c.easy || c.title).slice(0, 180));
    const html = `<!DOCTYPE html>
${GEN.trim()}
<html lang="{{lang}}">
<head>
<base href="../">
<title>{{es:${esc(titleEs).replace(/[|{}]/g, " ")} · Ayuda de MasterDev|en:${esc(titleEn).replace(/[|{}]/g, " ")} · MasterDev Help}}</title>
<meta name="description" content="{{es:${desc(ce).replace(/[|{}]/g, " ")}|en:${desc(cn).replace(/[|{}]/g, " ")}}">
{{> head}}
</head>
<body>
{{> nav}}
<main id="contenido" class="page help-page">
  <div class="wrap help-art" lang="{{lang}}">
    ${lvChip(ce.level)}
<es>
    ${body(ce, "es")}
</es>
<en>
    ${body(cn, "en")}
</en>
    <p class="small help-back"><a href="ayuda.html">← {{es:Volver al centro de ayuda|en:Back to the help center}}</a> · <a href="descargar.html">{{es:Descargar MasterDev|en:Download MasterDev}}</a></p>
  </div>
</main>
{{> footer}}
</body>
</html>
`;
    await Deno.writeTextFile(new URL(file, helpDir), html);
    pages++;
    for (const [lang, c] of [["es", ce], ["en", cn]] as const) {
      for (const s of c.sections) {
        index[lang].push({ k: "sec", w: who, lv: s.level, t: plain(s.title), c: plain(c.title), h: `ayuda/${file}#${s.id}`,
          x: plain([...s.p, ...s.steps, ...s.list, s.tip].join(" ")).slice(0, 400), kw: c.keywords.join(" ") });
      }
    }
  }
}
for (const lang of ["es", "en"] as const) DATA[lang].faq.forEach((f, i) => index[lang].push({ k: "faq", w: "", lv: "basico", t: plain(f.q), c: plain(f.g), h: `ayuda.html#faq-${i + 1}`, x: plain(f.a).slice(0, 400), kw: "" }));

// ── el índice ──
const chapList = (lang: "es" | "en") => (["jugador", "dev"] as const).map(who => {
  const g = DATA[lang][who];
  const items = g.chapters.map(c => `<li data-lv="${c.level}"><a href="ayuda/${who}-${c.id}.html"><span class="ic" aria-hidden="true">${esc(c.icon)}</span> ${esc(plain(c.title))}</a> <span class="lv lv-${c.level}">${(LV[c.level] ?? [c.level, c.level])[lang === "es" ? 0 : 1]}</span></li>`).join("\n          ");
  return `<section class="help-guide" id="${who}">
        <h2>${WHO[who][lang === "es" ? 0 : 1]}</h2>
        <p class="small">${rich(g.lead, lang, who)}</p>
        <ul class="help-list">
          ${items}
        </ul>
      </section>`;
}).join("\n      ");
const faqList = (lang: "es" | "en") => DATA[lang].faq.map((f, i) => `<details class="help-faq" id="faq-${i + 1}"><summary>${esc(plain(f.q))}</summary><p>${rich(f.a, lang, "dev")}</p></details>`).join("\n        ");
const indexHtml = `<!DOCTYPE html>
${GEN.trim()}
<html lang="{{lang}}">
<head>
<title>{{es:Centro de ayuda · MasterDev|en:Help center · MasterDev}}</title>
<meta name="description" content="{{es:La Guía de MasterDev en la web: cada sección de la app explicada paso a paso, por niveles, con buscador y preguntas frecuentes.|en:The MasterDev Guide on the web: every section of the app explained step by step, by level, with search and FAQ.}}">
<meta property="og:title" content="{{es:Centro de ayuda · MasterDev|en:Help center · MasterDev}}">
{{> head}}
</head>
<body>
{{> nav}}
<main id="contenido" class="page help-page">
  <div class="wrap">
    <p class="kicker">{{es:Ayuda|en:Help}}</p>
    <h1>{{es:Centro de ayuda|en:Help center}}</h1>
    <p class="sub">{{es:La misma Guía que tienes en la app (pulsa ? o F1 allí), aquí para leerla sin abrirla. ¿Algo va mal? Mira el|en:The same Guide you have in the app (press ? or F1 there), here to read without opening it. Something wrong? Check the}} <a href="estado.html">{{es:estado de MasterDev|en:MasterDev status}}</a>.</p>
    <div class="help-search" data-help data-index="ayuda-index.json">
      <label class="sr" for="help-q">{{es:Buscar en la ayuda|en:Search the help}}</label>
      <input id="help-q" type="search" autocomplete="off" placeholder="{{es:¿Qué quieres saber? Por ejemplo: grabar un clip|en:What do you want to know? For example: record a clip}}">
      <div class="help-filters" role="group" aria-label="{{es:Nivel|en:Level}}">
        <button type="button" class="chip on" data-lv="">{{es:Todo|en:All}}</button>
        <button type="button" class="chip" data-lv="basico">{{es:Básico|en:Basic}}</button>
        <button type="button" class="chip" data-lv="intermedio">{{es:Intermedio|en:Intermediate}}</button>
        <button type="button" class="chip" data-lv="avanzado">{{es:Avanzado|en:Advanced}}</button>
      </div>
      <p class="small help-count" aria-live="polite"></p>
      <ol class="help-results" hidden></ol>
    </div>
    <div class="help-guides">
<es>
      ${chapList("es")}
</es>
<en>
      ${chapList("en")}
</en>
    </div>
    <section class="help-faqs" id="preguntas">
      <h2>{{es:Preguntas frecuentes|en:Frequently asked questions}}</h2>
<es>
        ${faqList("es")}
</es>
<en>
        ${faqList("en")}
</en>
    </section>
    <section class="help-more">
      <h2>{{es:¿No lo encuentras?|en:Can't find it?}}</h2>
      <p>{{es:En la app tienes «💬 Pregúntale a MasterDev» en el ?, la ayuda en la comunidad de tu servidor (con mentores 🎓) y 🐞 Reportar un problema, con vista previa de lo que se manda.|en:In the app you have “💬 Ask MasterDev” in the ?, help in your server's community (with mentors 🎓) and 🐞 Report a problem, with a preview of what gets sent.}}</p>
    </section>
  </div>
</main>
{{> footer}}
<script src="{{root}}ayuda.js"></script>
</body>
</html>
`;
await Deno.writeTextFile(new URL("ayuda.html", pagesDir), indexHtml);
await Deno.writeTextFile(new URL("ayuda-index.json", web), JSON.stringify(index.es));
await Deno.mkdir(new URL("en/", web), { recursive: true });
await Deno.writeTextFile(new URL("en/ayuda-index.json", web), JSON.stringify(index.en));
console.log(`[OK]  ayuda: ${pages} artículos, índice con ${index.es.length} entradas (es) y ${index.en.length} (en)`);
void fold;
