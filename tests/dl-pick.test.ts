// Build 166 (GU03): la función que elige qué baja el botón de descarga (app.js, entre <pick> y </pick>), sin red.
// deno test --allow-read tests/dl-pick.test.ts
const src = await Deno.readTextFile(new URL("../app.js", import.meta.url));
const m = /\/\/ <pick>[\s\S]*?\/\/ <\/pick>/.exec(src);
if (!m) throw new Error("app.js no tiene el bloque <pick>");
// deno-lint-ignore no-explicit-any
type Asset = { name: string; size: number; browser_download_url: string } | null;
const pick = new Function(m[0] + "\nreturn mdPickDownload;")() as (rel: unknown) => { main: Asset; setup: Asset; zip: Asset; portable: Asset };
const a = (name: string) => ({ name, size: 1, browser_download_url: "https://example.invalid/" + name });
function eq(x: unknown, y: unknown, msg: string) { if (x !== y) throw new Error(`${msg}: ${x} !== ${y}`); }

Deno.test("con el instalador nuevo: el botón baja MasterDev-win-Setup.exe", () => {
  const r = pick({ assets: [a("MasterDev-1.8.0-win-x64.zip"), a("latest.json"), a("MasterDev-win-Setup.exe"), a("MasterDev-win-Portable.zip"), a("releases.win.json")] });
  eq(r.main?.name, "MasterDev-win-Setup.exe", "main");
  eq(r.zip?.name, "MasterDev-1.8.0-win-x64.zip", "zip");
  eq(r.portable?.name, "MasterDev-win-Portable.zip", "portable");
});

Deno.test("solo con el zip antiguo (1.0.x): cae al zip", () => {
  const r = pick({ assets: [a("latest.json"), a("MasterDev-1.0.2-win-x64.zip"), a("manifest.json")] });
  eq(r.main?.name, "MasterDev-1.0.2-win-x64.zip", "main");
  eq(r.setup, null, "setup");
  eq(r.portable, null, "portable");
});

Deno.test("sin nada (o sin assets): null y el enlace fijo de la página se queda", () => {
  eq(pick({ assets: [a("SUBIR.md"), a("MasterDev-amigos-20261106-2113.zip")] }).main, null, "sin archivos válidos");
  eq(pick({}).main, null, "sin assets");
  eq(pick(null).main, null, "null");
  eq(pick({ assets: [null, { name: 5 }] }).main, null, "basura");
});

Deno.test("no confunde nombres parecidos", () => {
  const r = pick({ assets: [a("MasterDev-win-Setup.exe.sig"), a("evil-MasterDev-win-Setup.exe"), a("MasterDev-1.8.0-win-x64.zip.part")] });
  eq(r.main, null, "main");
});
