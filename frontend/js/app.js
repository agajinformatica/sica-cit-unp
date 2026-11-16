// Controlador Principal del Frontend - SICA CIT - UNP
// Implementa Control de Acceso Basado en Roles (RBAC) estricto por módulo y por acción.
(function () {
    // Definición de Permisos RBAC por Rol Institucional en el CIT - UNP
    const RBAC_PERMISSIONS = {
        ADMIN_CIT: {
            usuarioNombre: "Mg. Ing. Luis Armando Saavedra Yarleque",
            cargo: "Jefatura / Administración CIT - UNP",
            practicanteIdAsociado: null,
            areaAsignadaId: "TODAS",
            vistasPermitidas: ["dashboard", "actividades", "alertas", "predictivo", "convenios", "reportes", "marcacion"],
            vistaInicial: "dashboard",
            puedeCalificarActividades: true,
            puedeAtenderAlertas: true,
            puedeCrearConvenios: true,
            puedeVerIndicadoresGerenciales: true
        },
        SUPERVISOR: {
            usuarioNombre: "Ing. Carlos Alberto Mendoza Ruiz",
            cargo: "Supervisor de Área — Desarrollo de Software CIT",
            practicanteIdAsociado: null,
            areaAsignadaId: "AREA-DEV",
            vistasPermitidas: ["dashboard", "actividades", "alertas", "predictivo", "reportes"],
            vistaInicial: "dashboard",
            puedeCalificarActividades: true,
            puedeAtenderAlertas: true,
            puedeCrearConvenios: false,
            puedeVerIndicadoresGerenciales: true
        },
        PRACTICANTE: {
            usuarioNombre: "Arnold Jonatan Alvarado Girón",
            cargo: "Practicante Profesional — Ingeniería Informática",
            practicanteIdAsociado: "PRAC-01",
            areaAsignadaId: "AREA-DEV",
            vistasPermitidas: ["marcacion", "actividades", "alertas", "reportes"],
            vistaInicial: "marcacion",
            puedeCalificarActividades: false,
            puedeAtenderAlertas: false,
            puedeCrearConvenios: false,
            puedeVerIndicadoresGerenciales: false
        }
    };

    const state = {
        currentView: "dashboard",
        currentRole: "ADMIN_CIT",
        selectedDependencia: "TODAS",
        selectedPracticanteId: "PRAC-01",
        filtroEstadoActividad: "TODAS",
        selectedAlertId: "ALR-901",
        examenesMode: false,
        evalModalActividadId: null,
        evalModalStars: 5
    };

    const LUCIDE_PATHS = {
        "check-circle": '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
        "clock": '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
        "alert-circle": '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
        "alert-triangle": '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
        "book-open": '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
        "star": '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
        "star-filled": '<polygon fill="currentColor" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
        "shield": '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
        "user-check": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>',
        "graduation-cap": '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
        "paperclip": '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
        "award": '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
        "send": '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
        "message-square": '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
        "lock": '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
        "dot": '<circle cx="12" cy="12" r="4" fill="currentColor"/>'
    };

    window.lucideSvg = function (name, size = 15, strokeWidth = 1.65, extraClass = "") {
        const content = LUCIDE_PATHS[name] || LUCIDE_PATHS["dot"];
        return `<svg class="lucide-svg ${extraClass}" width="${size}" height="${size}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="${strokeWidth}">${content}</svg>`;
    };

    function getCurrentRbac() {
        return RBAC_PERMISSIONS[state.currentRole] || RBAC_PERMISSIONS.ADMIN_CIT;
    }

    // =========================================================================
    // MÓDULO DE AUTENTICACIÓN INSTITUCIONAL UNP (CONTROL DE ROLES Y SESIÓN)
    // =========================================================================
    window.limpiarErrorLogin = function () {
        const banner = document.getElementById("loginValidationBanner");
        if (banner) banner.classList.add("d-none");
        document.getElementById("loginInputUsuario")?.classList.remove("input-error-unp");
        document.getElementById("loginInputPassword")?.classList.remove("input-error-unp");
    };

    window.autocompletarLogin = function (usuario, password) {
        limpiarErrorLogin();
        document.getElementById("loginInputUsuario").value = usuario;
        document.getElementById("loginInputPassword").value = password;
    };

    window.procesarInicioSesion = function (e) {
        e.preventDefault();
        limpiarErrorLogin();

        const userRaw = document.getElementById("loginInputUsuario").value.trim().toLowerCase();
        const passRaw = document.getElementById("loginInputPassword").value.trim();

        let rolAutenticado = null;

        // 1. Verificar cuenta de Jefatura / Administración CIT - UNP
        if ((userRaw === "lsaavedray@unp.edu.pe" || userRaw === "02849179" || userRaw === "admin") && passRaw === "admin2026") {
            rolAutenticado = "ADMIN_CIT";
            RBAC_PERMISSIONS.ADMIN_CIT.usuarioNombre = "Mg. Ing. Luis Armando Saavedra Yarleque";
            RBAC_PERMISSIONS.ADMIN_CIT.cargo = "Jefatura / Administración CIT - UNP";
        }
        // 2. Verificar cuentas de Supervisores de Área del CIT - UNP
        else if ((userRaw === "cmendozar@unp.edu.pe" || userRaw === "supervisor") && passRaw === "sup2026") {
            rolAutenticado = "SUPERVISOR";
            RBAC_PERMISSIONS.SUPERVISOR.usuarioNombre = "Ing. Carlos Alberto Mendoza Ruiz";
            RBAC_PERMISSIONS.SUPERVISOR.cargo = "Supervisor — Desarrollo de Software CIT";
            RBAC_PERMISSIONS.SUPERVISOR.areaAsignadaId = "AREA-DEV";
        }
        else if (userRaw === "jpantap@unp.edu.pe" && passRaw === "sup2026") {
            rolAutenticado = "SUPERVISOR";
            RBAC_PERMISSIONS.SUPERVISOR.usuarioNombre = "Ing. Jorge Luis Panta Palacios";
            RBAC_PERMISSIONS.SUPERVISOR.cargo = "Supervisor — Redes y Telecomunicaciones CIT";
            RBAC_PERMISSIONS.SUPERVISOR.areaAsignadaId = "AREA-NET";
        }
        else if (userRaw === "mzapatac@unp.edu.pe" && passRaw === "sup2026") {
            rolAutenticado = "SUPERVISOR";
            RBAC_PERMISSIONS.SUPERVISOR.usuarioNombre = "Ing. María Elena Zapata Chunga";
            RBAC_PERMISSIONS.SUPERVISOR.cargo = "Supervisor — Soporte Técnico CIT";
            RBAC_PERMISSIONS.SUPERVISOR.areaAsignadaId = "AREA-SUP";
        }
        // 3. Verificar cualquier Practicante registrado en el Padrón (Usuario: Código UNP, Correo o DNI | Contraseña: DNI)
        else {
            const pracEncontrado = window.CIT_UNP_DATA.practicantes.find(p =>
                (String(p.codigoUnp).toLowerCase() === userRaw ||
                 String(p.correo).toLowerCase() === userRaw ||
                 String(p.dni).toLowerCase() === userRaw) &&
                String(p.dni) === passRaw
            );
            if (pracEncontrado) {
                rolAutenticado = "PRACTICANTE";
                RBAC_PERMISSIONS.PRACTICANTE.usuarioNombre = pracEncontrado.nombres;
                RBAC_PERMISSIONS.PRACTICANTE.cargo = `Practicante ${pracEncontrado.modalidad} — ${pracEncontrado.escuela || 'Ing. Informática'}`;
                RBAC_PERMISSIONS.PRACTICANTE.practicanteIdAsociado = pracEncontrado.id;
                RBAC_PERMISSIONS.PRACTICANTE.areaAsignadaId = pracEncontrado.areaId;
                state.selectedPracticanteId = pracEncontrado.id;
            }
        }

        if (!rolAutenticado) {
            const banner = document.getElementById("loginValidationBanner");
            const txt = document.getElementById("loginValidationText");
            document.getElementById("loginInputUsuario").classList.add("input-error-unp");
            document.getElementById("loginInputPassword").classList.add("input-error-unp");
            if (txt) txt.textContent = "Credenciales incorrectas. Verifique su correo institucional, Código Universitario UNP o DNI.";
            if (banner) banner.classList.remove("d-none");
            return;
        }

        // Activar sesión autenticada y mostrar las pantallas correspondientes al rol
        document.getElementById("authLoginScreen").classList.add("d-none");
        document.getElementById("appAuthenticatedContainer").classList.remove("d-none");

        handleRoleChange(rolAutenticado);
        syncBackendAction("/api/v1/auth/login", { usuario: userRaw, rol: rolAutenticado });
    };

    window.cerrarSesionInstitucional = function () {
        document.getElementById("appAuthenticatedContainer").classList.add("d-none");
        document.getElementById("authLoginScreen").classList.remove("d-none");
        document.getElementById("loginInputPassword").value = "";
        limpiarErrorLogin();
        if (window.lucide && typeof window.lucide.createIcons === "function") {
            window.lucide.createIcons({ attrs: { "stroke-width": 1.65 } });
        }
    };

    function startClock() {
        const elTop = document.getElementById("serverClockTopText");
        const elTerminal = document.getElementById("terminalLiveClock");
        function tick() {
            const now = new Date();
            const timeStr = now.toLocaleTimeString("es-PE", { hour12: false });
            const dateStr = now.toLocaleDateString("es-PE", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
            if (elTop) elTop.textContent = `${dateStr} · ${timeStr} UTC-5`;
            if (elTerminal) elTerminal.textContent = timeStr;
        }
        tick();
        setInterval(tick, 1000);
    }

    // Actualiza visibilidad de módulos en el menú lateral y controles según el Rol activo
    function aplicarPoliticaRbacEnInterfaz() {
        const rbac = getCurrentRbac();

        // 1. Mostrar u ocultar enlaces del Sidebar según vistasPermitidas
        document.querySelectorAll(".nav-unp .nav-link").forEach(link => {
            const view = link.getAttribute("data-view");
            const permitido = rbac.vistasPermitidas.includes(view);
            link.classList.toggle("d-none", !permitido);

            // Ajustar etiquetas del menú cuando ingresa el Practicante
            const spanLabel = link.querySelector("span");
            if (spanLabel) {
                if (state.currentRole === "PRACTICANTE") {
                    if (view === "marcacion") spanLabel.textContent = "Mi Asistencia y Bitácora";
                    if (view === "actividades") spanLabel.textContent = "Mis Actividades y Notas";
                    if (view === "alertas") spanLabel.textContent = "Mis Notificaciones";
                    if (view === "reportes") spanLabel.textContent = "Mi Récord y Constancia";
                } else {
                    if (view === "marcacion") spanLabel.textContent = "Terminal de Asistencia";
                    if (view === "actividades") spanLabel.textContent = "Supervisión de Actividades";
                    if (view === "alertas") spanLabel.textContent = "Centro de Notificaciones";
                    if (view === "reportes") spanLabel.textContent = "Reportes y Constancias";
                }
            }
        });

        // 2. Ocultar selector global de dependencia si es Practicante
        const depFilterWrap = document.getElementById("topbarDependenciaWrapper");
        if (depFilterWrap) {
            depFilterWrap.classList.toggle("d-none", state.currentRole === "PRACTICANTE");
        }

        // 3. Si es Practicante, fijar su propio ID y deshabilitar cambiar de practicante en Marcación y Constancia
        const selectMarc = document.getElementById("selectPracticanteMarcacion");
        const selectConst = document.getElementById("selectPracticanteConstancia");
        if (state.currentRole === "PRACTICANTE" && rbac.practicanteIdAsociado) {
            state.selectedPracticanteId = rbac.practicanteIdAsociado;
            if (selectMarc) {
                selectMarc.value = rbac.practicanteIdAsociado;
                selectMarc.disabled = true;
            }
            if (selectConst) {
                selectConst.value = rbac.practicanteIdAsociado;
                selectConst.disabled = true;
            }
        } else {
            if (selectMarc) selectMarc.disabled = false;
            if (selectConst) selectConst.disabled = false;
        }

        // 4. Ocultar tabla de Indicadores Gerenciales y botones exclusivos según Rol RBAC
        const cardIndicadores = document.getElementById("cardIndicadoresGerenciales");
        const btnExportarGlobal = document.getElementById("btnExportarConsolidadoGlobal");
        const btnNuevoPracDash = document.getElementById("btnDashboardNuevoPracticante");
        if (cardIndicadores) cardIndicadores.classList.toggle("d-none", !rbac.puedeVerIndicadoresGerenciales);
        if (btnExportarGlobal) btnExportarGlobal.classList.toggle("d-none", !rbac.puedeVerIndicadoresGerenciales);
        if (btnNuevoPracDash) btnNuevoPracDash.classList.toggle("d-none", !rbac.puedeCrearConvenios);

        // 5. Actualizar tarjeta de sesión en la barra lateral
        const userFooterName = document.getElementById("sidebarUserSessionName");
        const userFooterRole = document.getElementById("sidebarUserSessionRole");
        if (userFooterName) userFooterName.textContent = rbac.usuarioNombre;
        if (userFooterRole) userFooterRole.textContent = rbac.cargo;
    }

    // Guardia de Navegación RBAC
    window.switchView = function (viewName) {
        const rbac = getCurrentRbac();
        if (!rbac.vistasPermitidas.includes(viewName)) {
            showToastAlerta(
                "Acceso restringido por perfil",
                `El perfil actual (${rbac.cargo}) no cuenta con permisos para acceder a este módulo.`,
                "warning"
            );
            viewName = rbac.vistaInicial;
        }

        state.currentView = viewName;
        document.querySelectorAll(".view-section").forEach(sec => {
            sec.classList.add("d-none");
        });
        const target = document.getElementById(`view-${viewName}`);
        if (target) target.classList.remove("d-none");

        document.querySelectorAll(".nav-unp .nav-link").forEach(link => {
            link.classList.toggle("active", link.getAttribute("data-view") === viewName);
        });
        renderAll();
    };

    window.handleRoleChange = function (newRole) {
        state.currentRole = newRole;
        const rbac = getCurrentRbac();
        const badge = document.getElementById("activeRoleBadge");
        badge.className = "role-pill-unp";

        if (newRole === "ADMIN_CIT") {
            badge.innerHTML = `${lucideSvg("shield", 15, 1.75)} <span>${rbac.usuarioNombre} · Jefatura CIT</span>`;
        } else if (newRole === "SUPERVISOR") {
            badge.innerHTML = `${lucideSvg("user-check", 15, 1.75)} <span>${rbac.usuarioNombre} · Supervisor</span>`;
        } else {
            badge.innerHTML = `${lucideSvg("graduation-cap", 15, 1.75)} <span>${rbac.usuarioNombre} · Practicante</span>`;
        }

        aplicarPoliticaRbacEnInterfaz();

        // Si la vista actual no está permitida para el nuevo rol, redirigir a su vista inicial
        if (!rbac.vistasPermitidas.includes(state.currentView)) {
            switchView(rbac.vistaInicial);
        } else {
            renderAll();
        }

        showToastAlerta(
            "Sesión de usuario actualizada",
            `Ingresó como ${rbac.usuarioNombre} (${rbac.cargo}). Módulos ajustados según sus permisos.`,
            "primary"
        );
    };

    window.handleDependenciaFilter = function (depId) {
        state.selectedDependencia = depId;
        renderAll();
    };

    function getFilteredPracticantes() {
        const list = window.CIT_UNP_DATA.practicantes;
        if (state.selectedDependencia === "TODAS") return list;
        return list.filter(p => p.dependenciaId === state.selectedDependencia);
    }

    function getEstadoBadge(estado) {
        switch (estado) {
            case "PUNTUAL":
                return `<span class="badge bg-success-subtle text-success border border-success-subtle">${lucideSvg("check-circle", 13, 1.75, "me-1")}Puntual</span>`;
            case "TARDANZA":
                return `<span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">${lucideSvg("clock", 13, 1.75, "me-1")}Tardanza</span>`;
            case "FALTA_INJUSTIFICADA":
                return `<span class="badge bg-danger-subtle text-danger border border-danger-subtle">${lucideSvg("alert-circle", 13, 1.75, "me-1")}Inasistencia</span>`;
            case "PERMISO_ACADEMICO":
                return `<span class="badge bg-info-subtle text-info-emphasis border border-info-subtle">${lucideSvg("book-open", 13, 1.75, "me-1")}Permiso Académico</span>`;
            default:
                return `<span class="badge bg-secondary">${estado}</span>`;
        }
    }

    function getSemaforoHtml(nivel, score) {
        if (nivel === "VERDE") {
            return `<span class="semaforo-pill semaforo-verde">${lucideSvg("dot", 14, 2)} Óptimo (${score}%)</span>`;
        } else if (nivel === "AMBAR") {
            return `<span class="semaforo-pill semaforo-ambar">${lucideSvg("alert-triangle", 13, 1.75)} Preventivo (${score}%)</span>`;
        }
        return `<span class="semaforo-pill semaforo-rojo">${lucideSvg("alert-circle", 13, 1.75)} Crítico (${score}%)</span>`;
    }

    function renderStarsStatic(count) {
        if (!count || count <= 0) return `<span class="text-muted small">Sin calificar</span>`;
        let html = "";
        for (let i = 1; i <= 5; i++) {
            html += `<span class="${i <= count ? "text-warning" : "text-muted opacity-50"} me-1">${lucideSvg(i <= count ? "star-filled" : "star", 14, 1.6)}</span>`;
        }
        return `<span class="fw-semibold ms-1 tabular-nums">${html} <span class="small text-secondary">(${count}/5)</span></span>`;
    }

    // 1. Renderizar Dashboard Ejecutivo CIT-UNP
    function renderDashboard() {
        const pracs = getFilteredPracticantes();
        const acts = window.CIT_UNP_DATA.actividades;
        const alertas = window.CIT_UNP_DATA.alertas;

        const puntuales = pracs.filter(p => p.estadoHoy === "PUNTUAL").length;
        const incidenciasHoy = pracs.filter(p => p.estadoHoy === "TARDANZA" || p.estadoHoy === "FALTA_INJUSTIFICADA").length;
        const actsPendientes = acts.filter(a => a.estadoRevision === "PENDIENTE_REVISION" || a.estadoRevision === "OBSERVADA").length;
        const alertasAtendidas = alertas.filter(a => a.atendida).length;
        const pctAlertas = alertas.length ? Math.round((alertasAtendidas / alertas.length) * 100) : 100;

        document.getElementById("kpiTotalPracticantes").textContent = pracs.length;
        document.getElementById("kpiPuntualesHoy").textContent = `${puntuales} / ${pracs.length}`;
        document.getElementById("kpiIncidenciasHoy").textContent = incidenciasHoy;
        document.getElementById("kpiActividadesRevision").textContent = actsPendientes;
        document.getElementById("kpiAlertasAtendidas").textContent = `${pctAlertas}% (${alertasAtendidas}/${alertas.length})`;
        document.getElementById("topAlertCount").textContent = alertas.filter(a => !a.atendida).length;

        const tbody = document.getElementById("dashboardPracticantesBody");
        tbody.innerHTML = pracs.map(p => {
            const paha = Math.min(100, Math.round((p.horasAcumuladas / p.metaHoras) * 100));
            const modBadge = p.modalidad === "PREPROFESIONAL"
                ? `<span class="badge bg-primary-subtle text-primary border border-primary-subtle">Preprofesional · 30 h</span>`
                : `<span class="badge bg-light text-dark border">Profesional · 48 h</span>`;
            return `
                <tr>
                    <td>
                        <div class="fw-semibold text-dark">${p.nombres}</div>
                        <div class="small text-secondary tabular-nums">Cód. ${p.codigoUnp} · DNI ${p.dni}</div>
                    </td>
                    <td>
                        <div class="fw-medium small text-dark">${p.areaNombre}</div>
                        <div class="text-secondary" style="font-size:0.75rem;">Sup: ${p.supervisor}</div>
                    </td>
                    <td>${modBadge}<div class="small text-secondary mt-1 tabular-nums">${p.turnoHoy}</div></td>
                    <td class="tabular-nums">
                        <div class="fw-medium small mb-1">${p.horaEntradaHoy} <span class="text-secondary">→</span> ${p.horaSalidaHoy}</div>
                        ${getEstadoBadge(p.estadoHoy)}
                    </td>
                    <td style="min-width:170px;" class="tabular-nums">
                        <div class="d-flex justify-content-between small mb-1">
                            <span class="fw-semibold">${p.horasAcumuladas} / ${p.metaHoras} h</span>
                            <span class="text-primary fw-semibold">${paha}%</span>
                        </div>
                        <div class="progress" style="height: 6px; background-color: #e2e8f0;">
                            <div class="progress-bar ${paha >= 90 ? 'bg-success' : 'bg-primary'}" style="width: ${paha}%"></div>
                        </div>
                        <div class="text-secondary mt-1" style="font-size:0.73rem;">Jornada semanal: ${p.horasSemanaActual}/${p.topeSemanal} h</div>
                    </td>
                    <td>${renderStarsStatic(Math.round(p.promedioEvaluacionActividades))}</td>
                    <td>${getSemaforoHtml(p.nivelSemaforo, p.scoreRiesgoAusentismo)}</td>
                </tr>
            `;
        }).join("");
    }

    // 2. Renderizar Vista de Marcación y Bitácora de Actividades
    function renderMarcacion() {
        const selectEl = document.getElementById("selectPracticanteMarcacion");
        const pracs = window.CIT_UNP_DATA.practicantes;
        if (selectEl.options.length !== pracs.length) {
            selectEl.innerHTML = pracs.map(p =>
                `<option value="${p.id}" ${p.id === state.selectedPracticanteId ? "selected" : ""}>${p.nombres} (${p.modalidad} — ${p.areaNombre})</option>`
            ).join("");
        }
        selectEl.value = state.selectedPracticanteId;

        const p = pracs.find(item => item.id === state.selectedPracticanteId) || pracs[0];
        const paha = Math.min(100, ((p.horasAcumuladas / p.metaHoras) * 100).toFixed(1));
        const pctSemanal = Math.min(100, Math.round((p.horasSemanaActual / p.topeSemanal) * 100));

        document.getElementById("marcCardNombre").textContent = p.nombres;
        document.getElementById("marcCardModalidad").textContent = `Modalidad ${p.modalidad} (Máximo permitido: ${p.topeDiario} h/día · ${p.topeSemanal} h/semana)`;
        document.getElementById("marcCardArea").textContent = `${p.areaNombre} (${p.dependenciaId})`;
        document.getElementById("marcCardTurno").textContent = `${p.turnoHoy} (Tolerancia de ingreso: ${p.toleranciaMin} min)`;
        document.getElementById("marcCardSemanalText").textContent = `${p.horasSemanaActual} / ${p.topeSemanal} h`;
        document.getElementById("marcCardSemanalBar").style.width = `${pctSemanal}%`;
        document.getElementById("marcCardTotalText").textContent = `${p.horasAcumuladas} / ${p.metaHoras} h (${paha}%)`;
        document.getElementById("marcCardTotalBar").style.width = `${paha}%`;
    }

    window.cambiarPracticanteMarcacion = function (pracId) {
        const rbac = getCurrentRbac();
        if (state.currentRole === "PRACTICANTE" && rbac.practicanteIdAsociado) {
            state.selectedPracticanteId = rbac.practicanteIdAsociado;
            return;
        }
        state.selectedPracticanteId = pracId;
        limpiarValidacionActividad();
        renderMarcacion();
    };

    window.limpiarValidacionActividad = function () {
        const txt = document.getElementById("inputDescripcionActividad");
        const banner = document.getElementById("inlineValidationActividad");
        if (txt) txt.classList.remove("input-error-unp");
        if (banner) banner.classList.add("d-none");
    };

    function mostrarValidacionInlineActividad(mensaje) {
        const txt = document.getElementById("inputDescripcionActividad");
        const banner = document.getElementById("inlineValidationActividad");
        const bannerText = document.getElementById("inlineValidationActividadText");
        if (txt) {
            txt.classList.add("input-error-unp");
            txt.focus();
        }
        if (banner && bannerText) {
            bannerText.textContent = mensaje;
            banner.classList.remove("d-none");
        }
        showToastAlerta("Registro de actividad requerido", mensaje, "danger");
    }

    window.ejecutarMarcacionConActividad = function (tipoAccion) {
        const p = window.CIT_UNP_DATA.practicantes.find(item => item.id === state.selectedPracticanteId);
        if (!p) return;

        limpiarValidacionActividad();

        const simHora = document.getElementById("inputHoraSimulada").value || "08:05";
        const catActividad = document.getElementById("inputCategoriaActividad").value;
        const descActividad = document.getElementById("inputDescripcionActividad").value.trim();
        const entregableActividad = document.getElementById("inputEntregableActividad").value.trim();
        const horasSesion = parseFloat(document.getElementById("inputHorasSesion").value) || 6.0;

        if (tipoAccion === "ENTRADA") {
            p.horaEntradaHoy = simHora;
            const [hProg, mProg] = p.horaInicioTurno.split(":").map(Number);
            const [hReal, mReal] = simHora.split(":").map(Number);
            const retraso = (hReal * 60 + mReal) - (hProg * 60 + mProg);

            if (retraso > p.toleranciaMin) {
                p.estadoHoy = "TARDANZA";
                p.tardanzasMes += 1;
                const nuevaAlerta = {
                    id: "ALR-" + Math.floor(1000 + Math.random() * 9000),
                    fechaHora: `2026-11-16 ${simHora}:00`,
                    tipo: "TARDANZA EN TURNO",
                    practicante: p.nombres,
                    area: p.areaNombre,
                    canal: "WHATSAPP + CORREO",
                    destinatario: `${p.supervisor} (${p.telefonoWhatsapp})`,
                    mensajeWhatsapp: `*[CIT-UNP · NOTIFICACIÓN DE TARDANZA]*\nSe informa que el practicante *${p.nombres}* (Modalidad ${p.modalidad}) registró su ingreso a las *${simHora} h* (Inicio de turno: ${p.horaInicioTurno} h · Retraso: *${retraso} minutos*).\nÁrea asignada: ${p.areaNombre}.`,
                    asuntoCorreo: `[CIT-UNP] Registro de Tardanza (${retraso} min) — ${p.nombres}`,
                    atendida: false,
                    horaAtencion: "-"
                };
                window.CIT_UNP_DATA.alertas.unshift(nuevaAlerta);
                state.selectedAlertId = nuevaAlerta.id;
                showToastAlerta(
                    `Ingreso con tardanza (${retraso} min)`,
                    `Se registró la entrada de ${p.nombres} a las ${simHora} h y se despachó la notificación automática al supervisor ${p.supervisor} vía WhatsApp y correo institucional.`,
                    "danger"
                );
            } else {
                p.estadoHoy = "PUNTUAL";
                showToastAlerta(
                    "Asistencia de entrada registrada",
                    `Ingreso puntual validado a las ${simHora} h para ${p.nombres} en el área de ${p.areaNombre}.`,
                    "success"
                );
            }

            syncBackendAction("/api/v1/asistencia/marcar", {
                practicanteId: p.id,
                tipoAccion: "ENTRADA",
                horaMarcacion: simHora
            });
            renderAll();
            return;
        }

        if (!descActividad) {
            mostrarValidacionInlineActividad(
                "Para registrar la salida del turno, detalle la actividad técnica ejecutada y el entregable correspondiente."
            );
            return;
        }

        if (p.horasSemanaActual + horasSesion > p.topeSemanal) {
            showToastAlerta(
                "Límite de jornada semanal alcanzado",
                `${p.nombres} registra ${p.horasSemanaActual} h en la semana actual. Se contabilizaron únicamente las horas disponibles dentro del límite semanal de su modalidad (${p.topeSemanal} h/semana).`,
                "warning"
            );
        }

        p.horaSalidaHoy = simHora;
        const horasValidas = Math.min(horasSesion, Math.max(0, p.topeSemanal - p.horasSemanaActual));
        p.horasSemanaActual = +(p.horasSemanaActual + horasValidas).toFixed(1);
        p.horasAcumuladas = +(p.horasAcumuladas + horasValidas).toFixed(1);

        const nuevaAct = {
            id: "ACT-" + Math.floor(200 + Math.random() * 799),
            fecha: "2026-11-16",
            practicanteId: p.id,
            practicanteNombre: p.nombres,
            modalidad: p.modalidad,
            areaNombre: p.areaNombre,
            categoriaTecnica: catActividad,
            descripcion: descActividad,
            entregable: entregableActividad || "Actividad documentada al cierre de turno en el CIT - UNP",
            horasSesion: horasValidas,
            estadoRevision: "PENDIENTE_REVISION",
            calificacion: 0,
            observacionSupervisor: "Pendiente de validación y calificación por el supervisor de área.",
            supervisor: p.supervisor
        };
        window.CIT_UNP_DATA.actividades.unshift(nuevaAct);
        document.getElementById("inputDescripcionActividad").value = "";
        document.getElementById("inputEntregableActividad").value = "";

        showToastAlerta(
            "Jornada finalizada y actividad registrada",
            `Se acreditaron +${horasValidas} h en el récord acumulado de ${p.nombres} y la actividad pasó a bandeja de revisión de ${p.supervisor}.`,
            "primary"
        );

        syncBackendAction("/api/v1/asistencia/marcar", {
            practicanteId: p.id,
            tipoAccion: "SALIDA",
            horaMarcacion: simHora,
            categoriaActividad: catActividad,
            descripcionActividad: descActividad,
            entregableActividad: nuevaAct.entregable,
            horasSesionSolicitadas: horasSesion
        });

        renderAll();
    };

    // 3. Renderizar Módulo de Evaluación de Actividades Realizadas (Con filtro por Rol RBAC)
    function renderActividades() {
        const rbac = getCurrentRbac();
        let acts = window.CIT_UNP_DATA.actividades;

        // Si el rol es PRACTICANTE, solo ve sus propias actividades registradas
        if (state.currentRole === "PRACTICANTE" && rbac.practicanteIdAsociado) {
            acts = acts.filter(a => a.practicanteId === rbac.practicanteIdAsociado);
        }

        const filtered = state.filtroEstadoActividad === "TODAS"
            ? acts
            : acts.filter(a => a.estadoRevision === state.filtroEstadoActividad);

        document.getElementById("countActTotales").textContent = acts.length;
        document.getElementById("countActAprobadas").textContent = acts.filter(a => a.estadoRevision === "APROBADA").length;
        document.getElementById("countActPendientes").textContent = acts.filter(a => a.estadoRevision === "PENDIENTE_REVISION").length;
        document.getElementById("countActObservadas").textContent = acts.filter(a => a.estadoRevision === "OBSERVADA").length;

        const tbody = document.getElementById("tablaActividadesBody");
        tbody.innerHTML = filtered.map(a => {
            let estadoBadge = `<span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">${lucideSvg("clock", 13, 1.75, "me-1")}Pendiente de Revisión</span>`;
            if (a.estadoRevision === "APROBADA") {
                estadoBadge = `<span class="badge bg-success-subtle text-success border border-success-subtle">${lucideSvg("check-circle", 13, 1.75, "me-1")}Aprobada y Validada</span>`;
            } else if (a.estadoRevision === "OBSERVADA") {
                estadoBadge = `<span class="badge bg-danger-subtle text-danger border border-danger-subtle">${lucideSvg("alert-circle", 13, 1.75, "me-1")}Observada</span>`;
            }

            // Acción según permiso RBAC: Supervisor/Admin califican; Practicante solo visualiza estado
            const accionHtml = rbac.puedeCalificarActividades
                ? `<button class="btn btn-sm btn-outline-primary fw-medium" onclick="abrirModalEvaluarActividad('${a.id}')">
                       ${lucideSvg("award", 14, 1.75, "me-1")}Calificar
                   </button>`
                : `<span class="badge bg-light text-secondary border">${lucideSvg("lock", 12, 1.75, "me-1")}Solo Lectura</span>`;

            return `
                <tr>
                    <td class="tabular-nums">
                        <span class="badge bg-light text-secondary border mb-1">${a.id}</span>
                        <div class="small fw-medium">${a.fecha}</div>
                    </td>
                    <td>
                        <div class="fw-semibold text-dark">${a.practicanteNombre}</div>
                        <div class="small text-secondary">${a.areaNombre} (${a.modalidad})</div>
                    </td>
                    <td>
                        <span class="badge bg-primary-subtle text-primary mb-1">${a.categoriaTecnica}</span>
                        <div class="small text-dark">${a.descripcion}</div>
                        <div class="small text-secondary mt-1">${lucideSvg("paperclip", 13, 1.65, "me-1")}<strong>Entregable:</strong> ${a.entregable}</div>
                    </td>
                    <td class="fw-semibold text-center tabular-nums">${a.horasSesion} h</td>
                    <td>
                        ${estadoBadge}
                        <div class="mt-1">${renderStarsStatic(a.calificacion)}</div>
                        <div class="small text-secondary mt-1"><em>"${a.observacionSupervisor}"</em></div>
                    </td>
                    <td class="text-end">${accionHtml}</td>
                </tr>
            `;
        }).join("");
    }

    window.filtrarActividades = function (estado) {
        state.filtroEstadoActividad = estado;
        renderActividades();
    };

    window.abrirModalEvaluarActividad = function (actId) {
        const rbac = getCurrentRbac();
        if (!rbac.puedeCalificarActividades) {
            showToastAlerta("Acción no autorizada", "Solo los Supervisores de Área y la Jefatura del CIT pueden calificar actividades.", "danger");
            return;
        }
        const act = window.CIT_UNP_DATA.actividades.find(a => a.id === actId);
        if (!act) return;
        state.evalModalActividadId = actId;
        state.evalModalStars = act.calificacion > 0 ? act.calificacion : 5;

        document.getElementById("evalModalPracticante").textContent = `${act.practicanteNombre} (${act.areaNombre})`;
        document.getElementById("evalModalDescripcion").textContent = act.descripcion;
        document.getElementById("evalModalEntregable").textContent = act.entregable;
        document.getElementById("evalModalEstadoSelect").value = act.estadoRevision === "PENDIENTE_REVISION" ? "APROBADA" : act.estadoRevision;
        document.getElementById("evalModalObservacion").value = act.observacionSupervisor;
        renderModalStars();

        const modalEl = document.getElementById("modalEvaluarActividad");
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    };

    window.setModalStar = function (num) {
        state.evalModalStars = num;
        renderModalStars();
    };

    function renderModalStars() {
        const container = document.getElementById("evalModalStarsContainer");
        const labels = ["", "1 · Deficiente", "2 · Regular (Requiere subsanar)", "3 · Bueno", "4 · Muy Bueno", "5 · Destacado (Sobresaliente)"];
        let html = "";
        for (let i = 1; i <= 5; i++) {
            html += `<button type="button" class="star-rating-btn ${i <= state.evalModalStars ? 'active' : ''}" onclick="setModalStar(${i})">${lucideSvg(i <= state.evalModalStars ? "star-filled" : "star", 20, 1.65)}</button>`;
        }
        html += `<span class="ms-2 fw-semibold text-dark small">${labels[state.evalModalStars]}</span>`;
        container.innerHTML = html;
    }

    window.guardarEvaluacionActividad = function () {
        const act = window.CIT_UNP_DATA.actividades.find(a => a.id === state.evalModalActividadId);
        if (!act) return;

        const nuevoEstado = document.getElementById("evalModalEstadoSelect").value;
        const obs = document.getElementById("evalModalObservacion").value.trim() || "Actividad validada por el supervisor de área del CIT - UNP.";

        act.estadoRevision = nuevoEstado;
        act.calificacion = state.evalModalStars;
        act.observacionSupervisor = obs;

        const prac = window.CIT_UNP_DATA.practicantes.find(p => p.id === act.practicanteId);
        if (prac) {
            const calificadas = window.CIT_UNP_DATA.actividades.filter(a => a.practicanteId === prac.id && a.calificacion > 0);
            if (calificadas.length) {
                const suma = calificadas.reduce((acc, item) => acc + item.calificacion, 0);
                prac.promedioEvaluacionActividades = +(suma / calificadas.length).toFixed(1);
            }
        }

        if (nuevoEstado === "OBSERVADA") {
            const alertaObs = {
                id: "ALR-" + Math.floor(1000 + Math.random() * 9000),
                fechaHora: "2026-11-16 " + new Date().toLocaleTimeString("es-PE", { hour12: false }),
                tipo: "OBSERVACIÓN DE ACTIVIDAD",
                practicante: act.practicanteNombre,
                area: act.areaNombre,
                canal: "WHATSAPP + CORREO",
                destinatario: act.practicanteNombre,
                mensajeWhatsapp: `*[CIT-UNP · OBSERVACIÓN EN BITÁCORA DE ACTIVIDADES]*\nLa actividad *${act.id}* (${act.categoriaTecnica}) presenta observaciones del supervisor *${act.supervisor}*.\nCalificación preliminar: ${act.calificacion}/5\nDetalle requerido: _${obs}_`,
                asuntoCorreo: `[CIT-UNP] Solicitud de Subsanación de Actividad Técnica (${act.id})`,
                atendida: false,
                horaAtencion: "-"
            };
            window.CIT_UNP_DATA.alertas.unshift(alertaObs);
            state.selectedAlertId = alertaObs.id;
            showToastAlerta(
                "Observación técnica notificada",
                `Se registró la observación en la actividad ${act.id} y se notificó a ${act.practicanteNombre} vía WhatsApp y correo institucional para su subsanación.`,
                "warning"
            );
        } else {
            showToastAlerta(
                "Conformidad de actividad registrada",
                `La actividad ${act.id} de ${act.practicanteNombre} fue aprobada con calificación ${act.calificacion}/5 y sus horas quedaron validadas.`,
                "success"
            );
        }

        syncBackendAction("/api/v1/actividades/evaluar", {
            actividadId: act.id,
            estadoRevision: nuevoEstado,
            calificacion: state.evalModalStars,
            observacionSupervisor: obs
        });

        const modalEl = document.getElementById("modalEvaluarActividad");
        bootstrap.Modal.getInstance(modalEl).hide();
        renderAll();
    };

    // 4. Renderizar Centro de Alertas WhatsApp + Correo SMTP (Con control RBAC)
    function renderAlertas() {
        const rbac = getCurrentRbac();
        const alertas = window.CIT_UNP_DATA.alertas;
        const selected = alertas.find(a => a.id === state.selectedAlertId) || alertas[0];

        if (selected) {
            document.getElementById("waPreviewDestinatario").textContent = selected.destinatario;
            document.getElementById("waPreviewMensaje").innerHTML = selected.mensajeWhatsapp
                .replace(/\*(.*?)\*/g, "<strong>$1</strong>")
                .replace(/_(.*?)_/g, "<em>$1</em>")
                .replace(/\n/g, "<br>");
            document.getElementById("waPreviewHora").textContent = selected.fechaHora;

            document.getElementById("emailPreviewAsunto").textContent = selected.asuntoCorreo;
            document.getElementById("emailPreviewPara").textContent = selected.destinatario;
            document.getElementById("emailPreviewCuerpo").innerHTML = `
                <p class="mb-2 small">Estimado(a) Supervisor(a) / Practicante del <strong>Centro de Informática y Telecomunicaciones (CIT - UNP)</strong>:</p>
                <p class="mb-2 small">El servicio institucional de seguimiento de prácticas ha emitido la siguiente notificación automática:</p>
                <div class="p-2 bg-light border-start border-3 border-primary rounded small mb-2">
                    <strong>Categoría de Alerta:</strong> ${selected.tipo}<br>
                    <strong>Practicante:</strong> ${selected.practicante}<br>
                    <strong>Unidad Operativa:</strong> ${selected.area}<br>
                    <strong>Fecha y Hora Oficial:</strong> ${selected.fechaHora}
                </div>
                <p class="small text-secondary mb-0">Centro de Informática y Telecomunicaciones — Universidad Nacional de Piura.</p>
            `;
        }

        const tbody = document.getElementById("tablaAlertasBody");
        tbody.innerHTML = alertas.map(a => {
            let botonesGestion = `
                <div class="d-inline-flex gap-1">
                    ${!a.atendida && rbac.puedeAtenderAlertas
                        ? `<button class="btn btn-sm btn-primary py-1 px-2" onclick="event.stopPropagation(); marcarAlertaAtendida('${a.id}')">Confirmar</button>`
                        : ""
                    }
                    <button class="btn btn-sm btn-outline-primary py-1 px-2" onclick="event.stopPropagation(); abrirModalDetalleAlerta('${a.id}')">Ver Detalle</button>
                </div>
            `;

            return `
                <tr class="${a.id === selected?.id ? 'table-active' : ''}" style="cursor:pointer;" onclick="seleccionarAlerta('${a.id}')">
                    <td class="small fw-medium tabular-nums">${a.fechaHora}</td>
                    <td><span class="badge bg-light text-dark border">${a.tipo}</span></td>
                    <td>
                        <div class="fw-semibold small text-dark">${a.practicante}</div>
                        <div class="text-secondary" style="font-size:0.74rem;">${a.area}</div>
                    </td>
                    <td><span class="badge bg-success-subtle text-success border border-success-subtle">${lucideSvg("message-square", 12, 1.75, "me-1")}${a.canal}</span></td>
                    <td>
                        ${a.atendida
                            ? `<span class="badge bg-success-subtle text-success border border-success-subtle">${lucideSvg("check-circle", 12, 1.75, "me-1")}Atendida (${a.horaAtencion})</span>`
                            : `<span class="badge bg-danger-subtle text-danger border border-danger-subtle">${lucideSvg("clock", 12, 1.75, "me-1")}Pendiente</span>`
                        }
                        ${a.resolucionSupervisor ? `<div class="small text-secondary mt-1"><em>"${a.resolucionSupervisor}"</em></div>` : ""}
                    </td>
                    <td class="text-end">${botonesGestion}</td>
                </tr>
            `;
        }).join("");
    }

    window.seleccionarAlerta = function (alertaId) {
        state.selectedAlertId = alertaId;
        renderAlertas();
    };

    window.abrirModalDetalleAlerta = function (alertaId) {
        state.selectedAlertId = alertaId;
        renderAlertas();

        const a = window.CIT_UNP_DATA.alertas.find(item => item.id === alertaId);
        if (!a) return;
        const rbac = getCurrentRbac();

        document.getElementById("detAlertaCodigo").textContent = a.id;
        document.getElementById("detAlertaTipo").textContent = a.tipo;
        document.getElementById("detAlertaPracticante").textContent = a.practicante;
        document.getElementById("detAlertaArea").textContent = a.area;
        document.getElementById("detAlertaFechaHora").textContent = a.fechaHora;
        document.getElementById("detAlertaDestinatario").textContent = a.destinatario;
        document.getElementById("detAlertaCanal").textContent = a.canal;
        document.getElementById("detAlertaHoraAtencion").textContent = a.atendida ? `${a.horaAtencion} h` : "Sin confirmar aún";
        document.getElementById("detAlertaEstadoBadge").innerHTML = a.atendida
            ? `<span class="badge bg-success-subtle text-success border">Atendida y Registrada</span>`
            : `<span class="badge bg-danger-subtle text-danger border">Pendiente de Confirmación</span>`;

        document.getElementById("detAlertaMensajeWa").innerHTML = a.mensajeWhatsapp
            .replace(/\*(.*?)\*/g, "<strong>$1</strong>")
            .replace(/_(.*?)_/g, "<em>$1</em>")
            .replace(/\n/g, "<br>");
        document.getElementById("detAlertaAsuntoCorreo").textContent = a.asuntoCorreo;

        const inputRes = document.getElementById("detAlertaInputResolucion");
        if (inputRes) {
            inputRes.value = a.resolucionSupervisor || (a.atendida ? "Incidencia verificada y coordinada por el supervisor de área del CIT - UNP." : "");
            inputRes.disabled = !rbac.puedeAtenderAlertas;
        }
        const btnSave = document.getElementById("btnGuardarSeguimientoAlerta");
        if (btnSave) {
            btnSave.classList.toggle("d-none", !rbac.puedeAtenderAlertas);
        }

        const modalEl = document.getElementById("modalDetalleAlerta");
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    };

    window.guardarSeguimientoAlertaModal = function () {
        const a = window.CIT_UNP_DATA.alertas.find(item => item.id === state.selectedAlertId);
        if (!a) return;
        const resolucion = document.getElementById("detAlertaInputResolucion").value.trim();
        a.atendida = true;
        if (a.horaAtencion === "-") {
            a.horaAtencion = new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false });
        }
        a.resolucionSupervisor = resolucion || "Atención confirmada por supervisión del CIT - UNP.";

        const modalEl = document.getElementById("modalDetalleAlerta");
        bootstrap.Modal.getInstance(modalEl).hide();

        showToastAlerta(
            "Seguimiento de notificación guardado",
            `Se registró la resolución y se confirmó la atención de la notificación ${a.id} (${a.practicante}).`,
            "success"
        );
        syncBackendAction("/api/v1/alertas/atender", { alertaId: a.id, resolucion: a.resolucionSupervisor });
        renderAll();
    };

    window.despacharWhatsappDirectoModal = function () {
        const a = window.CIT_UNP_DATA.alertas.find(item => item.id === state.selectedAlertId);
        if (!a) return;
        // Extraer dígitos telefónicos o usar teléfono del practicante
        const digits = (a.destinatario.match(/\d+/g) || []).join("") || "51968412390";
        const phone = digits.startsWith("51") ? digits : `51${digits}`;
        const urlWa = `https://wa.me/${phone}?text=${encodeURIComponent(a.mensajeWhatsapp)}`;
        window.open(urlWa, "_blank", "noopener,noreferrer");
        showToastAlerta(
            "Despacho hacia WhatsApp iniciado",
            `Se abrió el enlace de envío directo hacia ${a.destinatario} con el mensaje institucional pre-cargado.`,
            "success"
        );
    };

    window.reenviarCorreoInstitucionalModal = function () {
        const a = window.CIT_UNP_DATA.alertas.find(item => item.id === state.selectedAlertId);
        if (!a) return;
        showToastAlerta(
            "Correo institucional reenviado",
            `El servidor SMTP despachó nuevamente la notificación "${a.asuntoCorreo}" a ${a.destinatario}.`,
            "primary"
        );
    };

    window.marcarAlertaAtendida = function (alertaId) {
        const rbac = getCurrentRbac();
        if (!rbac.puedeAtenderAlertas) {
            showToastAlerta("Permiso requerido", "Solo los Supervisores y la Jefatura del CIT pueden confirmar la atención de alertas.", "warning");
            return;
        }
        const a = window.CIT_UNP_DATA.alertas.find(item => item.id === alertaId);
        if (a) {
            a.atendida = true;
            a.horaAtencion = new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false });
            showToastAlerta(
                "Atención de alerta registrada",
                `La notificación ${a.id} (${a.practicante}) quedó registrada como atendida a las ${a.horaAtencion} h.`,
                "success"
            );
            syncBackendAction("/api/v1/alertas/atender", { alertaId });
            renderAll();
        }
    };

    // 5. Renderizar Módulo Inteligente Predictivo de Ausentismo
    function renderPredictivo() {
        const pracs = getFilteredPracticantes();
        const tbody = document.getElementById("tablaPredictivoBody");
        tbody.innerHTML = pracs.map(p => {
            const boost = state.examenesMode && p.modalidad === "PREPROFESIONAL" ? 18 : 0;
            const score = Math.min(98, p.scoreRiesgoAusentismo + boost);
            let nivel = "VERDE";
            if (score >= 65) nivel = "ROJO";
            else if (score >= 35) nivel = "AMBAR";

            return `
                <tr>
                    <td>
                        <div class="fw-semibold text-dark">${p.nombres}</div>
                        <div class="small text-secondary">${p.modalidad} · ${p.areaNombre}</div>
                    </td>
                    <td class="text-center fw-semibold tabular-nums">${p.indicePuntualidad}%</td>
                    <td class="text-center tabular-nums">${p.tardanzasMes} tard. / ${p.faltasMes} faltas</td>
                    <td>${getSemaforoHtml(nivel, score)}</td>
                    <td class="small text-secondary">${state.examenesMode && p.modalidad === "PREPROFESIONAL" ? "Incremento de riesgo proyectado por temporada de exámenes parciales/finales" : p.factorPredictivo}</td>
                    <td class="tabular-nums">
                        <div class="small"><strong>Convenio:</strong> ${p.fechaFinProgramada}</div>
                        <div class="small ${p.fechaFinProyectada > p.fechaFinProgramada ? 'text-danger fw-semibold' : 'text-success fw-semibold'}">
                            <strong>Proyección:</strong> ${p.fechaFinProyectada}
                        </div>
                    </td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary fw-medium" onclick="emitirAlertaPreventiva('${p.id}', ${score})">
                            ${lucideSvg("send", 13, 1.75, "me-1")}Notificar Prevención
                        </button>
                    </td>
                </tr>
            `;
        }).join("");
    }

    window.toggleSemanaExamenes = function (checked) {
        state.examenesMode = checked;
        renderPredictivo();
    };

    window.emitirAlertaPreventiva = function (pracId, scoreActual) {
        const p = window.CIT_UNP_DATA.practicantes.find(item => item.id === pracId);
        if (!p) return;
        const nueva = {
            id: "ALR-" + Math.floor(1000 + Math.random() * 9000),
            fechaHora: "2026-11-16 " + new Date().toLocaleTimeString("es-PE", { hour12: false }),
            tipo: "ALERTA PREVENTIVA DE AUSENTISMO",
            practicante: p.nombres,
            area: p.areaNombre,
            canal: "WHATSAPP + CORREO",
            destinatario: `${p.supervisor} / ${p.nombres}`,
            mensajeWhatsapp: `*[CIT-UNP · AVISO PREVENTIVO DE SEGUIMIENTO HORARIO]*\nEl análisis de asistencia estima un *índice de riesgo de ausentismo de ${scoreActual}%* para *${p.nombres}*.\nFactor observado: _${p.factorPredictivo}_\nFecha estimada de culminación: *${p.fechaFinProyectada}*. Se recomienda coordinar programación de recuperación de horas.`,
            asuntoCorreo: `[CIT-UNP] Aviso Preventivo de Seguimiento Horario (${scoreActual}%) — ${p.nombres}`,
            atendida: false,
            horaAtencion: "-"
        };
        window.CIT_UNP_DATA.alertas.unshift(nueva);
        state.selectedAlertId = nueva.id;
        showToastAlerta(
            "Notificación preventiva enviada",
            `Se despachó el aviso preventivo por WhatsApp y correo institucional para coordinar el seguimiento horario de ${p.nombres}.`,
            "primary"
        );
        syncBackendAction("/api/v1/predictivo/alerta", { practicanteId: p.id, temporadaExamenesUnp: state.examenesMode });
        renderAll();
    };

    // 6. Renderizar Vista de Registro de Practicantes, Datos Personales y Convenios
    function renderConvenios() {
        const deps = window.CIT_UNP_DATA.dependencias;
        const containerDeps = document.getElementById("cardsDependenciasUnp");
        containerDeps.innerHTML = deps.map(d => {
            const count = window.CIT_UNP_DATA.practicantes.filter(p => p.dependenciaId === d.id).length;
            return `
                <div class="col-md-3">
                    <div class="card-custom p-3 h-100 kpi-card">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="badge ${d.id === 'CIT-UNP' ? 'bg-primary' : 'bg-light text-dark border'}">${d.id}</span>
                            <span class="fw-semibold text-dark small tabular-nums">${count} Practicantes</span>
                        </div>
                        <div class="fw-semibold small text-dark">${d.nombre}</div>
                        <div class="text-secondary mt-1" style="font-size:0.75rem;">${d.facultad}</div>
                    </div>
                </div>
            `;
        }).join("");
        renderDirectorioPracticantes();
    }

    window.renderDirectorioPracticantes = function () {
        const tbody = document.getElementById("tablaDirectorioPracticantesBody");
        if (!tbody) return;
        const searchInput = document.getElementById("inputBuscarPracticanteDir");
        const q = (searchInput ? searchInput.value : "").trim().toLowerCase();

        const pracs = window.CIT_UNP_DATA.practicantes.filter(p => {
            if (!q) return true;
            return (
                String(p.codigoUnp).toLowerCase().includes(q) ||
                String(p.dni).toLowerCase().includes(q) ||
                String(p.nombres).toLowerCase().includes(q) ||
                String(p.escuela).toLowerCase().includes(q)
            );
        });

        tbody.innerHTML = pracs.map(p => `
            <tr>
                <td class="tabular-nums">
                    <div class="fw-bold text-primary">${p.codigoUnp}</div>
                    <div class="small text-secondary">DNI: ${p.dni}</div>
                </td>
                <td>
                    <div class="fw-semibold text-dark">${p.nombres}</div>
                    <div class="small text-secondary">ID: ${p.id} · Inicio: ${p.fechaInicio}</div>
                </td>
                <td>
                    <div class="fw-medium small text-dark">${p.escuela || 'Ingeniería Informática'}</div>
                    <span class="badge bg-light text-secondary border mt-1">${p.cicloCondicion || '10.° Ciclo'}</span>
                </td>
                <td class="small">
                    <div class="text-dark fw-medium">${p.correo}</div>
                    <div class="text-secondary tabular-nums">${p.telefonoWhatsapp}</div>
                </td>
                <td class="small text-secondary">${p.direccionDistrito || 'Castilla, Piura'}</td>
                <td>
                    <span class="badge ${p.modalidad === 'PREPROFESIONAL' ? 'bg-primary-subtle text-primary border' : 'bg-success-subtle text-success border'} mb-1">
                        ${p.modalidad} (${p.topeSemanal} h/sem)
                    </span>
                    <div class="small text-dark fw-medium">${p.areaNombre}</div>
                </td>
            </tr>
        `).join("");
    };

    window.registrarNuevoConvenio = function (e) {
        e.preventDefault();
        const rbac = getCurrentRbac();
        if (!rbac.puedeCrearConvenios) {
            showToastAlerta("Acceso restringido", "Solo la Jefatura / Administración del CIT puede inscribir nuevos practicantes.", "danger");
            return;
        }
        const codigo = document.getElementById("nuevoCodigo").value.trim();
        const dni = document.getElementById("nuevoDni").value.trim();
        const apellidos = document.getElementById("nuevoApellidos").value.trim();
        const nombresPila = document.getElementById("nuevoNombres").value.trim();
        const correo = document.getElementById("nuevoCorreo").value.trim();
        const whatsapp = document.getElementById("nuevoWhatsapp").value.trim();
        const direccion = document.getElementById("nuevoDireccion").value.trim();
        const escuela = document.getElementById("nuevoEscuela").value;
        const ciclo = document.getElementById("nuevoCiclo").value;
        const modalidad = document.getElementById("nuevoModalidad").value;
        const depId = document.getElementById("nuevoDependencia").value;
        const areaId = document.getElementById("nuevoArea").value;
        const turno = document.getElementById("nuevoTurno").value;

        if (!nombresPila || !apellidos || !dni || !codigo) return;

        // Validar duplicidad de Código Universitario o DNI
        const existe = window.CIT_UNP_DATA.practicantes.some(p => p.codigoUnp === codigo || p.dni === dni);
        if (existe) {
            showToastAlerta(
                "Practicante ya registrado",
                `Ya existe un practicante en el padrón con el Código Universitario ${codigo} o DNI ${dni}.`,
                "warning"
            );
            return;
        }

        const nombreCompleto = `${nombresPila} ${apellidos}`.trim();
        const areaObj = window.CIT_UNP_DATA.areasCit.find(a => a.id === areaId) || window.CIT_UNP_DATA.areasCit[0];
        const isPre = modalidad === "PREPROFESIONAL";

        const nuevoPrac = {
            id: "PRAC-0" + (window.CIT_UNP_DATA.practicantes.length + 1),
            codigoUnp: codigo,
            dni: dni,
            nombres: nombreCompleto,
            facultadOrigen: "Facultad de Ingeniería Industrial",
            escuela: escuela,
            cicloCondicion: ciclo,
            direccionDistrito: direccion || "Castilla, Piura",
            dependenciaId: depId,
            areaId: areaObj.id,
            areaNombre: areaObj.nombre,
            supervisor: areaObj.supervisor,
            modalidad: modalidad,
            topeDiario: isPre ? 6 : 8,
            topeSemanal: isPre ? 30 : 48,
            horasSemanaActual: 0,
            metaHoras: isPre ? 360 : 480,
            horasAcumuladas: 0,
            turnoHoy: turno,
            horaInicioTurno: turno.substring(0, 5),
            toleranciaMin: 10,
            estadoHoy: "PUNTUAL",
            horaEntradaHoy: "Sin marcación hoy",
            horaSalidaHoy: "--:--",
            indicePuntualidad: 100.0,
            tardanzasMes: 0,
            faltasMes: 0,
            scoreRiesgoAusentismo: 5,
            nivelSemaforo: "VERDE",
            factorPredictivo: "Convenio activo dentro del límite semanal de " + (isPre ? "30 horas" : "48 horas"),
            fechaInicio: "2026-11-16",
            fechaFinProgramada: "2027-03-16",
            fechaFinProyectada: "2027-03-16",
            telefonoWhatsapp: whatsapp,
            correo: correo,
            promedioEvaluacionActividades: 5.0
        };

        window.CIT_UNP_DATA.practicantes.unshift(nuevoPrac);
        // Forzar refresco de los selectores de practicante en Marcación y Constancias
        document.getElementById("selectPracticanteMarcacion").innerHTML = "";
        document.getElementById("selectPracticanteConstancia").innerHTML = "";

        e.target.reset();
        showToastAlerta(
            "Practicante y convenio registrados",
            `Se inscribió a ${nombreCompleto} (Cód. UNP: ${codigo} · DNI: ${dni}) bajo modalidad ${modalidad} en el área de ${areaObj.nombre}.`,
            "success"
        );
        syncBackendAction("/api/v1/convenios", nuevoPrac);
        renderAll();
    };

    // 7. Renderizar Vista de Reportes y Constancia Oficial
    function renderReportes() {
        const tbodyAnexo05 = document.getElementById("tablaAnexo05Body");
        tbodyAnexo05.innerHTML = window.CIT_UNP_DATA.metricasAnexo05.map(m => `
            <tr class="tabular-nums">
                <td class="fw-medium text-dark">${m.documento}</td>
                <td>${m.indicador}</td>
                <td class="text-center"><span class="badge bg-light text-secondary border">${m.periodo}</span></td>
                <td class="text-center text-danger fw-semibold">${m.valorAntes}</td>
                <td class="text-center text-success fw-semibold">${m.valorDespues}</td>
                <td class="text-center"><span class="badge bg-success-subtle text-success border border-success-subtle">${m.mejora}</span></td>
            </tr>
        `).join("");

        const selectConst = document.getElementById("selectPracticanteConstancia");
        const pracs = window.CIT_UNP_DATA.practicantes;
        if (selectConst.options.length !== pracs.length) {
            selectConst.innerHTML = pracs.map(p =>
                `<option value="${p.id}" ${p.id === state.selectedPracticanteId ? "selected" : ""}>${p.nombres} (${p.modalidad})</option>`
            ).join("");
        }
        selectConst.value = state.selectedPracticanteId;
        actualizarVistaPreviaConstancia(state.selectedPracticanteId);
    }

    window.actualizarVistaPreviaConstancia = function (pracId) {
        const rbac = getCurrentRbac();
        if (state.currentRole === "PRACTICANTE" && rbac.practicanteIdAsociado) {
            pracId = rbac.practicanteIdAsociado;
        }
        state.selectedPracticanteId = pracId;
        const p = window.CIT_UNP_DATA.practicantes.find(item => item.id === pracId) || window.CIT_UNP_DATA.practicantes[0];
        const actsPrac = window.CIT_UNP_DATA.actividades.filter(a => a.practicanteId === p.id);
        const paha = Math.min(100, ((p.horasAcumuladas / p.metaHoras) * 100).toFixed(1));

        document.getElementById("constNombrePracticante").textContent = p.nombres.toUpperCase();
        document.getElementById("constDniCodigo").textContent = `con DNI N.° ${p.dni} y Código Universitario N.° ${p.codigoUnp}`;
        document.getElementById("constModalidad").textContent = `PRÁCTICAS ${p.modalidad}ES`;
        document.getElementById("constArea").textContent = p.areaNombre;
        document.getElementById("constSupervisor").textContent = p.supervisor;
        document.getElementById("constHoras").textContent = `${p.horasAcumuladas} horas efectivas acumuladas (Meta establecida en el convenio: ${p.metaHoras} horas — Nivel de avance: ${paha}%)`;
        document.getElementById("constMetricas").textContent = `Índice de Puntualidad: ${p.indicePuntualidad}% | Calificación Promedio de Actividades Técnicas: ${p.promedioEvaluacionActividades} / 5.0`;
        document.getElementById("constListaActividades").innerHTML = actsPrac.length
            ? actsPrac.map(a => `<li><strong>[${a.categoriaTecnica}]</strong> ${a.descripcion} <em>(Calificación del supervisor: ${a.calificacion || 5}/5 — Estado: ${a.estadoRevision})</em>.</li>`).join("")
            : `<li>Desarrollo de sistemas informáticos, soporte a la infraestructura de red y mantenimiento preventivo en el CIT - UNP.</li>`;
    };

    window.exportarReporteCsv = function () {
        const pracs = window.CIT_UNP_DATA.practicantes;
        const headers = ["ID", "Codigo_UNP", "DNI", "Practicante", "Modalidad", "Area_CIT", "Horas_Acumuladas", "Meta_Horas", "Puntualidad_Pct", "Promedio_Actividades_1_5", "Riesgo_Ausentismo_Pct", "Nivel_Semaforo"];
        const rows = pracs.map(p => [
            p.id, p.codigoUnp, p.dni, `"${p.nombres}"`, p.modalidad, `"${p.areaNombre}"`,
            p.horasAcumuladas, p.metaHoras, p.indicePuntualidad, p.promedioEvaluacionActividades,
            p.scoreRiesgoAusentismo, p.nivelSemaforo
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", "Consolidado_Asistencia_y_Actividades_CIT_UNP_2026.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToastAlerta(
            "Consolidado exportado correctamente",
            "Se descargó el archivo CSV/Excel con el registro de asistencia, horas acumuladas y calificaciones de actividades del CIT - UNP.",
            "success"
        );
    };

    function showToastAlerta(titulo, mensaje, tipoColor) {
        const toastEl = document.getElementById("liveSystemToast");
        const iconContainer = document.getElementById("liveToastIcon");
        document.getElementById("liveToastTitle").textContent = titulo;
        document.getElementById("liveToastBody").textContent = mensaje;

        toastEl.className = `toast toast-unp-card toast-type-${tipoColor || 'primary'}`;
        let iconName = "check-circle";
        let iconClass = "text-primary";
        if (tipoColor === "success") { iconName = "check-circle"; iconClass = "text-success"; }
        else if (tipoColor === "danger") { iconName = "alert-circle"; iconClass = "text-danger"; }
        else if (tipoColor === "warning") { iconName = "alert-triangle"; iconClass = "text-warning-emphasis"; }

        if (iconContainer) {
            iconContainer.className = `${iconClass} me-2 d-inline-flex align-items-center`;
            iconContainer.innerHTML = lucideSvg(iconName, 17, 1.8);
        }

        const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 5000 });
        toast.show();
    }

    function renderAll() {
        aplicarPoliticaRbacEnInterfaz();
        renderDashboard();
        renderMarcacion();
        renderActividades();
        renderAlertas();
        renderPredictivo();
        renderConvenios();
        renderReportes();
        if (window.lucide && typeof window.lucide.createIcons === "function") {
            window.lucide.createIcons({ attrs: { "stroke-width": 1.65 } });
        }
    }

    async function syncBackendAction(endpoint, payload) {
        if (window.location.protocol.startsWith("http")) {
            try {
                await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-User-Role": state.currentRole
                    },
                    body: JSON.stringify(payload)
                });
            } catch (_) {}
        }
    }

    document.addEventListener("DOMContentLoaded", function () {
        startClock();
        renderAll();
    });
})();
