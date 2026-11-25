const fs = require("fs");
const path = require("path");
const { IAsistenciaRepositoryPort } = require("../../domain/ports/OutputPorts");

/**
 * ADAPTADOR SECUNDARIO DE PERSISTENCIA LOCAL / RESPALDO (Repository Pattern):
 * Implementa el puerto IAsistenciaRepositoryPort almacenando en disco (cit_unp_database.json)
 * cuando no se define DATABASE_URL (modo pruebas unitarias o desarrollo sin servidor PostgreSQL).
 */

const INITIAL_SEED = {
    dependencias: [
        { id: "CIT-UNP", nombre: "CIT - Oficina de Tecnologías de la Información", facultad: "Escuela Profesional de Ingeniería Informática", activo: true },
        { id: "FII-UNP", nombre: "Facultad de Ingeniería Industrial — Centro de Cómputo", facultad: "Facultad de Ingeniería Industrial", activo: true },
        { id: "FCA-UNP", nombre: "Facultad de Ciencias Administrativas — Unidad de Sistemas", facultad: "Facultad de Ciencias Administrativas", activo: true },
        { id: "FIM-UNP", nombre: "Facultad de Ingeniería de Minas — Laboratorio de Simulación", facultad: "Facultad de Ingeniería de Minas", activo: true }
    ],
    areasCit: [
        { id: "AREA-DEV", nombre: "Desarrollo de Software y Sistemas Web", supervisor: "Ing. Carlos Alberto Mendoza Ruiz", ubicacion: "CIT - Sede Central OTI - Campus UNP" },
        { id: "AREA-NET", nombre: "Redes, Fibra Óptica y Telecomunicaciones", supervisor: "Ing. Jorge Luis Panta Palacios", ubicacion: "OTI - Nodo Principal / NOC" },
        { id: "AREA-SUP", nombre: "Soporte Técnico y Mantenimiento de Equipos", supervisor: "Ing. María Elena Zapata Chunga", ubicacion: "OTI - Taller de Hardware y Soporte" },
        { id: "AREA-SRV", nombre: "Administración de Servidores y Base de Datos", supervisor: "Mg. Ing. Luis Armando Saavedra Yarleque", ubicacion: "OTI - Data Center Institucional" }
    ],
    practicantes: [
        {
            id: "PRAC-01",
            codigoUnp: "0512021045",
            dni: "73461414",
            nombres: "Arnold Jonatan Alvarado Girón",
            facultadOrigen: "UNP — Facultad de Ingeniería Industrial",
            escuela: "UNP — Ingeniería Informática",
            cicloCondicion: "Egresado / Bachiller",
            direccionDistrito: "Castilla, Piura",
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
            factorPredictivo: "Cumplimiento regular de 38 h semanales y 96.4% de puntualidad",
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
            facultadOrigen: "UNP — Facultad de Ingeniería Industrial",
            escuela: "UNP — Ing. Electrónica y Telecomunicaciones",
            cicloCondicion: "10.° Ciclo",
            direccionDistrito: "Piura",
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
            turnoHoy: "08:00 - 14:00 (Turno Mañana)",
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
            factorPredictivo: "Asistencia continua en horario escalonado sin cruce académico",
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
            facultadOrigen: "SENATI — Zonal Piura Tumbes",
            escuela: "SENATI — Soporte y Mantenimiento de Equipos",
            cicloCondicion: "9.° Ciclo",
            direccionDistrito: "Veintiséis de Octubre, Piura",
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
            turnoHoy: "14:00 - 20:00 (Turno Tarde)",
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
            factorPredictivo: "Retrasos recurrentes en cambio de turno los martes y jueves",
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
            facultadOrigen: "UCV — Universidad César Vallejo (Piura)",
            escuela: "UCV — Ingeniería de Sistemas",
            cicloCondicion: "9.° Ciclo",
            direccionDistrito: "Castilla, Piura",
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
            turnoHoy: "08:00 - 14:00 (Turno Mañana)",
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
            factorPredictivo: "Recurrencia de inasistencias en periodos de evaluación académica",
            fechaInicio: "2026-09-01",
            fechaFinProgramada: "2026-12-15",
            fechaFinProyectada: "2027-01-19",
            telefonoWhatsapp: "+51 921 640 911",
            correo: "kpalaciosc@alumnos.unp.edu.pe",
            promedioEvaluacionActividades: 3.5
        },
        {
            id: "PRAC-05",
            codigoUnp: "0512020064",
            dni: "72891044",
            nombres: "Valeria del Milagro Talledo Morán",
            facultadOrigen: "UTP — Universidad Tecnológica del Perú",
            escuela: "UTP — Ingeniería de Sistemas e Informática",
            cicloCondicion: "Egresado / Bachiller",
            direccionDistrito: "Piura",
            dependenciaId: "CIT-UNP",
            areaId: "AREA-DEV",
            areaNombre: "Desarrollo de Software y Sistemas Web",
            supervisor: "Ing. Carlos Alberto Mendoza Ruiz",
            modalidad: "PROFESIONAL",
            topeDiario: 8,
            topeSemanal: 48,
            horasSemanaActual: 40.0,
            metaHoras: 480,
            horasAcumuladas: 452.0,
            turnoHoy: "08:00 - 16:00",
            horaInicioTurno: "08:00",
            toleranciaMin: 10,
            estadoHoy: "PUNTUAL",
            horaEntradaHoy: "07:58",
            horaSalidaHoy: "16:00",
            indicePuntualidad: 95.0,
            tardanzasMes: 1,
            faltasMes: 0,
            scoreRiesgoAusentismo: 9,
            nivelSemaforo: "VERDE",
            factorPredictivo: "Avance superior al 94% del récord de horas requerido",
            fechaInicio: "2026-08-01",
            fechaFinProgramada: "2026-11-25",
            fechaFinProyectada: "2026-11-20",
            telefonoWhatsapp: "+51 954 339 102",
            correo: "vtalledom@alumnos.unp.edu.pe",
            promedioEvaluacionActividades: 4.8
        },
        {
            id: "PRAC-06",
            codigoUnp: "0512022104",
            dni: "76391820",
            nombres: "Renzo Gabriel Alzamora Requena",
            facultadOrigen: "UNP — Facultad de Ingeniería Industrial",
            escuela: "UNP — Ingeniería Industrial",
            cicloCondicion: "10.° Ciclo",
            direccionDistrito: "Castilla, Piura",
            dependenciaId: "FII-UNP",
            areaId: "AREA-SUP",
            areaNombre: "Soporte Técnico — Centro de Cómputo FII",
            supervisor: "Ing. María Elena Zapata Chunga",
            modalidad: "PREPROFESIONAL",
            topeDiario: 6,
            topeSemanal: 30,
            horasSemanaActual: 22.0,
            metaHoras: 360,
            horasAcumuladas: 244.0,
            turnoHoy: "13:00 - 19:00 (Turno Tarde)",
            horaInicioTurno: "13:00",
            toleranciaMin: 10,
            estadoHoy: "PERMISO_ACADEMICO",
            horaEntradaHoy: "Permiso Justificado",
            horaSalidaHoy: "Recupera Sáb.",
            indicePuntualidad: 89.5,
            tardanzasMes: 2,
            faltasMes: 0,
            scoreRiesgoAusentismo: 28,
            nivelSemaforo: "VERDE",
            factorPredictivo: "Permiso académico autorizado con sesión de recuperación programada",
            fechaInicio: "2026-08-20",
            fechaFinProgramada: "2026-12-18",
            fechaFinProyectada: "2026-12-18",
            telefonoWhatsapp: "+51 981 402 716",
            correo: "ralzamorar@alumnos.unp.edu.pe",
            promedioEvaluacionActividades: 4.6
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
            descripcion: "Implementación de servicios API REST para el despacho automatizado de notificaciones vía WhatsApp y correo institucional en el OTI - UNP.",
            entregable: "Commit #a84f21 en repositorio institucional y pruebas funcionales aprobadas",
            horasSesion: 8.0,
            estadoRevision: "APROBADA",
            calificacion: 5,
            observacionSupervisor: "Conformidad otorgada. Servicios desacoplados y operativos según especificación técnica.",
            supervisor: "Ing. Carlos Alberto Mendoza Ruiz"
        },
        {
            id: "ACT-102",
            fecha: "2026-11-16",
            practicanteId: "PRAC-02",
            practicanteNombre: "Lucía Fernanda Córdova Seminario",
            modalidad: "PREPROFESIONAL",
            areaNombre: "Redes, Fibra Óptica y Telecomunicaciones",
            categoriaTecnica: "REDES_TELECOM",
            descripcion: "Configuración de VLANs segmentadas y diagnóstico de enlaces de fibra óptica entre el CIT y el pabellón de Ingeniería Industrial.",
            entregable: "Informe técnico de latencia y tabla de direccionamiento VLAN #14",
            horasSesion: 6.0,
            estadoRevision: "APROBADA",
            calificacion: 5,
            observacionSupervisor: "Configuración verificada en switch de distribución sin pérdida de paquetes.",
            supervisor: "Ing. Jorge Luis Panta Palacios"
        },
        {
            id: "ACT-103",
            fecha: "2026-11-16",
            practicanteId: "PRAC-03",
            practicanteNombre: "Diego Alejandro Vílchez Valladolid",
            modalidad: "PREPROFESIONAL",
            areaNombre: "Soporte Técnico y Mantenimiento de Equipos",
            categoriaTecnica: "SOPORTE_TECNICO",
            descripcion: "Mantenimiento preventivo, limpieza interna y despliegue de imagen de sistema operativo en 12 estaciones del Laboratorio 02.",
            entregable: "Ficha de atención de incidencias OTI #402 al #413",
            horasSesion: 5.5,
            estadoRevision: "PENDIENTE_REVISION",
            calificacion: 0,
            observacionSupervisor: "Pendiente de validación por el responsable del área de Soporte Técnico.",
            supervisor: "Ing. María Elena Zapata Chunga"
        },
        {
            id: "ACT-104",
            fecha: "2026-11-15",
            practicanteId: "PRAC-04",
            practicanteNombre: "Kevin Alexander Palacios Chiroque",
            modalidad: "PREPROFESIONAL",
            areaNombre: "Administración de Servidores y Base de Datos",
            categoriaTecnica: "SERVIDORES_BD",
            descripcion: "Verificación de respaldos automáticos (pg_dump) de bases de datos académicas en servidor PostgreSQL.",
            entregable: "Reporte de respaldo diario del servidor principal",
            horasSesion: 4.5,
            estadoRevision: "OBSERVADA",
            calificacion: 2,
            observacionSupervisor: "Adjuntar la suma de verificación SHA-256 y la evidencia de prueba de restauración para validar la sesión.",
            supervisor: "Mg. Ing. Luis Armando Saavedra Yarleque"
        },
        {
            id: "ACT-105",
            fecha: "2026-11-16",
            practicanteId: "PRAC-05",
            practicanteNombre: "Valeria del Milagro Talledo Morán",
            modalidad: "PROFESIONAL",
            areaNombre: "Desarrollo de Software y Sistemas Web",
            categoriaTecnica: "DESARROLLO_SOFTWARE",
            descripcion: "Elaboración del módulo de exportación de certificados e informes mensuales de cumplimiento de horas en formato PDF.",
            entregable: "Plantilla institucional validada con registros del OTI - UNP",
            horasSesion: 8.0,
            estadoRevision: "PENDIENTE_REVISION",
            calificacion: 0,
            observacionSupervisor: "Registrada al cierre de jornada. Pendiente de calificación por el supervisor.",
            supervisor: "Ing. Carlos Alberto Mendoza Ruiz"
        }
    ],
    alertas: [
        {
            id: "ALR-901",
            fechaHora: "2026-11-16 14:23:10",
            tipo: "TARDANZA EN TURNO",
            practicante: "Diego Alejandro Vílchez Valladolid",
            area: "Soporte Técnico — OTI UNP",
            canal: "WHATSAPP + CORREO",
            destinatario: "Ing. María Elena Zapata Chunga (+51 968 112 400)",
            mensajeWhatsapp: "*[OTI-UNP · NOTIFICACIÓN DE TARDANZA]*\nSe informa que el practicante *Diego Alejandro Vílchez Valladolid* (Modalidad Preprofesional) registró su ingreso a las *14:23 h* (Inicio de turno: 14:00 h · Retraso: *23 minutos*).\nÁrea asignada: Soporte Técnico y Mantenimiento.",
            asuntoCorreo: "[OTI-UNP] Registro de Tardanza en Turno Tarde — Diego Vílchez Valladolid",
            atendida: true,
            horaAtencion: "14:28"
        },
        {
            id: "ALR-902",
            fechaHora: "2026-11-16 08:30:00",
            tipo: "INASISTENCIA NO JUSTIFICADA",
            practicante: "Kevin Alexander Palacios Chiroque",
            area: "Administración de Servidores y BD — OTI UNP",
            canal: "WHATSAPP + CORREO",
            destinatario: "Mg. Ing. Luis Armando Saavedra Yarleque (lsaavedray@unp.edu.pe)",
            mensajeWhatsapp: "*[OTI-UNP · ALERTA DE INASISTENCIA]*\nEl practicante *Kevin Alexander Palacios Chiroque* no registra marcación de ingreso en el turno programado (*08:00 - 14:00 h*) y no cuenta con solicitud de permiso académico previo.\nIndicador de seguimiento: *Riesgo Crítico de Ausentismo (79%)*.",
            asuntoCorreo: "[OTI-UNP] Notificación de Inasistencia y Seguimiento Horario — Kevin Palacios Chiroque",
            atendida: false,
            horaAtencion: "-"
        },
        {
            id: "ALR-903",
            fechaHora: "2026-11-15 18:15:40",
            tipo: "OBSERVACIÓN DE ACTIVIDAD",
            practicante: "Kevin Alexander Palacios Chiroque",
            area: "Administración de Servidores y BD — OTI UNP",
            canal: "WHATSAPP + CORREO",
            destinatario: "Kevin Palacios Chiroque (+51 921 640 911)",
            mensajeWhatsapp: "*[OTI-UNP · OBSERVACIÓN EN BITÁCORA DE ACTIVIDADES]*\nLa actividad registrada el *15/11/2026* presenta observaciones por parte del supervisor *Mg. Ing. Luis Armando Saavedra Yarleque*.\nDetalle técnico requerido: _Adjuntar la suma de verificación SHA-256 y la evidencia de prueba de restauración para validar la sesión._",
            asuntoCorreo: "[OTI-UNP] Solicitud de Subsanación de Actividad Técnica — Turno 15/11/2026",
            atendida: true,
            horaAtencion: "18:40"
        },
        {
            id: "ALR-904",
            fechaHora: "2026-11-16 16:01:05",
            tipo: "CUMPLIMIENTO DE HORAS (94%)",
            practicante: "Valeria del Milagro Talledo Morán",
            area: "Desarrollo de Software — OTI UNP",
            canal: "WHATSAPP + CORREO",
            destinatario: "Jefatura OTI - UNP / Ing. Carlos Mendoza Ruiz",
            mensajeWhatsapp: "*[OTI-UNP · AVANCE DE CONVENIO DE PRÁCTICAS]*\nLa practicante *Valeria del Milagro Talledo Morán* (Modalidad Profesional) ha completado *452.0 de 480.0 horas* requeridas (*94.2%* de avance).\nFecha estimada de culminación: *20/11/2026*. Se encuentra habilitada la pre-emisión del informe final.",
            asuntoCorreo: "[OTI-UNP] Aviso de Proximidad de Término de Prácticas Profesionales — Valeria Talledo Morán",
            atendida: true,
            horaAtencion: "16:10"
        }
    ],
    metricasAnexo05: [
        {
            documento: "Registro de asistencia de practicantes (OTI - UNP)",
            indicador: "Porcentaje de registros con errores u omisiones de marcación al mes (%)",
            periodo: "Evaluación Comparativa",
            valorAntes: "28.4 % (Registro Físico)",
            valorDespues: "1.2 % (Plataforma SICA-OTI)",
            mejora: "-95.8 % en errores"
        },
        {
            documento: "Reporte de incidencias horarias en unidades del CIT",
            indicador: "N.° promedio de tardanzas e inasistencias no reportadas a tiempo por mes",
            periodo: "Evaluación Comparativa",
            valorAntes: "19.5 incidencias/mes",
            valorDespues: "2.0 incidencias/mes",
            mejora: "-89.7 % en incidencias"
        },
        {
            documento: "Informe mensual de horas acumuladas y actividades",
            indicador: "Tiempo promedio (minutos) para consolidar el récord mensual y validar actividades",
            periodo: "Evaluación Comparativa",
            valorAntes: "240.0 min (4 horas)",
            valorDespues: "3.5 min (Automatizado)",
            mejora: "-98.5 % en tiempo"
        },
        {
            documento: "Bitácora del servicio de notificaciones institucionales",
            indicador: "Alertas automáticas y preventivas generadas y atendidas oportunamente (%)",
            periodo: "Evaluación Comparativa",
            valorAntes: "0.0 % (Sin cobertura)",
            valorDespues: "94.6 % atendidas",
            mejora: "+94.6 % de atención"
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
            id: datosPracticante.id || `PRAC-0${db.practicantes.length + 1}`,
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

    async marcarAlertaAtendida(alertaId, horaAtencion, resolucionSupervisor = null) {
        const db = this._readDb();
        const alerta = db.alertas.find(a => a.id === alertaId);
        if (!alerta) {
            throw new Error(`Alerta ${alertaId} no encontrada.`);
        }
        alerta.atendida = true;
        alerta.horaAtencion = horaAtencion;
        if (resolucionSupervisor) {
            alerta.resolucionSupervisor = resolucionSupervisor;
        }
        this._writeDb(db);
        return alerta;
    }
}

module.exports = { JsonPersistenceRepository, INITIAL_SEED };
