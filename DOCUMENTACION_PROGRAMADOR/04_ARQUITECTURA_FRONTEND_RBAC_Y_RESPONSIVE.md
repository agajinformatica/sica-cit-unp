# 04. Arquitectura del Frontend, RBAC y Diseño Responsivo

El Frontend (`frontend/`) está diseñado como una **Single-Page Application (SPA) modular** con identidad visual institucional de la **Universidad Nacional de Piura (UNP)**, cero diálogos nativos (`window.alert()`) y soporte responsivo completo para computadoras de escritorio, tablets y teléfonos móviles.

---

## 1. Estructura de Archivos del Frontend

1. **`frontend/index.html`:**
   * **Pantalla de Autenticación (`#authLoginScreen`):** Portal institucional con los escudos oficiales de la UNP y de la Facultad de Ingeniería Industrial (`logo_unp.png` y `logo_fii_unp.png`), validación inline (`#loginValidationBanner`) y píldoras de autocompletado rápido para los 3 roles.
   * **Contenedor Autenticado (`#appAuthenticatedContainer`):** Permanece oculto (`d-none`) hasta que el usuario inicia sesión válidamente.
   * **Menú Lateral (`#sidebarUnp`) + Backdrop Móvil (`#sidebarMobileBackdrop`):** Navegación entre las 7 vistas operativas del sistema y tarjeta de sesión activa en el pie del menú.
   * **7 Secciones de Vista (`.view-section`):**
     1. `#view-dashboard`: 5 tarjetas KPI y tabla de monitoreo diario en tiempo real.
     2. `#view-marcacion`: Reloj oficial en vivo, tarjeta de progreso semanal/total y formulario de bitácora técnica diaria.
     3. `#view-actividades`: Bandeja de supervisión con filtros por estado (`TODAS`, `APROBADA`, `PENDIENTE_REVISION`, `OBSERVADA`).
     4. `#view-alertas`: Simulador visual de burbuja de WhatsApp + bandeja de correo institucional SMTP + historial de alertas.
     5. `#view-predictivo`: Semáforo predictivo de ausentismo y conmutador de periodo de exámenes parciales/finales UNP.
     6. `#view-convenios`: Tarjetas por dependencia, formulario de inscripción con datos personales/código universitario UNP y directorio general con buscador en vivo.
     7. `#view-reportes`: Tabla comparativa de indicadores operativos y generador de **Informe de Cumplimiento y Constancia de Prácticas** listo para impresión PDF (`@media print`).
   * **Modales Interactivos:** `#modalEvaluarActividad` (calificación de 1 a 5 estrellas vectoriales) y `#modalDetalleAlerta` (expediente de notificación, resolución del supervisor y despacho directo a `https://wa.me/...`).

2. **`frontend/js/app.js`:**
   * Encapsulado en una IIFE `(function () { ... })()` para no contaminar el espacio global salvo los manejadores de eventos invocados desde el DOM.

---

## 2. Matriz de Permisos RBAC en el Frontend (`RBAC_PERMISSIONS`)

El objeto `RBAC_PERMISSIONS` en `frontend/js/app.js` gobierna qué módulos del menú lateral se muestran y qué botones de acción están habilitados:

| Propiedad / Permiso | `ADMIN_CIT` (Jefatura CIT) | `SUPERVISOR` (Supervisor Área) | `PRACTICANTE` (Estudiante / Egresado) |
| :--- | :---: | :---: | :---: |
| **`vistasPermitidas`** | `dashboard`, `marcacion`, `actividades`, `alertas`, `predictivo`, `convenios`, `reportes` (7/7) | `dashboard`, `actividades`, `alertas`, `predictivo`, `reportes` (5/7) | `marcacion`, `actividades`, `alertas`, `reportes` (4/7) |
| **`vistaInicial`** | `dashboard` | `dashboard` | `marcacion` |
| **`puedeCalificarActividades`** | `true` | `true` | `false` *(Muestra candado "Solo Lectura")* |
| **`puedeAtenderAlertas`** | `true` | `true` | `false` |
| **`puedeCrearConvenios`** | `true` | `false` | `false` |
| **`puedeVerIndicadoresGerenciales`** | `true` | `true` | `false` |
| **Aislamiento de datos** | Ve todas las dependencias y practicantes | Ve indicadores y actividades de supervisión | En `marcacion`, `actividades` y `reportes` solo puede ver su propio registro (`practicanteIdAsociado`) |

---

## 3. Sincronización con el Backend y PostgreSQL

En `frontend/js/app.js` existen dos funciones de comunicación HTTP con el Backend:

1. **`hydrateFromBackendPostgres()`:**
   Se ejecuta automáticamente en el evento `DOMContentLoaded`. Realiza un `GET /api/v1/estado` hacia el Backend; si el servidor responde desde PostgreSQL, actualiza `window.CIT_UNP_DATA` (`practicantes`, `actividades`, `alertas`, `dependencias`, `areasCit`) y ejecuta `renderAll()`.
2. **`syncBackendAction(endpoint, payload)`:**
   Envía peticiones `POST` hacia `/api/v1/...` adjuntando la cabecera `"X-User-Role": state.currentRole` cada vez que se registra una asistencia, se califica una actividad, se atiende una alerta o se inscribe un nuevo practicante.

---

## 4. Diseño Responsivo para Celulares y Tablets (`frontend/css/styles.css`)

El diseño responsivo se organiza en dos puntos de quiebre principales más el modo de impresión oficial:

### 4.1. Tablets y Pantallas Medianas (`@media (max-width: 991.98px)`)
* **Sidebar Off-Canvas (`#sidebarUnp`):** Pasa a `transform: translateX(-100%)` con transición suave `cubic-bezier(0.4, 0, 0.2, 1)`.
* **Función `toggleMobileSidebar(forceState)`:** Activada por el botón hamburguesa `#btnToggleSidebarMobile` en la barra superior (`d-lg-none`), añade la clase `.sidebar-open` al menú lateral y `.active` al fondo oscuro `#sidebarMobileBackdrop`. Al seleccionar cualquier módulo en `switchView()`, el menú móvil se cierra automáticamente.
* **Contenedor Principal (`.main-wrapper`):** Elimina el margen izquierdo fijo (`margin-left: 0 !important; width: 100%`).

### 4.2. Teléfonos Celulares (`@media (max-width: 767.98px)`)
* **Pantalla de Login:** Ajusta rellenos y apila verticalmente las tarjetas de cuentas de acceso rápido (`.credential-pill-btn`).
* **Selectores y Buscadores (`.responsive-select-topbar`, `.responsive-search-dir`):** Pasan de `315px` fijos a `width: 100% !important`.
* **Notificaciones Flotantes (`.toast-unp-card`):** Se adaptan al ancho de la pantalla móvil (`left: 0.5rem; right: 0.5rem; width: 100%`).
* **Constancia Oficial (`.constancia-sheet`):** Reduce márgenes internos, adapta el tamaño de los escudos (`52px`) y apila las firmas en pantallas pequeñas (`col-12 col-sm-6`).

### 4.3. Impresión de Constancia en PDF (`@media print`)
* Oculta automáticamente `.sidebar-unp`, `.topbar-unp` y cualquier elemento con clase `.no-print`, dejando únicamente la hoja `.constancia-sheet` lista para exportar en tamaño A4.
