# SICA - CIT UNP | Sistema Inteligente de Control de Asistencia y Evaluación de Prácticas

**Tesis de Ingeniería Informática – Universidad Nacional de Piura (UNP)**
**Tesista:** Bach. Arnold Jonatan Alvarado Girón
**Asesor:** Mg. Ing. Luis Armando Saavedra Yarleque

---

## 1. Arquitectura del Software (Arquitectura Hexagonal + SOLID)

El proyecto está dividido en dos módulos desacoplados:
* `frontend/`: Aplicación Web Interactiva (HTML5 + Bootstrap 5.3 + Iconografía Vectorial Fina **Lucide 1.65px** + Paleta Institucional Sobria UNP).
* `backend/`: Servidor API REST en **Node.js** estructurado bajo **Arquitectura Hexagonal (Puertos y Adaptadores)**:
  * `src/domain/`: Estrategias de validación horaria de la **Ley N.° 28518** (`ModalidadPreprofesionalStrategy` 30h/sem vs. `ModalidadProfesionalStrategy` 48h/sem), Servicio Predictivo de Ausentismo (`PredictorAusentismoService`) y Puertos de Salida (`OutputPorts.js`).
  * `src/application/`: Casos de Uso (`RegistrarMarcacionUseCase`, `EvaluarActividadUseCase`, `PredecirAusentismoUseCase`, `RegistrarConvenioUseCase`, `AtenderAlertaUseCase`).
  * `src/infrastructure/`: Adaptadores Secundarios de Persistencia (`JsonPersistenceRepository` y `PostgresRepositoryAdapter`), Adaptador Compuesto de Notificaciones (`MultiChannelNotificationAdapter`: WhatsApp + Correo SMTP) y Adaptador Primario HTTP (`HttpServerAdapter`).

---

## 2. Ejecución Rápida

### A. Ejecutar Pruebas Unitarias y de Integración del Dominio Hexagonal
```bash
cd backend
node --test tests/hexagonal.test.js
```

### B. Iniciar el Servidor Backend + Frontend Integrado (`http://localhost:3000`)
```bash
cd backend
node src/main.js
```
Luego abre `http://localhost:3000` en tu navegador (o abre directamente `frontend/index.html`).
