const fs = require("fs");
const path = require("path");
const { IAsistenciaRepositoryPort } = require("../../domain/ports/OutputPorts");

/**
 * ADAPTADOR SECUNDARIO DE PERSISTENCIA (Repository Pattern):
 * Implementa el puerto IAsistenciaRepositoryPort almacenando de forma persistente
 * en disco (cit_unp_database.json) y manteniendo paridad estructural con PostgreSQL.
 */

const INITIAL_SEED = {
    dependencias: [
        { id: "CIT-UNP", nombre: "CIT - Centro de Informática y Telecomunicaciones (Sede Piloto)", facultad: "Escuela Prof. de Ingeniería Informática", activo: true },
        { id: "FII-UNP", nombre: "Facultad de Ingeniería Industrial - Laboratorios de Cómputo", facultad: "Facultad de Ingeniería Industrial", activo: true },
        { id: "FCA-UNP", nombre: "Facultad de Ciencias Administrativas (Proyección)", facultad: "Facultad de Ciencias Administrativas", activo: true },
        { id: "FIM-UNP", nombre: "Facultad de Ingeniería de Minas (Proyección)", facultad: "Facultad de Ingeniería de Minas", activo: true }
    ],
    areasCit: [
        { id: "AREA-DEV", nombre: "Desarrollo de Software y Sistemas Web", supervisor: "Ing. Carlos Alberto Mendoza Ruiz", ubicacion: "CIT - Pabellón Central 2do Piso" },
        { id: "AREA-NET", nombre: "Redes, Fibra Óptica y Telecomunicaciones", supervisor: "Ing. Jorge Luis Panta Palacios", ubicacion: "CIT - Nodo Principal / NOC" },
        { id: "AREA-SUP", nombre: "Soporte Técnico y Mantenimiento de Equipos", supervisor: "Ing. María Elena Zapata Chunga", ubicacion: "CIT - Taller de Hardware y Labs" },
        { id: "AREA-SRV", nombre: "Administración de Servidores y Base de Datos", supervisor: "Mg. Ing. Luis Armando Saavedra Yarleque", ubicacion: "CIT - Data Center Institucional" }
    ],
    practicantes: [
        {
            id: "PRAC-01",
            codigoUnp: "0512021045",
            dni: "73461414",
            nombres: "Arnold Jonatan Alvarado Girón",
            escuela: "Ingeniería Informática",
            dependenciaId: "CIT-UNP",
            areaId: "AREA-DEV",
            areaNombre: "Desarrollo de Software y Sistemas Web",
            supervisor: "Ing. Carlos Alberto Mendoza Ruiz",
            modalidad: "PROFESIONAL",
            topeDiario: 8,
            topeSemanal: 48,
            horasSemanaActual: 38.0,
            metaHoras: 480,
            horasAcumuladas: 438.5,
            turnoHoy: "08:00 - 16:00",
            horaInicioTurno: "08:00",
            toleranciaMin: 10,
            estadoHoy: "PUNTUAL",
            horaEntradaHoy: "07:56",
            horaSalidaHoy: "16:02",
            indicePuntualidad: 96.4,
            tardanzasMes: 1,
            faltasMes: 0,
            scoreRiesgoAusentismo: 12,
            nivelSemaforo: "VERDE",
            factorPredictivo: "Ritmo constante (38 h/sem) y 96.4% de puntualidad",
            fechaInicio: "2026-08-01",
            fechaFinProgramada: "2026-11-30",
            fechaFinProyectada: "2026-11-24",
            telefonoWhatsapp: "+51 968 412 390",
            correo: "aalvaradog@alumnos.unp.edu.pe",
            promedioEvaluacionActividades: 4.9
        },
        {
            id: "PRAC-02",
            codigoUnp: "0512022018",
            dni: "75812034",
            nombres: "Lucía Fernanda Córdova Seminario",
            escuela: "Ingeniería Informática",
            dependenciaId: "CIT-UNP",
            areaId: "AREA-NET",
            areaNombre: "Redes, Fibra Óptica y Telecomunicaciones",
            supervisor: "Ing. Jorge Luis Panta Palacios",
            modalidad: "PREPROFESIONAL",
            topeDiario: 6,
            topeSemanal: 30,
            horasSemanaActual: 24.0,
            metaHoras: 360,
            horasAcumuladas: 282.0,
            turnoHoy: "08:00 - 14:00 (Escalonado Mañana)",
            horaInicioTurno: "08:00",
            toleranciaMin: 10,
            estadoHoy: "PUNTUAL",
            horaEntradaHoy: "08:04",
            horaSalidaHoy: "14:05",
            indicePuntualidad: 92.0,
            tardanzasMes: 2,
            faltasMes: 0,
            scoreRiesgoAusentismo: 21,
            nivelSemaforo: "VERDE",
            factorPredictivo: "Cumple horario escalonado sin cruce académico",
            fechaInicio: "2026-08-15",
            fechaFinProgramada: "2026-12-10",
            fechaFinProyectada: "2026-12-06",
            telefonoWhatsapp: "+51 973 210 845",
            correo: "lcordovas@alumnos.unp.edu.pe",
            promedioEvaluacionActividades: 4.7
        },
        {
            id: "PRAC-03",
            codigoUnp: "0512022089",
            dni: "76109482",
            nombres: "Diego Alejandro Vílchez Valladolid",
            escuela: "Ingeniería Informática",
            dependenciaId: "CIT-UNP",
            areaId: "AREA-SUP",
            areaNombre: "Soporte Técnico y Mantenimiento de Equipos",
            supervisor: "Ing. María Elena Zapata Chunga",
            modalidad: "PREPROFESIONAL",
            topeDiario: 6,
            topeSemanal: 30,
            horasSemanaActual: 18.5,
            metaHoras: 360,
            horasAcumuladas: 210.0,
            turnoHoy: "14:00 - 20:00 (Escalonado Tarde)",
            horaInicioTurno: "14:00",
            toleranciaMin: 10,
            estadoHoy: "TARDANZA",
            horaEntradaHoy: "14:23",
            horaSalidaHoy: "En turno",
            indicePuntualidad: 78.5,
            tardanzasMes: 5,
            faltasMes: 1,
            scoreRiesgoAusentismo: 54,
            nivelSemaforo: "AMBAR",
            factorPredictivo: "Cruce con laboratorios de 9no ciclo los martes y jueves",
            fechaInicio: "2026-09-01",
            fechaFinProgramada: "2026-12-20",
            fechaFinProyectada: "2027-01-04",
            telefonoWhatsapp: "+51 945 881 203",
            correo: "dvilchezv@alumnos.unp.edu.pe",
            promedioEvaluacionActividades: 4.1
        },
        {
            id: "PRAC-04",
            codigoUnp: "0512021092",
            dni: "74920115",
            nombres: "Kevin Alexander Palacios Chiroque",
            escuela: "Ingeniería Informática",
            dependenciaId: "CIT-UNP",
            areaId: "AREA-SRV",
            areaNombre: "Administración de Servidores y Base de Datos",
            supervisor: "Mg. Ing. Luis Armando Saavedra Yarleque",
            modalidad: "PREPROFESIONAL",
            topeDiario: 6,
            topeSemanal: 30,
            horasSemanaActual: 14.0,
            metaHoras: 360,
            horasAcumuladas: 165.0,
            turnoHoy: "08:00 - 14:00 (Escalonado Mañana)",
            horaInicioTurno: "08:00",
            toleranciaMin: 10,
            estadoHoy: "FALTA_INJUSTIFICADA",
            horaEntradaHoy: "--:--",
            horaSalidaHoy: "--:--",
            indicePuntualidad: 64.0,
            tardanzasMes: 7,
            faltasMes: 3,
            scoreRiesgoAusentismo: 79,
            nivelSemaforo: "ROJO",
            factorPredictivo: "Alta recurrencia de ausencias en semanas de exámenes parciales",
            fechaInicio: "2026-09-01",
            fechaFinProgramada: "2026-12-15",
            fechaFinProyectada: "2027-01-19",
            telefonoWhatsapp: "+51 921 640 911",
            correo: "kpalaciosc@alumnos.unp.edu.pe",
            promedioEvaluacionActividades: 3.5
        }
    ],
    actividades: [
        {
            id: "ACT-101",
            fecha: "2026-11-16",
            practicanteId: "PRAC-01",
            practicanteNombre: "Arnold Jonatan Alvarado Girón",
            modalidad: "PROFESIONAL",
            areaNombre: "Desarrollo de Software y Sistemas Web",
            categoriaTecnica: "DESARROLLO_SOFTWARE",
            descripcion: "Implementación de Arquitectura Hexagonal (Puertos y Adaptadores) para el servicio de alertas automáticas vía WhatsApp y SMTP en el CIT - UNP.",
            entregable: "Commit #a84f21 en repositorio Git institucional + Pruebas unitarias aprobadas",
            horasSesion: 8.0,
            estadoRevision: "APROBADA",
            calificacion: 5,
            observacionSupervisor: "Excelente desacoplamiento de los adaptadores secundarios y cumplimiento de principios SOLID.",
            supervisor: "Ing. Carlos Alberto Mendoza Ruiz"
        },
        {
            id: "ACT-103",
            fecha: "2026-11-16",
            practicanteId: "PRAC-03",
            practicanteNombre: "Diego Alejandro Vílchez Valladolid",
            modalidad: "PREPROFESIONAL",
            areaNombre: "Soporte Técnico y Mantenimiento de Equipos",
            categoriaTecnica: "SOPORTE_TECNICO",
            descripcion: "Mantenimiento preventivo, limpieza interna y clonación de imágenes de sistema operativo en 12 estaciones del Laboratorio 02.",
            entregable: "Ficha de atención de tickets CIT #402 al #413",
            horasSesion: 5.5,
            estadoRevision: "PENDIENTE_REVISION",
            calificacion: 0,
            observacionSupervisor: "Pendiente de evaluación por el supervisor del turno tarde.",
            supervisor: "Ing. María Elena Zapata Chunga"
        }
    ],
    alertas: [
        {
            id: "ALR-901",
            fechaHora: "2026-11-16 14:23:10",
            tipo: "TARDANZA",
            practicante: "Diego Alejandro Vílchez Valladolid",
            area: "Soporte Técnico - CIT UNP",
            canal: "WHATSAPP + CORREO",
            destinatario: "Ing. María Elena Zapata Chunga (+51 968 112 400)",
            mensajeWhatsapp: "*[CIT-UNP · ALERTA DE TARDANZA]*\nEl practicante *Diego Alejandro Vílchez Valladolid* (Preprofesional - Ing. Informática) registró su ingreso a las *14:23* (Turno: 14:00, Retraso: *23 min*).\nUnidad: Soporte Técnico CIT.",
            asuntoCorreo: "[CIT-UNP] Notificación Automática de Tardanza - Diego Vílchez Valladolid",
            atendida: true,
            horaAtencion: "14:28"
        },
        {
            id: "ALR-902",
            fechaHora: "2026-11-16 08:30:00",
            tipo: "INASISTENCIA",
            practicante: "Kevin Alexander Palacios Chiroque",
            area: "Servidores y BD - CIT UNP",
            canal: "WHATSAPP + CORREO",
            destinatario: "Mg. Ing. Luis Armando Saavedra Yarleque (lsaavedray@unp.edu.pe)",
            mensajeWhatsapp: "*[CIT-UNP · ALERTA DE INASISTENCIA]*\nEl practicante *Kevin Alexander Palacios Chiroque* no registró marcación de entrada en su turno programado (*08:00 - 14:00*) y no cuenta con permiso académico registrado.\nNivel Predictivo: *ROJO (Riesgo Crítico 79%)*.",
            asuntoCorreo: "[CIT-UNP URGENTE] Inasistencia Injustificada y Alerta Predictiva Roja - Kevin Palacios",
            atendida: false,
            horaAtencion: "-"
        }
    ]
};

class JsonPersistenceRepository extends IAsistenciaRepositoryPort {
    constructor(filePath = null) {
        super();
        const dataDir = path.join(__dirname, "../../../data");
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        this.dbPath = filePath || path.join(dataDir, "cit_unp_database.json");
        if (!fs.existsSync(this.dbPath)) {
            fs.writeFileSync(this.dbPath, JSON.stringify(INITIAL_SEED, null, 2), "utf-8");
        }
    }

    _readDb() {
        return JSON.parse(fs.readFileSync(this.dbPath, "utf-8"));
    }

    _writeDb(data) {
        fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), "utf-8");
    }

    async obtenerEstadoCompleto() {
        return this._readDb();
    }

    async obtenerPracticantePorId(id) {
        const db = this._readDb();
        return db.practicantes.find(p => p.id === id) || null;
    }

    async actualizarPracticante(practicanteActualizado) {
        const db = this._readDb();
        const idx = db.practicantes.findIndex(p => p.id === practicanteActualizado.id);
        if (idx !== -1) {
            db.practicantes[idx] = practicanteActualizado;
            this._writeDb(db);
        }
        return practicanteActualizado;
    }

    async crearPracticante(datosPracticante) {
        const db = this._readDb();
        const nuevo = {
            id: `PRAC-0${db.practicantes.length + 1}`,
            ...datosPracticante
        };
        db.practicantes.unshift(nuevo);
        this._writeDb(db);
        return nuevo;
    }

    async guardarActividad(datosActividad) {
        const db = this._readDb();
        const nueva = {
            id: datosActividad.id || `ACT-${Math.floor(200 + Math.random() * 799)}`,
            ...datosActividad
        };
        db.actividades.unshift(nueva);
        this._writeDb(db);
        return nueva;
    }

    async obtenerActividadPorId(id) {
        const db = this._readDb();
        return db.actividades.find(a => a.id === id) || null;
    }

    async actualizarActividad(actividadActualizada) {
        const db = this._readDb();
        const idx = db.actividades.findIndex(a => a.id === actividadActualizada.id);
        if (idx !== -1) {
            db.actividades[idx] = actividadActualizada;
            this._writeDb(db);
        }
        return actividadActualizada;
    }

    async listarActividadesPorPracticante(practicanteId) {
        const db = this._readDb();
        return db.actividades.filter(a => a.practicanteId === practicanteId);
    }

    async guardarAlerta(alerta) {
        const db = this._readDb();
        db.alertas.unshift(alerta);
        this._writeDb(db);
        return alerta;
    }

    async marcarAlertaAtendida(alertaId, horaAtencion) {
        const db = this._readDb();
        const alerta = db.alertas.find(a => a.id === alertaId);
        if (!alerta) {
            throw new Error(`Alerta ${alertaId} no encontrada.`);
        }
        alerta.atendida = true;
        alerta.horaAtencion = horaAtencion;
        this._writeDb(db);
        return alerta;
    }
}

module.exports = { JsonPersistenceRepository, INITIAL_SEED };
