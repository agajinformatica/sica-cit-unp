# 05. Despliegue en GitHub y Railway + Hoja de Ruta Técnica

Este documento detalla la infraestructura de producción configurada para **SICA - CIT UNP** y la hoja de ruta (backlog técnico) para futuras iteraciones del programador.

---

## 1. Infraestructura Desplegada en Producción

### 1.1. Repositorio GitHub
* **Repositorio:** `https://github.com/agajinformatica/sica-cit-unp`
* **Cuenta propietaria:** `agajinformatica` (`agaj.informatica@gmail.com`)
* **Rama principal:** `main`

### 1.2. Proyecto en Railway Cloud (`sica-cit-unp`)
* **Project ID:** `b94e719d-a18d-4d5b-8f6f-abd950f6e083`
* **Environment:** `production` (`5fa0ae66-0789-4cb0-8d4c-5a308b7e3bad`)
* **Servicio de Aplicación Web (`sica-cit-unp`):**
  * **Service ID:** `21a7bfe4-699f-4df8-93e5-a1a0dfd05755`
  * **Dominio Público:** `https://sica-cit-unp-production.up.railway.app` (enrutado al puerto interno `8080`).
  * **Constructor:** Railpack (`v0.43.0`) con Node `18.20.8`.
  * **Comando de Inicio (`Procfile` y `railway.json`):** `node backend/src/main.js`.
  * **Healthcheck:** `/api/v1/health`.
* **Servicio de Base de Datos (`Postgres`):**
  * **Service ID:** `b6905ff7-4123-4df9-83df-c27fb1e2fc7a`
  * **Vinculación al Backend:** Variable de referencia `DATABASE_URL=${{Postgres.DATABASE_URL}}` inyectada en el servicio `sica-cit-unp`.

---

## 2. Comandos Útiles de Mantenimiento y Despliegue

### 2.1. Subir Cambios a GitHub
```bash
git add .
git commit -m "feat: descripción técnica del cambio"
git push origin main
```

### 2.2. Desplegar Hacia Railway desde la Terminal
```bash
# Desplegar el directorio del proyecto hacia el servicio sica-cit-unp en producción
railway up . --path-as-root \
  --project b94e719d-a18d-4d5b-8f6f-abd950f6e083 \
  --service 21a7bfe4-699f-4df8-93e5-a1a0dfd05755 \
  --environment 5fa0ae66-0789-4cb0-8d4c-5a308b7e3bad \
  --ci

# Consultar logs en tiempo real del contenedor en Railway
railway logs --service 21a7bfe4-699f-4df8-93e5-a1a0dfd05755 --lines 100

# Verificar el estado del motor PostgreSQL en producción
curl -s https://sica-cit-unp-production.up.railway.app/api/v1/health
```

---

## 3. Hoja de Ruta Técnica (Backlog Pendiente para el Programador)

Los siguientes **5 puntos** se encuentran planificados como pendientes para evolucionar el flujo `Frontend → API REST → PostgreSQL` hacia un modo 100 % transaccional puro:

1. **Autenticación real contra la tabla `usuario` en PostgreSQL (`POST /api/v1/auth/login`):**
   * Reemplazar la validación local en `frontend/js/app.js` (`procesarInicioSesion`) por una consulta SQL parametrizada sobre la tabla `usuario` (con hash de contraseña `scrypt` / `bcrypt`) y emisión de token firmando el rol RBAC.
2. **Unificación de IDs y eliminación de doble mutación entre Frontend y Backend:**
   * Hacer que las funciones `ejecutarMarcacionConActividad`, `guardarEvaluacionActividad`, `registrarNuevoConvenio` y `marcarAlertaAtendida` en `frontend/js/app.js` esperen (`await`) la respuesta de la API REST y actualicen `window.CIT_UNP_DATA` usando exclusivamente el registro e ID devueltos por PostgreSQL.
3. **Sincronización integral de las 9 tablas del modelo 3FN (`schema_postgresql_cit_unp.sql`):**
   * Reflejar cada inserción/actualización directamente en las 9 tablas relacionales normalizadas (`facultad_dependencia`, `usuario`, `area_operativa`, `convenio_practica`, `horario_escalonado`, `registro_asistencia`, `actividad_practica`, `alerta_automatizada`, `prediccion_ausentismo`) para auditorías directas por `psql` o `pgAdmin`.
4. **Endpoints CRUD de Edición y Baja (`PUT / DELETE /api/v1/convenios/:id`):**
   * Añadir botones de edición de datos personales/turnos y cambio de estado del convenio (`ACTIVO`, `CULMINADO`, `SUSPENDIDO`) en el Directorio de Practicantes conectados a PostgreSQL.
5. **Indicador visual de conexión PostgreSQL en tiempo real y manejo de errores HTTP en UI:**
   * Mostrar un indicador de estado de base de datos en la barra superior consultando `/api/v1/health` y presentar cualquier error HTTP (`400`/`403`/`500`) mediante el componente `showToastAlerta`.
