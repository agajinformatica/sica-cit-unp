# 02. Referencia de la API REST y Seguridad RBAC

El adaptador primario HTTP (`backend/src/infrastructure/http/HttpServerAdapter.js`) está construido sobre el módulo nativo `http` de Node.js (sin sobrecarga de frameworks pesados), soportando CORS, parseo asíncrono de cuerpos JSON, control de acceso basado en roles (**RBAC**) y entrega de archivos estáticos del Frontend.

---

## 1. Seguridad y Control de Acceso Basado en Roles (RBAC) en la API

El método privado `_enforceRbac(req, allowedRoles)` valida la cabecera HTTP `X-User-Role` enviada por el cliente en cada operación protegida:

| Cabecera HTTP | Valores Soportados | Descripción |
| :--- | :--- | :--- |
| `Content-Type` | `application/json` | Formato de carga útil para peticiones `POST`. |
| `X-User-Role` | `ADMIN_CIT` \| `SUPERVISOR` \| `PRACTICANTE` | Rol de la sesión activa del usuario autenticado. |

Si un usuario con rol `PRACTICANTE` intenta invocar un endpoint exclusivo de supervisión o jefatura (por ejemplo `/api/v1/actividades/evaluar` o `/api/v1/convenios`), la API rechaza la operación con código `HTTP 400` y el mensaje:
```json
{
  "ok": false,
  "error": "Acceso denegado (RBAC): El rol 'PRACTICANTE' no cuenta con autorización para ejecutar esta operación."
}
```

---

## 2. Catálogo de Endpoints REST (`/api/v1/...`)

### 2.1. `GET /api/v1/health` — Healthcheck de Arquitectura y Base de Datos
* **Roles permitidos:** Público (Usado por Railway para monitoreo de disponibilidad).
* **Respuesta exitosa (`200 OK`):**
```json
{
  "status": "OK",
  "sistema": "SICA - CIT UNP (Sistema Inteligente de Control de Asistencia y Evaluación de Prácticas)",
  "arquitectura": "Hexagonal (Ports & Adapters)",
  "motorBaseDatos": "PostgreSQL (Conectado)",
  "patronesActivos": [
    "Strategy (Ley 28518: 30h/48h)",
    "Repository (PostgreSQL)",
    "Adapter",
    "Composite Notification",
    "RBAC Auth"
  ],
  "horaServidorOficial": "2026-11-17T00:51:38.490Z"
}
```

---

### 2.2. `GET /api/v1/estado` — Obtener Estado Completo desde PostgreSQL
* **Roles permitidos:** `ADMIN_CIT`, `SUPERVISOR`, `PRACTICANTE`.
* **Descripción:** Consulta en paralelo las tablas de practicantes, actividades técnicas y alertas automatizadas en PostgreSQL y devuelve el estado consolidado para hidratar la interfaz web.
* **Respuesta exitosa (`200 OK`):**
```json
{
  "ok": true,
  "data": {
    "motorPersistencia": "PostgreSQL",
    "dependencias": [...],
    "areasCit": [...],
    "practicantes": [...],
    "actividades": [...],
    "alertas": [...],
    "metricasAnexo05": [...]
  }
}
```

---

### 2.3. `POST /api/v1/auth/login` — Registro de Sesión Institucional
* **Cuerpo de petición (`Request Body`):**
```json
{
  "usuario": "lsaavedray@unp.edu.pe",
  "rol": "ADMIN_CIT"
}
```
* **Respuesta exitosa (`200 OK`):**
```json
{
  "ok": true,
  "sesion": {
    "usuario": "lsaavedray@unp.edu.pe",
    "rol": "ADMIN_CIT",
    "autenticadoEn": "2026-11-17T00:55:00.000Z"
  }
}
```

---

### 2.4. `POST /api/v1/asistencia/marcar` — Registrar Entrada o Salida + Actividad
* **Roles permitidos:** `ADMIN_CIT`, `SUPERVISOR`, `PRACTICANTE`.
* **Caso A — Marcación de Entrada (`Request Body`):**
```json
{
  "practicanteId": "PRAC-02",
  "tipoAccion": "ENTRADA",
  "horaMarcacion": "08:25"
}
```
* **Caso B — Marcación de Salida con Bitácora Técnica (`Request Body`):**
```json
{
  "practicanteId": "PRAC-02",
  "tipoAccion": "SALIDA",
  "horaMarcacion": "14:05",
  "categoriaActividad": "REDES_TELECOM",
  "descripcionActividad": "Configuración de VLANs y verificación de enlaces de fibra óptica en el CIT.",
  "entregableActividad": "Informe técnico VLAN #14",
  "horasSesionSolicitadas": 6.0
}
```
* **Respuesta exitosa (`201 Created`):** Devuelve `{ ok: true, resultado: { tipoAccion, practicante, actividadCreada, alertaGenerada } }`.

---

### 2.5. `POST /api/v1/actividades/evaluar` — Calificar y Validar Actividad Técnica
* **Roles permitidos (RBAC):** Exclusivo `ADMIN_CIT` y `SUPERVISOR`.
* **Cuerpo de petición (`Request Body`):**
```json
{
  "actividadId": "ACT-103",
  "estadoRevision": "APROBADA",
  "calificacion": 5,
  "observacionSupervisor": "Mantenimiento verificado satisfactoriamente en el Laboratorio 02."
}
```
* **Respuesta exitosa (`200 OK`):** Devuelve la actividad actualizada, el practicante con su nuevo promedio ponderado y, si fue `OBSERVADA`, la alerta despachada.

---

### 2.6. `POST /api/v1/predictivo/alerta` — Evaluar Riesgo de Ausentismo y Emitir Alerta Preventiva
* **Roles permitidos (RBAC):** Exclusivo `ADMIN_CIT` y `SUPERVISOR`.
* **Cuerpo de petición (`Request Body`):**
```json
{
  "practicanteId": "PRAC-03",
  "temporadaExamenesUnp": true
}
```
* **Respuesta exitosa (`201 Created`):** Devuelve `{ ok: true, resultado: { practicante, resultadoIA, alerta } }`.

---

### 2.7. `POST /api/v1/convenios` — Inscribir Nuevo Practicante y Convenio
* **Roles permitidos (RBAC):** Exclusivo `ADMIN_CIT`.
* **Cuerpo de petición (`Request Body`):**
```json
{
  "codigoUnp": "0512022095",
  "dni": "74125896",
  "nombres": "Luis Fernando Palacios Reyes",
  "escuela": "Ingeniería Informática",
  "cicloCondicion": "10.° Ciclo",
  "direccionDistrito": "Urb. Miraflores, Castilla - Piura",
  "dependenciaId": "CIT-UNP",
  "areaId": "AREA-DEV",
  "areaNombre": "Desarrollo de Software y Sistemas Web",
  "supervisor": "Ing. Carlos Alberto Mendoza Ruiz",
  "modalidad": "PREPROFESIONAL",
  "turnoHoy": "08:00 - 14:00 (Turno Mañana)",
  "telefonoWhatsapp": "+51 968 123 456",
  "correo": "lpalaciosr@alumnos.unp.edu.pe"
}
```
* **Respuesta exitosa (`201 Created`):** Devuelve el objeto del practicante creado e insertado en PostgreSQL.

---

### 2.8. `POST /api/v1/alertas/atender` — Confirmar Atención y Resolución de Alerta
* **Roles permitidos (RBAC):** Exclusivo `ADMIN_CIT` y `SUPERVISOR`.
* **Cuerpo de petición (`Request Body`):**
```json
{
  "alertaId": "ALR-902",
  "resolucion": "Se coordinó con el practicante la recuperación de horas el día sábado."
}
```
* **Respuesta exitosa (`200 OK`):** Devuelve la alerta actualizada con `atendida: true`, `horaAtencion` y `resolucionSupervisor`.
