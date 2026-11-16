const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { buildContainer } = require("../src/main");
const { ModalidadStrategyFactory } = require("../src/domain/strategies/ModalidadHorarioStrategy");
const { PredictorAusentismoService } = require("../src/domain/services/PredictorAusentismoService");

/**
 * SUITE DE PRUEBAS UNITARIAS Y DE INTEGRACIÓN HEXAGONAL
 * Valida las reglas de negocio del Dominio (Ley N.° 28518, tardanzas, predicción IA)
 * y los Casos de Uso de Aplicación del CIT - UNP.
 */

test("1. Patrón Strategy valida correctamente topes de Ley N.° 28518 (30h Preprofesional vs 48h Profesional)", () => {
    const stratPre = ModalidadStrategyFactory.obtenerEstrategia("PREPROFESIONAL");
    assert.equal(stratPre.topeHorasDiarias, 6);
    assert.equal(stratPre.topeHorasSemanales, 30);

    // Si lleva 27h en la semana y solicita registrar 6h, solo debe computar 3h para no exceder 30h
    const resPre = stratPre.validarHorasSesion(27, 6);
    assert.equal(resPre.horasValidas, 3);
    assert.equal(resPre.excedeTopeSemanal, true);

    const stratProf = ModalidadStrategyFactory.obtenerEstrategia("PROFESIONAL");
    assert.equal(stratProf.topeHorasDiarias, 8);
    assert.equal(stratProf.topeHorasSemanales, 48);
    const resProf = stratProf.validarHorasSesion(40, 8);
    assert.equal(resProf.horasValidas, 8);
    assert.equal(resProf.excedeTopeSemanal, false);
});

test("2. Servicio Predictivo clasifica tardanzas (> 10 min tolerancia) y calcula riesgo de ausentismo", () => {
    const puntual = PredictorAusentismoService.clasificarIngreso("08:00", "08:08", 10);
    assert.equal(puntual.estadoAsistencia, "PUNTUAL");
    assert.equal(puntual.disparaAlerta, false);

    const tardanza = PredictorAusentismoService.clasificarIngreso("08:00", "08:24", 10);
    assert.equal(tardanza.estadoAsistencia, "TARDANZA");
    assert.equal(tardanza.minutosTardanza, 24);
    assert.equal(tardanza.disparaAlerta, true);
});

test("3. Caso de Uso RegistrarMarcacionUseCase dispara alerta multicanal ante tardanza y guarda bitácora de actividad al salir", async () => {
    const tempDb = path.join("/tmp", `test_cit_unp_${Date.now()}.json`);
    const container = buildContainer(tempDb);

    // 3A. Simular marcación con tardanza (08:25 en turno de 08:00)
    const resEntrada = await container.registrarMarcacionUseCase.execute({
        practicanteId: "PRAC-02",
        tipoAccion: "ENTRADA",
        horaMarcacion: "08:25"
    });
    assert.equal(resEntrada.estadoAsistencia, "TARDANZA");
    assert.equal(resEntrada.minutosTardanza, 25);
    assert.ok(resEntrada.alertaGenerada, "Debe generar alerta automática por WhatsApp y Correo");
    assert.equal(resEntrada.alertaGenerada.tipo, "TARDANZA");

    // 3B. Simular marcación de salida con registro obligatorio de actividad técnica (RF-17)
    const resSalida = await container.registrarMarcacionUseCase.execute({
        practicanteId: "PRAC-02",
        tipoAccion: "SALIDA",
        horaMarcacion: "14:05",
        categoriaActividad: "REDES_TELECOM",
        descripcionActividad: "Monitoreo de switches de distribución y enlaces de fibra en el CIT - UNP.",
        entregableActividad: "Ticket CIT #501",
        horasSesionSolicitadas: 5.5
    });
    assert.equal(resSalida.actividadCreada.categoriaTecnica, "REDES_TELECOM");
    assert.equal(resSalida.actividadCreada.estadoRevision, "PENDIENTE_REVISION");
    assert.equal(resSalida.practicante.horasAcumuladas, 287.5);

    fs.unlinkSync(tempDb);
});

test("4. Caso de Uso EvaluarActividadUseCase califica de 1 a 5 (RF-18) y emite alerta si la actividad es OBSERVADA", async () => {
    const tempDb = path.join("/tmp", `test_eval_cit_unp_${Date.now()}.json`);
    const container = buildContainer(tempDb);

    const resObs = await container.evaluarActividadUseCase.execute({
        actividadId: "ACT-103",
        estadoRevision: "OBSERVADA",
        calificacion: 2,
        observacionSupervisor: "Adjuntar capturas de diagnóstico de hardware de las 12 PCs."
    });

    assert.equal(resObs.actividad.estadoRevision, "OBSERVADA");
    assert.equal(resObs.actividad.calificacion, 2);
    assert.ok(resObs.alertaGenerada, "Debe enviar alerta de actividad observada al practicante");
    assert.equal(resObs.alertaGenerada.tipo, "ACTIVIDAD_OBSERVADA");

    fs.unlinkSync(tempDb);
});
