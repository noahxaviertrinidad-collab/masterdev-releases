// Servidor local para ver la web mientras se edita (sin dependencias).
// Uso: deno run --allow-net --allow-read tools/serve.ts [puerto]   → http://127.0.0.1:8798/
const port = Number(Deno.args[0] ?? 8798);
const root = new URL("../", import.meta.url);
const types: Record<string, string> = {
  html: "text/html; charset=utf-8", css: "text/css", js: "text/javascript", png: "image/png", svg: "image/svg+xml",
  woff2: "font/woff2", xml: "application/xml", txt: "text/plain; charset=utf-8", json: "application/json", ico: "image/x-icon",
};
Deno.serve({ port, hostname: "127.0.0.1" }, async (req) => {
  let path = decodeURIComponent(new URL(req.url).pathname);
  if (path.includes("..")) return new Response("Bad request", { status: 400 });
  if (path.endsWith("/")) path += "index.html";
  try {
    const file = await Deno.readFile(new URL("." + path, root));
    return new Response(file, { headers: { "content-type": types[path.split(".").pop()!] ?? "application/octet-stream", "cache-control": "no-store" } });
  } catch {
    try {
      const file = await Deno.readFile(new URL("./404.html", root));
      return new Response(file, { status: 404, headers: { "content-type": types.html } });
    } catch { return new Response("Not found", { status: 404 }); }
  }
});
