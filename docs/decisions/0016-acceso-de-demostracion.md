# 0016 — Acceso de demostración: `npm run demo:setup`

**Estado:** APROBADO (2026-10-26, plan PSES 2.0 de portafolio).

## Contexto
Para probar la app, un evaluador tenía que crear el administrador con `create-admin`, inventar personas y registrar entradas una por una; las pantallas Dentro, Historial y Auditoría salían vacías. El estándar del portafolio exige un acceso de demostración reproducible que no dependa del autor.

Dos reglas existentes lo impedían: el seed no crea usuarios (D14) y las contraseñas nunca se imprimen (`npm run users`).

## Decisión
- Comando local **`npm run demo:setup`**, después de `db:deploy`:
  - **Una cuenta por rol** en el dominio reservado `@demo.cedi.test`: `seguridad@demo.cedi.test` (SECURITY) y `admin@demo.cedi.test` (ADMIN).
  - **Contraseñas generadas** con `crypto.randomInt` (16 caracteres al azar, sin caracteres ambiguos), que cumplen la regla de contraseñas nuevas. Se **muestran una sola vez** en la terminal y no se guardan en ningún archivo. Repetir el comando genera contraseñas nuevas para esas dos cuentas (y las reactiva si estaban desactivadas).
  - **Datos ficticios**: 10 personas de los cuatro tipos con solo los datos de su tipo (spec §7), visitas abiertas y cerradas de hoy, días anteriores, una visita olvidada desde ayer (D3), otra cerrada a mano por el administrador, un técnico dentro con herramientas, y la auditoría de todo ello. Las horas se calculan desde el momento de ejecución en `CEDI_TIMEZONE`.
- **Protecciones**: se niega con `NODE_ENV=production`; solo inserta (respeta los permisos de ADR 0012); los datos se crean una sola vez (si ya existe alguna persona `DEMO…`, no se duplican); no toca cuentas fuera de `@demo.cedi.test`.
- La excepción a «las contraseñas nunca se imprimen» aplica **solo** a `demo:setup` y a esas dos cuentas. `create-admin`, `npm run users` y el seed no cambian.
- Las empresas ficticias se comparten con el seed (`scripts/lib/demo-companies.ts`).

## Alternativas descartadas
- **Contraseñas fijas documentadas en el README:** cualquiera que lea el repositorio podría entrar en una instalación que las conserve.
- **Pedir las contraseñas como `create-admin`:** añade fricción al evaluador sin beneficio en una base local de demostración.
- **Insertar los datos desde la API (HTTP):** exigiría la app en marcha y no permite fechar visitas en días anteriores.

## Consecuencias
- Un evaluador ejecuta `db:up`, `db:deploy` y `demo:setup`, y entra con cualquiera de los dos roles con datos realistas.
- Las visitas de demostración envejecen: si se repite el comando otro día, no se recrean (no se duplican ni se borran).
- Una instalación de producción nunca tiene cuentas de demostración: el comando se niega a ejecutarse allí.
