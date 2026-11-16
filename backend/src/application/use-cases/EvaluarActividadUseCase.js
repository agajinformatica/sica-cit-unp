/**
 * CASO DE USO (Application Layer): EvaluarActividadUseCase
 * Implementa CU-13 y RF-18: El Supervisor del CIT - UNP evalúa la actividad realizada
 * por el practicante en escala de 1 a 5, otorga conformidad (APROBADA u OBSERVADA)
 * y, si es OBSERVADA, despacha una alerta automática por WhatsApp y Correo.
 */
class EvaluarActividadUseCase {
    constructor(asistenciaRepository, notificationPort) {
        this.asistenciaRepository = asistenciaRepository;
        this.notificationPort = notificationPort;
    }

    async execute({ actividadId, estadoRevision, calificacion, observacionSupervisor }) {
        const actividad = await this.asistenciaRepository.obtenerActividadPorId(actividadId);
        if (!actividad) {
            throw new Error(`Actividad con ID ${actividadId} no encontrada.`);
        }

        const calificacionNum = Math.min(5, Math.max(1, Number(calificacion || 5)));
        actividad.estadoRevision = estadoRevision === "OBSERVADA" ? "OBSERVADA" : "APROBADA";
        actividad.calificacion = calificacionNum;
        actividad.observacionSupervisor = String(observacionSupervisor || "Actividad evaluada por el supervisor.").trim();

        await this.asistenciaRepository.actualizarActividad(actividad);

        // Recalcular el promedio de evaluación de actividades del practicante
        const practicante = await this.asistenciaRepository.obtenerPracticantePorId(actividad.practicanteId);
        if (practicante) {
            const todas = await this.asistenciaRepository.listarActividadesPorPracticante(practicante.id);
            const calificadas = todas.filter(a => Number(a.calificacion) > 0);
            if (calificadas.length > 0) {
                const suma = calificadas.reduce((acc, item) => acc + Number(item.calificacion), 0);
                practicante.promedioEvaluacionActividades = Number((suma / calificadas.length).toFixed(1));
                await this.asistenciaRepository.actualizarPracticante(practicante);
            }
        }

        let alertaGenerada = null;
        if (actividad.estadoRevision === "OBSERVADA") {
            const payloadObs = {
                tipo: "ACTIVIDAD_OBSERVADA",
                practicante: actividad.practicanteNombre,
                area: actividad.areaNombre,
                canal: "WHATSAPP + CORREO",
                destinatario: actividad.practicanteNombre,
                mensajeWhatsapp: `*[CIT-UNP · ACTIVIDAD OBSERVADA]*\nTu actividad *${actividad.id}* (${actividad.categoriaTecnica}) fue marcada como *OBSERVADA* por *${actividad.supervisor}*.\nCalificación preliminar: ${actividad.calificacion}/5\nObservación: _${actividad.observacionSupervisor}_`,
                asuntoCorreo: `[CIT-UNP] Actividad de Prácticas Observada (${actividad.id}) - Subsanación Requerida`
            };
            alertaGenerada = await this.notificationPort.enviarAlertaMulticanal(payloadObs);
            await this.asistenciaRepository.guardarAlerta(alertaGenerada);
        }

        return {
            actividad,
            practicante,
            alertaGenerada
        };
    }
}

module.exports = { EvaluarActividadUseCase };
