# 0008 — Identificación por cédula, sin gafete

**Estado:** APROBADO (2026-10-23). Integrada en el spec (§5, §7, §9). Sustituye a D7 y modifica D10, D13, D14, R13 y R15. Agrega R17.

## Contexto
El responsable del proyecto aclaró cómo se opera en la caseta:
- Las personas externas no tienen gafete. Dan su número de cédula y el guarda lo teclea.
- Si la cédula ya está registrada, no se vuelven a pedir datos: solo se registra la entrada o la salida.
- La cédula y el nombre no cambian. La empresa y el tipo de persona sí pueden cambiar con el tiempo.
- Solo el guarda usa la app, con su propia cuenta. No hace falta una pantalla de gestión de usuarios.

## Decisión
1. **Sin gafete.** Se elimina `persons.badge_code`. La búsqueda y el escaneo usan `persons.identification` (cédula), que es única.
2. **Normalización de la cédula (D10):** se admite escribirla con números, letras, guiones, espacios y puntos. Se guarda en mayúsculas y solo con letras y dígitos, con entre 4 y 20 caracteres. Así `1-234-567`, `1.234.567` y `1234567` identifican a la misma persona. La normalización vive en `@cedi/shared` y se usa igual en la web y en la API.
3. **Datos fijos y datos que cambian (D13):**
   - Cédula y nombre: solo Admin los corrige, por errores de captura, con auditoría.
   - Tipo y empresa: Seguridad y Admin pueden cambiarlos, con auditoría.
4. **Historial fiel (R17):** `visits` guarda `person_type` y `company_id` al registrar la entrada. Los reportes de visitas usan esos valores, no los actuales de la persona. La empresa es obligatoria en la visita (ADR 0009).
5. **Usuarios sin pantalla (D14):**
   - Un comando de terminal (`npm run users`) crea cuentas SECURITY o ADMIN, las lista, las activa o desactiva y restablece contraseñas.
   - R14 se mantiene: una cuenta desactivada pierde el acceso en su siguiente petición.
   - R15 deja de aplicar porque no hay edición de usuarios en la web. En su lugar, el comando impide desactivar al último ADMIN activo.
6. **Escaneo:** `POST /scans {identification}`; `BADGE_NOT_FOUND` pasa a llamarse `PERSON_NOT_FOUND`. `ScannerSource` se mantiene: hoy la entrada es manual por teclado, y un lector tipo teclado seguiría funcionando sin cambios.

## Consecuencias
- Se agrega una migración que elimina `badge_code` y añade `person_type` y `company_id` a `visits`.
- Un error al teclear la cédula crea una persona nueva. Por eso la corrección por Admin queda auditada, y el formulario de registro mostrará la cédula normalizada para confirmarla.
- Si en el futuro se reintroduce un gafete u otro medio, bastará una columna o tabla nueva y otra implementación de `ScannerSource`.
