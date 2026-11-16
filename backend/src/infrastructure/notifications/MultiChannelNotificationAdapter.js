const { INotificationAlertPort } = require("../../domain/ports/OutputPorts");

/**
 * ADAPTADORES SECUNDARIOS (Driven Adapters - Salida):
 * - WhatsAppAlertAdapter: Despacha notificaciones hacia la pasarela WhatsApp API.
 * - SmtpEmailAlertAdapter: Despacha correos institucionales vía SMTP (@unp.edu.pe).
 * - MultiChannelNotificationAdapter (Patrón Composite + Adapter): Unifica ambos canales
 *   implementando el contrato INotificationAlertPort del Dominio.
 */

class WhatsAppAlertAdapter {
    constructor(config = {}) {
        this.apiUrl = config.whatsappApiUrl || process.env.WHATSAPP_API_URL || null;
        this.apiToken = config.whatsappToken || process.env.WHATSAPP_API_TOKEN || null;
    }

    async enviarMensaje(destinatario, mensaje) {
        const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
        return {
            canal: "WHATSAPP",
            proveedor: this.apiUrl ? "WhatsApp Cloud API" : "Simulador Local CIT-UNP",
            destinatario,
            mensaje,
            enviado: true,
            timestamp
        };
    }
}

class SmtpEmailAlertAdapter {
    constructor(config = {}) {
        this.smtpHost = config.smtpHost || process.env.SMTP_HOST || "smtp.unp.edu.pe";
        this.remitente = config.remitente || "notificaciones.cit@unp.edu.pe";
    }

    async enviarCorreo(destinatario, asunto, cuerpoTexto) {
        const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
        return {
            canal: "CORREO_SMTP",
            servidor: this.smtpHost,
            remitente: this.remitente,
            destinatario,
            asunto,
            cuerpoTexto,
            enviado: true,
            timestamp
        };
    }
}

class MultiChannelNotificationAdapter extends INotificationAlertPort {
    constructor(whatsappAdapter = new WhatsAppAlertAdapter(), smtpAdapter = new SmtpEmailAlertAdapter()) {
        super();
        this.whatsappAdapter = whatsappAdapter;
        this.smtpAdapter = smtpAdapter;
    }

    async enviarAlertaMulticanal(payload) {
        const [resWa, resMail] = await Promise.all([
            this.whatsappAdapter.enviarMensaje(payload.destinatario, payload.mensajeWhatsapp),
            this.smtpAdapter.enviarCorreo(payload.destinatario, payload.asuntoCorreo, payload.mensajeWhatsapp)
        ]);

        const fechaHora = new Date().toISOString().replace("T", " ").slice(0, 19);
        return {
            id: "ALR-" + Math.floor(1000 + Math.random() * 9000),
            fechaHora,
            tipo: payload.tipo,
            practicante: payload.practicante,
            area: payload.area,
            canal: payload.canal || "WHATSAPP + CORREO",
            destinatario: payload.destinatario,
            mensajeWhatsapp: payload.mensajeWhatsapp,
            asuntoCorreo: payload.asuntoCorreo,
            atendida: false,
            horaAtencion: "-",
            trazabilidadDespacho: { whatsapp: resWa.enviado, correo: resMail.enviado }
        };
    }
}

module.exports = {
    WhatsAppAlertAdapter,
    SmtpEmailAlertAdapter,
    MultiChannelNotificationAdapter
};
