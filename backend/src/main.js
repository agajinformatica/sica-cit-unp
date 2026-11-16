const { JsonPersistenceRepository } = require("./infrastructure/persistence/JsonPersistenceRepository");
const { MultiChannelNotificationAdapter } = require("./infrastructure/notifications/MultiChannelNotificationAdapter");
const { RegistrarMarcacionUseCase } = require("./application/use-cases/RegistrarMarcacionUseCase");
const { EvaluarActividadUseCase } = require("./application/use-cases/EvaluarActividadUseCase");
const {
    PredecirAusentismoUseCase,
    RegistrarConvenioUseCase,
    AtenderAlertaUseCase
} = require("./application/use-cases/GestionarConveniosYAlertasUseCase");
const { HttpServerAdapter } = require("./infrastructure/http/HttpServerAdapter");

/**
 * COMPOSITION ROOT (Inyección de Dependencias - Principio SOLID DIP):
 * Ensambla los Adaptadores Secundarios (Persistencia y Notificaciones WhatsApp/SMTP),
 * los inyecta en los Casos de Uso de Aplicación y levanta el Adaptador Primario HTTP.
 */
function buildContainer(customDbPath = null) {
    const asistenciaRepository = new JsonPersistenceRepository(customDbPath);
    const notificationPort = new MultiChannelNotificationAdapter();

    const registrarMarcacionUseCase = new RegistrarMarcacionUseCase(asistenciaRepository, notificationPort);
    const evaluarActividadUseCase = new EvaluarActividadUseCase(asistenciaRepository, notificationPort);
    const predecirAusentismoUseCase = new PredecirAusentismoUseCase(asistenciaRepository, notificationPort);
    const registrarConvenioUseCase = new RegistrarConvenioUseCase(asistenciaRepository);
    const atenderAlertaUseCase = new AtenderAlertaUseCase(asistenciaRepository);

    const httpAdapter = new HttpServerAdapter({
        asistenciaRepository,
        registrarMarcacionUseCase,
        evaluarActividadUseCase,
        predecirAusentismoUseCase,
        registrarConvenioUseCase,
        atenderAlertaUseCase
    });

    return {
        asistenciaRepository,
        notificationPort,
        registrarMarcacionUseCase,
        evaluarActividadUseCase,
        predecirAusentismoUseCase,
        registrarConvenioUseCase,
        atenderAlertaUseCase,
        httpAdapter
    };
}

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    const HOST = process.env.HOST || "0.0.0.0";
    const container = buildContainer();
    const server = container.httpAdapter.createServer();
    server.listen(PORT, HOST, () => {
        console.log("==========================================================================");
        console.log(" SICA - CIT UNP | Backend con Arquitectura Hexagonal Activo");
        console.log(` Servidor Web + API REST escuchando en: http://${HOST}:${PORT}`);
        console.log(` Healthcheck Hexagonal:                 http://${HOST}:${PORT}/api/v1/health`);
        console.log("==========================================================================");
    });
}

module.exports = { buildContainer };
