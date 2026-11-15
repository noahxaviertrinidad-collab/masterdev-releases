// Build 171 (GU44): el buscador del centro de ayuda (ayuda.js, entre <search> y </search>) sobre el índice generado, sin red.
// deno test --allow-read tests/ayuda-search.test.ts
const src = await Deno.readTextFile(new URL("../ayuda.js", import.meta.url));
const m = /\/\/ <search>[\s\S]*?\/\/ <\/search>/.exec(src);
if (!m) throw new Error("ayuda.js no tiene el bloque <search>");
type Item = { k: string; w: string; lv: string; t: string; c: string; h: string; x: string; kw: string };
const search = new Function(m[0] + "\nreturn search;")() as (q: string, lv: string, list: Item[]) => Item[];
const es: Item[] = JSON.parse(await Deno.readTextFile(new URL("../ayuda-index.json", import.meta.url)));
const en: Item[] = JSON.parse(await Deno.readTextFile(new URL("../en/ayuda-index.json", import.meta.url)));
const top = (q: string, list: Item[], n = 3) => search(q, "", list).slice(0, n).map(r => r.h + " " + r.t);
const has = (q: string, list: Item[], re: RegExp) => {
  const r = top(q, list);
  if (!r.some(x => re.test(x))) throw new Error(`«${q}» no encuentra ${re}: ${JSON.stringify(r)}`);
};
Deno.test("5 preguntas en español", () => {
  has("¿Cómo grabo un clip?", es, /clip/i);
  has("crear un juego de Roblox", es, /roblox/i);
  has("Olvidé mi contraseña", es, /contrase/i);
  has("añadir amigos y hablar", es, /amigo/i);
  has("conectar Claude", es, /claude|ia/i);
});
Deno.test("5 preguntas en inglés", () => {
  has("record a clip", en, /clip/i);
  has("make a Roblox game", en, /roblox/i);
  has("I forgot my password", en, /password/i);
  has("add friends", en, /friend/i);
  has("connect Claude", en, /claude|ai/i);
});
Deno.test("el nivel filtra", () => {
  const r = search("clip", "avanzado", es);
  if (r.some(x => x.lv !== "avanzado")) throw new Error("se coló otro nivel");
});
