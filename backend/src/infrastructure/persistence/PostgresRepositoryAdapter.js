const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const { IAsistenciaRepositoryPort } = require("../../domain/ports/OutputPorts");
const { INITIAL_SEED } = require("./JsonPersistenceRepository");

/**
 * ADAPTADOR SECUNDARIO POSTGRESQL (Driven Adapter - Persistencia Relacional):
 * Implementa el contrato completo IAsistenciaRepositoryPort utilizando el motor
 * relacional PostgreSQL (Pool de conexiones 'pg').
 *
 * Al iniciar:
 * 1. Ejecuta el DDL relacional 3FN (schema_postgresql_cit_unp.sql) y las tablas
 *    operativas de lectura/escritura rápida del CIT - UNP.
 * 2. Si las tablas se encuentran vacías (primer despliegue en Railway o entorno local),
 *    inserta automáticamente los datos semilla institucionales del CIT - UNP.
 */
class PostgresRepositoryAdapter extends IAsistenciaRepositoryPort {
    constructor(connectionStringOrPool) {
        super();
        if (typeof connectionStringOrPool === "string") {
            const isLocal = connectionStringOrPool.includes("localhost") || connectionStringOrPool.includes("127.0.0.1");
            this.pool = new Pool({
                connectionString: connectionStringOrPool,
                ssl: isLocal ? false : { rejectUnauthorized: false }
            });
        } else {
            this.pool = connectionStringOrPool;
        }
        this.initialized = false;
        this.initPromise = null;
    }

    async ensureInitialized() {
        if (this.initialized) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            const client = await this.pool.connect();
            try {
                await client.query("BEGIN");

                // 1. Ejecutar el esquema relacional 3FN institucional (9 tablas de la tesis)
                const schemaSqlPath = path.join(__dirname, "../../../sql/schema_postgresql_cit_unp.sql");
                if (fs.existsSync(schemaSqlPath)) {
                    const ddl3fn = fs.readFileSync(schemaSqlPath, "utf-8");
                    await client.query(ddl3fn);
                }

                // 2. Crear tablas operativas indexadas para sincronización transaccional Frontend <-> Backend PostgreSQL
                await client.query(`
                    CREATE TABLE IF NOT EXISTS sica_practicante_convenio (
                        id VARCHAR(30) PRIMARY KEY,
                        codigo_unp VARCHAR(20) NOT NULL,
                        dni VARCHAR(15) NOT NULL,
                        nombres VARCHAR(160) NOT NULL,
                        facultad_origen VARCHAR(150),
                        escuela VARCHAR(120),
                        ciclo_condicion VARCHAR(60),
                        direccion_distrito VARCHAR(180),
                        dependencia_id VARCHAR(30) NOT NULL,
                        area_id VARCHAR(30) NOT NULL,
                        area_nombre VARCHAR(150) NOT NULL,
                        supervisor VARCHAR(150) NOT NULL,
                        modalidad VARCHAR(25) NOT NULL,
                        tope_diario INTEGER NOT NULL,
                        tope_semanal INTEGER NOT NULL,
                        horas_semana_actual NUMERIC(6,2) NOT NULL DEFAULT 0,
                        meta_horas NUMERIC(6,2) NOT NULL,
                        horas_acumuladas NUMERIC(6,2) NOT NULL DEFAULT 0,
                        turno_hoy VARCHAR(100),
                        hora_inicio_turno VARCHAR(10),
                        tolerancia_min INTEGER NOT NULL DEFAULT 10,
                        estado_hoy VARCHAR(40),
                        hora_entrada_hoy VARCHAR(30),
                        hora_salida_hoy VARCHAR(30),
                        indice_puntualidad NUMERIC(5,2) NOT NULL DEFAULT 100.0,
                        tardanzas_mes INTEGER NOT NULL DEFAULT 0,
                        faltas_mes INTEGER NOT NULL DEFAULT 0,
                        score_riesgo_ausentismo INTEGER NOT NULL DEFAULT 5,
                        nivel_semaforo VARCHAR(20) NOT NULL DEFAULT 'VERDE',
                        factor_predictivo TEXT,
                        fecha_inicio VARCHAR(20),
                        fecha_fin_programada VARCHAR(20),
                        fecha_fin_proyectada VARCHAR(20),
                        telefono_whatsapp VARCHAR(40),
                        correo VARCHAR(140),
                        promedio_evaluacion_actividades NUMERIC(3,1) NOT NULL DEFAULT 5.0,
                        orden_registro SERIAL
                    );

                    CREATE TABLE IF NOT EXISTS sica_actividad_practica (
                        id VARCHAR(30) PRIMARY KEY,
                        fecha VARCHAR(20) NOT NULL,
                        practicante_id VARCHAR(30) NOT NULL REFERENCES sica_practicante_convenio(id) ON DELETE CASCADE,
                        practicante_nombre VARCHAR(160) NOT NULL,
                        modalidad VARCHAR(25) NOT NULL,
                        area_nombre VARCHAR(150) NOT NULL,
                        categoria_tecnica VARCHAR(50) NOT NULL,
                        descripcion TEXT NOT NULL,
                        entregable TEXT,
                        horas_sesion NUMERIC(4,2) NOT NULL DEFAULT 0,
                        estado_revision VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE_REVISION',
                        calificacion INTEGER NOT NULL DEFAULT 0,
                        observacion_supervisor TEXT,
                        supervisor VARCHAR(150),
                        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS sica_alerta_automatizada (
                        id VARCHAR(30) PRIMARY KEY,
                        fecha_hora VARCHAR(40) NOT NULL,
                        tipo VARCHAR(60) NOT NULL,
                        practicante VARCHAR(160) NOT NULL,
                        area VARCHAR(150) NOT NULL,
                        canal VARCHAR(40) NOT NULL DEFAULT 'WHATSAPP + CORREO',
                        destinatario VARCHAR(180) NOT NULL,
                        mensaje_whatsapp TEXT NOT NULL,
                        asunto_correo VARCHAR(220) NOT NULL,
                        atendida BOOLEAN NOT NULL DEFAULT FALSE,
                        hora_atencion VARCHAR(20) DEFAULT '-',
                        resolucion_supervisor TEXT,
                        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                `);

                // 3. Verificar si ya existen practicantes en PostgreSQL; si está vacío, poblar con INITIAL_SEED
                const { rows: countRows } = await client.query(`SELECT COUNT(*)::int AS total FROM sica_practicante_convenio`);
                if (countRows[0].total === 0) {
                    // Poblar también facultad_dependencia en el esquema 3FN
                    for (const dep of INITIAL_SEED.dependencias) {
                        await client.query(
                            `INSERT INTO facultad_dependencia (codigo_unp, nombre, facultad, activo)
                             VALUES ($1, $2, $3, $4)
                             ON CONFLICT (codigo_unp) DO NOTHING`,
                            [dep.id, dep.nombre, dep.facultad, dep.activo]
                        );
                    }

                    // Poblar practicantes
                    for (const p of INITIAL_SEED.practicantes) {
                        await this._upsertPracticanteQuery(client, p);
                    }

                    // Poblar actividades
                    for (const a of INITIAL_SEED.actividades) {
                        await this._upsertActividadQuery(client, a);
                    }

                    // Poblar alertas
                    for (const alr of INITIAL_SEED.alertas) {
                        await this._upsertAlertaQuery(client, alr);
                    }
                }

                await client.query("COMMIT");
                this.initialized = true;
                console.log("[PostgreSQL] Esquema relacional CIT-UNP verificado y sincronizado correctamente.");
            } catch (err) {
                await client.query("ROLLBACK");
                console.error("[PostgreSQL] Error inicializando esquema:", err.message);
                throw err;
            } finally {
                client.release();
            }
        })();

        return this.initPromise;
    }

    async _upsertPracticanteQuery(executor, p) {
        const sql = `
            INSERT INTO sica_practicante_convenio (
                id, codigo_unp, dni, nombres, facultad_origen, escuela, ciclo_condicion,
                direccion_distrito, dependencia_id, area_id, area_nombre, supervisor,
                modalidad, tope_diario, tope_semanal, horas_semana_actual, meta_horas,
                horas_acumuladas, turno_hoy, hora_inicio_turno, tolerancia_min,
                estado_hoy, hora_entrada_hoy, hora_salida_hoy, indice_puntualidad,
                tardanzas_mes, faltas_mes, score_riesgo_ausentismo, nivel_semaforo,
                factor_predictivo, fecha_inicio, fecha_fin_programada, fecha_fin_proyectada,
                telefono_whatsapp, correo, promedio_evaluacion_actividades
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
                $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36
            )
            ON CONFLICT (id) DO UPDATE SET
                codigo_unp = EXCLUDED.codigo_unp,
                dni = EXCLUDED.dni,
                nombres = EXCLUDED.nombres,
                facultad_origen = EXCLUDED.facultad_origen,
                escuela = EXCLUDED.escuela,
                ciclo_condicion = EXCLUDED.ciclo_condicion,
                direccion_distrito = EXCLUDED.direccion_distrito,
                dependencia_id = EXCLUDED.dependencia_id,
                area_id = EXCLUDED.area_id,
                area_nombre = EXCLUDED.area_nombre,
                supervisor = EXCLUDED.supervisor,
                modalidad = EXCLUDED.modalidad,
                tope_diario = EXCLUDED.tope_diario,
                tope_semanal = EXCLUDED.tope_semanal,
                horas_semana_actual = EXCLUDED.horas_semana_actual,
                meta_horas = EXCLUDED.meta_horas,
                horas_acumuladas = EXCLUDED.horas_acumuladas,
                turno_hoy = EXCLUDED.turno_hoy,
                hora_inicio_turno = EXCLUDED.hora_inicio_turno,
                tolerancia_min = EXCLUDED.tolerancia_min,
                estado_hoy = EXCLUDED.estado_hoy,
                hora_entrada_hoy = EXCLUDED.hora_entrada_hoy,
                hora_salida_hoy = EXCLUDED.hora_salida_hoy,
                indice_puntualidad = EXCLUDED.indice_puntualidad,
                tardanzas_mes = EXCLUDED.tardanzas_mes,
                faltas_mes = EXCLUDED.faltas_mes,
                score_riesgo_ausentismo = EXCLUDED.score_riesgo_ausentismo,
                nivel_semaforo = EXCLUDED.nivel_semaforo,
                factor_predictivo = EXCLUDED.factor_predictivo,
                fecha_inicio = EXCLUDED.fecha_inicio,
                fecha_fin_programada = EXCLUDED.fecha_fin_programada,
                fecha_fin_proyectada = EXCLUDED.fecha_fin_proyectada,
                telefono_whatsapp = EXCLUDED.telefono_whatsapp,
                correo = EXCLUDED.correo,
                promedio_evaluacion_actividades = EXCLUDED.promedio_evaluacion_actividades
        `;
        await executor.query(sql, [
            p.id,
            p.codigoUnp,
            p.dni,
            p.nombres,
            p.facultadOrigen || "Facultad de Ingeniería Industrial",
            p.escuela || "Ingeniería Informática",
            p.cicloCondicion || "10.° Ciclo",
            p.direccionDistrito || "Castilla, Piura",
            p.dependenciaId || "CIT-UNP",
            p.areaId || "AREA-DEV",
            p.areaNombre,
            p.supervisor,
            p.modalidad,
            Number(p.topeDiario),
            Number(p.topeSemanal),
            Number(p.horasSemanaActual || 0),
            Number(p.metaHoras),
            Number(p.horasAcumuladas || 0),
            p.turnoHoy,
            p.horaInicioTurno || "08:00",
            Number(p.toleranciaMin || 10),
            p.estadoHoy || "PUNTUAL",
            p.horaEntradaHoy || "--:--",
            p.horaSalidaHoy || "--:--",
            Number(p.indicePuntualidad || 100),
            Number(p.tardanzasMes || 0),
            Number(p.faltasMes || 0),
            Number(p.scoreRiesgoAusentismo || 5),
            p.nivelSemaforo || "VERDE",
            p.factorPredictivo || "",
            p.fechaInicio || "2026-11-16",
            p.fechaFinProgramada || "2027-03-16",
            p.fechaFinProyectada || "2027-03-16",
            p.telefonoWhatsapp || "+51 968 000 000",
            p.correo || "practicante@alumnos.unp.edu.pe",
            Number(p.promedioEvaluacionActividades || 5.0)
        ]);
    }

    async _upsertActividadQuery(executor, a) {
        const sql = `
            INSERT INTO sica_actividad_practica (
                id, fecha, practicante_id, practicante_nombre, modalidad, area_nombre,
                categoria_tecnica, descripcion, entregable, horas_sesion,
                estado_revision, calificacion, observacion_supervisor, supervisor
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
            ON CONFLICT (id) DO UPDATE SET
                estado_revision = EXCLUDED.estado_revision,
                calificacion = EXCLUDED.calificacion,
                observacion_supervisor = EXCLUDED.observacion_supervisor,
                horas_sesion = EXCLUDED.horas_sesion
        `;
        await executor.query(sql, [
            a.id,
            a.fecha,
            a.practicanteId,
            a.practicanteNombre,
            a.modalidad,
            a.areaNombre,
            a.categoriaTecnica,
            a.descripcion,
            a.entregable,
            Number(a.horasSesion || 0),
            a.estadoRevision || "PENDIENTE_REVISION",
            Number(a.calificacion || 0),
            a.observacionSupervisor || "",
            a.supervisor || ""
        ]);
    }

    async _upsertAlertaQuery(executor, alr) {
        const sql = `
            INSERT INTO sica_alerta_automatizada (
                id, fecha_hora, tipo, practicante, area, canal, destinatario,
                mensaje_whatsapp, asunto_correo, atendida, hora_atencion, resolucion_supervisor
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
            ON CONFLICT (id) DO UPDATE SET
                atendida = EXCLUDED.atendida,
                hora_atencion = EXCLUDED.hora_atencion,
                resolucion_supervisor = EXCLUDED.resolucion_supervisor
        `;
        await executor.query(sql, [
            alr.id,
            alr.fechaHora,
            alr.tipo,
            alr.practicante,
            alr.area,
            alr.canal || "WHATSAPP + CORREO",
            alr.destinatario,
            alr.mensajeWhatsapp,
            alr.asuntoCorreo || "[CIT-UNP] Notificación Automática",
            Boolean(alr.atendida),
            alr.horaAtencion || "-",
            alr.resolucionSupervisor || null
        ]);
    }

    _mapPracticanteRow(r) {
        if (!r) return null;
        return {
            id: r.id,
            codigoUnp: r.codigo_unp,
            dni: r.dni,
            nombres: r.nombres,
            facultadOrigen: r.facultad_origen,
            escuela: r.escuela,
            cicloCondicion: r.ciclo_condicion,
            direccionDistrito: r.direccion_distrito,
            dependenciaId: r.dependencia_id,
            areaId: r.area_id,
            areaNombre: r.area_nombre,
            supervisor: r.supervisor,
            modalidad: r.modalidad,
            topeDiario: Number(r.tope_diario),
            topeSemanal: Number(r.tope_semanal),
            horasSemanaActual: Number(r.horas_semana_actual),
            metaHoras: Number(r.meta_horas),
            horasAcumuladas: Number(r.horas_acumuladas),
            turnoHoy: r.turno_hoy,
            horaInicioTurno: r.hora_inicio_turno,
            toleranciaMin: Number(r.tolerancia_min),
            estadoHoy: r.estado_hoy,
            horaEntradaHoy: r.hora_entrada_hoy,
            horaSalidaHoy: r.hora_salida_hoy,
            indicePuntualidad: Number(r.indice_puntualidad),
            tardanzasMes: Number(r.tardanzas_mes),
            faltasMes: Number(r.faltas_mes),
            scoreRiesgoAusentismo: Number(r.score_riesgo_ausentismo),
            nivelSemaforo: r.nivel_semaforo,
            factorPredictivo: r.factor_predictivo,
            fechaInicio: r.fecha_inicio,
            fechaFinProgramada: r.fecha_fin_programada,
            fechaFinProyectada: r.fecha_fin_proyectada,
            telefonoWhatsapp: r.telefono_whatsapp,
            correo: r.correo,
            promedioEvaluacionActividades: Number(r.promedio_evaluacion_actividades)
        };
    }

    _mapActividadRow(r) {
        if (!r) return null;
        return {
            id: r.id,
            fecha: r.fecha,
            practicanteId: r.practicante_id,
            practicanteNombre: r.practicante_nombre,
            modalidad: r.modalidad,
            areaNombre: r.area_nombre,
            categoriaTecnica: r.categoria_tecnica,
            descripcion: r.descripcion,
            entregable: r.entregable,
            horasSesion: Number(r.horas_sesion),
            estadoRevision: r.estado_revision,
            calificacion: Number(r.calificacion),
            observacionSupervisor: r.observacion_supervisor,
            supervisor: r.supervisor
        };
    }

    _mapAlertaRow(r) {
        if (!r) return null;
        return {
            id: r.id,
            fechaHora: r.fecha_hora,
            tipo: r.tipo,
            practicante: r.practicante,
            area: r.area,
            canal: r.canal,
            destinatario: r.destinatario,
            mensajeWhatsapp: r.mensaje_whatsapp,
            asuntoCorreo: r.asunto_correo,
            atendida: Boolean(r.atendida),
            horaAtencion: r.hora_atencion,
            resolucionSupervisor: r.resolucion_supervisor || undefined
        };
    }

    async obtenerEstadoCompleto() {
        await this.ensureInitialized();
        const [pracRes, actRes, alrRes] = await Promise.all([
            this.pool.query(`SELECT * FROM sica_practicante_convenio ORDER BY orden_registro ASC`),
            this.pool.query(`SELECT * FROM sica_actividad_practica ORDER BY creado_en DESC, id DESC`),
            this.pool.query(`SELECT * FROM sica_alerta_automatizada ORDER BY creado_en DESC, id DESC`)
        ]);

        return {
            motorPersistencia: "PostgreSQL",
            dependencias: INITIAL_SEED.dependencias,
            areasCit: INITIAL_SEED.areasCit,
            practicantes: pracRes.rows.map(r => this._mapPracticanteRow(r)),
            actividades: actRes.rows.map(r => this._mapActividadRow(r)),
            alertas: alrRes.rows.map(r => this._mapAlertaRow(r)),
            metricasAnexo05: INITIAL_SEED.metricasAnexo05
        };
    }

    async obtenerPracticantePorId(id) {
        await this.ensureInitialized();
        const { rows } = await this.pool.query(
            `SELECT * FROM sica_practicante_convenio WHERE id = $1`,
            [id]
        );
        return this._mapPracticanteRow(rows[0]);
    }

    async actualizarPracticante(practicanteActualizado) {
        await this.ensureInitialized();
        await this._upsertPracticanteQuery(this.pool, practicanteActualizado);
        return practicanteActualizado;
    }

    async crearPracticante(datosPracticante) {
        await this.ensureInitialized();
        const { rows } = await this.pool.query(`SELECT COUNT(*)::int AS total FROM sica_practicante_convenio`);
        const nextNum = rows[0].total + 1;
        const nuevo = {
            id: datosPracticante.id || `PRAC-${String(nextNum).padStart(2, "0")}`,
            ...datosPracticante
        };
        await this._upsertPracticanteQuery(this.pool, nuevo);
        return nuevo;
    }

    async guardarActividad(datosActividad) {
        await this.ensureInitialized();
        const nueva = {
            id: datosActividad.id || `ACT-${Math.floor(200 + Math.random() * 799)}`,
            ...datosActividad
        };
        await this._upsertActividadQuery(this.pool, nueva);
        return nueva;
    }

    async obtenerActividadPorId(id) {
        await this.ensureInitialized();
        const { rows } = await this.pool.query(
            `SELECT * FROM sica_actividad_practica WHERE id = $1`,
            [id]
        );
        return this._mapActividadRow(rows[0]);
    }

    async actualizarActividad(actividadActualizada) {
        await this.ensureInitialized();
        await this._upsertActividadQuery(this.pool, actividadActualizada);
        return actividadActualizada;
    }

    async listarActividadesPorPracticante(practicanteId) {
        await this.ensureInitialized();
        const { rows } = await this.pool.query(
            `SELECT * FROM sica_actividad_practica WHERE practicante_id = $1 ORDER BY creado_en DESC`,
            [practicanteId]
        );
        return rows.map(r => this._mapActividadRow(r));
    }

    async guardarAlerta(alerta) {
        await this.ensureInitialized();
        await this._upsertAlertaQuery(this.pool, alerta);
        return alerta;
    }

    async marcarAlertaAtendida(alertaId, horaAtencion, resolucionSupervisor = null) {
        await this.ensureInitialized();
        const { rows } = await this.pool.query(
            `UPDATE sica_alerta_automatizada
             SET atendida = TRUE,
                 hora_atencion = $2,
                 resolucion_supervisor = COALESCE($3, resolucion_supervisor)
             WHERE id = $1
             RETURNING *`,
            [alertaId, horaAtencion, resolucionSupervisor]
        );
        if (!rows[0]) {
            throw new Error(`Alerta ${alertaId} no encontrada en PostgreSQL.`);
        }
        return this._mapAlertaRow(rows[0]);
    }
}

module.exports = { PostgresRepositoryAdapter };
