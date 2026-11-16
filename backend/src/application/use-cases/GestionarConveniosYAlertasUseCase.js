const { ModalidadStrategyFactory } = require("../../domain/strategies/ModalidadHorarioStrategy");
const { PredictorAusentismoService } = require("../../domain/services/PredictorAusentismoService");

/**
 * CASOS DE USO (Application Layer):
 * - PredecirAusentismoUseCase (CU-07: Evaluación predictiva y alerta preventiva)
 * - RegistrarConvenioUseCase (CU-08 / CU-09: Alta multifacultad con Strategy Pattern)
 * - AtenderAlertaUseCase (CU-06: Registro de atención para indicador Anexo 05)
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
            tipo: "RIESGO_PREDICTIVO",
            practicante: practicante.nombres,
            area: practicante.areaNombre,
            canal: "WHATSAPP + CORREO",
            destinatario: `${practicante.supervisor} / ${practicante.nombres}`,
            mensajeWhatsapp: `*[CIT-UNP · ALERTA PREDICTIVA DE AUSENTISMO]*\nEl modelo predictivo estimó un *Score de Riesgo de ${resultadoIA.scoreRiesgoAusentismo}% (${resultadoIA.nivelSemaforo})* para *${practicante.nombres}*.\nFactor: _${practicante.factorPredictivo}_\nFecha término proyectada: *${resultadoIA.fechaFinProyectada}*.`,
            asuntoCorreo: `[CIT-UNP PREVENTIVO] Alerta Predictiva de Ausentismo (${resultadoIA.scoreRiesgoAusentismo}%) - ${practicante.nombres}`
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
            codigoUnp: datos.codigoUnp || "0512023010",
            dni: datos.dni,
            nombres: datos.nombres,
            escuela: datos.escuela || "Ingeniería Informática",
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
            turnoHoy: datos.turnoHoy || "08:00 - 14:00 (Escalonado Mañana)",
            horaInicioTurno: String(datos.turnoHoy || "08:00").slice(0, 5),
            toleranciaMin: 10,
            estadoHoy: "PUNTUAL",
            horaEntradaHoy: "Recién inscrito",
            horaSalidaHoy: "--:--",
            indicePuntualidad: 100.0,
            tardanzasMes: 0,
            faltasMes: 0,
            scoreRiesgoAusentismo: 5,
            nivelSemaforo: "VERDE",
            factorPredictivo: `Convenio activo dentro del límite semanal de ${strategy.topeHorasSemanales} horas`,
            fechaInicio: "2026-11-16",
            fechaFinProgramada: "2027-03-16",
            fechaFinProyectada: "2027-03-16",
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

    async execute(alertaId) {
        const horaAtencion = new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false });
        return await this.asistenciaRepository.marcarAlertaAtendida(alertaId, horaAtencion);
    }
}

module.exports = {
    PredecirAusentismoUseCase,
    RegistrarConvenioUseCase,
    AtenderAlertaUseCase
};
