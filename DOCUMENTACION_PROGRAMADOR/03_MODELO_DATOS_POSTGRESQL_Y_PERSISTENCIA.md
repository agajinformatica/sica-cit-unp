# 03. Modelo de Datos PostgreSQL y Capa de Persistencia

La persistencia del sistema está desacoplada a través del contrato `IAsistenciaRepositoryPort` (`backend/src/domain/ports/OutputPorts.js`) y cuenta con dos implementaciones intercambiables en `backend/src/infrastructure/persistence/`:

1. **`PostgresRepositoryAdapter.js`:** Motor relacional principal en producción (conectado al servicio `Postgres` en Railway mediante `pg.Pool`).
2. **`JsonPersistenceRepository.js`:** Motor de respaldo en archivo local (`backend/data/cit_unp_database.json`) para pruebas unitarias aisladas o ejecución sin servidor PostgreSQL.

---

## 1. Inicialización Automática y Transaccional (`ensureInitialized()`)

Cuando el servidor arranca con `DATABASE_URL` definido, `PostgresRepositoryAdapter.ensureInitialized()` abre una transacción SQL (`BEGIN ... COMMIT`) e inicializa automáticamente la base de datos en tres pasos:

1. **Ejecución del DDL Relacional 3FN (`backend/sql/schema_postgresql_cit_unp.sql`):**
   Crea (con `CREATE TABLE IF NOT EXISTS`) las **9 tablas normalizadas en Tercera Forma Normal (3FN)**:
   * `facultad_dependencia` (Sede piloto CIT-UNP y facultades de proyección).
   * `usuario` (Jefatura CIT, Supervisores de área y Practicantes con `dni` y `codigo_universitario`).
   * `area_operativa` (Desarrollo de Software, Redes y Telecomunicaciones, Soporte Técnico, Servidores y BD).
   * `convenio_practica` (Modalidad `PREPROFESIONAL` o `PROFESIONAL`, topes horarios y metas).
   * `horario_escalonado` (Turnos por día de semana y tolerancia de 10 minutos).
   * `registro_asistencia` (Marcaciones de entrada/salida, minutos de tardanza y estado diario).
   * `actividad_practica` (Bitácora técnica por turno, entregable y calificación de 1 a 5).
   * `alerta_automatizada` (Trazabilidad de envíos por WhatsApp y Correo Institucional).
   * `prediccion_ausentismo` (Historial de evaluaciones del modelo predictivo y semáforo).

2. **Creación de Tablas Operativas de Sincronización Rápida:**
   Crea las tablas indexadas `sica_practicante_convenio`, `sica_actividad_practica` (con clave foránea `ON DELETE CASCADE` hacia `sica_practicante_convenio`) y `sica_alerta_automatizada`.

3. **Semilla Institucional Idempotente (`INITIAL_SEED`):**
   Consulta `SELECT COUNT(*)::int AS total FROM sica_practicante_convenio`. Si la tabla está vacía (`total === 0`), inserta automáticamente las 4 dependencias de la UNP, los 6 practicantes iniciales del CIT - UNP, las 5 actividades técnicas y las 4 alertas institucionales usando sentencias parametrizadas `INSERT ... ON CONFLICT DO UPDATE`.

---

## 2. Métodos Implementados del Puerto `IAsistenciaRepositoryPort`

| Método del Contrato | Operación SQL en `PostgresRepositoryAdapter` |
| :--- | :--- |
| `obtenerEstadoCompleto()` | Ejecuta `Promise.all()` con `SELECT *` sobre `sica_practicante_convenio`, `sica_actividad_practica` y `sica_alerta_automatizada`, mapeando las columnas `snake_case` de PostgreSQL a objetos `camelCase` del Dominio. |
| `obtenerPracticantePorId(id)` | `SELECT * FROM sica_practicante_convenio WHERE id = $1` |
| `actualizarPracticante(p)` | Ejecuta `_upsertPracticanteQuery(this.pool, p)` con 36 parámetros posicionales (`$1..$36`) previniendo al 100 % cualquier inyección SQL. |
| `crearPracticante(datos)` | Calcula el correlativo `PRAC-XX` e inserta el nuevo practicante en PostgreSQL. |
| `guardarActividad(act)` | Ejecuta `_upsertActividadQuery(this.pool, nueva)` insertando el registro en `sica_actividad_practica`. |
| `obtenerActividadPorId(id)` | `SELECT * FROM sica_actividad_practica WHERE id = $1` |
| `actualizarActividad(act)` | Actualiza `estado_revision`, `calificacion`, `observacion_supervisor` y `horas_sesion` mediante `ON CONFLICT (id) DO UPDATE`. |
| `listarActividadesPorPracticante(id)` | `SELECT * FROM sica_actividad_practica WHERE practicante_id = $1 ORDER BY creado_en DESC` |
| `guardarAlerta(alr)` | Inserta la notificación despachada en `sica_alerta_automatizada`. |
| `marcarAlertaAtendida(id, hora, res)` | `UPDATE sica_alerta_automatizada SET atendida = TRUE, hora_atencion = $2, resolucion_supervisor = COALESCE($3, resolucion_supervisor) WHERE id = $1 RETURNING *` |

---

## 3. Mapeo Objeto-Relacional (Data Mapper Interno)

Para mantener el Dominio limpio de nombres de columnas SQL (`snake_case`), `PostgresRepositoryAdapter` incorpora tres métodos mapeadores privados:
* `_mapPracticanteRow(r)`: Convierte tipos `NUMERIC` de PostgreSQL (`horas_semana_actual`, `meta_horas`, `horas_acumuladas`, `indice_puntualidad`, `promedio_evaluacion_actividades`) a `Number` nativos de JavaScript.
* `_mapActividadRow(r)`: Transforma la fila de `sica_actividad_practica` en la entidad de actividad consumida por `EvaluarActividadUseCase`.
* `_mapAlertaRow(r)`: Transforma la fila de `sica_alerta_automatizada` incluyendo el estado booleano `atendida` y `resolucionSupervisor`.
