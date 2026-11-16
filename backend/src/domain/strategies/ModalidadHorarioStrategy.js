/**
 * PATRÓN DE DISEÑO: STRATEGY (GoF)
 * Regula las reglas horarias diferenciadas según la Ley N.° 28518
 * (Modalidades Formativas Laborales en el Perú y Reglamento Académico UNP).
 */

class ModalidadPreprofesionalStrategy {
    constructor() {
        this.modalidad = "PREPROFESIONAL";
        this.topeHorasDiarias = 6;
        this.topeHorasSemanales = 30;
        this.metaHorasDefecto = 360;
    }

    validarHorasSesion(horasSemanaActual, horasSesionSolicitadas) {
        const disponibleSemana = Math.max(0, this.topeHorasSemanales - horasSemanaActual);
        const horasValidas = Math.min(horasSesionSolicitadas, this.topeHorasDiarias, disponibleSemana);
        const excedeTopeSemanal = (horasSemanaActual + horasSesionSolicitadas) > this.topeHorasSemanales;
        return {
            horasValidas: Number(horasValidas.toFixed(2)),
            excedeTopeSemanal,
            topeSemanalAplicado: this.topeHorasSemanales,
            mensajeRegla: excedeTopeSemanal
                ? `Tope legal Preprofesional (Ley N.° 28518: máx. 30 h/semana) alcanzado. Se computaron ${horasValidas} h.`
                : "Dentro del límite legal Preprofesional (6 h/día, 30 h/semana)."
        };
    }
}

class ModalidadProfesionalStrategy {
    constructor() {
        this.modalidad = "PROFESIONAL";
        this.topeHorasDiarias = 8;
        this.topeHorasSemanales = 48;
        this.metaHorasDefecto = 480;
    }

    validarHorasSesion(horasSemanaActual, horasSesionSolicitadas) {
        const disponibleSemana = Math.max(0, this.topeHorasSemanales - horasSemanaActual);
        const horasValidas = Math.min(horasSesionSolicitadas, this.topeHorasDiarias, disponibleSemana);
        const excedeTopeSemanal = (horasSemanaActual + horasSesionSolicitadas) > this.topeHorasSemanales;
        return {
            horasValidas: Number(horasValidas.toFixed(2)),
            excedeTopeSemanal,
            topeSemanalAplicado: this.topeHorasSemanales,
            mensajeRegla: excedeTopeSemanal
                ? `Tope legal Profesional (Ley N.° 28518: máx. 48 h/semana) alcanzado. Se computaron ${horasValidas} h.`
                : "Dentro del límite legal Profesional (8 h/día, 48 h/semana)."
        };
    }
}

class ModalidadStrategyFactory {
    static obtenerEstrategia(modalidad) {
        if (String(modalidad).toUpperCase() === "PROFESIONAL") {
            return new ModalidadProfesionalStrategy();
        }
        return new ModalidadPreprofesionalStrategy();
    }
}

module.exports = {
    ModalidadPreprofesionalStrategy,
    ModalidadProfesionalStrategy,
    ModalidadStrategyFactory
};
