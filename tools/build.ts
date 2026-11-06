// MasterDev · web pública · generador.
// Lee las plantillas de _src/pages y escribe una página por idioma: español en la raíz (/) e inglés en /en/.
// Uso (desde masterdev-web):  deno run -A tools/build.ts
//
// Sintaxis de las plantillas:
//   <es>…</es> <en>…</en>      bloque solo para ese idioma (puede ocupar varias líneas)
//   {{es:texto|en:text}}        texto corto por idioma (sirve dentro de atributos; sin «|» ni «}}» dentro)
//   {{> nombre}}                incluye _src/partials/nombre.html
//   {{root}}                    ruta a la raíz del sitio desde la página ("" o "../")
//   {{lang}} {{url}} {{es_url}} {{en_url}} {{other_url}} {{page}} {{year}}
// También genera sitemap.xml (con hreflang). Las páginas en ONLY_ES solo salen en español.

const SITE = "https://masterdev.website";
const LANGS = ["es", "en"] as const;
type Lang = typeof LANGS[number];
const ONLY_ES = new Set(["404.html"]);

const src = new URL("../_src/", import.meta.url);
const out = new URL("../", import.meta.url);

function urlFor(lang: Lang, page: string): string {
  const clean = page === "index.html" ? "" : page;
  return `${SITE}/${lang === "es" ? "" : "en/"}${clean}`;
}

async function partial(name: string, depth = 0): Promise<string> {
  if (depth > 5) throw new Error(`Inclusión demasiado profunda: ${name}`);
  const text = await Deno.readTextFile(new URL(`partials/${name}.html`, src));
  return await includes(text, depth + 1);
}

async function includes(text: string, depth = 0): Promise<string> {
  const re = /\{\{>\s*([\w-]+)\s*\}\}/g;
  let result = "", last = 0;
  for (const m of text.matchAll(re)) {
    result += text.slice(last, m.index) + await partial(m[1], depth);
    last = m.index! + m[0].length;
  }
  return result + text.slice(last);
}

function localize(text: string, lang: Lang): string {
  const other = lang === "es" ? "en" : "es";
  return text
    .replace(new RegExp(`<${other}>[\\s\\S]*?</${other}>`, "g"), "")
    .replace(new RegExp(`</?${lang}>`, "g"), "")
    .replace(/\{\{es:([^|}]*)\|en:([^}]*)\}\}/g, (_m, es, en) => (lang === "es" ? es : en));
}

function vars(text: string, lang: Lang, page: string): string {
  const v: Record<string, string> = {
    root: lang === "es" ? "" : "../",
    lang,
    page,
    url: urlFor(lang, page),
    es_url: urlFor("es", page),
    en_url: urlFor("en", page),
    other_url: urlFor(lang === "es" ? "en" : "es", page),
    year: String(new Date().getFullYear()),
  };
  return text.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in v ? v[k] : m));
}

const pages: string[] = [];
for await (const e of Deno.readDir(new URL("pages/", src))) if (e.isFile && e.name.endsWith(".html")) pages.push(e.name);
pages.sort();

await Deno.mkdir(new URL("en/", out), { recursive: true });
const sitemap: string[] = [];
for (const page of pages) {
  const raw = await includes(await Deno.readTextFile(new URL(`pages/${page}`, src)));
  for (const lang of LANGS) {
    if (lang === "en" && ONLY_ES.has(page)) continue;
    let html = vars(localize(raw, lang), lang, page);
    html = html.replace(/\n{3,}/g, "\n\n");
    const left = html.match(/\{\{[^}]*\}\}|<\/?(es|en)>/);
    if (left) throw new Error(`${lang}/${page}: queda sin procesar «${left[0]}»`);
    const target = new URL(lang === "es" ? page : `en/${page}`, out);
    await Deno.writeTextFile(target, html);
    console.log(`[OK]  ${lang === "es" ? "" : "en/"}${page}`);
  }
  if (!ONLY_ES.has(page)) {
    sitemap.push(`  <url><loc>${urlFor("es", page)}</loc>` +
      `<xhtml:link rel="alternate" hreflang="es" href="${urlFor("es", page)}"/>` +
      `<xhtml:link rel="alternate" hreflang="en" href="${urlFor("en", page)}"/>` +
      `<xhtml:link rel="alternate" hreflang="x-default" href="${urlFor("es", page)}"/></url>`);
    sitemap.push(`  <url><loc>${urlFor("en", page)}</loc>` +
      `<xhtml:link rel="alternate" hreflang="es" href="${urlFor("es", page)}"/>` +
      `<xhtml:link rel="alternate" hreflang="en" href="${urlFor("en", page)}"/>` +
      `<xhtml:link rel="alternate" hreflang="x-default" href="${urlFor("es", page)}"/></url>`);
  }
}
await Deno.writeTextFile(new URL("sitemap.xml", out),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${sitemap.join("\n")}\n</urlset>\n`);
console.log("[OK]  sitemap.xml");
