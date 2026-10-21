# Web de Idoia Esteban Galván

Sitio estático para GitHub Pages. Repositorio previsto: `idoiaesteban/idoiaesteban.github.io`.
La web se publica desde `main` / `/ (root)` en Settings → Pages.

- Abre `https://idoiaesteban.github.io/` para ver la web.
- Abre `https://idoiaesteban.github.io/gestor.html` para editar contenido y fotos.
- El gestor pide un token de GitHub con permiso Contents: Read and write para este repositorio. El token se guarda en el navegador, no en los archivos de la web.
- Las fotos y fichas están en `contenido/`; `contenido/datos-generados.js` es el índice que lee la web y lo actualiza el gestor al publicar.
- El diseño está en `assets/`. Los vídeos se reproducen desde enlaces públicos de Cloudflare R2: ese almacenamiento sigue siendo externo a este repositorio.
- Cuando se conozca el dominio `.com`, configurarlo desde Settings → Pages → Custom domain y después ajustar DNS. No crear `CNAME` con un dominio provisional.

Esta copia procede de `ipesoa/idoweb` y conserva el diseño, las fotos y el gestor. Se retiraron herramientas antiguas de importación/publicación y entradas duplicadas de Contact que se habían señalado para eliminar.
