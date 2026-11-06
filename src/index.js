// Taller El Roi — Worker: sitio estático + trabajos por categoría + Estudio del dueño.
// Público: GET /api/trabajos · GET /media/<key> · GET /trabajos/<categoria>
// Admin (header X-Owner-Key): CRUD de trabajos y subida de fotos a R2.
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const CATEGORIAS = [
  { slug: "muebles-de-cocina", nombre: "Muebles de cocina", foto: "/assets/cocina.jpg", linea: "Cocinas integrales y muebles de cocina a la medida de tu casa." },
  { slug: "closets", nombre: "Clósets", foto: "/assets/closet.jpg", linea: "Clósets y vestidores que aprovechan cada rincón." },
  { slug: "puertas", nombre: "Puertas", foto: "/assets/puertas.jpg", linea: "Puertas principales e interiores en madera sólida." },
  { slug: "pergolas", nombre: "Pérgolas", foto: "/assets/pergola.jpg", linea: "Pérgolas y estructuras de madera para tu terraza o jardín." },
  { slug: "huellas-para-gradas", nombre: "Huellas para gradas", foto: "/assets/gradas.jpg", linea: "Huellas y pasamanos de madera para tus gradas." },
  { slug: "trabajos-en-piedra", nombre: "Trabajos en piedra", foto: "/assets/piedra.jpg", linea: "Revestimientos y detalles en piedra natural." },
  { slug: "ranurados", nombre: "Ranurados", foto: "/assets/ranurados.jpg", linea: "Paneles ranurados de madera que visten cualquier muro." },
];

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const isOwner = (req, env) =>
  !!env.ESTUDIO_OWNER_KEY && req.headers.get("x-owner-key") === env.ESTUDIO_OWNER_KEY;

async function listTrabajos(env, categoria) {
  const q = categoria
    ? env.DB.prepare(
        "SELECT id, titulo, categoria, descripcion, foto, formato, orden FROM trabajos WHERE categoria = ? ORDER BY orden ASC, id ASC"
      ).bind(categoria)
    : env.DB.prepare(
        "SELECT id, titulo, categoria, descripcion, foto, formato, orden FROM trabajos ORDER BY orden ASC, id ASC"
      );
  const { results } = await q.all();
  return results || [];
}

function paginaCategoria(cat, trabajos) {
  const cards = trabajos.length
    ? trabajos
        .map(
          (t) => `
        <article class="card">
          ${t.foto ? `<div class="ph"><img src="${esc(t.foto)}" alt="${esc(t.titulo)}" loading="lazy" /></div>` : ""}
          <div class="info">
            <h3>${esc(t.titulo)}</h3>
            ${t.descripcion ? `<p>${esc(t.descripcion)}</p>` : ""}
          </div>
        </article>`
        )
        .join("")
    : `<div class="vacio">
         <p><b>Estamos preparando esta galería.</b></p>
         <p>Muy pronto verás aquí los trabajos de ${esc(cat.nombre.toLowerCase())} que el taller ha realizado en Cuenca. Si tienes un proyecto en mente, pídenos tu cotización sin compromiso.</p>
       </div>`;
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(cat.nombre)} · Trabajos · Taller El Roi</title>
    <meta name="description" content="Trabajos de ${esc(cat.nombre.toLowerCase())} realizados por Taller El Roi, carpintería a medida en San Miguel de Putushí, Cuenca, Ecuador." />
    <link rel="icon" href="/favicon.ico" sizes="48x48" />
    <link rel="icon" type="image/png" href="/logo-mark.png" sizes="512x512" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <style>
      :root{ --bg:#171310; --panel:#221b15; --line:#3d3226; --ink:#f3ead9; --soft:#c9b896; --wood:#ce8d3c; }
      *{ box-sizing:border-box; }
      body{ margin:0; font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; background:var(--bg); color:var(--ink); }
      .wrap{ max-width:1060px; margin:0 auto; padding:0 clamp(18px,4vw,44px) 70px; }
      nav{ display:flex; justify-content:space-between; align-items:center; padding:20px 0; }
      nav a{ color:var(--soft); text-decoration:none; font-size:14px; letter-spacing:.08em; text-transform:uppercase; }
      nav .brand{ color:var(--ink); font-weight:800; }
      nav .brand span{ color:var(--wood); }
      .hero{ border-radius:18px; overflow:hidden; position:relative; margin-bottom:34px; }
      .hero img{ width:100%; height:300px; object-fit:cover; display:block; filter:brightness(.62); }
      .hero .txt{ position:absolute; inset:auto 0 0 0; padding:26px clamp(18px,4vw,36px); }
      .hero h1{ margin:0 0 6px; font-size:clamp(28px,5vw,44px); }
      .hero p{ margin:0; color:#e8dcc2; max-width:560px; }
      .grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:20px; }
      .card{ background:var(--panel); border:1px solid var(--line); border-radius:16px; overflow:hidden; }
      .card .ph img{ width:100%; height:230px; object-fit:cover; display:block; }
      .card .info{ padding:18px 20px 20px; }
      .card h3{ margin:0 0 8px; font-size:19px; }
      .card p{ margin:0; color:var(--soft); line-height:1.55; font-size:15px; white-space:pre-wrap; }
      .vacio{ border:1px dashed var(--line); border-radius:16px; padding:28px; color:var(--soft); line-height:1.6; }
      .cta{ margin-top:36px; text-align:center; }
      .cta a{ display:inline-block; background:var(--wood); color:#1c150e; font-weight:800; text-decoration:none; padding:14px 26px; border-radius:12px; }
      footer{ border-top:1px solid var(--line); margin-top:56px; padding:26px 0 6px; text-align:center; color:var(--soft); font-size:13px; }
      footer img{ height:64px; width:auto; opacity:.55; display:block; margin:0 auto 12px; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <nav>
        <a class="brand" href="/">Taller <span>El Roi</span></a>
        <a href="/#trabajos">← Todos los trabajos</a>
      </nav>
      <div class="hero">
        <img src="${cat.foto}" alt="${esc(cat.nombre)}" />
        <div class="txt">
          <h1>${esc(cat.nombre)}</h1>
          <p>${esc(cat.linea)}</p>
        </div>
      </div>
      <div class="grid">${cards}
      </div>
      <div class="cta">
        <a href="mailto:tallerelroi@gmail.com?subject=${encodeURIComponent("Cotización — " + cat.nombre)}">Pedir cotización de ${esc(cat.nombre.toLowerCase())}</a>
      </div>
      <footer>
        <img src="/assets/logo-marca-de-agua.png" alt="Taller El Roi" />
        Carpintería a medida · San Miguel de Putushí, Cuenca, Ecuador<br />
        © 2026 Taller El Roi · Desarrollado por Jorge Moisés Pasato
      </footer>
    </div>
  </body>
</html>`;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname;

    // ---------- Páginas de categoría ----------
    const mc = path.match(/^\/trabajos\/([a-z0-9-]+)\/?$/);
    if (mc && req.method === "GET") {
      const cat = CATEGORIAS.find((c) => c.slug === mc[1]);
      if (cat) {
        const trabajos = await listTrabajos(env, cat.nombre);
        return new Response(paginaCategoria(cat, trabajos), {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
    }

    // ---------- API pública ----------
    if (path === "/api/trabajos" && req.method === "GET") {
      return json(await listTrabajos(env));
    }
    if (path.startsWith("/media/")) {
      const key = decodeURIComponent(path.slice("/media/".length));
      const obj = await env.MEDIA.get(key);
      if (!obj) return new Response("No encontrado", { status: 404 });
      const headers = new Headers();
      obj.writeHttpMetadata(headers);
      headers.set("etag", obj.httpEtag);
      headers.set("cache-control", "public, max-age=31536000, immutable");
      return new Response(obj.body, { headers });
    }

    // ---------- Estudio (página) ----------
    if (path === "/estudio" || path === "/estudio/") {
      const res = await env.ASSETS.fetch(new Request(new URL("/estudio.html", url.origin), req));
      const headers = new Headers(res.headers);
      headers.set("x-robots-tag", "noindex, nofollow");
      return new Response(res.body, { status: res.status, headers });
    }

    // ---------- API admin ----------
    if (path.startsWith("/api/admin/")) {
      if (!isOwner(req, env)) return json({ error: "Clave incorrecta" }, 401);

      if (path === "/api/admin/trabajos" && req.method === "GET") {
        return json(await listTrabajos(env));
      }
      if (path === "/api/admin/trabajos" && req.method === "POST") {
        const b = await req.json().catch(() => ({}));
        const titulo = String(b.titulo || "").trim();
        if (!titulo) return json({ error: "El título es obligatorio" }, 400);
        const info = await env.DB.prepare(
          "INSERT INTO trabajos (titulo, categoria, descripcion, foto, formato, orden) VALUES (?, ?, ?, ?, ?, (SELECT COALESCE(MAX(orden),0)+1 FROM trabajos))"
        )
          .bind(
            titulo,
            String(b.categoria || ""),
            String(b.descripcion || ""),
            String(b.foto || ""),
            b.formato === "tall" ? "tall" : "wide"
          )
          .run();
        return json({ id: info.meta.last_row_id }, 201);
      }

      const m = path.match(/^\/api\/admin\/trabajos\/(\d+)(\/foto)?$/);
      if (m) {
        const id = Number(m[1]);
        if (m[2] === "/foto" && req.method === "POST") {
          const form = await req.formData().catch(() => null);
          const file = form && form.get("foto");
          if (!file || typeof file === "string")
            return json({ error: "Falta la foto" }, 400);
          if (file.size > 20 * 1024 * 1024)
            return json({ error: "La foto supera los 20 MB" }, 400);
          const prev = await env.DB.prepare("SELECT foto FROM trabajos WHERE id = ?")
            .bind(id).first();
          if (!prev) return json({ error: "Trabajo no encontrado" }, 404);
          const key = `trabajos/${id}-${Date.now()}.jpg`;
          await env.MEDIA.put(key, file.stream(), {
            httpMetadata: { contentType: file.type || "image/jpeg" },
          });
          const foto = `/media/${key}`;
          await env.DB.prepare("UPDATE trabajos SET foto = ? WHERE id = ?")
            .bind(foto, id).run();
          if (prev.foto && prev.foto.startsWith("/media/")) {
            await env.MEDIA.delete(prev.foto.slice("/media/".length)).catch(() => {});
          }
          return json({ foto });
        }
        if (req.method === "PUT") {
          const b = await req.json().catch(() => ({}));
          const titulo = String(b.titulo || "").trim();
          if (!titulo) return json({ error: "El título es obligatorio" }, 400);
          await env.DB.prepare(
            "UPDATE trabajos SET titulo = ?, categoria = ?, descripcion = ?, formato = ?, orden = ? WHERE id = ?"
          )
            .bind(
              titulo,
              String(b.categoria || ""),
              String(b.descripcion || ""),
              b.formato === "tall" ? "tall" : "wide",
              Number.isFinite(+b.orden) ? +b.orden : 0,
              id
            )
            .run();
          return json({ ok: true });
        }
        if (req.method === "DELETE") {
          const prev = await env.DB.prepare("SELECT foto FROM trabajos WHERE id = ?")
            .bind(id).first();
          await env.DB.prepare("DELETE FROM trabajos WHERE id = ?").bind(id).run();
          if (prev && prev.foto && prev.foto.startsWith("/media/")) {
            await env.MEDIA.delete(prev.foto.slice("/media/".length)).catch(() => {});
          }
          return json({ ok: true });
        }
      }
      return json({ error: "Ruta no válida" }, 404);
    }

    // ---------- Sitio estático ----------
    return env.ASSETS.fetch(req);
  },
};
