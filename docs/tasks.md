# Tareas por fase

Actualizar al cerrar cada fase o tarea. No avanzar de fase sin aprobación.

## Fase 1 — Análisis  ✅ APROBADA (2026-10-23)
- [x] Revisar requisitos y detectar ambigüedades
- [x] Proponer arquitectura, modelo de datos, flujos y stack (`docs/plan.md`)
- [x] Aprobar D1-D14, R11-R16 y stack (`plan.md`)
- [x] Crear `docs/decisions/` con un ADR corto por decisión importante (0001-0007)

## Fase 2 — Base del proyecto  ✅ APROBADA (2026-10-23)
- [x] Monorepo, configuración, lint, tipos
- [x] docker-compose (BD), `.env.example`
- [x] Prisma: esquema, migraciones (índice parcial y CHECK en SQL)
- [x] Autenticación, roles (guards), seed, `create-admin`
- [x] Tests: autorización por rol, hash de contraseñas
- [x] Completar sección «Comandos» en `CLAUDE.md`
- [x] Web mínima: login, sesión y ruta protegida
- [x] CI en GitHub Actions (formato, lint, tipos, tests, integración, build)
- [x] `npm run test:integration` contra PostgreSQL 17 en Docker: 11/11, incluida la concurrencia de R1
- [x] `db:up` → `db:deploy` → `db:seed`
- [x] `create-admin` → login en la web (verificado por el responsable el 2026-10-23)
- [x] Sin drift: `prisma migrate diff` entre la BD y el esquema sale vacío (no borra el índice parcial ni los CHECK)

### Cambios de requisitos (2026-10-23)
**Cédula sin gafete (ADR 0008)**
- [x] Integrada en el spec (§5, §7, §9), plan (D7, D10, D13, D14, R13, R15, R17) y ADR 0008
- [x] Migración `cedula_sin_gafete`: se elimina `badge_code`, la cédula queda normalizada con CHECK y las visitas guardan `person_type` y `company_id`
- [x] `normalizeIdentification` / `identificationSchema` en `@cedi/shared`, con pruebas
- [x] Gestión de usuarios por terminal (`npm run users`), con la regla del último ADMIN activo probada

**Campos por tipo de persona (ADR 0009)**
- [x] Spec §7: tabla de datos por tipo. Empresa obligatoria para todos; motivo y área obligatorios para contratista, técnico y visitante; herramientas opcionales solo para técnico; sin «tipo de visita». Spec sin menciones al gafete.
- [x] Plan: D1, D8 y D9 enmendadas; nuevas R18 y R19
- [x] Migración `campos_por_tipo`: `company_id NOT NULL`, se elimina `visit_kind`, `CHECK visits_fields_by_person_type`
- [x] `personSchema`, `visitDetailsSchema` (unión discriminada estricta por tipo), `PERSON_TYPE_LABEL` y `VISIT_FIELDS_BY_TYPE` en `@cedi/shared`
- [x] Integración 21/21, unitarias 63/63, sin drift. Las pruebas de integración dejan `cedi_test` vacía al terminar.

## Fase 3 — Personas  ✅ APROBADA (2026-10-23)
- [x] Vista de personas separada por tipo (Trabajadores externos, Contratistas, Mantenimiento / Técnicos, Visitantes), cada sección con sus columnas (motivo, área y herramientas de la última visita, según el tipo)
- [x] Registrar, buscar (cédula por prefijo, nombre sin tildes, empresa) y editar personas; paginación; búsqueda y página en la URL
- [x] Empresas con autocompletado; creación en línea sin duplicados (`POST /companies` devuelve la existente)
- [x] Detalle con historial de visitas (tipo, empresa, motivo, área y herramientas de cada visita, R17)
- [x] Cédula y nombre solo editables por ADMIN; tipo y empresa por ambos roles; el cambio de tipo pide confirmación; todo auditado con nombres de campos (D12, D13)
- [x] D15: columna `persons.name_normalized` con índice trigram (migración `nombre_normalizado`, dentro de una transacción)
- [x] Validaciones con `personSchema` / `updatePersonSchema` compartidos
- [x] Tests: unitarias de servicio (permisos, campos cambiados, cédula duplicada, empresa inexistente), HTTP contra PostgreSQL (registro, secciones, búsqueda, paginación, detalle, edición por rol, auditoría) y lógica web (`changesBetween`)
- [x] Verificado en el navegador como guarda (escritorio y móvil)
- [x] Corregidos durante la fase: un error en la expresión regular que unía los espacios del nombre (borraba las «s»); resultados obsoletos en el autocompletado de empresas; `npm run users` con entrada por tubería

## Fase 4 — Ingreso y salida  ✅ APROBADA (2026-10-23)
- [x] Pantalla principal de ingreso y salida: campo de cédula enfocado, Enter envía, aviso grande «ENTRADA / SALIDA registrada», el cursor vuelve solo al campo
- [x] `ScannerSource` (contrato) con `ManualEntryScanner` (teclado; también sirve para un lector tipo teclado)
- [x] `POST /scans {identification, confirmed}`: persona nueva, salida automática, entrada pendiente, doble escaneo (D2) y visita de un día anterior (D3, día según la zona del CEDI)
- [x] `POST /visits`: entrada de persona existente, o persona nueva + primera entrada en una sola transacción
- [x] `PATCH /visits/:id/close`: cierre manual de visita olvidada con hora real (validada y auditada)
- [x] Formulario de visita según el tipo, con motivo y área prellenados de la visita anterior (D1); herramientas opcionales solo para técnico
- [x] Reloj inyectable (`Clock`) para probar D2 y D3; auditoría de entrada, salida y cierre manual
- [x] Tests: doble entrada (incluida la concurrencia de 5 casetas), salida sin entrada (R2), cierre correcto, persona registrada y no registrada, todo o nada al registrar persona nueva, R17, R18, R16/R19, D1, D2, D3 y medianoche en la zona del CEDI
- [x] Verificado en el navegador: contratista (entrada, doble escaneo, salida), técnico nuevo con herramientas, visita olvidada cerrada y nueva entrada prellenada
- [x] Ajustes de uso: el diálogo de confirmación enfoca «Cancelar» (un Enter accidental no confirma); registrar persona nueva pide elegir el tipo explícitamente y empieza en el nombre
- [ ] E2E con Playwright del flujo de escaneo (planificado para la Fase 9)

## Fase 5 — Dashboard  ✅ APROBADA (2026-10-23)
- [x] Inicio = dashboard de la caseta: ingresar cédula sigue siendo la acción principal; debajo, indicadores del día, personas dentro (las 8 primeras) y actividad reciente (spec §14)
- [x] Indicadores: dentro ahora (número principal), entradas de hoy, salidas de hoy y visitas sin salida de días anteriores (ámbar con ícono y texto solo si hay alguna, D3)
- [x] Vista «Dentro» (spec §17): filtro por tipo con conteos, búsqueda por nombre o cédula, hora de entrada, tiempo dentro, visitas olvidadas resaltadas y «Cerrar visita» con hora real (D3)
- [x] `GET /dashboard/summary` y `GET /visits/inside`; «hoy» empieza a medianoche en la zona del CEDI (`startOfDay`, contempla cambios de horario, D6)
- [x] Actualización cada 10 s y al instante tras cada operación local (D11)
- [x] `Clock` pasa a un módulo global (`common/time`) compartido por escaneo y dashboard
- [x] Tests: medianoche y cambio de horario (unitarias), conteos del día con una entrada a las 23:30 locales, orden de «dentro», actividad reciente, actualización tras una salida y acceso sin sesión (integración), filtro y duraciones (web)
- [x] Verificado en el navegador: dashboard, actualización desde otra sesión en ≤ 10 s, vista «Dentro», cierre de visita olvidada, móvil sin desbordamiento

## Fase 6 — Historial  ✅ APROBADA (2026-10-23)
- [x] Sección «Historial» separada por tipo (ADR 0009), cada pestaña con sus columnas: persona, empresa, fecha, entrada, salida, duración, estado; motivo y área según el tipo; herramientas para técnicos
- [x] Filtros en una fila: atajos Hoy / Últimos 7 días / Este mes / Todo, rango desde-hasta, estado (dentro / salida registrada) y búsqueda por nombre, cédula o empresa; por defecto, las visitas de hoy; todo en la URL
- [x] `GET /visits` (paginado) y `GET /visits/:id`; los días se cuentan en la zona del CEDI (`startOfLocalDate`, D6); la empresa buscada es la de cada visita (R17)
- [x] Detalle de visita: tipo y empresa de ese momento, motivo, área, herramientas, quién registró entrada y salida, duración; enlace al historial completo de la persona (también desde su ficha)
- [x] `GET /visits/inside` se registra antes que `GET /visits/:id` (orden de módulos, con prueba)
- [x] Búsqueda normalizada compartida entre personas e historial (`searchTermsOf`)
- [x] Tests: filtros por tipo, días del CEDI con entrada a las 23:30, estado, empresa de cada visita, nombre sin tildes, prefijo de cédula, paginación, detalle, validación y 404 (integración); rangos y filtros en la URL (web); días locales (unitarias)
- [x] Verificado en el navegador, incluido móvil; se corrigió el encabezado en pantallas pequeñas (el menú pasa a su propia fila y «Cerrar sesión» queda visible)

## Fase 7 — Herramientas  ✅ APROBADA (2026-10-23)
Ya hecho en fases anteriores: registro al entrar, solo para técnicos (Fase 4, R16/R19) y consulta en historial y detalle (Fase 6).
Alcance aprobado el 2026-10-23: **revisión al salir**. Descartado por ahora: herramientas en «Dentro», búsqueda por herramienta, agregar herramientas a una visita abierta.
- [x] Al registrar la salida de un técnico, el aviso muestra las herramientas con que entró para verificarlas (sin formulario adicional, spec §11): recuadro ámbar con ícono y texto
- [x] `formatToolLabel` compartido entre el aviso y el historial («Taladro ×2 · inalámbrico»)
- [x] Tests: la salida devuelve las herramientas (integración), el aviso las incluye y el formato (web)
- [x] Verificado en el navegador: entrada de técnico con 2 herramientas → salida con confirmación D2 → aviso con la lista

## Fase 8 — Auditoría  ✅ APROBADA (2026-10-23)
- [x] Registro transversal (desde las Fases 3-4): alta y cambios de personas con nombres de campos, entradas, salidas y cierres manuales, en la misma transacción que la operación (D12: nunca valores)
- [x] `GET /audit` y `GET /audit/actors` solo para ADMIN (`@Roles` en toda la clase); filtros por días del CEDI, acción, usuario y registro
- [x] Cada registro muestra sobre qué persona fue (en visitas, la persona y la hora de entrada), resuelto en dos consultas
- [x] Acciones, entidades y nombres de campos en `@cedi/shared`, con textos en español
- [x] Vista «Auditoría» solo para Administrador (menú y ruta); enlace «Ver auditoría de esta persona» en su ficha
- [x] Atajos de fecha compartidos entre historial y auditoría (`lib/date-range`, `DateRangeFilter`)
- [x] Tests: 403 para Seguridad, orden y contenido, sin valores guardados, filtros por acción, usuario, registro y día (integración); filtros en la URL (web)
- [x] **Corregido:** al cerrar sesión la pantalla no redirigía al login y seguía mostrando los datos cargados (`queryClient.clear()` desconectaba a quien escuchaba la sesión)
- Fuera de alcance (ADR 0008): los cambios de cuentas con `npm run users` no quedan en la auditoría porque no hay un usuario de la app que los haga

## Fase 9 — Testing  ✅ APROBADA (2026-10-23)
- [x] Matriz de trazabilidad spec §34 y reglas (R1-R19, D1-D15) → pruebas: `docs/testing.md`
- [x] Huecos cubiertos: cuentas de usuario contra la BD real (crear, R14, R15, restablecer contraseña) y empresas creadas a la vez desde varias casetas
- [x] Cobertura con `@vitest/coverage-v8` y umbrales: API 97 % líneas / 86 % ramas (unitarias + integración), `shared` 95 %, lógica web 89 % / 91 %; nuevas pruebas de `http.ts` y de fechas locales
- [x] E2E con Playwright (9 escenarios): cédula nueva, doble escaneo, prellenado, herramientas al salir, visita olvidada, historial, Seguridad sin auditoría, auditoría como Admin, cierre de sesión. API :3100 y web :5174 propias; BD de pruebas preparada y vaciada en cada corrida
- [x] CI: `test:coverage` (unitarias + integración con umbrales) y E2E en Chromium, con informe de Playwright si fallan
- [x] Dependencias: aviso de seguridad en `multer` (vía `@nestjs/platform-express`) resuelto con `overrides` a 2.5.0; 0 vulnerabilidades
- Nota del equipo local: el Chromium descargado por Playwright no arranca en este Windows («configuración en paralelo incorrecta»); `E2E_BROWSER_CHANNEL=chrome` en `.env` usa el Chrome instalado. En CI se usa el Chromium de Playwright.

## Fase 10 — UI/UX final  ✅ APROBADA (2026-10-23)
- [x] Accesibilidad WCAG 2.1 A/AA revisada con axe en todas las pantallas (login, 8 pantallas internas, persona nueva, confirmación): sin problemas; queda como prueba e2e permanente
- [x] Estados comunes `LoadingState`, `ErrorState` (con «Reintentar») y `EmptyState` en las 8 pantallas
- [x] Sesión vencida o cuenta desactivada a mitad de turno → login con aviso «Tu sesión terminó»; reintentos solo ante cortes de conexión o fallas del servidor
- [x] Página «No encontrada» y pantalla de error general sin detalles técnicos (spec §26)
- [x] Sonido opcional del escaneo (spec §25): tonos distintos para entrada, salida y error; botón «Sonido» recordado en el navegador
- [x] Botones y campos de al menos 40 px; «Saltar al contenido»; título de pestaña por pantalla
- [x] Tablet (768 px): encabezado en una línea; **corregido** un desborde horizontal de la página causado por el encabezado oculto de las tablas
- [x] Tests: axe, tablet sin desbordes ni controles pequeños, teclado, títulos, sesión vencida y 404 (e2e, 17 en total); cliente de consultas, sonido, secciones y aviso de sesión (web)

## Fase 11 — Producción  ✅ APROBADA (2026-10-23)
- [x] ADR 0010: un contenedor; la API sirve la web compilada (mismo origen), migraciones al arrancar, `GET /api/health`, `TRUST_PROXY`, puerto por `API_PORT` o `PORT`
- [x] `Dockerfile` multi-etapa (usuario sin privilegios, healthcheck) y `docker-compose.prod.yml`; **probado en Docker**: migraciones desde cero, `create-admin` dentro del contenedor, health, login con cookie `Secure` y web en el navegador
- [x] Revisión de seguridad (`docs/security.md`): endpoints públicos, SQL, validación, secretos, cabeceras, dependencias (0 vulnerabilidades)
- [x] **Corregido:** restablecer la contraseña o desactivar una cuenta no cerraba las sesiones abiertas → `users.sessions_valid_from` y versión en la sesión (R20, migración `sesiones_validas_desde`)
- [x] Variables de producción documentadas; las opcionales vacías en `.env` cuentan como no definidas
- [x] Capturas generadas con Playwright (`npm run screenshots`, datos de prueba) en `docs/screenshots/`
- [x] README con todas las secciones del spec §31
- [x] CI construye también la imagen Docker
- [x] Tests: web servida por la API, rutas /api, caché, health 503/200, cabeceras, revocación de sesiones, variables vacías
- Pendiente del responsable: crear el repositorio git, publicarlo en GitHub y elegir la plataforma de despliegue (la imagen sirve para cualquiera que acepte Docker)

## Fase 12 — Rediseño de la interfaz (ADR 0011)  ✅ APROBADA (2026-10-23)
- [x] ADR 0011 y spec §14, §27: sistema de diseño y «Ingreso y salida» a pantalla completa en escritorio
- [x] Tokens de color, radios y sombras en `index.css`; Inter autoalojada; íconos SVG propios
- [x] Componentes base restilizados (`Button`, `Badge`, `Input`, `Select`, `Alert`, `StatTile`, estados, diálogo, filtros de fecha) y nuevo `Card`
- [x] Barra superior horizontal con marca, pestaña activa subrayada y usuario real de la sesión
- [x] «Ingreso y salida» según la imagen aprobada: escaneo con ilustración, 4 indicadores con ícono, «Personas dentro» y «Actividad reciente» con scroll interno; sin scroll de página en 1280 × 720, 1366 × 768 y 1920 × 1080
- [x] **Corregido:** el nuevo fondo dejaba el gris `slate-500` bajo contraste AA (pestañas del historial); se usa el token `ink-muted`
- [x] Tests: e2e sin scroll de página en 1280 × 720 y 1920 × 1080 (19 en total)
- [x] «Ingreso y salida» aprobada por el responsable
- [x] Componentes compartidos nuevos: `PageHeader`, `SegmentedControl`, `SearchInput` y `DataTable` (`Th`, `Td`)
- [x] Dentro: encabezado, filtro por tipo con conteos, búsqueda con lupa y tabla compartida dentro de una tarjeta; «Cerrar visita» sin cambios
- [x] Historial: pestañas por tipo, filtros (fechas, estado, búsqueda) en una barra compacta, tabla compartida y paginación; detalle de visita con tarjetas
- [x] Dentro e Historial aprobados por el responsable
- [x] Personas: encabezado con «Registrar persona», pestañas, búsqueda y tabla compartida; ficha con tarjetas «Datos» y «Visitas recientes»; registro en tarjeta
- [x] Formularios: aviso de campos obligatorios, dos columnas cuando hay espacio (consulta de contenedor), errores bajo cada campo; flujo de persona nueva con «Paso 1 de 2» y «Paso 2 de 2»; visita olvidada con aviso ámbar e ícono. Campos sin cambios
- [x] Auditoría: barra de filtros (fechas, acción, usuario) y tabla compartida; cada acción con ícono y su texto
- [x] Login, «Página no encontrada», error general y aviso de permiso con el mismo sistema; no queda ningún color fuera de los tokens
- [x] Capturas del README regeneradas (`npm run screenshots`)
- [x] Revisión final del responsable: rediseño aprobado

## Fase 13 — Remediación de seguridad, Etapa 1  ✅ APROBADA (2026-10-24)
Hallazgos de la auditoría de seguridad del 2026-10-24 (4 medios, 9 bajos, 8 informativos; sin críticos ni altos).
- [x] SEC-01: cerrar sesión revoca la sesión en el servidor (`sessions_valid_from`); una copia de la cookie deja de valer
- [x] SEC-02: rol `cedi_app` sin DELETE, TRUNCATE ni DDL; usuario de la API creado por `npm run db:deploy`; migraciones aparte con el dueño de las tablas; la imagen ya no migra al arrancar (ADR 0012)
- [x] SEC-03: el cierre manual solo aplica a visitas de días anteriores (D3); la salida de hoy se registra escaneando
- [x] Tests: SEC-01 (HTTP), SEC-02 (permisos y usuario de la API, integración; E2E con usuario sin privilegios), SEC-03 (integración)
- [x] **Probado en Docker** (proyecto aislado): `migrate` aplica las 6 migraciones y crea el usuario de la API; la app solo recibe ese usuario; `create-admin` dentro del contenedor; login con cookie `Secure`; logout invalida la copia de la cookie; el usuario de la API no puede borrar la auditoría; repetir `migrate` no falla
- [x] Revisión del responsable: aprobada y unida a `main` (pull request #2)

## Fase 14 — Remediación de seguridad, Etapa 2  ✅ APROBADA (2026-10-25)
- [x] SEC-04: eventos de seguridad en el log estructurado (logins, bloqueos, logout, sesiones rechazadas, accesos denegados, límites) y alerta `security.alert` por volumen de fallos (ADR 0013)
- [x] SEC-05: bloqueo temporal por correo tras 5 fallos seguidos (15 min), también para correos inexistentes (ADR 0013)
- [x] SEC-06: 413 ante un cuerpo demasiado grande y 400 ante JSON mal formado, en lugar de 500
- [x] SEC-12: la API se niega a arrancar en producción con los secretos de ejemplo; `e2e:prepare` se niega en producción; guía de secretos de producción en `docs/security.md`
- [x] SEC-12 en desarrollo: cuentas de prueba desactivadas, variables `DEV_*` eliminadas y rotados `JWT_SECRET` y la contraseña del dueño de PostgreSQL (2026-10-24)
- [x] Revisión del responsable: aprobada y unida a `main` (pull request #3)

## Fase 15 — Remediación de seguridad, Etapa 3  🔄 EN REVISIÓN
Primera unidad del plan PSES 2.0 (aprobado el 2026-10-25). Decisiones en ADR 0014.
- [x] SEC-07: límite de peticiones a toda la API por usuario (o por IP sin sesión); el de login sigue aparte
- [x] SEC-08: rechazo de contraseñas fáciles de adivinar en `npm run users` y `create-admin`
- [x] SEC-09: riesgo aceptado y documentado (sin expiración por inactividad; ver ADR 0014)
- [x] SEC-10: PostgreSQL de desarrollo solo en `127.0.0.1`
- [x] SEC-13: logs de petición sin cadena de búsqueda, parámetros ni encabezados
- [x] I1: token HS256 con emisor y audiencia exigidos
- [x] I3: CSP sin `unsafe-inline`
- [ ] Revisión del responsable
- Pendiente: SEC-11 (auditoría de dependencias y escaneo de secretos en CI), en su propia unidad
