const { IAsistenciaRepositoryPort } = require("../../domain/ports/OutputPorts");

/**
 * ADAPTADOR SECUNDARIO POSTGRESQL (Driven Adapter):
 * Implementa el mismo contrato IAsistenciaRepositoryPort utilizando consultas SQL
 * parametrizadas sobre el esquema relacional 3FN del CIT - UNP.
 * Gracias a la Arquitectura Hexagonal, puede intercambiarse con JsonPersistenceRepository
 * en src/main.js sin alterar ninguna línea de Dominio ni de Casos de Uso.
 */
class PostgresRepositoryAdapter extends IAsistenciaRepositoryPort {
    constructor(pgPool) {
        super();
        this.pool = pgPool;
    }

    async obtenerPracticantePorId(id) {
        const sql = `
            SELECT c.id, u.codigo_universitario AS "codigoUnp", u.dni, u.nombres_apellidos AS nombres,
                   a.nombre AS "areaNombre", c.modalidad, c.tope_horas_diarias AS "topeDiario",
                   c.tope_horas_semanales AS "topeSemanal", c.meta_horas_totales AS "metaHoras",
                   c.horas_acumuladas AS "horasAcumuladas"
            FROM convenio_practica c
            INNER JOIN usuario u ON u.id = c.practicante_id
            INNER JOIN area_operativa a ON a.id = c.area_operativa_id
            WHERE c.codigo_convenio = $1
        `;
        const { rows } = await this.pool.query(sql, [id]);
        return rows[0] || null;
    }

    async guardarActividad(actividad) {
        const sql = `
            INSERT INTO actividad_practica
            (registro_asistencia_id, categoria_tecnica, descripcion_actividad, entregable_evidencia, estado_revision, calificacion_desempeno)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const { rows } = await this.pool.query(sql, [
            actividad.registroAsistenciaId || 1,
            actividad.categoriaTecnica,
            actividad.descripcion,
            actividad.entregable,
            actividad.estadoRevision,
            actividad.calificacion
        ]);
        return rows[0];
    }

    async guardarAlerta(alerta) {
        const sql = `
            INSERT INTO alerta_automatizada
            (convenio_id, tipo_alerta, canal_envio, destinatario_contacto, mensaje_emitido, atendida_por_supervisor)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const { rows } = await this.pool.query(sql, [
            1,
            alerta.tipo,
            alerta.canal,
            alerta.destinatario,
            alerta.mensajeWhatsapp,
            alerta.atendida
        ]);
        return rows[0];
    }
}

module.exports = { PostgresRepositoryAdapter };
