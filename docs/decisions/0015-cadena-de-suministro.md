# 0015 — Cadena de suministro en CI: auditoría, secretos y acciones fijadas

**Estado:** APROBADO (2026-10-26, remediación de la auditoría de seguridad: SEC-11).

## Contexto
La auditoría (SEC-11) encontró que:
- el CI no revisaba vulnerabilidades conocidas en las dependencias ni secretos en el historial de Git;
- las acciones de GitHub se usaban por etiqueta movible (`@v4`), que su dueño puede reapuntar a otro código;
- el workflow tenía los permisos por defecto del `GITHUB_TOKEN`.

## Decisión
- **Job `supply-chain`** en el CI, en paralelo con el de pruebas:
  - `npm audit --audit-level=high`: falla con vulnerabilidades altas o críticas, de producción o de desarrollo (las herramientas de desarrollo también corren en el CI).
  - **gitleaks** sobre todo el historial (`fetch-depth: 0`) con `--redact`, para que un hallazgo nunca muestre el valor en los logs públicos del CI. Se ejecuta desde su imagen oficial fijada por digest, el mismo comando que se puede correr en local con Docker. No se usa una acción de terceros, que pediría permisos sobre los PR.
- **Acciones fijadas por commit** (`actions/checkout`, `setup-node`, `upload-artifact`), con la versión en un comentario.
- **`permissions: contents: read`** para todo el workflow.
- **Dependabot** semanal para npm y para las acciones. Agrupa parches y versiones menores en un PR; cada versión mayor llega en su propio PR. Solo propone: cada PR pasa por el CI completo y se revisa antes de unirlo.
- **Versiones:** se conservan los rangos `^` de `package.json`. Lo que se instala lo define `package-lock.json`, y `npm ci` (CI e imagen Docker) falla si no coincide con `package.json`.

## Alternativas descartadas
- **Fijar versiones exactas en `package.json`:** el lockfile ya da instalaciones reproducibles; fijar todo agregaría cambios sin beneficio verificable.
- **`gitleaks/gitleaks-action`:** necesita el token con permisos sobre los PR y es otra dependencia de terceros que hay que fijar.
- **Actualizar automáticamente (auto-merge de Dependabot):** contradice la regla de revisar cada actualización.

## Consecuencias
- Una vulnerabilidad alta publicada en una dependencia hace fallar el CI hasta que se actualice o se documente su excepción.
- Las acciones fijadas no reciben correcciones solas: Dependabot propone el nuevo commit.
- El escaneo de secretos de GitHub (y su protección al hacer push) es una opción del repositorio: el dueño la activa en Settings → Code security.
