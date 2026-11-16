/**
 * PUERTOS DE SALIDA DEL DOMINIO (Driven Ports)
 * Definen los contratos que la capa de Infraestructura debe implementar,
 * cumpliendo el Principio de Inversión de Dependencias (SOLID - DIP).
 */

class IAsistenciaRepositoryPort {
    async obtenerEstadoCompleto() { throw new Error("Método no implementado"); }
    async obtenerPracticantePorId(id) { throw new Error("Método no implementado"); }
    async actualizarPracticante(practicante) { throw new Error("Método no implementado"); }
    async crearPracticante(practicante) { throw new Error("Método no implementado"); }
    async guardarActividad(actividad) { throw new Error("Método no implementado"); }
    async obtenerActividadPorId(id) { throw new Error("Método no implementado"); }
    async actualizarActividad(actividad) { throw new Error("Método no implementado"); }
    async listarActividadesPorPracticante(practicanteId) { throw new Error("Método no implementado"); }
    async guardarAlerta(alerta) { throw new Error("Método no implementado"); }
    async marcarAlertaAtendida(alertaId, horaAtencion) { throw new Error("Método no implementado"); }
}

class INotificationAlertPort {
    /**
     * Envía una alerta automatizada por los canales configurados (WhatsApp y/o Correo SMTP).
     * @param {Object} payload { tipo, practicante, area, destinatario, mensajeWhatsapp, asuntoCorreo }
     */
    async enviarAlertaMulticanal(payload) {
        throw new Error("Método enviarAlertaMulticanal no implementado");
    }
}

module.exports = {
    IAsistenciaRepositoryPort,
    INotificationAlertPort
};
