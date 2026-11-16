const { ModalidadStrategyFactory } = require("../../domain/strategies/ModalidadHorarioStrategy");
const { PredictorAusentismoService } = require("../../domain/services/PredictorAusentismoService");

/**
 * CASO DE USO (Application Layer): RegistrarMarcacionUseCase
 * Orquesta CU-02 (Marcación Entrada/Salida), CU-12 (Cómputo y Tope Legal Ley N.° 28518),
 * CU-13 (Bitácora de Actividad Técnica RF-17) y CU-11 (Disparo de Alerta WhatsApp/Correo).
 */
class RegistrarMarcacionUseCase {
    constructor(asistenciaRepository, notificationPort) {
        this.asistenciaRepository = asistenciaRepository;
        this.notificationPort = notificationPort;
    }

    async execute(command) {
        const {
            practicanteId,
            tipoAccion, // "ENTRADA" | "SALIDA"
            horaMarcacion,
            categoriaActividad,
            descripcionActividad,
            entregableActividad,
            horasSesionSolicitadas
        } = command;

        const practicante = await this.asistenciaRepository.obtenerPracticantePorId(practicanteId);
        if (!practicante) {
            throw new Error(`Practicante con ID ${practicanteId} no encontrado en el CIT - UNP.`);
        }

        const strategy = ModalidadStrategyFactory.obtenerEstrategia(practicante.modalidad);
        let alertaGenerada = null;
        let actividadCreada = null;

        if (tipoAccion === "ENTRADA") {
            const clasificacion = PredictorAusentismoService.clasificarIngreso(
                practicante.horaInicioTurno,
                horaMarcacion,
                practicante.toleranciaMin
            );

            practicante.horaEntradaHoy = horaMarcacion;
            practicante.estadoHoy = clasificacion.estadoAsistencia;

            if (clasificacion.disparaAlerta) {
                practicante.tardanzasMes = Number(practicante.tardanzasMes || 0) + 1;
                const payloadAlerta = {
                    tipo: "TARDANZA",
                    practicante: practicante.nombres,
                    area: practicante.areaNombre,
                    canal: "WHATSAPP + CORREO",
                    destinatario: `${practicante.supervisor} (${practicante.telefonoWhatsapp})`,
                    mensajeWhatsapp: `*[CIT-UNP · ALERTA DE TARDANZA]*\nEl practicante *${practicante.nombres}* (${practicante.modalidad}) registró su entrada a las *${horaMarcacion}* (Turno: ${practicante.horaInicioTurno}, Retraso: *${clasificacion.minutosTardanza} min*).\nUnidad: ${practicante.areaNombre}.`,
                    asuntoCorreo: `[CIT-UNP] Alerta Automática de Tardanza (${clasificacion.minutosTardanza} min) - ${practicante.nombres}`
                };
                alertaGenerada = await this.notificationPort.enviarAlertaMulticanal(payloadAlerta);
                await this.asistenciaRepository.guardarAlerta(alertaGenerada);
            }

            await this.asistenciaRepository.actualizarPracticante(practicante);
            return {
                tipoAccion: "ENTRADA",
                estadoAsistencia: clasificacion.estadoAsistencia,
                minutosTardanza: clasificacion.minutosTardanza,
                practicante,
                alertaGenerada
            };
        }

        // Flujo SALIDA + Registro obligatorio de Actividad Técnica
        if (!descripcionActividad || !String(descripcionActividad).trim()) {
            throw new Error("Para registrar la salida del turno, detalle la actividad técnica ejecutada y el entregable correspondiente.");
        }

        const validacionTope = strategy.validarHorasSesion(
            Number(practicante.horasSemanaActual || 0),
            Number(horasSesionSolicitadas || strategy.topeHorasDiarias)
        );

        practicante.horaSalidaHoy = horaMarcacion;
        practicante.horasSemanaActual = Number((practicante.horasSemanaActual + validacionTope.horasValidas).toFixed(1));
        practicante.horasAcumuladas = Number((practicante.horasAcumuladas + validacionTope.horasValidas).toFixed(1));

        actividadCreada = await this.asistenciaRepository.guardarActividad({
            fecha: new Date().toISOString().slice(0, 10),
            practicanteId: practicante.id,
            practicanteNombre: practicante.nombres,
            modalidad: practicante.modalidad,
            areaNombre: practicante.areaNombre,
            categoriaTecnica: categoriaActividad || "DESARROLLO_SOFTWARE",
            descripcion: String(descripcionActividad).trim(),
            entregable: String(entregableActividad || "Entregable registrado en turno CIT-UNP").trim(),
            horasSesion: validacionTope.horasValidas,
            estadoRevision: "PENDIENTE_REVISION",
            calificacion: 0,
            observacionSupervisor: "Pendiente de evaluación y calificación (1-5) por el supervisor del CIT.",
            supervisor: practicante.supervisor
        });

        // Verificar si alcanzó el 90% o 100% de la meta de horas del convenio (RF-10)
        const paha = (practicante.horasAcumuladas / practicante.metaHoras) * 100;
        if (paha >= 90) {
            const payloadMeta = {
                tipo: "META_HORAS_90",
                practicante: practicante.nombres,
                area: practicante.areaNombre,
                canal: "WHATSAPP + CORREO",
                destinatario: `Jefatura CIT - UNP / ${practicante.supervisor}`,
                mensajeWhatsapp: `*[CIT-UNP · AVANCE DE HORAS ${paha.toFixed(1)}%]*\nEl practicante *${practicante.nombres}* (${practicante.modalidad}) alcanzó *${practicante.horasAcumuladas} / ${practicante.metaHoras} h*. Puede iniciar validación para su Constancia de Prácticas.`,
                asuntoCorreo: `[CIT-UNP] Cumplimiento de Meta de Horas (${paha.toFixed(1)}%) - ${practicante.nombres}`
            };
            alertaGenerada = await this.notificationPort.enviarAlertaMulticanal(payloadMeta);
            await this.asistenciaRepository.guardarAlerta(alertaGenerada);
        }

        await this.asistenciaRepository.actualizarPracticante(practicante);
        return {
            tipoAccion: "SALIDA",
            validacionTope,
            practicante,
            actividadCreada,
            alertaGenerada
        };
    }
}

module.exports = { RegistrarMarcacionUseCase };
