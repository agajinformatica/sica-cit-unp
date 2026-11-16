/**
 * SERVICIO DE DOMINIO: PredictorAusentismoService
 * Implementa el modelo analítico-predictivo de riesgo de ausentismo y
 * la proyección inteligente de la fecha de culminación de prácticas en el CIT - UNP.
 */

class PredictorAusentismoService {
    /**
     * Evalúa el nivel de riesgo de ausentismo (0 a 100%) y el semáforo preventivo.
     * @param {Object} practicante Datos acumulados del practicante
     * @param {boolean} temporadaExamenesUnp Indica si la UNP está en semana de exámenes parciales/finales
     */
    static evaluarRiesgoYProyeccion(practicante, temporadaExamenesUnp = false) {
        const tardanzas = Number(practicante.tardanzasMes || 0);
        const faltas = Number(practicante.faltasMes || 0);
        const puntualidad = Number(practicante.indicePuntualidad || 100);
        const horasSemana = Number(practicante.horasSemanaActual || 0);
        const topeSemanal = Number(practicante.topeSemanal || 30);

        // Ponderación multifactorial del dominio formativo universitario
        const pesoFaltas = faltas * 16;
        const pesoTardanzas = tardanzas * 5.5;
        const penalidadImpuntualidad = Math.max(0, (95 - puntualidad) * 0.7);
        const ratioAvanceSemanal = topeSemanal > 0 ? (horasSemana / topeSemanal) : 1;
        const penalidadBajoRitmo = ratioAvanceSemanal < 0.6 ? 12 : 0;
        const ajusteExamenes = (temporadaExamenesUnp && practicante.modalidad === "PREPROFESIONAL") ? 18 : 0;

        const scoreBruto = Math.round(pesoFaltas + pesoTardanzas + penalidadImpuntualidad + penalidadBajoRitmo + ajusteExamenes);
        const scoreRiesgo = Math.min(98, Math.max(5, scoreBruto));

        let nivelSemaforo = "VERDE";
        if (scoreRiesgo >= 65) {
            nivelSemaforo = "ROJO";
        } else if (scoreRiesgo >= 35) {
            nivelSemaforo = "AMBAR";
        }

        // Proyección de fecha de término según velocidad real de acumulación
        const horasRestantes = Math.max(0, Number(practicante.metaHoras) - Number(practicante.horasAcumuladas));
        const ritmoSemanalEfectivo = Math.max(8, horasSemana || (practicante.modalidad === "PROFESIONAL" ? 38 : 22));
        const semanasRestantes = horasRestantes / ritmoSemanalEfectivo;
        const diasRestantes = Math.ceil(semanasRestantes * 7);

        const baseDate = new Date("2026-11-16T12:00:00Z");
        baseDate.setUTCDate(baseDate.getUTCDate() + diasRestantes);
        const fechaFinProyectada = baseDate.toISOString().slice(0, 10);

        return {
            scoreRiesgoAusentismo: scoreRiesgo,
            nivelSemaforo,
            horasRestantes: Number(horasRestantes.toFixed(1)),
            fechaFinProyectada,
            requiereAlertaPreventiva: nivelSemaforo !== "VERDE"
        };
    }

    /**
     * Clasifica la marcación de entrada comparando la hora oficial del servidor con el turno asignado.
     */
    static clasificarIngreso(horaInicioTurno, horaMarcacion, toleranciaMinutos = 10) {
        const [hProg, mProg] = String(horaInicioTurno).split(":").map(Number);
        const [hReal, mReal] = String(horaMarcacion).split(":").map(Number);
        const minProg = (hProg || 8) * 60 + (mProg || 0);
        const minReal = (hReal || 8) * 60 + (mReal || 0);
        const retrasoMinutos = Math.max(0, minReal - minProg);

        if (retrasoMinutos > toleranciaMinutos) {
            return {
                estadoAsistencia: "TARDANZA",
                minutosTardanza: retrasoMinutos,
                disparaAlerta: true
            };
        }
        return {
            estadoAsistencia: "PUNTUAL",
            minutosTardanza: 0,
            disparaAlerta: false
        };
    }
}

module.exports = { PredictorAusentismoService };
