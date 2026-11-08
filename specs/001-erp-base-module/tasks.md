# Tareas: Módulo de Recursos Humanos y Planilla (ERP)

**Entrada**: Documentos de diseño desde `/specs/001-erp-base-module/`
**Prerrequisitos**: plan.md (obligatorio), spec.md (obligatorio para las historias de usuario), research.md, data-model.md, contracts/
**Alcance**: Módulo Base ERP (FR-001–FR-039, XR-001–XR-005) más las Historias de Usuario 1 a 6 de `spec.md`, incluidas las clarificaciones del 2026-11-08 (sesión simulada, parámetros manuales, retención de auditoría y respaldo JSON). Las tareas del módulo base se conservan en la Fase 2B y se mapean explícitamente a sus requisitos.
**Actualizado**: 2026-11-08

## Formato: `[ID] [P?] [Historia] Descripción con ruta de archivo`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[US1]–[US6]**: Historia de Usuario a la que pertenece la tarea
- Todas las rutas del módulo de RR.HH./Planilla son explícitas bajo `src/rrhh/`
- Las pruebas se incluyen por mandato de la constitución (Principio II) y del plan de verificación con Vitest + jsdom

## Convenciones de Rutas

- Código base del módulo: `src/`
- Extensión RR.HH./Planilla: `src/rrhh/calculo/`, `src/rrhh/components/`, `src/rrhh/seguridad/`, `src/rrhh/utils/`, `src/rrhh/views/`
- Pruebas: `tests/unit/`, `tests/integration/`, `tests/setup/`

---

## Fase 1: Configuración (Infraestructura Compartida)

**Propósito**: Inicializar la aplicación Vite y las herramientas compartidas.

- [-] T001 Crear la estructura Vite con `index.html`, `src/`, `src/rrhh/calculo/`, `src/rrhh/components/`, `src/rrhh/seguridad/`, `src/rrhh/utils/`, `src/rrhh/views/`, `tests/unit/`, `tests/integration/` y `tests/setup/` — estructura existente; `tests/setup/` no se usa (jsdom se monta por prueba)
- [-] T002 [P] Configurar Vite, Vitest y jsdom y registrar los scripts de desarrollo, prueba y compilación en `package.json` y `vite.config.js` — implementado con `vitest.config.mjs` y scripts en `package.json`
- [-] T003 [P] Configurar linting y formateo para JavaScript ES2022 en `.eslintrc.json` — implementado con `eslint.config.js` (flat config)
- [X] T004 [P] Configurar la adaptación de RR.HH. (nombre de módulo, etiquetas de Trabajador/Contrato/Novedad/Liquidación y color de acento) en `src/module-config.js`

---

## Fase 2: Fundacional (Prerrequisitos Bloqueantes)

**Propósito**: Infraestructura común que debe existir antes de implementar cualquier historia.

**⚠️ CRÍTICO**: Ninguna historia de usuario puede comenzar hasta completar esta fase.

- [X] T005 Implementar la capa de almacenamiento base (CRUD de entidades y documentos, identidad, marcas de tiempo, integridad referencial y eliminación en cascada) en `src/storage.js`
- [X] T006 [P] Crear los estilos compartidos y tokens de diseño (tipografía, formularios, estados vacíos y de error) en `src/styles.css`
- [X] T007 [P] Implementar el arranque de la aplicación y la navegación de vistas en `src/main.js` y `src/app.js`
- [X] T008 [P] Construir el marco del espacio de trabajo ERP (barra superior, logotipo SVG y barra lateral) en `src/components/shell.js`
- [X] T009 [P] Construir el panel de inicio con acciones rápidas y estadísticas en vivo en `src/components/dashboard.js`
- [X] T010 [P] Definir los campos personalizados de RR.HH. y el ciclo de vida documental de liquidaciones en `src/module-config.js`
- [-] T011 [P] Configurar el entorno de pruebas Vitest + jsdom y los fixtures compartidos en `tests/setup/jsdom.js` y `tests/setup/fixtures.js` — jsdom se configura inline en cada prueba; no existen `tests/setup/`

**Punto de control**: La base está lista; las historias de usuario pueden iniciarse.

---

## Fase 2B: Módulo Base ERP (FR-001–FR-039)

**Propósito**: Completar las capacidades base que el `spec.md` exige y que las tareas de RR.HH. no cubren.

- [ ] T085 [P] CRUD de entidades con validación de nombre/código en `src/components/entity-form.js` y `src/components/entity-list.js` (FR-001, FR-002, FR-003, FR-017)
- [ ] T086 [P] CRUD de documentos vinculados a entidad en `src/components/document-form.js` y `src/components/document-list.js` (FR-008, FR-018)
- [ ] T087 Pantalla de gestión consolidada sin listar entidades en `src/app.js` (FR-016)
- [ ] T088 [P] Búsqueda por nombre, código, categoría, descripción y fecha objetivo en `src/components/search-bar.js` (FR-004, FR-020, FR-021)
- [ ] T089 Navegación Panel/Entidades/Documentos/Buscar con módulo activo resaltado en `src/components/shell.js` (FR-012, FR-013, FR-014, FR-015, FR-037)
- [ ] T090 Mensajes de validación base, estados vacíos y feedback de error en `src/app.js` y `src/styles.css` (FR-005, FR-006)
- [ ] T091 [P] Renderizado y validación de campos personalizados en `src/components/entity-form.js` y `src/components/document-form.js` (FR-026, FR-027)
- [ ] T092 Campos personalizados en listas, detalle y resultados de búsqueda en `src/components/entity-list.js`, `src/components/document-list.js` y `src/components/search-bar.js` (FR-028)
- [ ] T093 Etiquetas visibles derivadas de la configuración en `src/module-config.js` y `src/components/shell.js` (FR-029, XR-002)
- [ ] T094 Transiciones de ciclo de vida y estado libre sin lifecycle en `src/module-config.js` y `src/components/document-form.js` (FR-030, FR-031)
- [ ] T095 [P] Color de acento con fallback y barra lateral responsive en `src/styles.css` (FR-038, FR-039)
- [ ] T096 Reporte de configuración inválida/conflictiva y reglas de validación extensibles en `src/module-config.js` y `src/app.js` (FR-025, XR-003)
- [ ] T097 [P] Prueba de rendimiento de listas y búsqueda con 500 registros en `tests/integration/base-rendimiento.test.js` (FR-032, SC-004)
- [ ] T098 Verificar adaptación solo-configuración sin tocar código central en `src/module-config.js` y `tests/integration/base-adaptacion.test.js` (SC-008, XR-001, XR-004, XR-005)

**Punto de control**: El módulo base queda funcional y trazado a FR-001–FR-039.

---

## Fase 3: Historia de Usuario 1 - Gestión de Fichas de Trabajadores y Catálogos Base (Prioridad: P1) 🎯 MVP

**Objetivo**: Registrar, buscar y actualizar fichas de trabajadores y los catálogos base (cargos, departamentos y centros de costo).

**Prueba Independiente**: Abrir el módulo, crear un trabajador y un catálogo, verlos en la lista, buscarlos y actualizarlos sin depender de otras historias.

### Pruebas para la Historia de Usuario 1

- [X] T012 [P] [US1] Crear pruebas unitarias de validación de trabajadores, RUT y catálogos en `tests/unit/rrhh-trabajadores.test.js`
- [X] T013 [P] [US1] Crear prueba de integración del flujo de alta, búsqueda y actualización de trabajadores en `tests/integration/rrhh-trabajadores-flow.test.js`

### Implementación para la Historia de Usuario 1

- [X] T014 [P] [US1] Definir el esquema de datos de trabajador (reutilizando Entity) y las claves de almacenamiento en `src/rrhh/utils/trabajadores-service.js`
- [X] T015 [P] [US1] Implementar el almacenamiento y CRUD de catálogos de cargos, departamentos y centros de costo en `src/rrhh/utils/catalogos-service.js`
- [X] T016 [US1] Implementar el servicio de fichas de trabajadores (crear, buscar y actualizar) en `src/rrhh/utils/trabajadores-service.js` (depende de T014)
- [X] T017 [P] [US1] Implementar la normalización y validación de RUT chileno en `src/rrhh/calculo/rut.js`
- [X] T018 [P] [US1] Construir el formulario de trabajador con validación y retroalimentación en `src/rrhh/components/trabajador-form.js`
- [X] T019 [P] [US1] Construir la vista de listado y búsqueda de trabajadores en `src/rrhh/views/trabajadores-view.js`
- [X] T020 [P] [US1] Construir la vista de gestión de catálogos base en `src/rrhh/views/catalogos-view.js`
- [X] T021 [US1] Integrar las vistas de trabajadores y catálogos en la navegación de RR.HH. en `src/rrhh/views/rrhh-router.js`
- [X] T022 [US1] Añadir mensajes de validación y estados vacíos de trabajadores y catálogos en `src/rrhh/components/trabajador-form.js` (depende de T018)

**Punto de control**: La Historia de Usuario 1 debe ser funcional y comprobable de forma independiente.

---

## Fase 4: Historia de Usuario 2 - Gestión de Contratos y Alertas de Plazo (Prioridad: P1)

**Objetivo**: Registrar contratos (sueldo base, jornada y tipo) con historial y alertar sobre vencimientos en 30 días o menos.

**Prueba Independiente**: Asociar un contrato a un trabajador, verlo en el historial y comprobar que el panel muestra una alerta cuando faltan 30 días o menos para el vencimiento.

### Pruebas para la Historia de Usuario 2

- [X] T023 [P] [US2] Crear pruebas unitarias de validación de contratos y selección por vigencia en `tests/unit/rrhh-contratos.test.js`
- [X] T024 [P] [US2] Crear prueba de integración de registro de contrato, cambio de sueldo y alerta de vencimiento en `tests/integration/rrhh-contratos-flow.test.js`

### Implementación para la Historia de Usuario 2

- [X] T025 [P] [US2] Definir el esquema de contrato y su clave de almacenamiento `erp_rrhh:contratos` en `src/rrhh/utils/contratos-service.js`
- [X] T026 [US2] Implementar el CRUD de contratos y el registro histórico de cambios de sueldo como nuevo contrato o anexo en `src/rrhh/utils/contratos-service.js` (depende de T025)
- [X] T027 [US2] Implementar `getContratoVigente(entityId, fecha)` por rango de vigencia en `src/rrhh/utils/contratos-service.js` (depende de T026)
- [X] T028 [P] [US2] Construir el formulario de contrato (sueldo base, jornada y tipo) en `src/rrhh/components/contrato-form.js`
- [X] T029 [P] [US2] Construir la vista de listado e historial de contratos por trabajador en `src/rrhh/views/contratos-view.js`
- [X] T030 [P] [US2] Implementar el servicio de alertas de contratos próximos a vencer en 30 días en `src/rrhh/utils/alertas-service.js`
- [X] T031 [US2] Mostrar las alertas de vencimiento de contrato en el panel principal en `src/components/dashboard.js` (depende de T030)
- [X] T032 [US2] Integrar las vistas de contratos y alertas en la navegación de RR.HH. en `src/rrhh/views/rrhh-router.js`

**Punto de control**: Las Historias de Usuario 1 y 2 deben funcionar de forma independiente.

---

## Fase 5: Historia de Usuario 3 - Registro y Aprobación de Novedades del Mes (Prioridad: P1)

**Objetivo**: Registrar y aprobar novedades del período (horas extra, licencias médicas y ausencias) con privacidad, control de topes, inmutabilidad y trazabilidad.

**Prueba Independiente**: Una jefatura registra novedades para su equipo, el sistema exige aprobación explícita antes del cálculo, valida el tope de horas extra, bloquea períodos cerrados y registra fecha, hora y usuario de cada aprobación o rechazo.

### Pruebas para la Historia de Usuario 3

- [X] T033 [P] [US3] Crear pruebas unitarias de estados, privacidad de licencias, tope de horas extra y período cerrado en `tests/unit/rrhh-novedades.test.js`
- [-] T034 [P] [US3] Crear prueba de integración del flujo de registro, aprobación, rechazo y bloqueo de cálculo en `tests/integration/rrhh-novedades-flow.test.js` — cubierto por `rrhh-novedades-registro`, `rrhh-novedades-aprobacion`, `rrhh-novedades-cascade`, `rrhh-novedades-edge-cases` y `rrhh-novedades-view`
- [X] T035 [P] [US3] Definir el esquema de novedad, tipos permitidos y clave `erp_rrhh:novedades` en `src/rrhh/utils/novedades-service.js`
- [X] T036 [US3] Implementar el CRUD de novedades con privacidad de licencias (solo tipo y días, sin diagnóstico) en `src/rrhh/utils/novedades-service.js` (depende de T035)
- [X] T037 [US3] Implementar la máquina de estados Pendiente/Aprobada/Rechazada con aprobadoPor, fechaAprobacion y motivoRechazo en `src/rrhh/utils/novedades-service.js` (depende de T036)
- [-] T038 [US3] Implementar la validación del tope legal de horas extra (máximo 2 h diarias) con confirmación y justificación en `src/rrhh/utils/novedades-service.js` (depende de T037) — regla implementada en `src/rrhh/utils/novedades-data.js`
- [X] T039 [US3] Implementar el bloqueo de solo lectura de novedades en períodos cerrados en `src/rrhh/utils/novedades-service.js` (depende de T037)
- [X] T040 [P] [US3] Construir el formulario de novedad con campos condicionados por tipo en `src/rrhh/components/novedad-form.js`
- [-] T041 [P] [US3] Construir el listado de novedades con acciones de aprobar/rechazar e historial de estados en `src/rrhh/views/novedades-view.js` — implementado en `src/rrhh/views/novedades.js` + `components/novedad-list.js`
- [X] T042 [US3] Implementar el bloqueo del cálculo masivo cuando existan novedades pendientes y la alerta con las no resueltas en `src/rrhh/utils/novedades-service.js` (depende de T037)
- [X] T043 [US3] Integrar la vista de novedades en la navegación de RR.HH. en `src/rrhh/views/rrhh-router.js`

**Punto de control**: Las Historias de Usuario 1, 2 y 3 deben funcionar de forma independiente.

---

## Fase 6: Historia de Usuario 4 - Cálculo de Planilla y Ciclo de Vida de Liquidaciones (Prioridad: P1)

**Objetivo**: Ejecutar el motor de cálculo masivo con parámetros legales versionados y gestionar el ciclo de vida de liquidaciones y períodos hasta el cierre inmutable.

**Prueba Independiente**: Calcular un período con datos de prueba, cuadrar el caso de referencia al peso, recorrer el ciclo borrador → calculada → aprobada → pagada/anulada y cerrar el período congelando UF, UTM, IMM y parámetros.

### Pruebas para la Historia de Usuario 4

- [X] T044 [P] [US4] Crear pruebas unitarias del motor de cálculo y de los parámetros legales versionados en `tests/unit/rrhh-calculo.test.js`
- [X] T045 [P] [US4] Crear pruebas unitarias del ciclo de vida de liquidaciones en `tests/unit/rrhh-liquidacion-estados.test.js`
- [X] T046 [P] [US4] Crear prueba de integración del caso de referencia, recálculo y cierre de período en `tests/integration/rrhh-calculo-periodo.test.js`

### Implementación para la Historia de Usuario 4

- [X] T047 [P] [US4] Definir el esquema de período y su clave `erp_rrhh:periodos` con estado Abierto/Cerrado en `src/rrhh/utils/periodos-service.js`
- [X] T048 [P] [US4] Definir los esquemas de parámetros legales y tramos de impuesto con vigencia en `src/rrhh/calculo/parametros.js`
- [X] T049 [US4] Implementar la selección de parámetros y tramos por fecha de vigencia en `src/rrhh/calculo/parametros.js` (depende de T048)
- [X] T050 [P] [US4] Implementar las funciones puras del motor (sueldo proporcional, horas extra, gratificación, AFP, salud, seguro de cesantía e impuesto único) en `src/rrhh/calculo/motor.js`
- [-] T051 [P] [US4] Implementar el redondeo por línea y los totales al peso en `src/rrhh/calculo/redondeo.js` — redondeo integrado en `src/rrhh/calculo/motor.js`
- [X] T052 [P] [US4] Implementar la máquina de estados de liquidación (borrador → calculada → aprobada → pagada / anulada) en `src/rrhh/utils/liquidacion-estados.js`
- [-] T053 [US4] Implementar la persistencia de liquidaciones y líneas con snapshot del parámetro legal en `src/rrhh/utils/liquidaciones-service.js` (depende de T052) — implementado en `src/rrhh/utils/liquidacion-service.js`
- [X] T054 [US4] Implementar la apertura, el cálculo y el cierre de período con congelamiento de UF, UTM, IMM y parámetros en `src/rrhh/utils/periodos-service.js` (depende de T047, T049, T053)
- [X] T055 [US4] Implementar la protección contra recálculo y edición de liquidaciones o novedades en períodos cerrados en `src/rrhh/utils/periodos-service.js` (depende de T054)
- [-] T056 [P] [US4] Construir la vista de gestión de períodos (abrir, calcular y cerrar) en `src/rrhh/views/periodos-view.js` — implementado en `src/rrhh/views/periodos.js`
- [-] T057 [P] [US4] Construir la vista de cálculo de planilla con alerta de novedades pendientes en `src/rrhh/views/planilla-view.js` — implementado en `src/rrhh/views/planilla.js`
- [-] T058 [P] [US4] Construir la vista de listado y detalle de liquidaciones en `src/rrhh/views/liquidaciones-view.js` — implementado en `src/rrhh/views/liquidaciones.js` + `liquidacion.js`
- [X] T059 [US4] Implementar el cálculo de aportes y costo empleador en `src/rrhh/utils/costo-empleador.js` (depende de T050)
- [X] T060 [US4] Integrar las vistas de períodos, planilla y liquidaciones en la navegación de RR.HH. en `src/rrhh/views/rrhh-router.js`
- [ ] T107 [P] [US4] Crear pruebas unitarias de carga manual, solapamiento de vigencias y selección por fecha de parámetros legales en `tests/unit/rrhh-parametros-carga.test.js` (clarificación 2026-11-08)
- [ ] T108 [P] [US4] Construir el formulario de carga manual y versionado de parámetros legales (UF, UTM, IMM, tasas, topes y tramos) en `src/rrhh/components/parametros-form.js` (clarificación 2026-11-08)
- [ ] T109 [P] [US4] Crear la vista de administración de parámetros legales y su historial de vigencias en `src/rrhh/views/parametros-view.js`
- [ ] T110 [US4] Integrar la vista de parámetros en la navegación de RR.HH. en `src/rrhh/views/rrhh-router.js` (depende de T108, T109)

**Punto de control**: Las Historias de Usuario 1 a 4 deben funcionar de forma independiente.

---

## Fase 7: Historia de Usuario 5 - Vista Explicativa e Impresión de Liquidaciones (Prioridad: P2)

**Objetivo**: Explicar cada línea de la liquidación con su base, tasa o fórmula y parámetro legal, y ofrecer una vista limpia para imprimir o guardar en PDF.

**Prueba Independiente**: Seleccionar una línea y ver su desglose con el parámetro legal y su vigencia; imprimir y obtener un comprobante sin controles de navegación que coincide con los montos de la liquidación.

### Pruebas para la Historia de Usuario 5

- [-] T061 [P] [US5] Crear prueba de integración del desglose por línea, snapshot congelado y vista de impresión en `tests/integration/rrhh-liquidacion-explicacion.test.js` — cubierto por `rrhh-liquidacion-view.test.js` y `rrhh-liquidacion-print.test.js`

### Implementación para la Historia de Usuario 5

- [-] T062 [P] [US5] Construir el panel de explicación por línea (base, tasa o factor, fórmula y parámetro legal con vigencia) en `src/rrhh/components/linea-explicacion.js` — explicación integrada en `src/rrhh/views/liquidacion.js`
- [-] T063 [P] [US5] Construir la vista imprimible de la liquidación sin menús ni controles de navegación en `src/rrhh/views/liquidacion-impresion.js` — impresión implementada en `src/rrhh/views/liquidacion.js` (`createPrintController`)
- [-] T064 [P] [US5] Implementar los estilos de impresión en tamaño carta/A4 vertical en `src/rrhh/views/liquidacion-impresion.css` — estilos de impresión en `src/styles.css`
- [-] T065 [US5] Manejar líneas manuales sin fórmula y snapshots congelados en la explicación en `src/rrhh/components/linea-explicacion.js` (depende de T062) — cubierto por `src/rrhh/views/liquidacion.js`
- [-] T066 [US5] Integrar las acciones de explicar e imprimir en el detalle de liquidación en `src/rrhh/views/liquidaciones-view.js` (depende de T058, T062, T063) — integrado en `src/rrhh/views/liquidaciones.js`

**Punto de control**: Las Historias de Usuario 1 a 5 deben funcionar de forma independiente.

---

## Fase 8: Historia de Usuario 6 - Seguridad, Roles y Gobierno de Datos (Prioridad: P2)

**Objetivo**: Restringir el acceso a datos sensibles según el rol y registrar una bitácora de auditoría de solo inserción conforme a la Ley 21.719.

**Prueba Independiente**: Simular el rol Jefatura y comprobar que se ocultan sueldos y datos financieros; verificar que toda consulta o cambio sensible queda en la bitácora y que esta no puede editarse ni eliminarse.

### Pruebas para la Historia de Usuario 6

- [X] T067 [P] [US6] Crear pruebas unitarias de la matriz de roles, enmascaramiento de datos sensibles e inmutabilidad de auditoría en `tests/unit/rrhh-seguridad.test.js`
- [-] T068 [P] [US6] Crear prueba de integración de acceso por rol, denegaciones auditadas y bitácora de solo inserción en `tests/integration/rrhh-seguridad-flow.test.js` — cubierto por `tests/integration/rrhh-seguridad-jefatura.test.js` y `tests/integration/rrhh-auditoria.test.js`
- [X] T069 [P] [US6] Definir los roles (Administrador, Jefatura, Analista/Trabajador) y sus permisos en `src/rrhh/seguridad/roles.js`
- [-] T070 [P] [US6] Implementar la sesión simulada y el cambio de rol en `src/rrhh/seguridad/sesion.js` — implementado en `src/rrhh/seguridad/session.js`
- [-] T071 [P] [US6] Implementar la clasificación y el enmascaramiento de datos sensibles por rol en `src/rrhh/seguridad/permisos.js` — implementado en `src/rrhh/seguridad/acceso-datos.js`
- [X] T072 [P] [US6] Implementar la bitácora de auditoría de solo inserción con rechazo de edición y eliminación en `src/rrhh/seguridad/auditoria.js`
- [X] T073 [US6] Registrar automáticamente consultas, creaciones, modificaciones y denegaciones de datos sensibles en `src/rrhh/seguridad/auditoria.js` (depende de T072)
- [X] T074 [US6] Aplicar las restricciones de rol en la capa de servicios de RR.HH. en `src/rrhh/utils/trabajadores-service.js`, `src/rrhh/utils/contratos-service.js` y `src/rrhh/utils/liquidaciones-service.js`
- [X] T075 [P] [US6] Construir el selector de rol y sesión en `src/rrhh/components/rol-switcher.js`
- [-] T076 [P] [US6] Construir la vista de consulta de la bitácora de auditoría en `src/rrhh/views/auditoria-view.js` — implementado en `src/rrhh/views/auditoria.js`
- [-] T077 [US6] Integrar el selector de rol y la vista de auditoría en la navegación de RR.HH. en `src/rrhh/views/rrhh-router.js` — selector en `src/components/shell.js` y pestaña de auditoría en `workspace.js`

**Punto de control**: Las seis historias de usuario deben funcionar de forma independiente.

---

## Fase 8B: Retención de Auditoría y Respaldo (FR-058, FR-060, SC-022)

**Propósito**: Cubrir los requisitos transversales incorporados en la clarificación del 2026-11-08.

- [ ] T111 [P] Crear pruebas unitarias de retención de auditoría y bloqueo de purga manual en `tests/unit/rrhh-auditoria-retencion.test.js` (FR-058)
- [ ] T112 [P] Implementar la política de retención (relación laboral + 6 años) y el bloqueo de purga manual en `src/rrhh/seguridad/auditoria.js` (FR-058)
- [ ] T113 [P] Crear pruebas unitarias de validación de respaldo y restauración atómica en `tests/unit/backup.test.js` (FR-060)
- [ ] T114 [P] Implementar la exportación completa a JSON (`schemaVersion`, `exportedAt`, tablas `erp:*` y `erp_rrhh:*`) en `src/backup.js` (FR-060)
- [ ] T115 Implementar la validación e importación con confirmación y restauración atómica en `src/backup.js` (FR-060) (depende de T114)
- [ ] T116 [P] Añadir las acciones de exportar e importar respaldo en la interfaz en `src/components/shell.js` y `src/styles.css` (FR-060)
- [ ] T117 Crear prueba de integración de exportación, importación y restauración completa en menos de 5 minutos en `tests/integration/backup-flow.test.js` (FR-060, SC-022)

**Punto de control**: La retención de auditoría y el respaldo/restauración quedan verificados de forma independiente.

---

## Fase 9: Pulido y Preocupaciones Transversales

**Propósito**: Mejoras que afectan a varias historias.

- [ ] T078 [P] Actualizar la documentación del módulo de RR.HH./Planilla en `docs/rrhh.md` (bloqueante de release) — Quality Standards exige documentar cambios de comportamiento, configuración y contratos
- [X] T079 Ejecutar la suite completa de Vitest (`tests/unit/rrhh-*.test.js` y `tests/integration/rrhh-*.test.js`) y corregir regresiones en los archivos de prueba afectados — 43 archivos / 323 pruebas en verde
- [X] T080 [P] Verificar el rendimiento de cálculo de 200 trabajadores en menos de 1 segundo en `src/rrhh/calculo/motor.js` — cubierto por `tests/integration/rrhh-rendimiento.test.js`
- [ ] T081 [P] Validar el flujo de RR.HH. descrito en `specs/001-erp-base-module/quickstart.md`
- [ ] T082 Revisar el endurecimiento de seguridad de datos sensibles en `src/rrhh/seguridad/permisos.js` y `src/rrhh/seguridad/auditoria.js`
- [ ] T083 Limpiar y refactorizar ayudantes compartidos en `src/rrhh/utils/common.js`
- [ ] T084 [P] Revisar accesibilidad y consistencia de la experiencia en `src/rrhh/views/liquidaciones-view.js`, `src/rrhh/views/novedades-view.js` y `src/rrhh/components/trabajador-form.js`

---

## Dependencias y Orden de Ejecución

### Dependencias por Fase

- **Configuración (Fase 1)**: Sin dependencias; puede iniciar de inmediato.
- **Fundacional (Fase 2)**: Depende de la Fase 1 y BLOQUEA todas las historias.
- **Historias de Usuario (Fases 3–8)**: Dependen de la Fase 2. Pueden ejecutarse en paralelo si hay personal suficiente o secuencialmente en orden de prioridad.
- **Retención y Respaldo (Fase 8B)**: Depende de la Fase 2 (almacenamiento) y de US6 (auditoría); puede ejecutarse en paralelo con US5.
- **Pulido (Fase 9)**: Depende de que las historias deseadas y la Fase 8B estén completas.

### Dependencias entre Historias

- **US1 (P1)**: Sin dependencias tras la Fase 2.
- **US2 (P1)**: Depende de US1 para asociar contratos a trabajadores; comprobable de forma independiente con trabajadores de prueba.
- **US3 (P1)**: Depende de US1 (trabajadores) y de US4 solo para el bloqueo del cálculo; el registro y la aprobación son independientes.
- **US4 (P1)**: Integra US1, US2, US3 y los parámetros legales cargados manualmente; es la historia de mayor acoplamiento.
- **US5 (P2)**: Depende de las liquidaciones de US4.
- **US6 (P2)**: Aplica de forma transversal a US1–US5; puede implementarse en paralelo una vez estabilizados los servicios.

### Dentro de Cada Historia

- Las pruebas se escriben primero y deben fallar antes de la implementación.
- Esquemas/modelos antes que servicios; servicios antes que vistas; vistas antes de la integración en el enrutador.
- Completar y validar una historia antes de avanzar a la siguiente prioridad.

### Oportunidades de Paralelismo

- Todas las tareas de Configuración marcadas `[P]` pueden ejecutarse en paralelo.
- Las tareas Fundacionales marcadas `[P]` pueden ejecutarse en paralelo dentro de la Fase 2.
- Una vez completada la Fase 2, las historias pueden abordarse en paralelo según la capacidad del equipo.
- Las pruebas de una historia marcadas `[P]` pueden ejecutarse en paralelo.
- Los componentes, vistas y servicios de archivos distintos dentro de una historia pueden desarrollarse en paralelo.

---

## Ejemplo Paralelo: Historia de Usuario 1

```bash
# Lanzar en paralelo las pruebas de la Historia de Usuario 1:
Task: "Pruebas unitarias de validación de trabajadores y catálogos en tests/unit/rrhh-trabajadores.test.js"
Task: "Prueba de integración del flujo de trabajadores en tests/integration/rrhh-trabajadores-flow.test.js"

# Lanzar en paralelo los servicios y vistas de archivos distintos:
Task: "Definir esquema de trabajador en src/rrhh/utils/trabajadores-service.js"
Task: "Implementar CRUD de catálogos en src/rrhh/utils/catalogos-service.js"
Task: "Implementar validación de RUT en src/rrhh/calculo/rut.js"
Task: "Construir formulario de trabajador en src/rrhh/components/trabajador-form.js"
Task: "Construir vista de trabajadores en src/rrhh/views/trabajadores-view.js"
Task: "Construir vista de catálogos en src/rrhh/views/catalogos-view.js"
```

---

## Ejemplo Paralelo: Historia de Usuario 4

```bash
# Lanzar en paralelo las pruebas de la Historia de Usuario 4:
Task: "Pruebas unitarias del motor de cálculo en tests/unit/rrhh-calculo.test.js"
Task: "Pruebas unitarias del ciclo de vida de liquidaciones en tests/unit/rrhh-liquidacion-estados.test.js"
Task: "Prueba de integración del cálculo y cierre de período en tests/integration/rrhh-calculo-periodo.test.js"

# Lanzar en paralelo las funciones puras y vistas de archivos distintos:
Task: "Implementar motor de cálculo en src/rrhh/calculo/motor.js"
Task: "Implementar redondeo por línea en src/rrhh/calculo/redondeo.js"
Task: "Construir vista de períodos en src/rrhh/views/periodos-view.js"
Task: "Construir vista de planilla en src/rrhh/views/planilla-view.js"
Task: "Construir vista de liquidaciones en src/rrhh/views/liquidaciones-view.js"
```

---

## Ejemplo Paralelo: Fase 8B (Retención y Respaldo)

```bash
# Pruebas independientes en archivos distintos:
Task: "Pruebas unitarias de retención de auditoría en tests/unit/rrhh-auditoria-retencion.test.js"
Task: "Pruebas unitarias de respaldo en tests/unit/backup.test.js"

# Implementación en archivos distintos:
Task: "Implementar retención de auditoría en src/rrhh/seguridad/auditoria.js"
Task: "Implementar exportación JSON en src/backup.js"
Task: "Añadir acciones de respaldo en src/components/shell.js"
```

---

## Estrategia de Implementación

### MVP Primero (Solo Historia de Usuario 1)

1. Completar la Fase 1: Configuración.
2. Completar la Fase 2: Fundacional (CRÍTICO, bloquea todas las historias).
3. Completar la Fase 3: Historia de Usuario 1.
4. **DETENERSE y VALIDAR**: probar la Historia de Usuario 1 de forma independiente.
5. Desplegar o demostrar si está lista.

### Entrega Incremental

1. Configuración + Fundacional → base lista.
2. US1 → probar → desplegar (MVP).
3. US2 → probar → desplegar.
4. US3 → probar → desplegar.
5. US4 → probar → desplegar.
6. US5 → probar → desplegar.
7. US6 → probar → desplegar.
8. Fase 8B (retención y respaldo) → probar → desplegar.
9. Cada historia añade valor sin romper las anteriores.

### Estrategia de Equipo en Paralelo

Con varios desarrolladores:

1. El equipo completa Configuración + Fundacional en conjunto.
2. Una vez lista la base:
   - Desarrollador A: US1 y US2.
   - Desarrollador B: US3.
   - Desarrollador C: US4 (coordinando con A y B).
   - Desarrollador D: US5 y US6, y la Fase 8B en paralelo con US5.
3. Las historias se completan e integran de forma independiente.

---

## Notas

- `[P]` indica tareas sobre archivos distintos y sin dependencias pendientes.
- La etiqueta `[USn]` permite la trazabilidad directa con `spec.md`.
- Cada historia debe ser completable y comprobable de forma independiente.
- Verificar que las pruebas fallen antes de implementar.
- Confirmar tras cada tarea o grupo lógico.
- Detenerse en cada punto de control para validar la historia de forma independiente.
- Evitar tareas vagas, conflictos sobre el mismo archivo y dependencias entre historias que rompan la independencia.

---

## Notas de implementación (2026-11-08)

Estados usados en este archivo:

- `[X]`: implementado y verificado con la suite de Vitest.
- `[-]`: implementado con una ruta o estructura distinta a la planificada (adaptación), o cubierto por un conjunto de pruebas equivalente.
- `[ ]`: pendiente.

Adaptaciones de rutas respecto al plan original:

- Vite/Vitest: `vitest.config.mjs` en lugar de `vite.config.js`.
- Lint: `eslint.config.js` (flat config) en lugar de `.eslintrc.json`.
- Pruebas: jsdom se monta inline en cada archivo; no existen `tests/setup/jsdom.js` ni `tests/setup/fixtures.js`.
- Novedades: `views/novedades.js` (en lugar de `novedades-view.js`) y reglas de tope en `utils/novedades-data.js`.
- Liquidaciones: `utils/liquidacion-service.js` (singular), `views/liquidaciones.js` + `views/liquidacion.js`; explicación e impresión viven en `liquidacion.js` y los estilos en `src/styles.css`.
- Seguridad: `seguridad/session.js` (en lugar de `sesion.js`), `seguridad/acceso-datos.js` (en lugar de `permisos.js`) y `views/auditoria.js` (en lugar de `auditoria-view.js`).
- Períodos/Planilla: `views/periodos.js` y `views/planilla.js`.

Decisiones de datos:

- El trabajador reutiliza `Entity`: el RUT se persiste en `taxId` (formateado) y el perfil RRHH en `erp_rrhh:trabajadores` con clave `entityId`.
- Los contratos guardan `entityId` y `entity_id`, con `estado: 'vigente' | 'terminado'`, para alimentar el motor de cálculo sin romper su contrato de entrada.
- Catálogos y contratos usan baja lógica para no perder historia; los cambios de sueldo cierran el contrato anterior el día previo al nuevo inicio.
- Los parámetros legales se cargan manualmente con vigencia desde/hasta y fuente; la carga se valida para evitar solapamientos (clarificación 2026-11-08).
- La bitácora de auditoría se conserva durante la relación laboral y 6 años tras el término; no se ofrece purga manual desde la interfaz (FR-058).
- El respaldo JSON incluye `schemaVersion`, `exportedAt` y todas las tablas `erp:*`/`erp_rrhh:*`; la restauración valida y reemplaza solo con confirmación explícita (FR-060, SC-022).

Verificación:

- `npx vitest run`: 43 archivos, 323 pruebas en verde (2026-11-08).
- `npm run lint`: sin errores.
- Tareas pendientes incorporadas por las clarificaciones: T107–T117 (parámetros manuales, retención de auditoría y respaldo/restauración).
