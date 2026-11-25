const { ModalidadStrategyFactory } = require("../../domain/strategies/ModalidadHorarioStrategy");
const { PredictorAusentismoService } = require("../../domain/services/PredictorAusentismoService");

/**
 * CASOS DE USO (Application Layer):
 * - PredecirAusentismoUseCase (Evaluación predictiva y alerta preventiva)
 * - RegistrarConvenioUseCase (Alta de practicante y convenio con Strategy Pattern)
 * - AtenderAlertaUseCase (Confirmación y seguimiento de alerta por el supervisor)
 */

class PredecirAusentismoUseCase {
    constructor(asistenciaRepository, notificationPort) {
        this.asistenciaRepository = asistenciaRepository;
        this.notificationPort = notificationPort;
    }

    async evaluarYEmitirAlertaPreventiva({ practicanteId, temporadaExamenesUnp = false }) {
        const practicante = await this.asistenciaRepository.obtenerPracticantePorId(practicanteId);
        if (!practicante) {
            throw new Error(`Practicante ${practicanteId} no encontrado.`);
        }

        const resultadoIA = PredictorAusentismoService.evaluarRiesgoYProyeccion(practicante, temporadaExamenesUnp);
        practicante.scoreRiesgoAusentismo = resultadoIA.scoreRiesgoAusentismo;
        practicante.nivelSemaforo = resultadoIA.nivelSemaforo;
        practicante.fechaFinProyectada = resultadoIA.fechaFinProyectada;
        await this.asistenciaRepository.actualizarPracticante(practicante);

        const payloadAlerta = {
            tipo: "ALERTA PREVENTIVA DE AUSENTISMO",
            practicante: practicante.nombres,
            area: practicante.areaNombre,
            canal: "WHATSAPP + CORREO",
            destinatario: `${practicante.supervisor} / ${practicante.nombres}`,
            mensajeWhatsapp: `*[OTI-UNP · AVISO PREVENTIVO DE SEGUIMIENTO HORARIO]*\nEl análisis de asistencia estima un *índice de riesgo de ausentismo de ${resultadoIA.scoreRiesgoAusentismo}% (${resultadoIA.nivelSemaforo})* para *${practicante.nombres}*.\nFactor observado: _${practicante.factorPredictivo}_\nFecha estimada de culminación: *${resultadoIA.fechaFinProyectada}*.`,
            asuntoCorreo: `[OTI-UNP] Aviso Preventivo de Seguimiento Horario (${resultadoIA.scoreRiesgoAusentismo}%) — ${practicante.nombres}`
        };

        const alerta = await this.notificationPort.enviarAlertaMulticanal(payloadAlerta);
        await this.asistenciaRepository.guardarAlerta(alerta);

        return { practicante, resultadoIA, alerta };
    }
}

class RegistrarConvenioUseCase {
    constructor(asistenciaRepository) {
        this.asistenciaRepository = asistenciaRepository;
    }

    async execute(datos) {
        const strategy = ModalidadStrategyFactory.obtenerEstrategia(datos.modalidad);
        const nuevo = await this.asistenciaRepository.crearPracticante({
            id: datos.id,
            codigoUnp: datos.codigoUnp || "0512023010",
            dni: datos.dni,
            nombres: datos.nombres,
            facultadOrigen: datos.facultadOrigen || "Facultad de Ingeniería Industrial",
            escuela: datos.escuela || "Ingeniería Informática",
            cicloCondicion: datos.cicloCondicion || "10.° Ciclo",
            direccionDistrito: datos.direccionDistrito || "Castilla, Piura",
            dependenciaId: datos.dependenciaId || "CIT-UNP",
            areaId: datos.areaId || "AREA-DEV",
            areaNombre: datos.areaNombre || "Desarrollo de Software y Sistemas Web",
            supervisor: datos.supervisor || "Ing. Carlos Alberto Mendoza Ruiz",
            modalidad: strategy.modalidad,
            topeDiario: strategy.topeHorasDiarias,
            topeSemanal: strategy.topeHorasSemanales,
            horasSemanaActual: 0,
            metaHoras: strategy.metaHorasDefecto,
            horasAcumuladas: 0,
            turnoHoy: datos.turnoHoy || "08:00 - 14:00 (Turno Mañana)",
            horaInicioTurno: String(datos.turnoHoy || "08:00").slice(0, 5),
            toleranciaMin: 10,
            estadoHoy: "PUNTUAL",
            horaEntradaHoy: "Sin marcación hoy",
            horaSalidaHoy: "--:--",
            indicePuntualidad: 100.0,
            tardanzasMes: 0,
            faltasMes: 0,
            scoreRiesgoAusentismo: 5,
            nivelSemaforo: "VERDE",
            factorPredictivo: `Convenio activo dentro del límite semanal de ${strategy.topeHorasSemanales} horas`,
            fechaInicio: datos.fechaInicio || "2026-11-16",
            fechaFinProgramada: datos.fechaFinProgramada || "2027-03-16",
            fechaFinProyectada: datos.fechaFinProyectada || "2027-03-16",
            telefonoWhatsapp: datos.telefonoWhatsapp || "+51 968 000 111",
            correo: datos.correo || "practicante@alumnos.unp.edu.pe",
            promedioEvaluacionActividades: 5.0
        });
        return nuevo;
    }
}

class AtenderAlertaUseCase {
    constructor(asistenciaRepository) {
        this.asistenciaRepository = asistenciaRepository;
    }

    async execute(alertaId, resolucionSupervisor = null) {
        const horaAtencion = new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false });
        return await this.asistenciaRepository.marcarAlertaAtendida(alertaId, horaAtencion, resolucionSupervisor);
    }
}

module.exports = {
    PredecirAusentismoUseCase,
    RegistrarConvenioUseCase,
    AtenderAlertaUseCase
};
