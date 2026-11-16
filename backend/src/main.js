const { JsonPersistenceRepository } = require("./infrastructure/persistence/JsonPersistenceRepository");
const { PostgresRepositoryAdapter } = require("./infrastructure/persistence/PostgresRepositoryAdapter");
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
 * Ensambla los Adaptadores Secundarios (Persistencia PostgreSQL / JSON y Notificaciones WhatsApp/SMTP),
 * los inyecta en los Casos de Uso de Aplicación y levanta el Adaptador Primario HTTP.
 */
function buildContainer(customDbPath = null) {
    const usePostgres = !customDbPath && Boolean(process.env.DATABASE_URL);
    const asistenciaRepository = usePostgres
        ? new PostgresRepositoryAdapter(process.env.DATABASE_URL)
        : new JsonPersistenceRepository(customDbPath);

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

    // Inicializar esquema PostgreSQL en segundo plano si DATABASE_URL está activo
    if (typeof container.asistenciaRepository.ensureInitialized === "function") {
        container.asistenciaRepository.ensureInitialized().catch(err => {
            console.error("[SICA-CIT] Advertencia al inicializar PostgreSQL:", err.message);
        });
    }

    const server = container.httpAdapter.createServer();
    server.listen(PORT, HOST, () => {
        console.log("==========================================================================");
        console.log(" SICA - CIT UNP | Backend con Arquitectura Hexagonal Activo");
        console.log(` Motor de Base de Datos:                ${process.env.DATABASE_URL ? "PostgreSQL (Activo)" : "Persistencia Local JSON"}`);
        console.log(` Servidor Web + API REST escuchando en: http://${HOST}:${PORT}`);
        console.log(` Healthcheck Hexagonal:                 http://${HOST}:${PORT}/api/v1/health`);
        console.log("==========================================================================");
    });
}

module.exports = { buildContainer };
