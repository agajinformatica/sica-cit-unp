const http = require("http");
const fs = require("fs");
const path = require("path");

/**
 * ADAPTADOR PRIMARIO HTTP / REST (Driving Adapter - Entrada):
 * Expone los Casos de Uso de la capa de Aplicación mediante endpoints JSON REST
 * (/api/v1/...) y sirve los activos estáticos del Frontend de la UNP.
 */

const MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml"
};

class HttpServerAdapter {
    constructor(useCases) {
        this.useCases = useCases;
        this.frontendDir = path.join(__dirname, "../../../../frontend");
    }

    _sendJson(res, statusCode, payload) {
        res.writeHead(statusCode, {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-Role"
        });
        res.end(JSON.stringify(payload, null, 2));
    }

    _enforceRbac(req, allowedRoles) {
        const userRole = req.headers["x-user-role"] || "ADMIN_CIT";
        if (!allowedRoles.includes(userRole)) {
            throw new Error(`Acceso denegado (RBAC): El rol '${userRole}' no cuenta con autorización para ejecutar esta operación.`);
        }
    }

    _parseBody(req) {
        return new Promise((resolve, reject) => {
            let body = "";
            req.on("data", chunk => { body += chunk.toString(); });
            req.on("end", () => {
                if (!body) return resolve({});
                try {
                    resolve(JSON.parse(body));
                } catch (err) {
                    reject(new Error("JSON inválido en el cuerpo de la petición."));
                }
            });
            req.on("error", reject);
        });
    }

    createServer() {
        return http.createServer(async (req, res) => {
            if (req.method === "OPTIONS") {
                return this._sendJson(res, 200, { ok: true });
            }

            const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
            const pathname = urlObj.pathname;

            try {
                // 1. Healthcheck de la Arquitectura Hexagonal y Motor PostgreSQL
                if (req.method === "GET" && pathname === "/api/v1/health") {
                    return this._sendJson(res, 200, {
                        status: "OK",
                        sistema: "SICA - CIT UNP (Sistema Inteligente de Control de Asistencia y Evaluación de Prácticas)",
                        arquitectura: "Hexagonal (Ports & Adapters)",
                        motorBaseDatos: process.env.DATABASE_URL ? "PostgreSQL (Conectado)" : "Persistencia Local JSON",
                        patronesActivos: ["Strategy (Ley 28518: 30h/48h)", "Repository (PostgreSQL)", "Adapter", "Composite Notification", "RBAC Auth"],
                        horaServidorOficial: new Date().toISOString()
                    });
                }

                // 1B. Autenticación Institucional y Asignación de Rol (CU-01)
                if (req.method === "POST" && pathname === "/api/v1/auth/login") {
                    const body = await this._parseBody(req);
                    return this._sendJson(res, 200, {
                        ok: true,
                        sesion: {
                            usuario: body.usuario,
                            rol: body.rol || "ADMIN_CIT",
                            autenticadoEn: new Date().toISOString()
                        }
                    });
                }

                // 2. Estado completo del Dashboard CIT - UNP
                if (req.method === "GET" && pathname === "/api/v1/estado") {
                    const estado = await this.useCases.asistenciaRepository.obtenerEstadoCompleto();
                    return this._sendJson(res, 200, { ok: true, data: estado });
                }

                // 3. CU-02 + CU-13: Registrar Marcación (Entrada / Salida + Bitácora Actividad)
                if (req.method === "POST" && pathname === "/api/v1/asistencia/marcar") {
                    const body = await this._parseBody(req);
                    const resultado = await this.useCases.registrarMarcacionUseCase.execute(body);
                    return this._sendJson(res, 201, { ok: true, resultado });
                }

                // 4. Evaluar y Calificar Actividad Realizada (Exclusivo ADMIN_CIT y SUPERVISOR)
                if (req.method === "POST" && pathname === "/api/v1/actividades/evaluar") {
                    this._enforceRbac(req, ["ADMIN_CIT", "SUPERVISOR"]);
                    const body = await this._parseBody(req);
                    const resultado = await this.useCases.evaluarActividadUseCase.execute(body);
                    return this._sendJson(res, 200, { ok: true, resultado });
                }

                // 5. Evaluar Predicción de Ausentismo y Emitir Alerta Preventiva (Exclusivo ADMIN_CIT y SUPERVISOR)
                if (req.method === "POST" && pathname === "/api/v1/predictivo/alerta") {
                    this._enforceRbac(req, ["ADMIN_CIT", "SUPERVISOR"]);
                    const body = await this._parseBody(req);
                    const resultado = await this.useCases.predecirAusentismoUseCase.evaluarYEmitirAlertaPreventiva(body);
                    return this._sendJson(res, 201, { ok: true, resultado });
                }

                // 6. Registrar Nuevo Convenio Multifacultad (Exclusivo ADMIN_CIT)
                if (req.method === "POST" && pathname === "/api/v1/convenios") {
                    this._enforceRbac(req, ["ADMIN_CIT"]);
                    const body = await this._parseBody(req);
                    const resultado = await this.useCases.registrarConvenioUseCase.execute(body);
                    return this._sendJson(res, 201, { ok: true, resultado });
                }

                // 7. Marcar Alerta como Atendida por el Supervisor (Exclusivo ADMIN_CIT y SUPERVISOR)
                if (req.method === "POST" && pathname === "/api/v1/alertas/atender") {
                    this._enforceRbac(req, ["ADMIN_CIT", "SUPERVISOR"]);
                    const body = await this._parseBody(req);
                    const resultado = await this.useCases.atenderAlertaUseCase.execute(body.alertaId, body.resolucion);
                    return this._sendJson(res, 200, { ok: true, resultado });
                }

                // 8. Servir archivos estáticos del Frontend
                let filePath = pathname === "/" ? path.join(this.frontendDir, "index.html") : path.join(this.frontendDir, pathname);
                if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                    const ext = path.extname(filePath).toLowerCase();
                    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
                    return fs.createReadStream(filePath).pipe(res);
                }

                return this._sendJson(res, 404, { ok: false, error: `Ruta no encontrada: ${pathname}` });
            } catch (err) {
                return this._sendJson(res, 400, { ok: false, error: err.message });
            }
        });
    }
}

module.exports = { HttpServerAdapter };
