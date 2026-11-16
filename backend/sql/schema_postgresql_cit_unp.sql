-- =============================================================================
-- ESQUEMA RELACIONAL POSTGRESQL (3FN) - SICA CIT-UNP
-- Proyecto: Sistema Inteligente de Control de Asistencia con Alertas Automatizadas
--           para la Gestión de Prácticas Preprofesionales y Profesionales en el CIT - UNP
-- Tesista:  Bach. Arnold Jonatan Alvarado Girón
-- =============================================================================

CREATE TABLE IF NOT EXISTS facultad_dependencia (
    id SERIAL PRIMARY KEY,
    codigo_unp VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    facultad VARCHAR(150) NOT NULL,
    tipo VARCHAR(30) NOT NULL DEFAULT 'CENTRO_OPERATIVO',
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS usuario (
    id SERIAL PRIMARY KEY,
    facultad_origen_id INTEGER REFERENCES facultad_dependencia(id),
    dni VARCHAR(8) UNIQUE NOT NULL,
    codigo_universitario VARCHAR(15) UNIQUE,
    nombres_apellidos VARCHAR(150) NOT NULL,
    correo_institucional VARCHAR(120) UNIQUE NOT NULL,
    telefono_whatsapp VARCHAR(25) NOT NULL,
    rol VARCHAR(25) NOT NULL CHECK (rol IN ('ADMIN_CIT', 'SUPERVISOR', 'PRACTICANTE')),
    password_hash VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS area_operativa (
    id SERIAL PRIMARY KEY,
    codigo_area VARCHAR(20) UNIQUE NOT NULL,
    dependencia_id INTEGER NOT NULL REFERENCES facultad_dependencia(id),
    supervisor_id INTEGER REFERENCES usuario(id),
    nombre VARCHAR(120) NOT NULL,
    ubicacion VARCHAR(150)
);

CREATE TABLE IF NOT EXISTS convenio_practica (
    id SERIAL PRIMARY KEY,
    codigo_convenio VARCHAR(20) UNIQUE NOT NULL,
    practicante_id INTEGER NOT NULL REFERENCES usuario(id),
    area_operativa_id INTEGER NOT NULL REFERENCES area_operativa(id),
    modalidad VARCHAR(20) NOT NULL CHECK (modalidad IN ('PREPROFESIONAL', 'PROFESIONAL')),
    tope_horas_diarias INTEGER NOT NULL DEFAULT 6,
    tope_horas_semanales INTEGER NOT NULL DEFAULT 30,
    meta_horas_totales NUMERIC(6,2) NOT NULL DEFAULT 360.00,
    horas_acumuladas NUMERIC(6,2) NOT NULL DEFAULT 0.00,
    fecha_inicio DATE NOT NULL,
    fecha_fin_programada DATE NOT NULL,
    fecha_fin_proyectada_ia DATE,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
);

CREATE TABLE IF NOT EXISTS horario_escalonado (
    id SERIAL PRIMARY KEY,
    convenio_id INTEGER NOT NULL REFERENCES convenio_practica(id),
    dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 1 AND 6),
    hora_entrada TIME NOT NULL,
    hora_salida TIME NOT NULL,
    tolerancia_minutos INTEGER NOT NULL DEFAULT 10,
    turno_descripcion VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS registro_asistencia (
    id SERIAL PRIMARY KEY,
    convenio_id INTEGER NOT NULL REFERENCES convenio_practica(id),
    horario_id INTEGER REFERENCES horario_escalonado(id),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    hora_marcacion_entrada TIMESTAMP,
    hora_marcacion_salida TIMESTAMP,
    minutos_tardanza INTEGER DEFAULT 0,
    horas_efectivas_sesion NUMERIC(4,2) DEFAULT 0.00,
    estado_asistencia VARCHAR(30) NOT NULL CHECK (estado_asistencia IN ('PUNTUAL', 'TARDANZA', 'FALTA_INJUSTIFICADA', 'PERMISO_ACADEMICO', 'RECUPERACION')),
    ip_registro VARCHAR(45)
);

CREATE TABLE IF NOT EXISTS actividad_practica (
    id SERIAL PRIMARY KEY,
    codigo_actividad VARCHAR(20) UNIQUE NOT NULL,
    registro_asistencia_id INTEGER NOT NULL REFERENCES registro_asistencia(id),
    supervisor_evaluador_id INTEGER REFERENCES usuario(id),
    categoria_tecnica VARCHAR(40) NOT NULL CHECK (categoria_tecnica IN ('DESARROLLO_SOFTWARE', 'REDES_TELECOM', 'SOPORTE_TECNICO', 'SERVIDORES_BD')),
    descripcion_actividad TEXT NOT NULL,
    entregable_evidencia VARCHAR(250),
    estado_revision VARCHAR(25) NOT NULL DEFAULT 'PENDIENTE_REVISION' CHECK (estado_revision IN ('PENDIENTE_REVISION', 'APROBADA', 'OBSERVADA')),
    calificacion_desempeno INTEGER DEFAULT 0 CHECK (calificacion_desempeno BETWEEN 0 AND 5),
    observacion_supervisor TEXT,
    fecha_evaluacion TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerta_automatizada (
    id SERIAL PRIMARY KEY,
    codigo_alerta VARCHAR(20) UNIQUE NOT NULL,
    convenio_id INTEGER NOT NULL REFERENCES convenio_practica(id),
    registro_asistencia_id INTEGER REFERENCES registro_asistencia(id),
    tipo_alerta VARCHAR(35) NOT NULL,
    canal_envio VARCHAR(30) NOT NULL DEFAULT 'WHATSAPP + CORREO',
    destinatario_contacto VARCHAR(150) NOT NULL,
    mensaje_emitido TEXT NOT NULL,
    fecha_envio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atendida_por_supervisor BOOLEAN DEFAULT FALSE,
    fecha_atencion TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prediccion_ausentismo (
    id SERIAL PRIMARY KEY,
    convenio_id INTEGER NOT NULL REFERENCES convenio_practica(id),
    fecha_evaluacion DATE NOT NULL DEFAULT CURRENT_DATE,
    indice_puntualidad NUMERIC(5,2) NOT NULL,
    tasa_ausentismo_mensual NUMERIC(5,2) NOT NULL,
    probabilidad_riesgo NUMERIC(5,2) NOT NULL,
    nivel_semaforo VARCHAR(20) NOT NULL CHECK (nivel_semaforo IN ('VERDE', 'AMBAR', 'ROJO')),
    factor_principal VARCHAR(255),
    fecha_termino_proyectada DATE
);
