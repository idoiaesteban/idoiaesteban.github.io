/* =====================================================================
   SEO  ·  datos para buscadores (no cambia nada de lo que se ve)
   ---------------------------------------------------------------------
   Se carga el último en cada página. Con los datos de contenido.js:
     · proyecto.html  → título, descripción, canonical y Open Graph de
                        ESE trabajo + ficha schema.org (Movie, TVSeries o
                        CreativeWork) que enlaza con Idoia (Person)
     · films, series… → lista schema.org (ItemList) de los trabajos
     · sección vacía o proyecto que no existe → noindex (que Google no
       guarde páginas vacías)
   Los datos fijos (Person, WebSite, ProfilePage) van en cada .html.
   Si algo falla aquí, la web sigue igual: todo va dentro de un try.
   ===================================================================== */
(function () {
  try {
    const DOMINIO = "https://idoiaesteban.com/";
    const PERSONA = { "@id": DOMINIO + "#idoia-esteban-galvan" };
    const NOMBRE = (window.Web && Web.about && Web.about.nombre) || "Idoia Esteban Galván";
    const pagina = document.body.dataset.pagina;
    const absoluta = (u) => new URL(u, DOMINIO).href;

    function meta(atributo, clave, valor) {
      let m = document.head.querySelector(`meta[${atributo}="${clave}"]`);
      if (!m) { m = document.createElement("meta"); m.setAttribute(atributo, clave); document.head.append(m); }
      m.setAttribute("content", valor);
    }
    function canonical(url) {
      let l = document.head.querySelector('link[rel="canonical"]');
      if (!l) { l = document.createElement("link"); l.rel = "canonical"; document.head.append(l); }
      l.href = url;
    }
    function jsonld(datos) {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.textContent = JSON.stringify(datos);
      document.head.append(s);
    }
    const noIndexar = () => meta("name", "robots", "noindex, follow");
    const enlaceAbsoluto = (p) => /^https?:\/\//i.test(p.enlace)
      ? p.enlace : absoluta(`proyecto.html?tipo=${p.tipo}&id=${encodeURIComponent(p.id)}`);

    /* ---- listas: films, series, comercials, videoclips, work ---- */
    if (["films", "series", "comercials", "videoclips", "work"].includes(pagina)) {
      const lista = Web.proyectos(pagina);
      if (!lista.length) { noIndexar(); return; }
      jsonld({
        "@context": "https://schema.org",
        "@type": "ItemList",
        "@id": absoluta(pagina + ".html") + "#trabajos",
        name: document.title,
        numberOfItems: lista.length,
        itemListElement: lista.map((p, i) => ({
          "@type": "ListItem", position: i + 1, url: enlaceAbsoluto(p), name: p.titulo,
        })),
      });
      return;
    }

    if (pagina !== "proyecto") return;

    /* ---- página de un trabajo ---- */
    const params = new URLSearchParams(location.search);
    const tipos = Web.tipos();
    const tipo = tipos.includes(params.get("tipo")) ? params.get("tipo") : tipos[0];
    const p = Web.proyecto(tipo, params.get("id"));
    if (!p) { noIndexar(); return; }

    const url = enlaceAbsoluto(p);
    const separar = (s) => String(s || "").split(/\s*\/\s*|\s*,\s*|\s+&\s+/).map((x) => x.trim()).filter(Boolean);
    // "labor" del info.txt: solo lo que pone (sin "Coming soon"), hasta el primer punto
    const labor = /coming soon/i.test(p.labor) ? "" : String(p.labor || "").split(/\.\s/)[0].replace(/\.$/, "").trim();
    const estreno = /coming soon/i.test(p.labor);
    const clase = { films: "film", series: "series", comercials: "commercial", videoclips: "music video" }[p.tipo] || "project";
    const fotos = (p.fotosPagina || p.galeria || []).filter((m) => !m.video).map((m) => absoluta(m.url));
    // la portada (la foto de la parrilla) va la primera: es la imagen que representa el trabajo
    if (p.portada) {
      const portada = absoluta(p.portada.url);
      if (fotos.includes(portada)) fotos.splice(fotos.indexOf(portada), 1);
      fotos.unshift(portada);
    }
    const hayVideo = !!(p.video && String(p.video).trim());

    // título de la pestaña y de Google
    const titulo = `${p.titulo}${p.ano ? ` (${p.ano})` : ""} · ${NOMBRE} · Production Designer`;
    document.title = titulo;

    // descripción: solo datos que ya están en la ficha
    const quien = p.director ? ` directed by ${p.director}` : "";
    const prod = (p.productora || p.cliente) ? `, produced by ${p.productora || p.cliente}` : "";
    const medios = [fotos.length ? "stills" : "", hayVideo ? (["films", "series"].includes(p.tipo) ? "trailer" : "video") : ""].filter(Boolean).join(" and ");
    const descripcion = (`${p.titulo}${p.ano ? ` (${p.ano})` : ""}${estreno ? ", coming soon" : ""}: ${clase}${quien}${prod}. ` +
      `${labor ? `Role: ${labor}. ` : ""}Portfolio of production designer ${NOMBRE}${medios ? ` — ${medios}` : ""}.`).replace(/\s+/g, " ");

    canonical(url);
    meta("name", "description", descripcion);
    meta("property", "og:type", p.tipo === "films" ? "video.movie" : p.tipo === "series" ? "video.tv_show" : "website");
    meta("property", "og:url", url);
    meta("property", "og:title", titulo);
    meta("property", "og:description", descripcion);
    meta("name", "twitter:title", titulo);
    meta("name", "twitter:description", descripcion);
    if (fotos[0]) {
      meta("property", "og:image", fotos[0]);
      meta("property", "og:image:alt", `${p.titulo} — ${NOMBRE}`);
      meta("name", "twitter:image", fotos[0]);
    }
    // quitar el tamaño fijo de la imagen genérica (ya no es esa)
    if (fotos[0]) document.head.querySelectorAll('meta[property="og:image:width"], meta[property="og:image:height"]').forEach((m) => m.remove());

    // ficha schema.org del trabajo
    const tipoSchema = { films: "Movie", series: "TVSeries" }[p.tipo] || "CreativeWork";
    const obra = {
      "@type": tipoSchema,
      "@id": url + "#obra",
      name: p.titulo,
      url,
      contributor: labor
        ? { "@type": "Role", roleName: labor, contributor: PERSONA }
        : PERSONA,
    };
    if (p.ano) obra.dateCreated = String(p.ano);
    if (p.tipo === "comercials") obra.genre = "Commercial";
    if (p.tipo === "videoclips") obra.genre = "Music video";
    const directores = separar(p.director).map((n) => ({ "@type": "Person", name: n }));
    if (directores.length) obra.director = directores.length === 1 ? directores[0] : directores;
    const productoras = separar(p.productora).map((n) => ({ "@type": "Organization", name: n }));
    if (productoras.length) obra[tipoSchema === "CreativeWork" ? "producer" : "productionCompany"] = productoras;
    if (p.cliente) obra.sponsor = { "@type": "Organization", name: p.cliente };
    if (fotos.length) obra.image = fotos.slice(0, 10);
    if (p.texto) obra.abstract = p.texto.replace(/\*/g, "").replace(/\s+/g, " ").slice(0, 500);

    jsonld({
      "@context": "https://schema.org",
      "@graph": [
        obra,
        {
          "@type": "WebPage",
          "@id": url,
          url,
          name: titulo,
          description: descripcion,
          inLanguage: "en",
          isPartOf: { "@id": DOMINIO + "#web" },
          about: { "@id": url + "#obra" },
          author: PERSONA,
          ...(fotos[0] ? { primaryImageOfPage: { "@type": "ImageObject", url: fotos[0] } } : {}),
          breadcrumb: {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: NOMBRE, item: DOMINIO },
              { "@type": "ListItem", position: 2, name: ((AJUSTES.secciones || []).find((s) => s.id === p.tipo) || {}).titulo || p.tipo,
                item: absoluta(((AJUSTES.secciones || []).find((s) => s.id === p.tipo) || {}).pagina || "work.html") },
              { "@type": "ListItem", position: 3, name: p.titulo, item: url },
            ],
          },
        },
      ],
    });
  } catch (e) {
    console.warn("seo.js:", e);
  }
})();
