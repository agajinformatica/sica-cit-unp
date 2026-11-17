# Manual Técnico del Programador — SICA CIT-UNP

> **Proyecto:** Sistema Inteligente de Control de Asistencia con Alertas Automatizadas para la Gestión de Prácticas Preprofesionales y Profesionales en el Centro de Informática y Telecomunicaciones de la Universidad Nacional de Piura (CIT - UNP)  
> **Autor / Tesista:** Bach. Arnold Jonatan Alvarado Girón (`agaj.informatica@gmail.com`)  
> **Escuela Profesional:** Ingeniería Informática — Facultad de Ingeniería Industrial (UNP)  
> **Versión de Arquitectura:** `1.1.0` (Arquitectura Hexagonal + PostgreSQL + UI Responsiva)

---

## 1. Índice de la Documentación para el Programador

1. **[00_INDICE_Y_GUIA_RAPIDA_DESARROLLADOR.md](./00_INDICE_Y_GUIA_RAPIDA_DESARROLLADOR.md)** *(Este documento)*  
   Requisitos del entorno, árbol de archivos del proyecto, instalación rápida, variables de entorno y ejecución de pruebas.
2. **[01_ARQUITECTURA_HEXAGONAL_Y_CAPAS_BACKEND.md](./01_ARQUITECTURA_HEXAGONAL_Y_CAPAS_BACKEND.md)**  
   Detalle del código del Backend: *Composition Root*, Capa de Dominio (*Strategy*, *PredictorAusentismoService*, Puertos), Casos de Uso de Aplicación y Adaptadores de Infraestructura.
3. **[02_REFERENCIA_API_REST_Y_SEGURIDAD_RBAC.md](./02_REFERENCIA_API_REST_Y_SEGURIDAD_RBAC.md)**  
   Especificación técnica de los endpoints HTTP REST (`/api/v1/...`), cabeceras de autorización por rol (`X-User-Role`), estructuras JSON de entrada/salida y ejemplos con `curl`.
4. **[03_MODELO_DATOS_POSTGRESQL_Y_PERSISTENCIA.md](./03_MODELO_DATOS_POSTGRESQL_Y_PERSISTENCIA.md)**  
   Funcionamiento del adaptador `PostgresRepositoryAdapter`, auto-migración SQL, tablas operativas, esquema relacional en 3FN (`schema_postgresql_cit_unp.sql`) y respaldo local JSON.
5. **[04_ARQUITECTURA_FRONTEND_RBAC_Y_RESPONSIVE.md](./04_ARQUITECTURA_FRONTEND_RBAC_Y_RESPONSIVE.md)**  
   Estructura del Frontend SPA (`index.html`, `styles.css`, `app.js`), control de vistas por rol RBAC, hidratación desde PostgreSQL, validaciones en-aplicación y diseño responsivo para celulares y tablets.
6. **[05_DESPLIEGUE_GITHUB_RAILWAY_Y_HOJA_DE_RUTA.md](./05_DESPLIEGUE_GITHUB_RAILWAY_Y_HOJA_DE_RUTA.md)**  
   Configuración de producción en GitHub y Railway (Node.js + servicio PostgreSQL), comandos de despliegue CLI y hoja de ruta técnica (backlog pendiente).

---

## 2. Árbol de Directorios de lo Construido

```text
SISTEMA_ASISTENCIA_CIT_UNP/
├── package.json                                  # Manifiesto raíz (Node >= 18, dependencia 'pg', scripts start/test)
├── Procfile                                      # Comando de arranque para Railway (web: node backend/src/main.js)
├── railway.json                                  # Configuración de despliegue y healthcheck (/api/v1/health)
├── README.md                                     # Resumen general del repositorio
├── DOCUMENTACION_PROGRAMADOR/                    # Documentación técnica completa para el desarrollador
│   ├── 00_INDICE_Y_GUIA_RAPIDA_DESARROLLADOR.md
│   ├── 01_ARQUITECTURA_HEXAGONAL_Y_CAPAS_BACKEND.md
│   ├── 02_REFERENCIA_API_REST_Y_SEGURIDAD_RBAC.md
│   ├── 03_MODELO_DATOS_POSTGRESQL_Y_PERSISTENCIA.md
│   ├── 04_ARQUITECTURA_FRONTEND_RBAC_Y_RESPONSIVE.md
│   └── 05_DESPLIEGUE_GITHUB_RAILWAY_Y_HOJA_DE_RUTA.md
├── backend/
│   ├── package.json                              # Manifiesto del módulo backend
│   ├── data/
│   │   └── cit_unp_database.json                 # Base de datos local de respaldo (cuando no hay DATABASE_URL)
│   ├── sql/
│   │   └── schema_postgresql_cit_unp.sql         # DDL del modelo relacional normalizado en 3FN (9 tablas)
│   ├── src/
│   │   ├── main.js                               # Composition Root: Inyección de dependencias y arranque HTTP
│   │   ├── domain/                               # CAPA DE DOMINIO (Reglas de negocio puras, 0 dependencias externas)
│   │   │   ├── ports/
│   │   │   │   └── OutputPorts.js                # Interfaces IAsistenciaRepositoryPort e INotificationAlertPort
│   │   │   ├── services/
│   │   │   │   └── PredictorAusentismoService.js # Clasificador de puntualidad y modelo predictivo de ausentismo
│   │   │   └── strategies/
│   │   │       └── ModalidadHorarioStrategy.js   # Patrón Strategy para topes de Ley N.° 28518 (30h vs. 48h)
│   │   ├── application/                          # CAPA DE APLICACIÓN (Casos de Uso orquestadores)
│   │   │   └── use-cases/
│   │   │       ├── RegistrarMarcacionUseCase.js  # Entrada, salida, tope semanal, bitácora y alertas por tardanza/meta
│   │   │       ├── EvaluarActividadUseCase.js    # Calificación 1-5 por supervisor y alerta por actividad observada
│   │   │       └── GestionarConveniosYAlertasUseCase.js # Predicción IA, alta de practicante/convenio y atención de alerta
│   │   └── infrastructure/                       # CAPA DE INFRAESTRUCTURA (Adaptadores Primarios y Secundarios)
│   │       ├── http/
│   │       │   └── HttpServerAdapter.js          # Servidor HTTP + API REST (/api/v1/...) + Servidor de estáticos
│   │       ├── notifications/
│   │       │   └── MultiChannelNotificationAdapter.js # Despachador compuesto WhatsApp + Correo Institucional SMTP
│   │       └── persistence/
│   │           ├── PostgresRepositoryAdapter.js  # Adaptador PostgreSQL (Pool 'pg', auto-migración y semilla)
│   │           └── JsonPersistenceRepository.js  # Adaptador local en disco (paridad de contrato con PostgreSQL)
│   └── tests/
│       └── hexagonal.test.js                     # Suite de pruebas unitarias y de integración (node:test)
└── frontend/
    ├── index.html                                # Interfaz SPA (Portal Login + Sidebar Off-Canvas + 7 Vistas + Modales)
    ├── assets/
    │   ├── logo_unp.png                          # Escudo oficial de la Universidad Nacional de Piura
    │   └── logo_fii_unp.png                      # Emblema oficial de la Facultad de Ingeniería Industrial / EPII
    ├── css/
    │   └── styles.css                            # Sistema de diseño institucional UNP y media queries responsivas
    └── js/
        ├── mockDataCitUnp.js                     # Estado base en memoria y métricas operativas del CIT - UNP
        └── app.js                                # Controlador Frontend, RBAC, sincronización API/PostgreSQL y UI
```

---

## 3. Requisitos e Instalación Rápida para Desarrollo Local

### 3.1. Prerrequisitos
* **Node.js:** `v18.0.0` o superior (probado en `v18.20.8` en Railway y `v26.x` en entorno local).
* **PostgreSQL:** `v15` o superior (opcional en modo desarrollo local gracias al fallback automático a `JsonPersistenceRepository`; activo por defecto en producción cuando se define `DATABASE_URL`).
* **Git:** `v2.30+`.

### 3.2. Clonación y Puesta en Marcha

```bash
# 1. Clonar el repositorio oficial
git clone https://github.com/agajinformatica/sica-cit-unp.git
cd sica-cit-unp

# 2. Instalar dependencias (driver PostgreSQL 'pg')
npm install

# 3. Ejecutar la suite de pruebas unitarias e integración hexagonal
npm test

# 4A. Iniciar en modo local (con persistencia JSON automática si no se define DATABASE_URL)
npm start

# 4B. Iniciar conectado a una base de datos PostgreSQL local o remota
DATABASE_URL="postgresql://usuario:password@localhost:5432/sica_cit_unp" PORT=3000 npm start
```

---

## 4. Variables de Entorno Soportadas

| Variable | Valor por Defecto | Descripción Técnica |
| :--- | :--- | :--- |
| `PORT` | `3000` (`8080` en Railway) | Puerto TCP en el que escucha `HttpServerAdapter`. |
| `HOST` | `0.0.0.0` | Interfaz de red de escucha del servidor HTTP. |
| `DATABASE_URL` | *(No definido)* | Cadena de conexión PostgreSQL (`postgresql://user:pass@host:port/db`). Si está presente, `buildContainer()` en `backend/src/main.js` inyecta automáticamente `PostgresRepositoryAdapter`, crea las tablas si no existen e inserta la semilla inicial del CIT - UNP. |

---

## 5. Cuentas de Prueba Preconfiguradas (Control de Acceso RBAC)

| Perfil Institucional | Usuario / Código UNP | Contraseña | Rol RBAC | Vistas Autorizadas |
| :--- | :--- | :--- | :--- | :--- |
| **Jefatura / Administración CIT** | `lsaavedray@unp.edu.pe` *(o `admin`)* | `admin2026` | `ADMIN_CIT` | Las 7 vistas completas + Alta de practicantes + Indicadores gerenciales |
| **Supervisor de Área (Desarrollo)** | `cmendozar@unp.edu.pe` *(o `supervisor`)* | `sup2026` | `SUPERVISOR` | Dashboard, Supervisión de Actividades (Calificar), Alertas (Confirmar), Predictivo y Reportes |
| **Supervisor de Área (Redes)** | `jpantap@unp.edu.pe` | `sup2026` | `SUPERVISOR` | Dashboard, Supervisión de Actividades, Alertas, Predictivo y Reportes |
| **Supervisor de Área (Soporte)** | `mzapatac@unp.edu.pe` | `sup2026` | `SUPERVISOR` | Dashboard, Supervisión de Actividades, Alertas, Predictivo y Reportes |
| **Practicante Profesional** | `0512021045` *(Arnold Alvarado)* | `73461414` *(DNI)* | `PRACTICANTE` | Mi Asistencia y Bitácora, Mis Actividades (Solo lectura), Mis Notificaciones, Mi Constancia |
| **Cualquier nuevo practicante** | Su `Código Universitario UNP` | Su `N.° de DNI` | `PRACTICANTE` | Acceso inmediato tras ser registrado en el módulo *Practicantes y Convenios* |
