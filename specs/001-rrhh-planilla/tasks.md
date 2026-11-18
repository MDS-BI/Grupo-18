---

description: "Task list for RR.HH. y Planilla feature implementation"
---

# Tasks: Módulo de Recursos Humanos y Planilla

**Input**: Design documents from `/specs/001-rrhh-planilla/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`, `.specify/memory/constitution.md`

**Tests**: Incluidas porque `spec.md` define una Prueba Independiente por historia y la constitución exige verificación automatizada.

**Organization**: Tareas agrupadas por historia de usuario, en orden de prioridad P1 → P2 → P3.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias incompletas)
- **[Story]**: Historia de usuario (US1–US12) solo en fases de usuario
- Incluir rutas de archivo exactas en cada descripción

## Path Conventions

- Proyecto único: `src/`, `tests/` en la raíz del repositorio
- Persistencia local: claves `erp_base_module:*` y `erp_rrhh:*`
- Extensiones RR.HH.: `src/rrhh/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar toolchain Vite/Vitest, configuración del módulo de RR.HH. y arranque de la aplicación.

- [ ] T001 Verificar y actualizar dependencias Vite, Vitest y jsdom en `package.json` y `package-lock.json`
- [ ] T002 [P] Configurar scripts `dev`, `build`, `test:run`, `lint` y `format:check` en `package.json` usando `eslint.config.js` y `.prettierrc.json`
- [ ] T003 [P] Preparar el entorno jsdom y la limpieza de `localStorage` en `tests/setup/setup.js`
- [ ] T004 [P] Declarar la configuración RR.HH. (nombre del módulo, etiquetas de Trabajador, Contrato, Novedad y Liquidación, y datos de la empresa emisora) en `src/module-config.js`
- [ ] T005 Implementar el arranque de la aplicación y los estilos globales en `src/main.js` y `src/styles.css`
- [ ] T006 Verificar el documento de entrada y el montaje del workspace en `index.html`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Núcleo compartido que BLOCKS todas las historias de usuario.

**⚠️ CRITICAL**: No iniciar ninguna historia hasta completar esta fase.

- [ ] T007 Implementar la capa de almacenamiento compartida que usan las colecciones de RR.HH. (carga, guardado, IDs y marcas de tiempo) en `src/storage.js`
- [ ] T008 [P] Implementar la sanitización de los textos libres de RR.HH. (nombres, observaciones y motivos) en listados, formularios, búsquedas y detalles en `src/utils/sanitize.js`
- [ ] T009 Implementar el núcleo de auditoría de solo inserción con retención y aborto de operación si falla la escritura en `src/rrhh/seguridad/auditoria.js`
- [ ] T010 [P] Definir los roles simulados y su catálogo de permisos en `src/rrhh/seguridad/roles.js`
- [ ] T011 Implementar la sesión simulada, selección de representado y cambio de rol en `src/rrhh/seguridad/session.js`
- [ ] T012 Implementar las guardas de visibilidad por rol en listados, detalles, búsquedas y vistas imprimibles en `src/rrhh/seguridad/acceso-datos.js`
- [ ] T013 Implementar las colecciones RR.HH. con prefijo `erp_rrhh:*` en `src/rrhh/storage-rrhh.js`
- [ ] T014 [P] Implementar el esquema, los tipos y la validación de parámetros legales en `src/rrhh/calculo/parametros.js`
- [ ] T015 Implementar la carga, selección y bloqueo de un conjunto completo de parámetros por mes y año en `src/rrhh/calculo/parametros-mes.js`, usando el esquema de T014
- [ ] T016 [P] Cargar datos semilla de catálogos, conceptos, parámetros y casos de referencia en `src/rrhh/data/seed.js`
- [ ] T017 Implementar exportación/importación JSON versionada sin sobrescribir auditoría en `src/backup.js`
- [ ] T018 Implementar el marco de workspace y el router de módulos RR.HH. en `src/rrhh/views/workspace.js` y `src/rrhh/views/rrhh-router.js`
- [ ] T019 Validar el flujo de inicio rápido de RR.HH. (selección de rol, ficha de Trabajador, contrato, novedad y persistencia) en `tests/integration/rrhh-quickstart.test.js`

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 — Fichas y Catálogos (Priority: P1) MVP

**Goal**: Registrar, buscar, actualizar y desactivar Trabajadores y mantener catálogos base sin duplicados.

**Independent Test**: Con catálogos semilla, crear un trabajador, buscarlo por nombre/código/RUT, editarlo, desactivarlo y verificar que conserva historia; crear/editar/desactivar un catálogo.

### Tests for User Story 1

- [ ] T020 [P] [US1] Crear pruebas unitarias de RUT, unicidad normalizada y desactivación en `tests/unit/rrhh-trabajadores.test.js`
- [ ] T021 [P] [US1] Crear prueba de integración del flujo completo de fichas y catálogos en `tests/integration/rrhh-trabajadores-flow.test.js`

### Implementation for User Story 1

- [ ] T022 [P] [US1] Implementar validación de RUT módulo 11 y normalización en `src/rrhh/calculo/rut.js`
- [ ] T023 [US1] Implementar servicios de ficha, jefatura y baja lógica en `src/rrhh/utils/trabajadores-service.js`
- [ ] T024 [US1] Implementar servicios de cargos, departamentos y centros de costo en `src/rrhh/utils/catalogos-service.js`
- [ ] T025 [P] [US1] Construir formulario de Trabajador con validaciones y selector de jefatura en `src/rrhh/components/trabajador-form.js`
- [ ] T026 [US1] Construir vistas de fichas y catálogos en `src/rrhh/views/trabajadores-view.js` y `src/rrhh/views/catalogos-view.js`
- [ ] T028 [US1] Registrar creación, actualización y desactivación en bitácora desde `src/rrhh/utils/alertas-service.js` y `src/rrhh/seguridad/auditoria.js`

**Checkpoint**: US1 fully functional and independently testable.

---

## Phase 4: User Story 2 — Contratos y Alertas (Priority: P1)

**Goal**: Registrar contratos, cambios de condiciones, renovaciones y alertas de vencimiento sin solapes.

**Independent Test**: Con fichas semilla, registrar un contrato a plazo fijo, ver historial y alerta "por vencer"/"vencido" sin recorrer novedades ni liquidaciones.

### Tests for User Story 2

- [ ] T029 [P] [US2] Crear pruebas unitarias de vigencias, estados y no superposición en `tests/unit/rrhh-contratos.test.js`
- [ ] T030 [P] [US2] Crear prueba de integración de registro, renovación, término y alertas en `tests/integration/rrhh-contratos-flow.test.js`

### Implementation for User Story 2

- [ ] T031 [US2] Implementar servicios de contratos, cambios y renovaciones en `src/rrhh/utils/contratos-service.js`
- [ ] T032 [US2] Implementar alertas de próximo vencimiento y vencido en `src/rrhh/utils/alertas-service.js`
- [ ] T033 [P] [US2] Construir formulario de contrato en `src/rrhh/components/contrato-form.js`
- [ ] T034 [US2] Construir vista de historial de contratos en `src/rrhh/views/contratos-view.js`
- [ ] T035 [US2] Aplicar transiciones, término automático por baja y auditoría en `src/rrhh/utils/contratos-service.js` y `src/rrhh/seguridad/auditoria.js`

**Checkpoint**: US1 and US2 independently functional.

---

## Phase 5: User Story 3 — Novedades y Aprobación (Priority: P1)

**Goal**: Registrar horas extra, licencias y ausencias; aprobar o rechazar con segregación de funciones.

**Independent Test**: Con trabajadores y contratos semilla, registrar novedades, aprobar/rechazar y verificar bloqueo por pendientes y por período cerrado.

### Tests for User Story 3

- [ ] T036 [P] [US3] Crear pruebas unitarias de estados, split mensual y aprobación en `tests/unit/rrhh-novedades.test.js` y `tests/unit/rrhh-novedades-aprobacion.test.js`
- [ ] T037 [P] [US3] Crear prueba de integración de registro sin diagnóstico y superposiciones en `tests/integration/rrhh-novedades-registro.test.js`
- [ ] T038 [P] [US3] Crear prueba de integración de aprobación, rechazo y cascada de baja en `tests/integration/rrhh-novedades-aprobacion.test.js` y `tests/integration/rrhh-novedades-cascade.test.js`

### Implementation for User Story 3

- [ ] T039 [US3] Implementar privacidad de licencias y split atómico por mes en `src/rrhh/utils/novedades-privacidad.js` y `src/rrhh/utils/novedades-data.js`
- [ ] T040 [US3] Implementar aprobación/rechazo segregada y justificación de horas extra en `src/rrhh/utils/novedades-aprobacion.js`
- [ ] T041 [US3] Implementar servicio de novedades y bloqueo por período cerrado en `src/rrhh/utils/novedades-service.js`
- [ ] T042 [P] [US3] Construir formulario y listado de novedades en `src/rrhh/components/novedad-form.js` y `src/rrhh/components/novedad-list.js`
- [ ] T043 [US3] Construir vista de novedades y auditoría en `src/rrhh/views/novedades.js` y `src/rrhh/seguridad/auditoria.js`

**Checkpoint**: US1–US3 independently functional.

---

## Phase 6: User Story 4 — Cálculo y Ciclo de Liquidaciones (Priority: P1)

**Goal**: Calcular masivamente un período, generar liquidaciones explicables y cerrar congelando parámetros.

**Independent Test**: Ejecutar cálculo sobre datos semilla, comparar con caso de referencia cuadrado al peso, cerrar período y verificar bloqueo de cambios.

### Tests for User Story 4

- [ ] T044 [P] [US4] Crear pruebas unitarias del motor y caso de referencia en `tests/unit/rrhh-calculo.test.js` y `tests/unit/rrhh-calculo-referencia.test.js`
- [ ] T045 [P] [US4] Crear pruebas unitarias de períodos y estados en `tests/unit/rrhh-periodos.test.js`
- [ ] T046 [P] [US4] Crear prueba de integración de cálculo masivo en `tests/integration/rrhh-calculo-periodo.test.js`
- [ ] T047 [P] [US4] Crear prueba de integración de cierre y congelamiento en `tests/integration/rrhh-cierre-periodo.test.js`

### Implementation for User Story 4

- [ ] T048 [US4] Implementar servicios de períodos, duplicados, estados y registro obligatorio de `fechaPago` en el período cerrado en `src/rrhh/utils/periodos-service.js` (FR-104)
- [ ] T049 [US4] Implementar motor de cálculo proporcional, cotizaciones, impuesto y redondeo en `src/rrhh/calculo/motor.js`
- [ ] T050 [US4] Implementar ciclo de vida, recálculo y desactualización de liquidaciones en `src/rrhh/utils/liquidacion-service.js` y `src/rrhh/utils/liquidacion-estados.js`
- [ ] T051 [US4] Construir vistas de períodos, planilla y resumen con campo editable de `fechaPago` en `src/rrhh/views/periodos.js`, `src/rrhh/views/planilla.js` y `src/rrhh/components/calculo-resumen.js` (FR-104)

**Checkpoint**: US1–US4 independently functional.

---

## Phase 7: User Story 6 — Seguridad, Roles y Gobierno (Priority: P1)

**Goal**: Restringir datos sensibles por rol simulado y auditar consultas, cambios y denegaciones.

**Independent Test**: Simular cada rol, verificar visibilidad y denegaciones (incluidos enlaces directos) y comprobar entradas en bitácora.

### Tests for User Story 6

- [ ] T052 [P] [US6] Crear pruebas unitarias de seguridad y auditoría en `tests/unit/rrhh-seguridad.test.js` y `tests/unit/rrhh-auditoria.test.js`
- [ ] T053 [P] [US6] Crear prueba de integración de matriz de roles en `tests/integration/rrhh-seguridad-jefatura.test.js`
- [ ] T054 [P] [US6] Crear prueba de integración de accesos denegados y auditoría en `tests/integration/rrhh-auditoria.test.js`

### Implementation for User Story 6

- [ ] T055 [US6] Refinar catálogo de roles y permisos efectivos en `src/rrhh/seguridad/roles.js`
- [ ] T056 [US6] Construir selector de rol y representado en `src/rrhh/components/rol-switcher.js`
- [ ] T057 [US6] Aplicar visibilidad transversal y denegación sin filtrar contenido en `src/rrhh/seguridad/acceso-datos.js`
- [ ] T058 [US6] Construir vista de consulta de bitácora en `src/rrhh/views/auditoria.js`
- [ ] T059 [US6] Registrar exportación/importación y preservar auditoría previa en `src/backup.js`

**Checkpoint**: Gobierno de datos activo para todas las historias.

---

## Phase 8: User Story 12 — Parámetros Legales (Priority: P1)

**Goal**: Versionar parámetros legales como conjunto completo por mes/año, cargado manualmente por administrador.

**Independent Test**: Cargar parámetros de un mes, crear período, verificar que usa ese conjunto y que un cambio posterior no afecta el período cerrado.

### Tests for User Story 12

- [ ] T060 [P] [US12] Crear pruebas unitarias de conjunto mensual y validación en `tests/unit/rrhh-calculo-parametros.test.js`
- [ ] T061 [P] [US12] Crear prueba de integración de vigencia y congelamiento en `tests/integration/rrhh-parametros-vigencia.test.js`

### Implementation for User Story 12

- [ ] T062 [US12] Implementar servicios de carga y validación mensual en `src/rrhh/utils/parametros-service.js`
- [ ] T063 [P] [US12] Construir formulario de parámetros legales en `src/rrhh/components/parametros-form.js`
- [ ] T064 [US12] Construir vista de administración de parámetros en `src/rrhh/views/parametros.js`
- [ ] T065 [US12] Aplicar validación al crear/calcular períodos y auditar cargas en `src/rrhh/calculo/parametros-mes.js` y `src/rrhh/seguridad/auditoria.js`

**Checkpoint**: Todos los P1 funcionales y auditables.

---

## Phase 9: User Story 5 — Explicación e Impresión (Priority: P2)

**Goal**: Explicar cada línea de liquidación y generar comprobante limpio imprimible/PDF.

**Independent Test**: Con liquidaciones semilla, seleccionar línea, ver base/fórmula/parámetro, imprimir comprobante y verificar permisos y marca de borrador.

### Tests for User Story 5

- [ ] T066 [P] [US5] Crear pruebas unitarias de explicación y snapshots en `tests/unit/rrhh-liquidacion.test.js`
- [ ] T067 [P] [US5] Crear pruebas de integración de vista e impresión en `tests/integration/rrhh-liquidacion-view.test.js` y `tests/integration/rrhh-liquidacion-print.test.js`

### Implementation for User Story 5

- [ ] T068 [US5] Implementar desglose y snapshots por línea en `src/rrhh/utils/liquidacion-calculo.js` y `src/rrhh/utils/liquidacion-data.js`
- [ ] T069 [US5] Construir vista explicativa por línea en `src/rrhh/views/liquidacion.js`
- [ ] T070 [US5] Construir vista imprimible/PDF en `src/rrhh/views/liquidaciones.js` y `src/styles.css`
- [ ] T071 [US5] Aplicar permisos y auditoría de consulta en `src/rrhh/seguridad/acceso-datos.js` y `src/rrhh/seguridad/auditoria.js`
- [ ] T072 [US5] Cubrir líneas manuales, parámetros faltantes y estados sin impresión en `tests/integration/rrhh-liquidacion-edge-cases.test.js`

**Checkpoint**: US5 independently functional.

---

## Phase 10: User Story 7 — Vacaciones (Priority: P2)

**Goal**: Gestionar saldo, solicitudes, aprobación, feriados y recalculo cuando cambia el calendario.

**Independent Test**: Con trabajadores y feriados semilla, consultar saldo, solicitar, aprobar/rechazar/anular y verificar recalculo por feriado agregado y saldo congelado al desvincular.

### Tests for User Story 7

- [ ] T073 [P] [US7] Crear pruebas unitarias de saldo y días hábiles en `tests/unit/rrhh-vacaciones-saldo.test.js` y `tests/unit/rrhh-vacaciones-dias-habiles.test.js`
- [ ] T074 [P] [US7] Crear pruebas unitarias de aprobación y validaciones en `tests/unit/rrhh-vacaciones-aprobacion.test.js` y `tests/unit/rrhh-vacaciones-validaciones.test.js`
- [ ] T075 [P] [US7] Crear prueba de integración del flujo completo en `tests/integration/rrhh-vacaciones-flow.test.js`

### Implementation for User Story 7

- [ ] T076 [US7] Implementar calendario de feriados y unicidad por fecha en `src/rrhh/utils/feriados-service.js`
- [ ] T077 [US7] Implementar devengo, saldo, solicitudes y recalculo por feriado en `src/rrhh/utils/vacaciones-service.js`
- [ ] T078 [P] [US7] Construir formulario de solicitud en `src/rrhh/components/vacacion-form.js`
- [ ] T079 [US7] Construir vista de saldo, solicitudes y feriados en `src/rrhh/views/vacaciones.js`
- [ ] T080 [US7] Agregar alerta de saldo máximo, congelamiento por baja y auditoría en `src/rrhh/utils/alertas-service.js` y `src/rrhh/seguridad/auditoria.js`

**Checkpoint**: US7 independently functional.

---

## Phase 11: User Story 8 — Cargas y Asignación Familiar (Priority: P2)

**Goal**: Registrar cargas vigentes y pagar automáticamente asignación familiar por tramo.

**Independent Test**: Con trabajadores de tramo A y D semilla, registrar cargas, calcular y verificar que solo el tramo A recibe `ASIG_FAMILIAR`, con carga de invalidez doble.

### Tests for User Story 8

- [ ] T081 [P] [US8] Crear pruebas unitarias de cargas, vigencia y asignación en `tests/unit/rrhh-cargas-familiares.test.js`
- [ ] T082 [P] [US8] Crear prueba de integración del flujo de asignación en `tests/integration/rrhh-cargas-familiares.test.js`

### Implementation for User Story 8

- [ ] T083 [US8] Implementar servicios de cargas, RUT y unicidad vigente en `src/rrhh/utils/cargas-service.js`
- [ ] T084 [US8] Implementar tramos de asignación familiar por conjunto mensual en `src/rrhh/calculo/parametros-mes.js`, usando el esquema de T014
- [ ] T085 [US8] Agregar línea `ASIG_FAMILIAR` como haber no imponible en `src/rrhh/calculo/motor.js`
- [ ] T086 [P] [US8] Construir vista y formulario de cargas en `src/rrhh/views/cargas.js` y `src/rrhh/components/carga-form.js`
- [ ] T087 [US8] Aplicar permisos de terceros y auditoría en `src/rrhh/seguridad/acceso-datos.js` y `src/rrhh/seguridad/auditoria.js`

**Checkpoint**: US8 independently functional.

---

## Phase 12: User Story 10 — Reportes de Gestión y Equidad (Priority: P2)

**Goal**: Mostrar reportes agregados sobre períodos cerrados sin exponer personas identificables.

**Independent Test**: Con tres períodos cerrados y cargos/géneros semilla, ver dotación, costo, horas extra, ausentismo y brecha; verificar ocultamiento de grupos menores a 5 y permisos por rol.

### Tests for User Story 10

- [ ] T088 [P] [US10] Crear pruebas unitarias de indicadores agregados en `tests/unit/rrhh-reportes.test.js`
- [ ] T089 [P] [US10] Crear pruebas unitarias de permisos y ocultamiento de género en `tests/unit/rrhh-reportes-permisos.test.js`
- [ ] T090 [P] [US10] Crear prueba de integración de reportes y estado vacío en `tests/integration/rrhh-reportes-flow.test.js`

### Implementation for User Story 10

- [ ] T091 [P] [US10] Implementar funciones de mediana y variación porcentual en `src/rrhh/calculo/estadisticas.js`
- [ ] T092 [US10] Implementar servicios de reportes sobre períodos cerrados en `src/rrhh/utils/reportes-service.js`
- [ ] T093 [P] [US10] Declarar el campo opcional sensible `genero` en `src/module-config.js` y consumirlo en `src/rrhh/components/trabajador-form.js` (FR-099)
- [ ] T094 [P] [US10] Construir componente de gráficos en `src/rrhh/components/grafico-reporte.js`
- [ ] T095 [US10] Construir vista de reportes con filtros en `src/rrhh/views/reportes.js`
- [ ] T096 [US10] Integrar ruta, permisos y auditoría de brecha en `src/rrhh/views/rrhh-router.js` y `src/rrhh/seguridad/auditoria.js`

**Checkpoint**: US10 independently functional.

---

## Phase 13: User Story 11 — Exportaciones Contables y de Pago (Priority: P2)

**Goal**: Exportar desde períodos cerrados un resumen contable y una nómina de pago en CSV.

**Independent Test**: Cerrar un período semilla, descargar ambos CSV y verificar columnas, totales y registro en bitácora.

### Tests for User Story 11

- [ ] T097 [P] [US11] Crear pruebas unitarias de generación CSV en `tests/unit/rrhh-exportaciones.test.js`
- [ ] T098 [P] [US11] Crear prueba de integración de exportación desde período cerrado en `tests/integration/rrhh-exportaciones.test.js`

### Implementation for User Story 11

- [ ] T099 [US11] Implementar servicio de exportación con cuenta/centro de costo y nómina, usando `PERIODO.fechaPago`, en `src/rrhh/utils/exportaciones-service.js` (FR-104)
- [ ] T100 [US11] Agregar acciones de descarga en la vista de planilla en `src/rrhh/views/planilla.js`
- [ ] T101 [US11] Aplicar permisos y auditoría de exportación en `src/rrhh/seguridad/acceso-datos.js` y `src/rrhh/seguridad/auditoria.js`

**Checkpoint**: US11 independently functional.

---

## Phase 14: User Story 9 — Simulador de Sueldo (Priority: P3)

**Goal**: Simular líquido ↔ bruto sin crear registros ni reemplazar la liquidación oficial.

**Independent Test**: Usar el caso de referencia, simular bruto→líquido y líquido→bruto, verificar coincidencia al peso y que no se crean registros.

### Tests for User Story 9

- [ ] T102 [P] [US9] Crear pruebas unitarias del simulador en `tests/unit/rrhh-simulador.test.js`
- [ ] T103 [P] [US9] Crear prueba de integración sin persistencia en `tests/integration/rrhh-simulador.test.js`

### Implementation for User Story 9

- [ ] T104 [US9] Implementar simulación directa bruto→líquido en `src/rrhh/calculo/simulador.js`
- [ ] T105 [US9] Implementar búsqueda inversa líquido→bruto en `src/rrhh/calculo/simulador-inverso.js`
- [ ] T106 [P] [US9] Construir vista del simulador y copia de desglose en `src/rrhh/views/simulador.js` (FR-095/FR-096)
- [ ] T107 [US9] Integrar ruta, permisos y marca de simulación referencial en `src/rrhh/views/rrhh-router.js` y `src/rrhh/seguridad/acceso-datos.js`

**Checkpoint**: Todas las historias US1–US12 independently functional.

---

## Phase 15: Polish & Cross-Cutting Concerns

**Purpose**: Verificación final, calidad, rendimiento y cierre documental.

- [ ] T108 [P] Actualizar documentación funcional, modelo de datos y contratos en `docs/rrhh.md`, `specs/001-rrhh-planilla/data-model.md` y `specs/001-rrhh-planilla/contracts/`
- [ ] T109 [P] Ejecutar y corregir la suite completa en `tests/unit/` y `tests/integration/`, con aserciones de SC-011 (<1 s por línea), SC-012 (<30 s por PDF), SC-020 (<5 min para reconstruir trazabilidad), SC-021 (≥95% de pruebas de acceso) y SC-022 (<5 min para exportar/restaurar respaldo)
- [ ] T110 [P] Verificar `lint` y `format:check` usando `package.json`
- [ ] T111 Verificar rendimiento en `tests/integration/rrhh-rendimiento.test.js`: explicación por línea <1 s (SC-011), PDF <30 s (SC-012) y cálculo de 500 trabajadores <10 s (SC-023)
- [ ] T112 Validar el flujo completo de `quickstart.md` en `tests/integration/rrhh-quickstart.test.js`
- [ ] T113 Endurecer seguridad de datos sensibles, sanitización y enlaces directos en `src/rrhh/seguridad/` y `src/utils/sanitize.js`
- [ ] T114 Verificar accesibilidad WCAG 2.2 AA en `src/styles.css` y `src/rrhh/components/`
- [ ] T115 Validar retención de auditoría y respaldo sin sobrescritura en `src/backup.js` y `src/rrhh/seguridad/auditoria.js`, con aserciones de SC-020 (<5 min para reconstruir trazabilidad) y SC-022 (<5 min para exportar/restaurar respaldo)
- [ ] T116 Completar matriz de trazabilidad FR/XR/SC en `docs/rrhh.md` y `specs/001-rrhh-planilla/spec.md`
- [ ] T117 Refactorizar ayudantes compartidos en `src/rrhh/utils/common.js`
- [ ] T118 Finalizar datos semilla de todas las historias en `src/rrhh/data/seed.js`
- [ ] T119 [P] Preparar README y checklist de release en `README.md` y `docs/rrhh.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias
- **Foundational (Phase 2)**: depende de Setup; BLOCKS todas las historias
- **User Stories (Phases 3–14)**: dependen de Foundational
- **Polish (Phase 15)**: depende de todas las historias incluidas

### User Story Completion Order

```text
Setup (T001–T006)
  ↓
Foundational (T007–T019)
  ↓
P1: US1 → US2 → US3 → US4
         ↘ US6 (cross-cutting, paralela desde Foundational)
          ↘ US12 (paralela; valida US2/US4)
  ↓
P2: US5 (tras US4) · US7 (tras US3/US6) · US8 (tras US4)
    US10 (tras US4/US7) · US11 (tras US4)
  ↓
P3: US9 (tras parámetros base)
  ↓
Polish (T108–T119)
```

### Within Each User Story

1. Pruebas unitarias/de integración primero
2. Modelos/servicios antes que componentes y vistas
3. Core implementation antes de integración con router/auditoría
4. Checkpoint de historia antes de avanzar a la siguiente prioridad

### Parallel Opportunities

- Setup: T002–T004
- Foundational: T008, T010, T014, T016
- Cada historia: pruebas marcadas `[P]` y componentes independientes marcados `[P]`
- Historias P2/P3 pueden avanzar en paralelo una vez cerrados sus prerrequisitos

### Parallel Examples per Story

| Story | Parallelizable tasks |
|---|---|
| US1 | T020 + T021; T022 + T025 |
| US2 | T029 + T030; T033 |
| US3 | T036 + T037 + T038; T042 |
| US4 | T044 + T045 + T046 + T047 |
| US5 | T066 + T067 |
| US6 | T052 + T053 + T054 |
| US7 | T073 + T074 + T075; T078 |
| US8 | T081 + T082; T086 |
| US9 | T102 + T103; T106 |
| US10 | T088 + T089 + T090; T091 + T093 + T094 |
| US11 | T097 + T098 |
| US12 | T060 + T061; T063 |

---

## Implementation Strategy

### MVP First (US1 + Foundational)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US1
4. **STOP and VALIDATE**: ejecutar T020/T021 y verificar US1 de forma independiente
5. Demo del workspace ERP base con fichas y catálogos

### Incremental Delivery

1. Setup + Foundational → núcleo listo
2. US1 → activos maestros → validar
3. US2 + US12 → contratos y parámetros → validar
4. US3 → novedades aprobadas → validar
5. US4 → motor/cierre → primer valor completo de planilla
6. US6 → gobierno de datos transversal
7. US5, US7, US8, US10, US11, US9 → incrementos P2/P3
8. Polish → release

### Parallel Team Strategy

1. Equipo completo ejecuta Setup + Foundational
2. Dev A: US1 → US2 → US3 → US4
3. Dev B: US6 + US12 + US5
4. Dev C: US7 → US8 → US10 → US11 → US9
5. Integrar detrás del router y la bitácora comunes en cada checkpoint

---

## Notes

- `[P]` = archivos distintos y sin dependencias incompletas
- `[Story]` = trazabilidad hacia `spec.md`
- Cada historia termina con un checkpoint independent test
- Verificar que las pruebas fallan antes de la implementación
- Evitar tareas vagas, conflictos de mismo archivo y dependencias entre historias que rompan independencia
