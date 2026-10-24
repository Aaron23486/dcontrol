# PROYECTO: Sistema de Control de Ingreso y Salida de Personal Externo — CEDI

## REQUISITO EXPRESO — ELIMINACIÓN DEL CAMPO «PERSONA QUE AUTORIZA»

**No se debe solicitar, almacenar ni mostrar el campo «Persona que autoriza» en ninguna parte de la aplicación.** Esta decisión aplica a contratistas, mantenimiento/técnicos, visitantes y cualquier otro tipo de persona. Por tanto, el campo no debe aparecer en formularios de registro, formularios de ingreso, detalles de visitas, filtros, reportes, APIs, validaciones ni modelo de datos. No sustituirlo por otro campo de autorización equivalente sin consultarme.

**Importante:** esta eliminación se refiere exclusivamente a la persona que autoriza físicamente el ingreso al CEDI. No elimina la **autenticación** ni la **autorización informática por roles** (Seguridad y Administrador), las cuales siguen siendo obligatorias.

---

## 1. ROL QUE DEBES ASUMIR

Actúa como un equipo senior multidisciplinario compuesto por:

- Analista de negocio.
- Analista funcional.
- Arquitecto de software.
- Ingeniero Full Stack.
- Diseñador UI/UX especializado en aplicaciones empresariales.
- Ingeniero de bases de datos.
- Especialista en seguridad de aplicaciones.
- QA / ingeniero de pruebas.
- DevOps.

Tu responsabilidad es diseñar y desarrollar una aplicación web empresarial **completamente funcional**, no un prototipo visual ni un mockup.

Debes analizar los requerimientos, detectar inconsistencias, proponer mejoras cuando sean necesarias y construir una solución mantenible, segura, escalable y profesional.

NO debes agregar funcionalidades solamente para hacer que el proyecto parezca más grande. Cada funcionalidad debe responder a una necesidad real del proceso.

---

# 2. CONTEXTO DEL PROYECTO

El proyecto consiste en desarrollar un sistema web para el **registro y control de ingreso y salida de personal externo de un CEDI (Centro de Distribución)**.

El CEDI recibe personas que no pertenecen directamente a la organización, entre ellas:

- Trabajadores externos recurrentes.
- Contratistas.
- Técnicos.
- Personal de mantenimiento.
- Visitantes.
- Personal de otras empresas.

Cada persona se identifica por su número de cédula, que Seguridad registra al momento de su ingreso y su salida.

El objetivo principal del sistema es:

> Saber quién se encuentra actualmente dentro del CEDI y mantener un historial completo y confiable de sus entradas y salidas.

El sistema debe priorizar la rapidez del proceso de ingreso y salida, especialmente para el personal de seguridad que utilizará la aplicación durante la operación diaria.

---

# 3. PROBLEMA QUE SE DESEA RESOLVER

El CEDI necesita controlar de manera centralizada y trazable el ingreso y salida de personas externas.

Las personas pueden acudir diariamente o solamente una vez.

Se requiere una solución que permita:

- Mantener un registro centralizado.
- Identificar rápidamente a la persona mediante su cédula.
- Registrar automáticamente la hora de entrada.
- Registrar automáticamente la hora de salida.
- Saber quién se encuentra dentro del CEDI en tiempo real.
- Consultar el historial de visitas.
- Mantener información diferente dependiendo del tipo de persona.
- Mantener trazabilidad de las operaciones realizadas.

---

# 4. OBJETIVO GENERAL

Desarrollar una aplicación web para gestionar el registro, control y consulta del ingreso y salida de personal externo al CEDI.

La aplicación debe permitir que el proceso operativo sea:

> ESCANEAR → IDENTIFICAR → REGISTRAR ENTRADA → PERSONA DENTRO → ESCANEAR → REGISTRAR SALIDA.

El sistema debe ser sencillo para el usuario de seguridad y suficientemente completo para demostrar buenas prácticas de desarrollo de software.

---

# 5. USUARIOS DEL SISTEMA

Existirán únicamente dos roles.

## 5.1 Seguridad

Es el usuario operativo principal.

Debe poder:

- Iniciar sesión.
- Registrar personas.
- Buscar personas.
- Registrar entradas.
- Registrar salidas.
- Consultar personas actualmente dentro.
- Consultar visitas.
- Consultar historial.
- Visualizar información relevante de una persona.
- Actualizar los datos que cambian con el tiempo (tipo de persona y empresa).

## 5.2 Administrador

Tiene las funciones de Seguridad y adicionalmente puede:

- Corregir el nombre o la cédula de una persona cuando hubo un error de captura.
- Consultar información administrativa necesaria (auditoría).

No debe existir registro público de usuarios ni pantalla de gestión de usuarios.

Quien opera la aplicación es el guarda de Seguridad, con su propio correo y contraseña. Las cuentas (de Seguridad y de Administrador) se crean, activan, desactivan y cambian de contraseña mediante comandos de terminal.

---

# 6. AUTENTICACIÓN

La aplicación utilizará autenticación interna mediante:

- Usuario/email.
- Contraseña.
- Sesión segura.
- Roles y autorización.

NO implementar:

- Google Login.
- Microsoft Login.
- Facebook Login.
- OAuth externo.
- Registro público.

La razón es que el proyecto está pensado como una aplicación interna empresarial.

El repositorio de GitHub debe quedar preparado para que un reclutador pueda:

1. Clonar el proyecto.
2. Configurar las variables de entorno.
3. Conectar su propia base de datos.
4. Ejecutar migraciones.
5. Crear el usuario administrador.
6. Iniciar sesión.
7. Utilizar completamente el sistema.

No incluir credenciales reales dentro del repositorio.

---

# 7. TIPOS DE PERSONAS EXTERNAS

El sistema maneja cuatro tipos de persona. **Todos** se identifican por su cédula y **todos** pertenecen a una empresa.

Hay datos **de la persona**, que se registran una sola vez, y datos **de cada visita**, que se piden en cada ingreso según el tipo.

| Dato | Trabajador externo | Contratista | Mantenimiento / Técnico | Visitante |
|---|:---:|:---:|:---:|:---:|
| Nombre completo (persona) | Obligatorio | Obligatorio | Obligatorio | Obligatorio |
| Cédula (persona) | Obligatoria | Obligatoria | Obligatoria | Obligatoria |
| Empresa (persona) | Obligatoria | Obligatoria | Obligatoria | Obligatoria |
| Motivo (visita) | — | Obligatorio | Obligatorio | Obligatorio |
| Área (visita) | — | Obligatoria | Obligatoria | Obligatoria (área que visita) |
| Herramientas o equipos (visita) | — | — | Opcional | — |

«—» significa que el dato **no se pide ni se guarda** para ese tipo. Así la información de un tipo no se mezcla con la de otro.

### TRABAJADOR EXTERNO

Persona que trabaja regularmente en el CEDI pero pertenece a otra empresa.

- Nombre completo.
- Cédula.
- Empresa.

No se pide información adicional en cada ingreso: si ya está registrado, basta con su cédula.

### CONTRATISTA

Persona que ingresa para realizar un trabajo específico.

- Nombre completo.
- Cédula.
- Empresa.
- En cada visita: motivo y área.

### MANTENIMIENTO / TÉCNICO

Persona que ingresa para realizar trabajos técnicos o de mantenimiento.

- Nombre completo.
- Cédula.
- Empresa.
- En cada visita: motivo, área y, si los trae, las herramientas o equipos que ingresa.

### VISITANTE

Persona que visita el CEDI ocasionalmente.

- Nombre completo.
- Cédula.
- Empresa.
- En cada visita: motivo y área que visita.

### Datos fijos y datos que cambian

- **Nombre y cédula** no cambian. Solo un Administrador puede corregirlos si hubo un error de captura.
- **Tipo de persona y empresa** pueden cambiar con el tiempo (por ejemplo, alguien pasa de la empresa 1 a la empresa 2). Seguridad puede actualizarlos.
- Cada visita conserva el tipo y la empresa que la persona tenía al entrar, para que el historial no cambie cuando se actualizan sus datos.
- Para agilizar, el motivo y el área de una visita se prellenan con los de la visita anterior de esa persona.

---

# 8. CONCEPTO IMPORTANTE: PERSONA VS VISITA

No almacenar toda la información en una sola entidad.

Separar conceptualmente:

## PERSONA

Representa quién es la persona.

Ejemplo:

- ID.
- Nombre.
- Identificación.
- Empresa (vigente; puede cambiar).
- Tipo de persona (vigente; puede cambiar).

## VISITA

Representa cada ingreso realizado por una persona.

Debe almacenar como mínimo:

- ID.
- Persona.
- Fecha.
- Hora de entrada.
- Hora de salida.
- Estado.
- Usuario que registró el ingreso.
- Usuario que registró la salida.
- Tipo de persona y empresa vigentes al entrar.
- Motivo y área, según el tipo (sección 7).
- Herramientas o equipos, solo para mantenimiento / técnico.

Una misma persona puede tener múltiples visitas.

Ejemplo:

Juan Pérez puede tener:

Visita 1 → 07/10/2026\
Visita 2 → 08/10/2026\
Visita 3 → 09/10/2026

No duplicar los datos permanentes de Juan en cada visita.

---

# 9. CÉDULA

Cada persona se identifica por su número de cédula, que es único.

La cédula puede contener números, letras y guiones (documentos extranjeros o pasaportes). El sistema la guarda normalizada, en mayúsculas y sin espacios, puntos ni guiones, para que la misma cédula escrita de distintas formas identifique a la misma persona.

El sistema debe permitir:

1. Introducir la cédula.
2. Buscar la persona asociada.
3. Mostrar su información.
4. Determinar si está dentro o no.
5. Registrar la operación correspondiente.

Inicialmente, Seguridad teclea la cédula. Un lector físico que funcione como teclado también debe servir sin cambios.

La arquitectura debe permitir posteriormente integrar otros métodos de escaneo sin tener que rediseñar todo el sistema.

---

# 10. FLUJO DE INGRESO

## Persona registrada

1. La persona llega al CEDI.
2. Seguridad ingresa la cédula de la persona.
3. El sistema encuentra la persona.
4. Muestra información relevante.
5. El sistema determina que la persona no tiene una visita abierta.
6. Seguridad confirma/realiza el ingreso.
7. Se registra fecha y hora.
8. La visita pasa al estado:

DENTRO.

El proceso debe ser rápido y requerir la menor cantidad de pasos posible.

---

## Persona no registrada

1. Seguridad ingresa la cédula de la persona.
2. El sistema no encuentra la persona.
3. Se muestra el formulario de registro.
4. Seguridad selecciona el tipo de persona.
5. El formulario cambia dinámicamente según el tipo.
6. Se registra la persona.
7. Se registra su primera entrada.

---

# 11. FLUJO DE SALIDA

1. La persona sale del CEDI.
2. Seguridad ingresa nuevamente la cédula.
3. El sistema encuentra la visita abierta.
4. Se registra automáticamente la fecha y hora de salida.
5. La visita pasa a:

SALIDA REGISTRADA.

No solicitar un formulario adicional para la salida.

---

# 12. ESTADOS

Mantener únicamente dos estados principales:

## DENTRO

La persona ingresó y todavía no ha registrado salida.

## SALIDA REGISTRADA

La persona ya salió del CEDI.

No crear estados innecesarios como:

- Pendiente.
- Cancelado.
- Autorizado.
- Programado.

A menos que posteriormente exista una necesidad funcional real.

---

# 13. REGLAS DE NEGOCIO

Implementar como mínimo las siguientes reglas:

### Regla 1

Una persona no puede tener dos visitas abiertas simultáneamente.

### Regla 2

No se puede registrar una salida si la persona no tiene una visita abierta.

### Regla 3

Al registrar una entrada se debe guardar automáticamente fecha y hora.

### Regla 4

Al registrar una salida se debe guardar automáticamente fecha y hora.

### Regla 5

Una persona que tenga una visita abierta debe aparecer como "DENTRO".

### Regla 6

Una visita cerrada debe conservar su historial.

### Regla 7

La información de la persona no debe duplicarse cada vez que ingresa.

### Regla 8

Los datos que se piden y se guardan dependen del tipo de persona, según la tabla de la sección 7. No se piden ni se guardan datos que no correspondan al tipo.

### Regla 9

Las funciones administrativas deben estar protegidas por rol.

### Regla 10

No permitir operaciones que generen registros inconsistentes.

Si detectas otras reglas de negocio necesarias para garantizar la integridad del sistema, proponlas antes de implementarlas.

---

# 14. DASHBOARD

El Dashboard debe estar orientado al usuario de Seguridad.

Debe mostrar como mínimo:

- Cantidad de personas actualmente dentro.
- Cantidad de entradas del día.
- Cantidad de salidas del día.
- Lista de personas actualmente dentro.
- Hora de ingreso.
- Empresa.
- Tipo de persona.

Debe existir una acción principal claramente visible:

> INGRESAR CÉDULA

El escaneo debe ser el elemento principal de la interfaz.

No convertir el dashboard en una pantalla llena de gráficos innecesarios.

---

# 15. PERSONAS

Crear un módulo para consultar personas.

Debe permitir:

- Listar.
- Buscar.
- Filtrar.
- Ver detalle.
- Registrar.
- Editar cuando corresponda.

La información se presenta **separada por tipo de persona** (Trabajadores externos, Contratistas, Mantenimiento / Técnicos y Visitantes), cada sección con sus propias columnas, para no mezclar información de distintos tipos.

La búsqueda debe poder utilizar:

- Nombre.
- Cédula.
- Empresa.
- Tipo de persona.

El detalle de una persona muestra sus datos y su historial de visitas, con el motivo, el área y las herramientas que correspondan a cada visita.

---

# 16. VISITAS

Crear un módulo para consultar visitas.

Debe permitir:

- Ver visitas del día.
- Ver historial.
- Filtrar por fecha.
- Buscar por persona.
- Buscar por empresa.
- Filtrar por tipo.
- Filtrar por estado.

Mostrar claramente:

- Persona.
- Empresa.
- Tipo.
- Fecha.
- Hora de entrada.
- Hora de salida.
- Estado.
- Motivo y área, cuando el tipo los tenga.

---

# 17. PERSONAS ACTUALMENTE DENTRO

Crear una vista específica para responder rápidamente:

> ¿Quién está actualmente dentro del CEDI?

Mostrar:

- Nombre.
- Empresa.
- Tipo.
- Hora de entrada.
- Tiempo dentro, si resulta útil.
- Estado.

Esta vista debe actualizarse correctamente cuando alguien entra o sale.

---

# 18. MANTENIMIENTO Y HERRAMIENTAS

Para personas de mantenimiento o técnicos se debe contemplar el registro de herramientas/equipos ingresados.

No crear una plataforma compleja de gestión de inventario.

El objetivo únicamente es conservar dentro de la visita información como:

- Herramienta/equipo.
- Descripción.
- Cantidad, si corresponde.

El diseño debe permitir posteriormente ampliar esta funcionalidad si el negocio lo requiere.

---

# 19. AUDITORÍA

Implementar trazabilidad de las acciones importantes.

Registrar como mínimo:

- Usuario que realizó la acción.
- Acción realizada.
- Fecha y hora.
- Entidad afectada.
- Identificador del registro afectado.

Las acciones importantes incluyen:

- Crear persona.
- Modificar persona.
- Registrar entrada.
- Registrar salida.
- Cambiar el tipo o la empresa de una persona.
- Corregir el nombre o la cédula de una persona.

No almacenar información sensible innecesaria en logs.

---

# 20. BASE DE DATOS

Diseñar una base de datos relacional normalizada.

Como mínimo deben analizarse entidades similares a:

- Users
- Roles
- Persons
- Companies
- Visits
- VisitTools / VisitItems
- AuditLogs

No asumir que todas estas tablas son obligatorias.

Primero analizar las relaciones y justificar la estructura final.

Evitar:

- Duplicación innecesaria.
- Relaciones circulares.
- Campos genéricos sin propósito.
- JSON para información que debería estar normalizada.
- Sobreingeniería.

Crear claves primarias, foráneas, índices y restricciones apropiadas.

Los campos utilizados frecuentemente para búsqueda deben estar correctamente indexados.

---

# 21. ARQUITECTURA

Utilizar una arquitectura profesional, mantenible y apropiada para una aplicación empresarial.

Separar claramente:

- UI / presentación.
- Lógica de negocio.
- Acceso a datos.
- Autenticación/autorización.
- API.
- Persistencia.

Evitar mezclar lógica de negocio directamente dentro de componentes visuales.

Utilizar principios de:

- SOLID.
- DRY.
- Separation of Concerns.
- Clean Code.
- Validación centralizada.
- Manejo consistente de errores.

No implementar patrones complejos si no aportan valor real.

---

# 22. API

Diseñar una API limpia y consistente.

Los endpoints deben representar recursos reales.

Ejemplos conceptuales:

- `/auth`
- `/users`
- `/persons`
- `/companies`
- `/visits`
- `/dashboard`
- `/audit`

No es obligatorio utilizar exactamente estos nombres.

Utilizar:

- HTTP methods correctos.
- Códigos HTTP apropiados.
- Validación de entrada.
- Manejo de errores consistente.
- Autorización por endpoint.
- DTOs cuando corresponda.

---

# 23. SEGURIDAD

Implementar buenas prácticas:

- Contraseñas almacenadas mediante hashing seguro.
- No almacenar contraseñas en texto plano.
- Sesiones/tokens seguros.
- Autorización por rol.
- Validación del lado servidor.
- Protección contra acceso no autorizado.
- Protección contra inyección SQL.
- Protección de información sensible.
- Variables de entorno.
- No subir secretos al repositorio.
- CORS correctamente configurado.
- Validación de datos.
- Manejo seguro de errores.

No revelar detalles internos de la aplicación en mensajes de error al usuario final.

---

# 24. UI/UX

La aplicación debe tener apariencia de **software empresarial moderno**, profesional y limpio.

No debe parecer:

- Una plantilla genérica.
- Un proyecto universitario.
- Un dashboard sobrecargado.
- Una landing page.

Priorizar:

- Claridad.
- Rapidez.
- Jerarquía visual.
- Accesibilidad.
- Consistencia.
- Responsive design.
- Estados claros.
- Feedback inmediato.

La acción principal debe ser evidente.

El usuario de Seguridad debe poder registrar una entrada/salida en pocos segundos.

---

# 25. EXPERIENCIA DE ESCANEO

El sistema debe estar diseñado pensando en un lector de códigos que se comporte como teclado.

Cuando el usuario escanee:

```
123456789

```

la aplicación debe procesar el código sin obligar al usuario a hacer múltiples clics.

Considerar:

- Campo de escaneo enfocado automáticamente.
- Enter como finalización del escaneo.
- Feedback visual.
- Feedback sonoro opcional.
- Mensaje de éxito.
- Mensaje de error.
- Evitar doble registro accidental.
- Mostrar claramente si se registró ENTRADA o SALIDA.

Si el lector envía Enter automáticamente, aprovecharlo.

---

# 26. MANEJO DE ERRORES

Crear mensajes claros para situaciones como:

- Cédula no registrada.
- Persona ya está dentro.
- Persona no tiene una visita abierta.
- Código inválido.
- Error de conexión.
- Datos incompletos.
- Usuario sin permisos.

Los errores deben ser comprensibles para personal operativo.

No mostrar errores técnicos como stack traces al usuario.

---

# 27. RESPONSIVE DESIGN

La aplicación debe funcionar correctamente en:

- Desktop.
- Laptop.
- Tablet.

La interfaz principal debe estar optimizada para el entorno operativo de un CEDI.

Priorizar desktop/tablet sobre móvil, pero mantener una experiencia responsive.

---

# 28. ACCESIBILIDAD

Aplicar buenas prácticas básicas:

- Contraste adecuado.
- Labels claros.
- Estados no comunicados únicamente mediante color.
- Navegación por teclado cuando corresponda.
- Inputs correctamente asociados a labels.
- Mensajes de error claros.
- Tamaños adecuados de botones.

---

# 29. TECNOLOGÍAS

Antes de comenzar el desarrollo, analiza y propone un stack tecnológico adecuado.

Priorizar:

- Tecnologías modernas.
- Madurez.
- Mantenibilidad.
- Facilidad de instalación.
- Buena documentación.
- Adecuación para un proyecto de portafolio.
- Facilidad para que un reclutador pueda clonar y ejecutar el proyecto.

No seleccionar tecnologías únicamente porque sean populares.

Explica brevemente la razón de cada tecnología seleccionada.

---

# 30. CONFIGURACIÓN DEL PROYECTO

El proyecto debe poder ejecutarse desde cero siguiendo instrucciones claras.

Debe incluir:

- `.env.example`
- Migraciones.
- Seed inicial.
- Configuración de base de datos.
- Usuario administrador inicial mediante proceso seguro.
- Scripts de desarrollo.
- Scripts de producción.
- Documentación de instalación.

Nunca incluir:

- `.env` real.
- Contraseñas reales.
- API keys reales.
- Tokens.
- Secretos.

---

# 31. GITHUB / PORTAFOLIO

El proyecto será publicado en GitHub como proyecto de portafolio profesional.

El README debe incluir:

## Descripción

Qué problema resuelve.

## Características

Principales funcionalidades.

## Arquitectura

Descripción de la arquitectura.

## Tecnologías

Stack utilizado.

## Base de datos

Modelo y relaciones.

## Instalación

Pasos desde cero.

## Configuración

Variables de entorno necesarias.

## Migraciones

Cómo ejecutar la base de datos.

## Usuario inicial

Cómo crear el administrador.

## Ejecución

Cómo ejecutar frontend/backend.

## Capturas

Espacio para screenshots.

## Decisiones técnicas

Explicar decisiones importantes.

## Seguridad

Explicar brevemente las medidas implementadas.

## Futuras mejoras

Solamente funcionalidades razonables.

---

# 32. NO HACER

No implementar:

- Login con Google.
- Login con Microsoft.
- Registro público.
- Funciones innecesarias.
- Sistema de reservas complejo.
- Notificaciones innecesarias.
- Módulos de inventario completos.
- Módulos de recursos humanos.
- Gestión de empleados internos.
- Funcionalidades que no estén relacionadas con el objetivo principal.

No sobrecomplicar el proyecto.

---

# 33. CALIDAD DEL CÓDIGO

Todo código generado debe ser:

- Legible.
- Tipado cuando el lenguaje lo permita.
- Modular.
- Mantenible.
- Consistente.
- Documentado únicamente donde aporte valor.

Evitar:

- Código duplicado.
- Funciones gigantes.
- Componentes gigantes.
- Variables ambiguas.
- Hardcoding.
- Lógica de negocio en la UI.
- Comentarios innecesarios.
- TODOs sin resolver.

---

# 34. TESTING

Implementar pruebas para las reglas críticas.

Como mínimo probar:

### Personas

- Crear persona.
- Buscar persona.
- Validar identificación.
- Validar formato y unicidad de la cédula.

### Entradas

- Registrar entrada.
- Evitar doble entrada.
- Persona registrada.
- Persona no registrada.

### Salidas

- Registrar salida.
- Evitar salida sin entrada.
- Cerrar correctamente la visita.

### Autorización

- Seguridad no puede acceder a funciones administrativas.
- Administrador puede administrar usuarios.

### Integridad

- Una persona no puede tener dos visitas abiertas.

---

# 35. DESARROLLO POR FASES

NO intentes construir todo de una sola vez.

Trabaja por fases.

## FASE 1 — Análisis

Antes de programar:

- Revisar requerimientos.
- Detectar ambigüedades.
- Proponer arquitectura.
- Proponer modelo de datos.
- Definir flujos.
- Definir stack.

NO escribir código todavía.

Presentar las decisiones y esperar validación.

---

## FASE 2 — Base del proyecto

Crear:

- Estructura.
- Configuración.
- Base de datos.
- Migraciones.
- Autenticación.
- Roles.
- Seed.

---

## FASE 3 — Personas

Implementar:

- CRUD.
- Tipos de personas.
- Empresas.
- Validaciones.

---

## FASE 4 — Ingreso y salida

Implementar:

- Escaneo.
- Registro de entrada.
- Registro de salida.
- Estados.
- Validaciones.
- Feedback.

---

## FASE 5 — Dashboard

Implementar:

- Personas dentro.
- Entradas del día.
- Salidas del día.
- Actividad reciente.

---

## FASE 6 — Historial

Implementar:

- Historial.
- Búsquedas.
- Filtros.
- Detalle de visitas.

---

## FASE 7 — Herramientas

Implementar información de herramientas/equipos para mantenimiento/técnicos.

---

## FASE 8 — Auditoría

Implementar trazabilidad de acciones.

---

## FASE 9 — Testing

Crear pruebas unitarias/integración/e2e según corresponda.

---

## FASE 10 — UI/UX final

Realizar revisión completa:

- Responsive.
- Accesibilidad.
- Estados.
- Errores.
- Loading.
- Empty states.
- Feedback.
- Consistencia visual.

---

## FASE 11 — Producción

Preparar:

- Variables de entorno.
- Build.
- Migraciones.
- Seguridad.
- Deployment.
- Documentación.

---

# 36. FORMA DE TRABAJO

En cada fase:

1. Analiza.
2. Explica qué vas a implementar.
3. Identifica posibles problemas.
4. Propón soluciones.
5. Implementa.
6. Ejecuta pruebas.
7. Verifica que no hayas roto funcionalidades existentes.
8. Resume los cambios.
9. Indica qué queda pendiente.

No avances automáticamente a una fase importante si existe una decisión arquitectónica que todavía no está clara.

---

# 37. PRINCIPIO GENERAL DEL PROYECTO

La aplicación debe seguir este principio:

> **Simple para operar, sólida técnicamente y completa funcionalmente.**

El usuario de Seguridad no debe necesitar conocimientos técnicos para utilizarla.

La complejidad debe estar en la arquitectura y en la calidad del software, no en la experiencia del usuario.

---

# 38. PRIMERA TAREA

NO empieces escribiendo código.

Primero realiza un análisis profesional del proyecto.

Entrega:

1. Requerimientos funcionales.
2. Requerimientos no funcionales.
3. Actores y permisos.
4. Casos de uso.
5. Flujo de entrada.
6. Flujo de salida.
7. Reglas de negocio.
8. Entidades principales.
9. Propuesta de modelo de datos.
10. Relaciones entre entidades.
11. Arquitectura propuesta.
12. Stack tecnológico recomendado.
13. Estructura de carpetas propuesta.
14. Estrategia de autenticación.
15. Estrategia de autorización.
16. Estrategia de auditoría.
17. Estrategia de testing.
18. Estructura inicial del README.
19. Riesgos o ambigüedades detectadas.
20. Recomendaciones de mejora.

Después de presentar este análisis, espera mi aprobación antes de comenzar la implementación.

No inventes requisitos de negocio que no hayan sido definidos. Cuando una decisión sea necesaria, presenta la recomendación y explica brevemente por qué.