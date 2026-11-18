# Tareas: Módulo de Recursos Humanos y Planilla

**Entrada**: Documentos de diseño desde `/specs/001-erp-base-module/`
**Prerrequisitos**: `plan.md` (obligatorio), `spec.md` (obligatorio para las historias de usuario), `research.md`, `data-model.md`, `contracts/` y `quickstart.md`
**Alcance**: Historias de Usuario 1 a 12 de `spec.md`, incluyendo FR-040–FR-107 y SC-011–SC-029 (las tareas de US8 a US12 se agregan a medida que se incorpora cada historia), la bitácora inmutable y el respaldo JSON sin sobrescritura de auditoría. Incluye el cierre de las brechas G1–G18 y K1 detectadas en la auditoría de consistencia. El módulo base genérico (FR-001–FR-039, XR-001–XR-005 y la antigua Fase 2B, tareas T018–T040) se retiró del alcance por no corresponder a Recursos Humanos y Planilla.
**Actualizado**: 2026-11-17 (incorporada la Historia de Usuario 7, Fase 9, tareas T170–T190; revisión anterior 2026-11-16 contra código/tests actuales con rutas ajustadas a la estructura real `src/rrhh/...`)
**Tests**: Incluidos por mandato de la constitución (Principio II) y del plan de verificación con Vitest + jsdom.

## Formato: `[ID] [P?] [Historia] Descripción con ruta de archivo`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[US1]–[US12]**: Historia de Usuario a la que pertenece la tarea
- Las tareas de configuración, fundacionales y pulido no llevan etiqueta de historia
- Todas las rutas son explícitas y relativas a la raíz del repositorio

## Convenciones de Rutas

- Código base del módulo: `src/`
- Utilidades transversales: `src/utils/`
- Extensión RR.HH./Planilla: `src/rrhh/calculo/`, `src/rrhh/components/`, `src/rrhh/seguridad/`, `src/rrhh/utils/`, `src/rrhh/views/`
- Pruebas: `tests/unit/`, `tests/integration/`, `tests/setup/`
- Documentación: `docs/`

> **Nota de trazabilidad**: revisión realizada comparando cada tarea con el estado actual de `src/` y `tests/` frente a `spec.md`. Solo se marcan `[X]` las tareas cuyo cumplimiento queda evidenciado en el código actual según el spec vigente. Las tareas sin evidencia completa quedan en `[ ]` con nota de lo faltante o la ruta real observada. Donde hubo duda, se dejó `[ ]`.
>
> **Nota de verificación (constitución II)**: `[X]` significa únicamente "evidencia de código"; NO implica pruebas en verde. Una historia solo se considera completa cuando sus tareas de prueba están `[X]`. En consecuencia se han desmarcado T045–T054 y T061–T064, cuyas pruebas asociadas (T041–T044 y T058–T060) permanecen `[ ]`.

---

## Fase 1: Configuración (Infraestructura Compartida)

**Propósito**: Inicializar la aplicación Vite y las herramientas compartidas.

- [X] T001 Crear la estructura de carpetas `src/`, `src/utils/`, `src/components/`, `src/rrhh/calculo/`, `src/rrhh/components/`, `src/rrhh/seguridad/`, `src/rrhh/utils/`, `src/rrhh/views/`, `tests/unit/`, `tests/integration/` y `tests/setup/`
  - Evidencia: existen `src/`, `src/components/`, `src/rrhh/{calculo,components,seguridad,utils,views}/`, `tests/unit/` y `tests/integration/`; se agregaron `src/utils/format.js` (formateo CLP, fechas, porcentajes y factores, reutilizado por `src/rrhh/utils/liquidacion-data.js` y `src/rrhh/components/dom.js`) y `tests/setup/setup.js` (configuración base de Vitest registrada en `vitest.config.mjs`), con cobertura en `tests/unit/utils-format.test.js`.
- [X] T002 [P] Configurar Vite, Vitest y jsdom con los scripts de desarrollo, prueba y compilación en `package.json` y `vitest.config.mjs`
  - Evidencia: `package.json`, `vitest.config.mjs`.
- [X] T003 [P] Configurar linting y formateo para JavaScript ES2022 en `eslint.config.js`
  - Evidencia: `eslint.config.js`, `.prettierrc.json`, `package.json` (scripts lint/format).
- [ ] T004 [P] Configurar la adaptación de RR.HH. (nombre de módulo, etiquetas de Trabajador/Contrato/Novedad/Liquidación y color de acento) en `src/module-config.js`
  - Falta: `module-config.js` define nombre/etiquetas Trabajador-Liquidación, acento y bloque `rrhh`/`empresa`, pero no evidencia la configuración completa de adaptación requerida por el spec (p. ej. etiquetas/ajustes específicos de Contrato/Novedad y perfil completo de adaptación).

---

## Fase 2: Fundacional (Prerrequisitos Bloqueantes)

**Propósito**: Infraestructura común que debe existir antes de implementar cualquier historia, incluidos el núcleo append-only de auditoría y los parámetros legales por vigencia.

**⚠️ CRÍTICO**: Ninguna historia de usuario puede comenzar hasta completar esta fase.

- [X] T005 Implementar la capa de almacenamiento compartida (persistencia local, identidad, marcas de tiempo e integridad referencial) que usa RR.HH. en `src/storage.js` (infraestructura compartida)
  - Evidencia: `src/storage.js` (`createId`, `now`, `addEntity`, `updateEntity`, `deleteEntity`, `addDocument`, `updateDocument`, `deleteDocument`, `deleteDocumentsForEntity`, `validateEntity`, `validateDocument`).
  - `deleteEntity` rechaza eliminar Trabajadores y Liquidaciones gestionados por RR.HH.; los Trabajadores se desactivan según la Historia de Usuario 1.
- [X] T006 [P] Crear los estilos compartidos y tokens de diseño (tipografía, formularios, estados vacíos y de error) en `src/styles.css`
  - Evidencia: `src/styles.css` (`:root` tokens/variables, estilos de formularios `.field*`/inputs, estados `.empty-state`, `.field-error`, `.config-errors`, `.rrhh-feedback`).
  - Falta (spec nuevo/reglas pendientes): verificar cobertura completa de todos los tokens/estados exigidos por el spec vigente.
- [X] T007 [P] Implementar el arranque de la aplicación y la navegación de vistas en `src/main.js` y `src/app.js`
  - Evidencia: `src/main.js` (`boot`), `src/app.js` (`boot`, `initApp`, `showView`, `bindEvents`, `views`).
  - Falta (spec nuevo/reglas pendientes): verificar cumplimiento total de reglas de navegación/pantallas exigidas por el spec vigente.
- [X] T008 [P] Construir el marco del espacio de trabajo ERP (barra superior, logotipo derivado del nombre y barra lateral) en `src/components/shell.js` (infraestructura compartida)
  - Evidencia: `src/components/shell.js` (`renderShell`, `renderLogo`, `deriveMonogram`, `applyTheme`, `renderRoleSelector`).
  - Falta (spec nuevo/reglas pendientes): verificar cumplimiento completo de todos los requisitos del marco según el spec vigente.
- [X] T009 [P] Construir el panel principal donde se muestran las alertas de RR.HH. (contratos por vencer de US2 y feriado acumulado de US7) en `src/components/dashboard.js` (FR-072, FR-088)
  - Evidencia: `src/components/dashboard.js` (`renderDashboard`, `refreshStats`, `renderContratoAlerts`).
  - Falta (spec nuevo/reglas pendientes): verificar que el panel muestre las alertas de RR.HH. exigidas por US2 y US7.
- [ ] T011 [P] Configurar el entorno de pruebas Vitest + jsdom y los fixtures compartidos en `tests/setup/jsdom.js` y `tests/setup/fixtures.js`
  - Evidencia parcial: existe `tests/setup/setup.js` con configuración base registrada en `vitest.config.mjs`; faltan `tests/setup/jsdom.js` y `tests/setup/fixtures.js` dedicados.

### Núcleo append-only de auditoría (bloqueante para US1–US12)

> **NOTA: Escribir T012 antes de implementar T013–T014 y verificar que falle.**

- [ ] T012 [P] Crear pruebas unitarias del núcleo de auditoría: solo inserción, rechazo de edición/eliminación, aborto de la operación si falla la escritura y retención de 6 años en `tests/unit/rrhh-auditoria-core.test.js` (FR-055, FR-056, FR-058)
  - Falta: no existe `tests/unit/rrhh-auditoria-core.test.js`; existen `tests/unit/rrhh-auditoria.test.js` y `tests/integration/rrhh-auditoria.test.js` con cobertura distinta.
- [ ] T013 Implementar el núcleo de auditoría append-only: registrar entradas, rechazar edición y eliminación de registros existentes y abortar la operación sensible cuando no se pueda escribir en `src/rrhh/seguridad/auditoria.js` (FR-055, FR-056)
  - Evidencia parcial: `src/rrhh/seguridad/auditoria.js` registra y rechaza edición/eliminación por API; falta evidencia de aborto de la operación sensible ante fallo de escritura y de garantías append-only ante escritura directa en almacenamiento.
- [ ] T014 Implementar la retención de la bitácora (relación laboral + 6 años), el bloqueo de purga manual y la conservación de marcas de tiempo en `src/rrhh/seguridad/auditoria.js` (FR-058)
  - Falta: no se evidencia lógica de retención de 6 años ni bloqueo de purga manual (existe `resetAuditoria` de uso interno/test).

### Parámetros legales por vigencia (bloqueante para US2 y US4)

> **NOTA: Escribir T015 antes de implementar T016–T017 y verificar que falle.**

- [ ] T015 [P] Crear pruebas unitarias de esquemas de parámetros legales, tramos y selección por fecha de vigencia en `tests/unit/rrhh-parametros.test.js` (FR-079)
  - Falta: no existe `tests/unit/rrhh-parametros.test.js`; existen pruebas relacionadas en `tests/unit/rrhh-calculo-parametros.test.js` y otras.
- [ ] T016 Implementar los esquemas de parámetros legales y tramos de impuesto con vigencia (UF, UTM, IMM, tasas, topes y tramos) en `src/rrhh/calculo/parametros.js` (FR-079)
  - Evidencia parcial: `src/rrhh/calculo/parametros.js` define parámetros y tramos con vigencia; no se verificó que cubra todos los esquemas/casos exigidos por el spec.
- [ ] T017 Implementar la selección de parámetros y tramos por fecha de vigencia, incluyendo la detección de parámetros faltantes para un período, en `src/rrhh/calculo/parametros.js` (FR-079)
  - Evidencia parcial: existe resolución por vigencia; falta evidencia explícita de detección/reporte de parámetros faltantes para un período según FR-079/US4.

**Punto de control**: La base, el núcleo de auditoría y los parámetros legales están listos; las historias de usuario pueden iniciarse y US2 puede validar sueldo mínimo y jornada máxima sin esperar a US4.

---

## Fase 3: Historia de Usuario 1 – Gestión de Fichas de Trabajadores y Catálogos Base (Prioridad: P1) 🎯 MVP

**Objetivo**: Registrar, buscar y actualizar fichas de trabajadores y los catálogos base (cargos, departamentos y centros de costo), incluyendo desactivación, cascada de jefatura y auditoría de fichas y catálogos.

**Prueba Independiente**: Abrir el módulo, crear un trabajador y un catálogo, verlos en la lista, buscarlos, actualizarlos, desactivar un trabajador sin novedades pendientes y comprobar que su equipo queda sin jefatura directa cuando corresponda. No requiere contratos ni liquidaciones.

### Pruebas de la Historia de Usuario 1

> **NOTA: Escribir estas pruebas primero y verificar que fallen antes de implementar.**

- [ ] T041 [P] [US1] Crear pruebas unitarias de validación de trabajadores, RUT, correo y fecha de ingreso en `tests/unit/rrhh-trabajadores.test.js` (FR-063)
  - Evidencia parcial: existe `tests/unit/rrhh-trabajadores.test.js`; no se verificó que cubra exactamente todos los casos exigidos por el spec actual.
- [ ] T042 [P] [US1] Crear pruebas unitarias de unicidad de RUT/código, código de catálogo por tipo y jefatura directa en `tests/unit/rrhh-catalogos-jefatura.test.js` (FR-061, FR-062, FR-064, FR-066)
  - Falta: no existe `tests/unit/rrhh-catalogos-jefatura.test.js`; cobertura puede estar distribuida en otros archivos.
- [ ] T043 [P] [US1] Crear pruebas unitarias de desactivación con bloqueo por novedades Pendientes, cascada de jefatura, no reactivación y auditoría de catálogos en `tests/unit/rrhh-trabajadores-baja.test.js` (FR-065, FR-067)
  - Falta: no existe `tests/unit/rrhh-trabajadores-baja.test.js`.
- [ ] T044 [P] [US1] Crear prueba de integración del flujo de alta, búsqueda, actualización, desactivación y auditoría de fichas/catálogos en `tests/integration/rrhh-trabajadores-flow.test.js` (FR-063, FR-065, FR-067)
  - Evidencia parcial: existe `tests/integration/rrhh-trabajadores-flow.test.js`; cobertura exacta frente al spec actual no verificada.

### Implementación de la Historia de Usuario 1

- [ ] T045 [P] [US1] Implementar la normalización y validación del RUT chileno en `src/rrhh/calculo/rut.js` (FR-063)
  - Evidencia: `src/rrhh/calculo/rut.js` (`limpiarRut`, `separarRut`, `calcularDigitoVerificador`, `formatearRut`, `validarRut`, `assertRutValido`).
  - Falta (spec nuevo/reglas pendientes): confirmar normalización/formatos/casos exigidos por el spec vigente.
- [ ] T046 [P] [US1] Implementar el almacenamiento y CRUD de catálogos de cargos, departamentos y centros de costo, con código único dentro de su tipo, ocultar/reactivar y sin eliminación, en `src/rrhh/utils/catalogos-service.js` (FR-064)
  - Evidencia: `src/rrhh/utils/catalogos-service.js` (`validarCatalogo`, `listCatalogos`, `getCatalogo`, `catalogosPorTipo`, `crearCatalogo`, `actualizarCatalogo`, `eliminarCatalogo`).
  - Falta (spec nuevo/reglas pendientes): falta evidencia de flujo explícito de reactivación en UI/servicio según redacción actual del spec y verificación de todas las reglas.
- [ ] T047 [P] [US1] Definir el esquema del perfil de trabajador reutilizando `Entity` (RUT en `taxId`, fecha de ingreso, estado activo/inactivo y jefatura directa) en `src/rrhh/utils/trabajadores-service.js` (FR-063, FR-066)
  - Evidencia: `src/rrhh/utils/trabajadores-service.js` (`TRABAJADORES_TABLE`, `profileId`, `crearTrabajador`, `getTrabajador`, `join`), integración con `src/storage.js` (`addEntity`/`updateEntity`).
  - Falta (spec nuevo/reglas pendientes): verificar esquema/estados completos exigidos por el spec vigente.
- [ ] T048 [US1] Implementar el servicio de fichas de trabajadores (crear, buscar y actualizar) con validación de correo y fecha en `src/rrhh/utils/trabajadores-service.js` (FR-063)
  - Evidencia: `src/rrhh/utils/trabajadores-service.js` (`validarTrabajador`, `crearTrabajador`, `actualizarTrabajador`, `listTrabajadores`, `buscarTrabajadores`, `getTrabajador`).
  - Falta (spec nuevo/reglas pendientes): verificar todas las validaciones/reglas detalladas del spec vigente.
- [ ] T049 [US1] Implementar la unicidad normalizada de RUT y de código entre fichas en `src/rrhh/utils/trabajadores-service.js` (FR-061, FR-062)
  - Evidencia: `src/rrhh/utils/trabajadores-service.js` (`normalizeRut`, `normalizeSearch`, `validarTrabajador`).
  - Falta (spec nuevo/reglas pendientes): confirmar normalización exacta y alcance exigidos por el spec vigente.
- [ ] T050 [US1] Implementar la desactivación de trabajadores con confirmación, bloqueo si existen novedades Pendientes (mediante el adaptador de novedades que se conecta en US3), cascada de jefatura a "sin jefatura directa", conservación histórica, prohibición de reactivación y un gancho para la terminación automática de contratos que se conecta en US2 (T068), en `src/rrhh/utils/trabajadores-service.js` (FR-065)
  - Evidencia: `src/rrhh/utils/trabajadores-service.js` (`tieneNovedadesPendientes`, `desactivarTrabajador`, `actualizarTrabajador` con bloqueo de reactivación).
  - Falta (spec nuevo/reglas pendientes): confirmación en UI/flujo completo y detalles adicionales del spec vigente (p. ej. auditoría de valores anterior/nuevo).
- [ ] T051 [US1] Implementar la validación de jefatura directa opcional (solo activos, sin autoasignación) en `src/rrhh/utils/trabajadores-service.js` (FR-066)
  - Evidencia: `src/rrhh/utils/trabajadores-service.js` (`validarTrabajador`, `workerIsActive`).
  - Falta (spec nuevo/reglas pendientes): verificar casos de UI/selector (ocultar inactivos) y reglas adicionales del spec vigente.
- [ ] T052 [P] [US1] Construir el formulario de trabajador con validación, selector de jefatura y retroalimentación en `src/rrhh/components/trabajador-form.js` (FR-063, FR-066)
  - Evidencia: `src/rrhh/components/trabajador-form.js` (`renderTrabajadorForm`, manejo de envío/errores, selector de jefatura).
  - Falta (spec nuevo/reglas pendientes): verificar cobertura completa de validaciones/UX según el spec vigente.
- [ ] T053 [P] [US1] Construir la vista de gestión de catálogos base con etiqueta "desactivado" y acciones de ocultar/reactivar en `src/rrhh/views/catalogos-view.js` (FR-064)
  - Evidencia: `src/rrhh/views/catalogos-view.js` (`renderCatalogosView`).
  - Falta (spec nuevo/reglas pendientes): verificar etiqueta/acciones completas de ocultar/reactivar exigidas por el spec vigente.
- [ ] T054 [P] [US1] Construir la vista de listado y búsqueda de trabajadores con acción de desactivación en `src/rrhh/views/trabajadores-view.js` (FR-063, FR-065)
  - Evidencia: `src/rrhh/views/trabajadores-view.js` (`renderTrabajadoresView`, búsqueda, listado y flujo de desvinculación).
  - Falta (spec nuevo/reglas pendientes): verificar confirmación/mensajes y comportamiento completo según el spec vigente.
- [ ] T055 [US1] Registrar creación, actualización y desactivación de fichas y catálogos en la bitácora (usuario, rol, fecha/hora y valores anterior/nuevo) en `src/rrhh/seguridad/auditoria.js`, `src/rrhh/utils/trabajadores-service.js` y `src/rrhh/utils/catalogos-service.js` (FR-067)
  - Evidencia parcial: servicios registran auditoría en varias operaciones, pero `src/rrhh/seguridad/auditoria.js` almacena `camposModificados` (nombres) y no valores anterior/nuevo; falta alineación con FR-067.
- [ ] T056 [US1] Añadir mensajes de validación y estados vacíos de trabajadores y catálogos en `src/rrhh/components/trabajador-form.js` y `src/rrhh/views/trabajadores-view.js` (FR-061–FR-063)
  - Falta: no se verificó cobertura completa en vistas/componentes.
- [X] T057 [US1] Integrar las vistas de trabajadores y catálogos en la navegación de RR.HH. en `src/rrhh/views/rrhh-router.js`
  - Evidencia: `src/rrhh/views/rrhh-router.js` (`renderRrhhRouter`, `RRHH_ROUTES`), `src/rrhh/views/workspace.js` (`RRHH_TABS`, `RENDERERS`, `RrhhWorkspace.renderTab`).
  - Falta (spec nuevo/reglas pendientes): verificar navegación completa y restricciones de acceso por rol según el spec vigente.

**Punto de control**: La Historia de Usuario 1 debe ser funcional y comprobable de forma independiente. La terminación automática de contratos al desvincular se completa en US2 (T068), reutilizando esta desactivación.

---

## Fase 4: Historia de Usuario 2 – Gestión de Contratos y Alertas de Plazo (Prioridad: P1)

**Objetivo**: Registrar contratos (sueldo base, jornada y tipo) con historial, estados vigente/vencido/terminado, validaciones legales y alertas de vencimiento en 30 días o menos.

**Prueba Independiente**: Asociar un contrato a un trabajador, verlo en el historial, registrar un cambio de condiciones como nuevo contrato, terminarlo estando vigente o vencido y comprobar la alerta de vencimiento. No requiere novedades ni liquidaciones.

### Pruebas de la Historia de Usuario 2

- [ ] T058 [P] [US2] Crear pruebas unitarias de validación de contratos, estados sin "cancelado", no superposición, sueldo mínimo, jornada máxima y renovación en `tests/unit/rrhh-contratos.test.js` (FR-068, FR-069, FR-070, FR-071)
  - Evidencia parcial: existe `tests/unit/rrhh-contratos.test.js`; cobertura exacta frente a reglas actuales no verificada.
- [ ] T059 [P] [US2] Crear pruebas unitarias de terminación automática del contrato vigente o vencido al desvincular y su auditoría en `tests/unit/rrhh-contratos-baja.test.js` (FR-070, FR-073)
  - Falta: no existe `tests/unit/rrhh-contratos-baja.test.js`.
- [ ] T060 [P] [US2] Crear prueba de integración de registro de contrato, cambio de sueldo, término, alerta de vencimiento, renovación y terminación automática al desvincular en `tests/integration/rrhh-contratos-flow.test.js` (FR-068, FR-071, FR-072, FR-073)
  - Evidencia parcial: existe `tests/integration/rrhh-contratos-flow.test.js`; cobertura exacta no verificada.

### Implementación de la Historia de Usuario 2

- [ ] T061 [P] [US2] Definir el esquema de contrato y su clave `erp_rrhh:contratos`, con estados vigente/vencido/terminado y sin estado "cancelado", en `src/rrhh/utils/contratos-service.js` (FR-068)
  - Evidencia: `src/rrhh/utils/contratos-service.js` (`CONTRATOS_TABLE`, `ESTADOS_CONTRATO`, `TIPOS_CONTRATO`, `buildRecord`, `estadoContratoEn`).
  - Falta (spec nuevo/reglas pendientes): confirmar alineación completa del esquema/campos con el spec vigente.
- [ ] T062 [US2] Implementar el CRUD de contratos, el historial de vigencias sin superposición y el máximo un contrato vigente por Trabajador (permitiendo cero contratos) en `src/rrhh/utils/contratos-service.js` (FR-068, FR-069)
  - Evidencia: `src/rrhh/utils/contratos-service.js` (`validarContrato`, `crearContrato`, `actualizarContrato`, `listContratos`, `getContrato`).
  - Falta (spec nuevo/reglas pendientes): verificar todas las restricciones CRUD/historial exigidas por el spec vigente.
- [ ] T063 [US2] Implementar las transiciones de estado: vencido por fecha; término de un contrato vigente o vencido, incluido el indefinido; prohibición de eliminar contratos y de usar el estado "cancelado" en `src/rrhh/utils/contratos-service.js` (FR-070)
  - Evidencia: `src/rrhh/utils/contratos-service.js` (`estadoContratoEn`, `terminarContrato`, `eliminarContrato`, `ESTADOS_CONTRATO`).
  - Falta (spec nuevo/reglas pendientes): verificar todos los casos de transición/terminación según el spec vigente.
- [ ] T064 [US2] Implementar los cambios de vigencia y renovaciones mediante un nuevo registro, ajustando la fecha de fin del anterior sin solapamiento y manteniendo la continuidad en `src/rrhh/utils/contratos-service.js` (FR-071)
  - Evidencia: `src/rrhh/utils/contratos-service.js` (`registrarCambioSueldo`).
  - Falta (spec nuevo/reglas pendientes): verificar flujo completo de renovaciones/ajustes según el spec vigente.
- [ ] T065 [US2] Implementar `getContratoVigente(entityId, fecha)` y `getContratosEnPeriodo(entityId, periodo)` por solapamiento de vigencia en `src/rrhh/utils/contratos-service.js` (FR-072, FR-080)
  - Evidencia parcial: existen `getContratoVigente` y `contratosEnPeriodo/contratoParaPeriodo`; la firma/nombre difiere de lo pedido (`getContratosEnPeriodo` no con esa firma exacta).
- [X] T066 [P] [US2] Implementar el servicio de alertas de contratos próximos a vencer (≤ 30 días) y vencidos en `src/rrhh/utils/alertas-service.js` (FR-072)
  - Evidencia: `src/rrhh/utils/alertas-service.js` (`DIAS_ALERTA_CONTRATO`, `diasHastaVencimiento`, `contratosPorVencer`, `alertasContratos`, `resumenAlertas`).
  - Falta (spec nuevo/reglas pendientes): verificar criterios exactos de alerta y exclusiones según el spec vigente.
- [X] T067 [US2] Implementar la validación de sueldo base no inferior al mínimo legal y jornada semanal no superior al máximo legal, usando los parámetros versionados, en `src/rrhh/utils/contratos-service.js` (FR-068; reglas de US2)
  - Evidencia: `src/rrhh/utils/contratos-service.js` (`validarContrato`, `limitarJornada`), `src/rrhh/utils/parametros-service.js`/`src/rrhh/calculo/parametros.js` (`obtenerParametro`/resolución por vigencia).
  - Falta (spec nuevo/reglas pendientes): verificar uso completo de parámetros versionados/vigencias en todos los casos según el spec vigente.
- [X] T068 [US2] Implementar la terminación automática de los contratos vigentes o vencidos al desvincular un Trabajador, conectada al gancho de desactivación de US1 en `src/rrhh/utils/trabajadores-service.js`, en `src/rrhh/utils/contratos-service.js` (FR-065, FR-070)
  - Evidencia: `src/rrhh/utils/trabajadores-service.js` (`desactivarTrabajador`), `src/rrhh/utils/contratos-service.js` (`terminarContrato`).
  - Falta (spec nuevo/reglas pendientes): confirmar cobertura exacta de contratos vencidos y requisitos de auditoría/fechas según el spec vigente.
- [ ] T069 [US2] Exigir un contrato cuya vigencia incluya la fecha de la novedad para registrarla y al menos un día del período para incluir al Trabajador en el cálculo, en `src/rrhh/utils/contratos-service.js` (FR-072)
  - Evidencia parcial: parte se aplica en `src/rrhh/utils/novedades-service.js` y cálculo/liquidaciones; no reside principalmente en `contratos-service.js` ni se verificó cumplimiento total.
- [X] T070 [P] [US2] Construir el formulario de contrato (sueldo base, jornada, tipo y vigencia) con validaciones en `src/rrhh/components/contrato-form.js` (FR-068)
  - Evidencia: `src/rrhh/components/contrato-form.js` (`renderContratoForm`).
  - Falta (spec nuevo/reglas pendientes): verificar validaciones/flujo completo según el spec vigente.
- [X] T071 [P] [US2] Construir la vista de listado e historial de contratos por trabajador con acciones de término para contratos vigentes o vencidos en `src/rrhh/views/contratos-view.js` (FR-068, FR-070)
  - Evidencia: `src/rrhh/views/contratos-view.js` (`renderContratosView`).
  - Falta (spec nuevo/reglas pendientes): verificar acciones/estados y reglas completas según el spec vigente.
- [X] T072 [US2] Mostrar las alertas de vencimiento de contrato en el panel principal en `src/components/dashboard.js` (FR-072)
  - Evidencia: `src/components/dashboard.js` (`renderContratoAlerts`, `refreshStats`).
  - Falta (spec nuevo/reglas pendientes): verificar contenido/criterios exactos de alerta según el spec vigente.
- [ ] T073 [US2] Registrar creación, actualización, cambios de estado y terminación automática de contratos en la bitácora con valores anterior/nuevo en `src/rrhh/seguridad/auditoria.js` y `src/rrhh/utils/contratos-service.js` (FR-073)
  - Evidencia parcial: se registra auditoría en operaciones de contrato, pero sin valores anterior/nuevo en el núcleo de auditoría.
- [X] T074 [US2] Integrar las vistas de contratos y alertas en la navegación de RR.HH. en `src/rrhh/views/rrhh-router.js`
  - Evidencia: `src/rrhh/views/rrhh-router.js` (`renderRrhhRouter`), `src/rrhh/views/workspace.js` (`RENDERERS.contratos`, `RRHH_TABS`), `src/components/dashboard.js` (`renderContratoAlerts`).
  - Falta (spec nuevo/reglas pendientes): ubicación exacta de alertas/navegación según el spec vigente (alertas integradas en dashboard base).

**Punto de control**: Las Historias de Usuario 1 y 2 deben funcionar de forma independiente.

---

## Fase 5: Historia de Usuario 3 – Registro y Aprobación de Novedades del Mes (Prioridad: P1)

**Objetivo**: Registrar y aprobar novedades del período (horas extra, licencias médicas y ausencias) con privacidad, período activo, split por meses, validaciones de superposición/tope y segregación de funciones.

**Prueba Independiente**: Una jefatura registra novedades para su equipo, el sistema exige aprobación explícita antes del cálculo, divide rangos que cruzan meses, bloquea períodos cerrados, impide editar Aprobadas/Rechazadas y registra cada cambio. No requiere ejecutar el cálculo.

### Pruebas de la Historia de Usuario 3

- [ ] T075 [P] [US3] Crear pruebas unitarias de estados, privacidad de licencias y bloqueo en período cerrado en `tests/unit/rrhh-novedades.test.js` (FR-074, FR-076)
  - Evidencia parcial: existe `tests/unit/rrhh-novedades.test.js`; cobertura exacta no verificada.
- [ ] T076 [P] [US3] Crear pruebas unitarias de split por meses con atomicidad y período activo requerido en `tests/unit/rrhh-novedades-split.test.js` (FR-074, FR-075)
  - Falta: no existe `tests/unit/rrhh-novedades-split.test.js`.
- [ ] T077 [P] [US3] Crear pruebas unitarias de segregación de funciones, edición/anulación solo de Pendientes y motivo obligatorio de rechazo en `tests/unit/rrhh-novedades-segregacion.test.js` (FR-077)
  - Falta: no existe `tests/unit/rrhh-novedades-segregacion.test.js`.
- [ ] T078 [P] [US3] Crear pruebas unitarias de superposición de licencias/ausencias y tope de horas extra con justificación escrita en `tests/unit/rrhh-novedades-validaciones.test.js` (FR-074; reglas de US3)
  - Falta: no existe `tests/unit/rrhh-novedades-validaciones.test.js`.
- [ ] T079 [P] [US3] Crear prueba de integración del flujo de registro, aprobación, rechazo, anulación solo de Pendientes y bloqueo de cálculo en `tests/integration/rrhh-novedades-flow.test.js` (FR-074, FR-076, FR-077, FR-078)
  - Falta: no existe `tests/integration/rrhh-novedades-flow.test.js`; existen pruebas de integración de novedades con otros nombres.

### Implementación de la Historia de Usuario 3

- [ ] T080 [P] [US3] Definir el esquema de novedad, tipos permitidos, justificación de horas extra y clave `erp_rrhh:novedades` en `src/rrhh/utils/novedades-service.js` (FR-074)
  - Evidencia parcial: `src/rrhh/utils/novedades-service.js` usa tabla `novedades` (`erp_rrhh:novedades` vía storage RR.HH.) y lógica de tipos; esquema completo/justificación según spec no verificado totalmente.
- [ ] T081 [US3] Implementar el CRUD de novedades con privacidad de licencias (solo tipo y días, sin diagnóstico) en `src/rrhh/utils/novedades-service.js` (FR-074)
  - Evidencia parcial: crear/actualizar/anular y sanitización de privacidad existen; falta verificar cobertura completa del CRUD y privacidad.
- [ ] T082 [US3] Implementar la asociación al período de la fecha y la exigencia de período activo en `src/rrhh/utils/novedades-service.js` (FR-074, FR-076)
  - Evidencia parcial: hay validaciones de período activo; verificar asociación por fecha en todos los casos.
- [ ] T083 [US3] Implementar el split atómico por mes calendario cuando el rango cruza meses, rechazando todo si algún período no está activo en `src/rrhh/utils/novedades-service.js` (FR-075)
  - Evidencia parcial: `dividirPorMes` y validaciones previas a inserción existen; atomicidad/comportamiento exacto no verificado.
- [ ] T084 [US3] Implementar la máquina de estados pendiente/aprobada/rechazada/anulada y el bloqueo de períodos cerrados en `src/rrhh/utils/novedades-service.js` (FR-076)
  - Evidencia parcial: estados y bloqueos existen (apoya en aprobación/períodos); verificar máquina completa.
- [ ] T085 [US3] Implementar la segregación de funciones: jefatura no aprueba lo que registró; administrador/a aprueba las de Trabajadores sin jefatura y las registradas por la jefatura; analista registra y ve pero no aprueba ni rechaza; solo Pendientes se editan/anulan y las Aprobadas/Rechazadas no se modifican en `src/rrhh/utils/novedades-service.js` (FR-077)
  - Evidencia parcial: hay controles de permisos/alcance; la matriz de roles implementada difiere del spec (roles adicionales/distintos), por lo que el cumplimiento de FR-077 no está confirmado.
- [ ] T086 [US3] Implementar la validación de superposición de licencias y ausencias de un mismo Trabajador en `src/rrhh/utils/novedades-service.js` (FR-074; reglas de US3)
  - Evidencia parcial: existe detección de solapamiento; verificar reglas completas.
- [ ] T087 [US3] Implementar el tope diario de horas extra desde los parámetros legales y la exigencia de justificación escrita para superarlo en `src/rrhh/utils/novedades-service.js` (FR-074; reglas de US3)
  - Evidencia parcial: usa `MAX_HORAS_EXTRA`; verificación de exigencia de justificación y todos los casos pendiente.
- [ ] T088 [US3] Implementar el motivo obligatorio al rechazar una novedad en `src/rrhh/utils/novedades-service.js` (FR-076; reglas de US3)
  - Falta: lógica de aprobación/rechazo delegada a `novedades-aprobacion.js`; obligatoriedad de motivo según spec no verificada aquí.
- [ ] T089 [P] [US3] Construir el formulario de novedad con campos condicionados por tipo y justificación de horas extra en `src/rrhh/components/novedad-form.js` (FR-074)
  - Evidencia parcial: `src/rrhh/components/novedad-form.js` existe.
- [ ] T090 [P] [US3] Construir el listado de novedades con acciones de aprobar/rechazar/anular solo sobre Pendientes e historial de estados en `src/rrhh/views/novedades.js` (FR-077)
  - Evidencia parcial: ruta real `src/rrhh/views/novedades.js` (existe) en lugar de `.../novedades-view.js`; cumplimiento completo no verificado.
- [ ] T091 [US3] Implementar el bloqueo del cálculo cuando existan novedades pendientes y la alerta con las no resueltas en `src/rrhh/utils/novedades-service.js` (FR-076)
  - Evidencia parcial: `estadoElegibilidad`/conteos y bloqueo en `calcularPeriodo` (`src/rrhh/utils/liquidacion-service.js`) existen; alerta/listado de no resueltas según spec no verificado.
- [ ] T092 [US3] Registrar creación, actualización, aprobación, rechazo y anulación de novedades en la bitácora con valores anterior/nuevo en `src/rrhh/seguridad/auditoria.js` y `src/rrhh/utils/novedades-service.js` (FR-078)
  - Evidencia parcial: auditoría registrada en operaciones; sin valores anterior/nuevo.
- [ ] T093 [US3] Integrar la vista de novedades en la navegación de RR.HH. en `src/rrhh/views/rrhh-router.js`
  - Evidencia parcial: integrada en `src/rrhh/views/rrhh-router.js`/`workspace.js` (vista `novedades.js`).

**Punto de control**: Las Historias de Usuario 1, 2 y 3 deben funcionar de forma independiente.

---

## Fase 6: Historia de Usuario 4 – Cálculo de Planilla y Ciclo de Vida de Liquidaciones (Prioridad: P1)

**Objetivo**: Crear períodos con parámetros obligatorios, ejecutar el cálculo con contratos que toquen el período y parámetros versionados, informar exclusiones y gestionar el ciclo de vida hasta el cierre inmutable.

**Prueba Independiente**: Crear un período, calcularlo con datos de prueba, cuadrar el caso de referencia al peso, recalcular sin duplicar tras una novedad aprobada y cerrar el período congelando UF, UTM y parámetros. Incluye un Trabajador con contrato terminado dentro del período.

### Pruebas de la Historia de Usuario 4

- [ ] T094 [P] [US4] Crear pruebas unitarias del motor de cálculo y del uso de parámetros legales versionados en `tests/unit/rrhh-calculo.test.js` (FR-080)
  - Evidencia parcial: existe `tests/unit/rrhh-calculo.test.js`; cobertura exacta no verificada.
- [ ] T095 [P] [US4] Crear pruebas unitarias de creación de período, estados y redondeo por línea en `tests/unit/rrhh-periodos.test.js` (FR-079, FR-082, FR-083)
  - Evidencia parcial: existe `tests/unit/rrhh-periodos.test.js`; no cubre necesariamente redondeo por línea en el mismo archivo.
- [ ] T096 [P] [US4] Crear pruebas unitarias de desactualización y recálculo idempotente de liquidaciones en `tests/unit/rrhh-liquidacion-estados.test.js` (FR-080, FR-081)
  - Evidencia parcial: existe `tests/unit/rrhh-liquidacion-estados.test.js`; idempotencia/desactualización según spec no verificada.
- [ ] T097 [P] [US4] Crear prueba de integración del caso de referencia, recálculo y cierre de período en `tests/integration/rrhh-calculo-periodo.test.js` (FR-080, FR-082, FR-083)
  - Evidencia parcial: existe `tests/integration/rrhh-calculo-periodo.test.js`.
- [ ] T098 [P] [US4] Crear prueba de integración de elegibilidad por solapamiento de vigencia y resumen de Trabajadores excluidos con motivo en `tests/integration/rrhh-calculo-elegibilidad.test.js` (FR-080)
  - Falta: no existe `tests/integration/rrhh-calculo-elegibilidad.test.js`.

### Implementación de la Historia de Usuario 4

- [ ] T099 [P] [US4] Definir el esquema de período y su clave `erp_rrhh:periodos` con estados Abierto/Calculado/Cerrado en `src/rrhh/utils/periodos-service.js` (FR-079, FR-082)
  - Evidencia parcial: `src/rrhh/utils/periodos-service.js` define `PERIODOS_TABLE` (`periodos`) y maneja estados; `spec.md:467` y `data-model.md:117` ya definen `Abierto/Calculado/Cerrado` y la clave `erp_rrhh:periodos`. Queda verificar que la implementación use exactamente esos valores y esa clave.
- [ ] T100 [US4] Implementar la creación de período por mes y año, con parámetros legales obligatorios, unicidad y validación de mes calendario en `src/rrhh/utils/periodos-service.js` (FR-079)
  - Evidencia parcial: apertura/aseguramiento de períodos existe; falta evidencia de exigir parámetros legales obligatorios al crear y de todas las validaciones.
- [ ] T101 [P] [US4] Implementar las funciones puras del motor (sueldo proporcional, horas extra, gratificación, AFP, salud, seguro de cesantía e impuesto único) en `src/rrhh/calculo/motor.js` (FR-080)
  - Evidencia parcial: `src/rrhh/calculo/motor.js` existe; cobertura completa de componentes legales no verificada.
- [ ] T102 [P] [US4] Implementar el redondeo por línea al peso y los totales por suma de líneas en `src/rrhh/calculo/redondeo.js` (FR-083)
  - Falta: no existe `src/rrhh/calculo/redondeo.js`; el redondeo puede estar en otro módulo.
- [ ] T103 [P] [US4] Implementar la máquina de estados de liquidación y la persistencia de liquidaciones y líneas con snapshot del parámetro legal en `src/rrhh/utils/liquidaciones-service.js` (FR-080)
  - Evidencia parcial: ruta real `src/rrhh/utils/liquidacion-service.js` y `src/rrhh/utils/liquidacion-estados.js` existen; snapshot/persistencia completa no verificada. (Ruta corregida a estructura real.)
- [ ] T104 [US4] Implementar el cálculo del período usando cualquier contrato cuya vigencia comprenda al menos un día del período (incluidos terminados/vencidos con vigencia en el período) y solo novedades aprobadas, en forma proporcional a los días de vigencia, dejando el período en estado Calculado en `src/rrhh/utils/periodos-service.js` (FR-080)
  - Evidencia parcial: la lógica de cálculo está en `src/rrhh/utils/liquidacion-service.js` (no en `periodos-service.js`) y usa contratos/novedades aprobadas; queda verificar proporcionalidad por días de vigencia y el paso a estado `Calculado` según FR-080. (Ruta real corregida.)
- [ ] T105 [US4] Implementar el resumen del cálculo con liquidaciones generadas y Trabajadores excluidos por no tener contrato en el período, indicando el motivo en `src/rrhh/utils/periodos-service.js` (FR-080)
  - Evidencia parcial: `calcularPeriodo` devuelve resumen/excluidos en `src/rrhh/utils/liquidacion-service.js`; ruta difiere.
- [ ] T106 [US4] Implementar el recálculo mientras el período esté Abierto o Calculado, reemplazando las liquidaciones en borrador sin duplicarlas en `src/rrhh/utils/periodos-service.js` (FR-080)
  - Evidencia parcial: el recálculo/prevención parcial existe en `src/rrhh/utils/liquidacion-service.js` (ruta real corregida); queda verificar idempotencia, reemplazo sin duplicados y estados `Abierto`/`Calculado` según FR-080.
- [ ] T107 [US4] Marcar como desactualizada la liquidación tras aprobar una novedad o cambiar un contrato posterior al último cálculo en `src/rrhh/utils/periodos-service.js` (FR-081)
  - Falta: no se evidencia marcado de desactualización según FR-081.
- [ ] T108 [US4] Implementar el cierre de período: bloquear con novedades pendientes o Trabajadores sin calcular, congelar UF/UTM/tasas y registrar quién y cuándo en `src/rrhh/utils/periodos-service.js` (FR-082)
  - Evidencia parcial: `cerrarPeriodo` congela parámetros y registra cierre; falta evidencia de bloqueos completos (pendientes/sin calcular) exigidos.
- [ ] T109 [US4] Impedir el recálculo y la edición de liquidaciones de períodos cerrados y la reapertura del período en `src/rrhh/utils/periodos-service.js` (FR-082, FR-083)
  - Evidencia parcial: hay controles de período cerrado (`PeriodoCerradoError`, `isPeriodoCerrado`); reapertura/edición según todas las reglas no verificada.
- [ ] T110 [P] [US4] Implementar el cálculo de aportes y costo empleador en `src/rrhh/utils/costo-empleador.js` (FR-080)
  - Evidencia parcial: `src/rrhh/utils/costo-empleador.js` existe.
- [ ] T111 [P] [US4] Construir el formulario de carga manual y versionado de parámetros legales (UF, UTM, IMM, tasas, topes y tramos) en `src/rrhh/components/parametros-form.js` (FR-079)
  - Falta: no existe `src/rrhh/components/parametros-form.js`.
- [ ] T112 [P] [US4] Construir la vista de administración de parámetros legales y su historial de vigencias en `src/rrhh/views/parametros-view.js` (FR-079)
  - Falta: no existe `src/rrhh/views/parametros-view.js`.
- [ ] T113 [P] [US4] Construir la vista de gestión de períodos (abrir, calcular y cerrar) en `src/rrhh/views/periodos.js` (FR-079, FR-082)
  - Evidencia parcial: ruta real `src/rrhh/views/periodos.js`; cumplimiento completo no verificado. (Ruta corregida.)
- [ ] T114 [P] [US4] Construir la vista de cálculo de planilla con alerta de novedades pendientes y resumen de generadas/excluidas en `src/rrhh/views/planilla.js` (FR-080)
  - Evidencia parcial: ruta real `src/rrhh/views/planilla.js` con elegibilidad y resultados; verificar alerta/resumen exactos. (Ruta corregida.)
- [ ] T115 [P] [US4] Construir la vista de listado y detalle de liquidaciones en `src/rrhh/views/liquidaciones.js` (FR-080)
  - Evidencia parcial: ruta real `src/rrhh/views/liquidaciones.js`; cumplimiento completo no verificado. (Ruta corregida.)
- [ ] T116 [US4] Registrar creación, cálculo, recálculo y cierre de períodos en la bitácora en `src/rrhh/seguridad/auditoria.js` y `src/rrhh/utils/periodos-service.js` (FR-084)
  - Evidencia parcial: se registran algunas acciones (abrir/cerrar/calcular) en servicios relacionados; cobertura completa de creación/cálculo/recálculo/cierre no verificada.
- [ ] T117 [US4] Integrar las vistas de parámetros, períodos, planilla y liquidaciones en la navegación de RR.HH. en `src/rrhh/views/rrhh-router.js`
  - Evidencia parcial: períodos, planilla y liquidaciones integrados en `src/rrhh/views/rrhh-router.js`/`workspace.js`; no hay vista de parámetros integrada.

**Punto de control**: Las Historias de Usuario 1 a 4 deben funcionar de forma independiente, incluida la elegibilidad por solapamiento y el resumen de exclusiones.

---

## Fase 7: Historia de Usuario 6 – Seguridad, Roles y Gobierno de Datos (Prioridad: P1)

**Objetivo**: Aplicar permisos detallados por rol, visibilidad restringida (incluido el scoping de equipo de la jefatura), cambio de rol auditado, bitácora append-only con filtros y respaldo/restauración JSON sin sobrescribir la bitácora.

**Prueba Independiente**: Simular cada rol y comprobar qué ve y qué puede operar; verificar que la jefatura solo accede a los datos básicos de su equipo, que cada consulta/cambio sensible, acceso denegado, cambio de rol y operación de respaldo queda en la bitácora, que esta no puede editarse ni eliminarse y que importar un respaldo no borra registros previos.

### Pruebas de la Historia de Usuario 6

- [ ] T118 [P] [US6] Crear pruebas unitarias de la matriz de roles y permisos detallados (administrador/a, analista, jefatura y Trabajador) en `tests/unit/rrhh-seguridad-roles.test.js` (FR-051, FR-085)
  - Falta: no existe `tests/unit/rrhh-seguridad-roles.test.js`; existe `tests/unit/rrhh-seguridad.test.js`.
- [ ] T119 [P] [US6] Crear pruebas unitarias de visibilidad restringida por rol, datos básicos de la jefatura y scoping de equipo en listados, detalles, búsquedas e impresión en `tests/unit/rrhh-seguridad-visibilidad.test.js` (FR-052, FR-053, FR-054, FR-085)
  - Falta: no existe `tests/unit/rrhh-seguridad-visibilidad.test.js`.
- [ ] T120 [P] [US6] Crear pruebas unitarias de inmutabilidad, retención, consulta exclusiva de la bitácora, filtros y registro de intentos denegados en `tests/unit/rrhh-auditoria.test.js` (FR-055, FR-056, FR-058, FR-087)
  - Evidencia parcial: existe `tests/unit/rrhh-auditoria.test.js`; no se verifica cobertura completa (retención, filtros/consulta exclusiva según spec) ni que el nombre/alcance coincida plenamente.
- [ ] T121 [P] [US6] Crear pruebas unitarias de cambio de rol en sesión activa con registro en bitácora en `tests/unit/rrhh-sesion-rol.test.js` (FR-086)
  - Falta: no existe `tests/unit/rrhh-sesion-rol.test.js`.
- [ ] T122 [P] [US6] Crear prueba de integración de acceso por rol, denegaciones auditadas y bitácora append-only en `tests/integration/rrhh-seguridad-flow.test.js` (FR-055, FR-057, FR-059)
  - Falta: no existe `tests/integration/rrhh-seguridad-flow.test.js`; hay pruebas relacionadas (`rrhh-seguridad-jefatura.test.js`, `rrhh-auditoria.test.js`).
- [ ] T123 [P] [US6] Crear prueba de integración de respaldo/restauración JSON que preserva y fusiona la auditoría previa, respeta permisos y completa el ciclo en menos de 5 minutos en `tests/integration/backup-flow.test.js` (FR-056, FR-060, FR-085, SC-022)
  - Falta: no existe `tests/integration/backup-flow.test.js` ni implementación de respaldo JSON.
- [ ] T124 [P] [US6] Crear prueba de integración de restricciones de Trabajador desvinculado y de jefatura sobre equipos ajenos en `tests/integration/rrhh-seguridad-desvinculado.test.js` (FR-051, FR-053, FR-085)
  - Falta: no existe `tests/integration/rrhh-seguridad-desvinculado.test.js`.

### Implementación de la Historia de Usuario 6

- [ ] T125 [P] [US6] Definir los cuatro roles y sus permisos detallados en `src/rrhh/seguridad/roles.js` (FR-051, FR-085)
  - Evidencia parcial: `src/rrhh/seguridad/roles.js` define matriz de roles, pero incluye roles adicionales (`gerencia`, `auditor`) y permisos que no coinciden exactamente con los cuatro roles/permisos detallados del spec.
- [ ] T126 [P] [US6] Implementar la sesión simulada, el selector de rol y el cambio de rol en sesión activa en `src/rrhh/seguridad/session.js` (FR-051, FR-086)
  - Evidencia parcial: ruta real `src/rrhh/seguridad/session.js` (no `sesion.js`) implementa sesión simulada y cambio de rol; falta registro en bitácora del cambio y re-selección/flujo completo exigido.
- [ ] T127 [P] [US6] Implementar la selección del Trabajador representado: jefatura solo activo; Trabajador activo o desvinculado (solo liquidaciones cerradas) en `src/rrhh/seguridad/session.js` (FR-051, FR-085)
  - Falta: la sesión guarda `trabajadorId/equipo` pero no se evidencia la selección/validación completa requerida por el spec.
- [ ] T128 [P] [US6] Implementar la clasificación de datos sensibles y la matriz de visibilidad por rol, incluyendo nombre, código, cargo, departamento, centro de costo y estado laboral como datos básicos de la jefatura, en `src/rrhh/seguridad/permisos.js` (FR-052, FR-054, FR-085)
  - Falta: no existe `src/rrhh/seguridad/permisos.js`; hay lógica relacionada en `src/rrhh/seguridad/roles.js` y `src/rrhh/seguridad/acceso-datos.js`.
- [ ] T129 [US6] Aplicar la visibilidad restringida en listados, detalles, búsquedas y vistas imprimibles en `src/rrhh/seguridad/permisos.js`, `src/components/search-bar.js` y `src/rrhh/views/liquidaciones.js` (FR-052, FR-054)
  - Falta: rutas reales difieren (`liquidaciones.js`, no `liquidaciones-view.js`; permisos no en `permisos.js`) y no se evidencia aplicación completa en listados/detalles/búsquedas/imprimibles.
- [ ] T130 [US6] Implementar la denegación de acciones/consultas sin revelar contenido protegido en `src/rrhh/seguridad/permisos.js` (FR-057, FR-059)
  - Evidencia parcial: hay denegaciones en `src/rrhh/seguridad/acceso-datos.js`, `src/rrhh/views/liquidacion.js` y `src/rrhh/views/liquidaciones.js`; módulo/ruta solicitada no existe y cobertura total no verificada.
- [ ] T131 [US6] Registrar en la bitácora consultas/cambios de datos sensibles, cambios de rol, accesos denegados (incluidos intentos de editar/eliminar auditoría) y operaciones de respaldo, con usuario, rol, fecha/hora, acción y registro afectado en `src/rrhh/seguridad/auditoria.js` (FR-055, FR-086)
  - Evidencia parcial: auditoría soporta varias acciones y denegaciones; faltan registro de cambios de rol/operaciones de respaldo y valores/campos completos según spec.
- [ ] T132 [US6] Aplicar las restricciones de rol y el scoping de equipo en la capa de servicios de RR.HH., incluidos parámetros y respaldo, en `src/rrhh/utils/trabajadores-service.js`, `src/rrhh/utils/contratos-service.js`, `src/rrhh/utils/novedades-service.js`, `src/rrhh/utils/periodos-service.js`, `src/rrhh/utils/liquidacion-service.js` y `src/rrhh/calculo/parametros.js` (FR-057, FR-085)
  - Evidencia parcial: algunos servicios aplican permisos (`trabajadores`, `contratos`, `novedades`, `liquidacion/periodos` en partes); falta cobertura uniforme (incl. parámetros/respaldo) y alineación con roles del spec. (Rutas reales ajustadas: `liquidacion-service.js`.)
- [ ] T133 [US6] Implementar el ayudante de equipo de jefatura (`getEquipo`) y aplicarlo a novedades, listados y búsquedas, impidiendo operar sobre Trabajadores ajenos en `src/rrhh/seguridad/permisos.js` y `src/rrhh/utils/trabajadores-service.js` (FR-053, FR-085)
  - Evidencia parcial: existe `equipoDeJefatura` en `src/rrhh/utils/jefatura.js` y scoping en servicios/vistas; no existe `getEquipo` en `permisos.js` ni se verificó aplicación completa en búsquedas/listados/impresión.
- [ ] T134 [P] [US6] Implementar la exportación JSON registrando la operación en la bitácora, sin modificar los datos, en `src/backup.js` (FR-060, FR-055)
  - Falta: no existe `src/backup.js`.
- [ ] T135 [US6] Implementar la validación e importación con confirmación y restauración atómica de datos operativos, registrando la operación sin sobrescribir ni eliminar registros previos de auditoría (fusión append-only), sin datos clínicos y respetando permisos, en `src/backup.js` (FR-060, FR-056, FR-085)
  - Falta: no existe `src/backup.js`.
- [ ] T136 [P] [US6] Construir el selector de rol/sesión y la reselección del Trabajador representado en `src/rrhh/components/rol-switcher.js` (FR-051, FR-086)
  - Evidencia parcial: existe `src/rrhh/components/rol-switcher.js` y selector en shell; reselección de trabajador representado según spec no verificada.
- [ ] T137 [P] [US6] Construir la vista de consulta de la bitácora de auditoría, accesible solo al administrador/a de RR.HH., con filtros por usuario, rol, acción y período, en `src/rrhh/views/auditoria.js` (FR-087)
  - Evidencia parcial: ruta real `src/rrhh/views/auditoria.js` existe; filtros requeridos y restricción exclusiva al rol administrador/a según spec no verificados. (Ruta corregida.)
- [ ] T138 [P] [US6] Añadir las acciones de exportar e importar respaldo en la interfaz con confirmación y verificación de permisos en `src/components/shell.js` y `src/styles.css` (FR-060, FR-085)
  - Falta: no se evidencian acciones de exportar/importar respaldo en `src/components/shell.js`.
- [ ] T139 [US6] Integrar el selector de rol, la vista de auditoría y las acciones de respaldo en la navegación y el marco del espacio de trabajo en `src/rrhh/views/rrhh-router.js` y `src/components/shell.js` (FR-086, FR-087, FR-060)
  - Evidencia parcial: selector de rol y vista de auditoría integrados; acciones de respaldo no existen.
- [ ] T140 [US6] Bloquear en un Trabajador desvinculado cualquier operación distinta de consultar sus propias liquidaciones cerradas en `src/rrhh/seguridad/permisos.js` y `src/rrhh/views/liquidaciones.js` (FR-051, FR-085)
  - Falta: rutas/lógica no alineadas al spec actual (no `permisos.js`) y restricción completa no verificada.
- [ ] T141 [US6] Aplicar permisos de administrador/a a la carga y administración de parámetros legales en `src/rrhh/calculo/parametros.js`, `src/rrhh/components/parametros-form.js` y `src/rrhh/views/parametros-view.js` (FR-085)
  - Falta: no existen `parametros-form.js`/`parametros-view.js` ni controles de permisos explícitos en `calculo/parametros.js`.
- [ ] T142 [US6] Aplicar permisos de administrador/a a la exportación, importación y restauración del respaldo en `src/backup.js` y `src/components/shell.js` (FR-085)
  - Falta: no existe `src/backup.js`.

**Punto de control**: US1–US4 y US6 deben funcionar de forma independiente; la seguridad, el scoping de equipo y la auditoría quedan aplicadas transversalmente.

---

## Fase 8: Historia de Usuario 5 – Vista Explicativa e Impresión de Liquidaciones (Prioridad: P2)

**Objetivo**: Explicar cada línea de la liquidación con su base, tasa o fórmula y parámetro legal, y ofrecer una vista limpia para imprimir o guardar en PDF, respetando permisos y el máximo de dos páginas.

**Prueba Independiente**: Seleccionar una línea y ver su desglose con el parámetro legal y su vigencia en menos de 1 segundo; imprimir y obtener un comprobante sin controles de navegación que coincide con los montos de la liquidación y se ajusta a dos páginas como máximo.

### Pruebas de la Historia de Usuario 5

- [ ] T143 [P] [US5] Crear prueba de integración del desglose por línea, snapshot congelado y marca de borrador en `tests/integration/rrhh-liquidacion-explicacion.test.js` (FR-040, FR-041, FR-043)
  - Falta: no existe `tests/integration/rrhh-liquidacion-explicacion.test.js`; cobertura relacionada en `rrhh-liquidacion-view.test.js`.
- [ ] T144 [P] [US5] Crear prueba de integración de la vista imprimible, contenido del comprobante (incluida empresa emisora), guardado en PDF, máximo de dos páginas y obtención del comprobante en menos de 30 segundos en `tests/integration/rrhh-liquidacion-print.test.js` (FR-044, FR-045, FR-046, FR-047, SC-015, SC-012)
  - Evidencia parcial: existe `tests/integration/rrhh-liquidacion-print.test.js`; cumplimiento de todos los criterios (p. ej. máximo dos páginas/tiempos) no verificado.
- [ ] T145 [P] [US5] Crear prueba de integración de permisos y auditoría al explicar, imprimir o guardar en PDF una liquidación en `tests/integration/rrhh-liquidacion-permisos.test.js` (FR-048, FR-049, FR-050)
  - Falta: no existe `tests/integration/rrhh-liquidacion-permisos.test.js`.
- [ ] T146 [P] [US5] Crear prueba de rendimiento de la explicación de línea que mida desde el evento de selección (foco/click) de cada línea hasta que el desglose con base, tasa/factor y fórmula queda visible, verificando que el 100% de las líneas responde en menos de 1 segundo, en `tests/integration/rrhh-liquidacion-rendimiento.test.js` (SC-011)
  - Falta: no existe `tests/integration/rrhh-liquidacion-rendimiento.test.js`.

### Implementación de la Historia de Usuario 5

- [ ] T147 [P] [US5] Construir el panel de explicación por línea (base, tasa o factor, fórmula y parámetro legal con vigencia) en `src/rrhh/components/linea-explicacion.js` (FR-040, FR-041)
  - Falta: no existe `src/rrhh/components/linea-explicacion.js`; la explicación se renderiza en `src/rrhh/views/liquidacion.js` con apoyo de utilidades.
- [ ] T148 [US5] Indicar claramente cuando una línea no dispone de fórmula o parámetro legal y registrar el motivo de las líneas manuales, sin omitirla del comprobante, en `src/rrhh/components/linea-explicacion.js` (FR-042)
  - Falta: ruta/componente distinto; comportamiento no verificado contra FR-042.
- [ ] T149 [US5] Implementar la explicación con valores congelados en períodos cerrados y la marca de "borrador" en abiertos/calculados en `src/rrhh/views/liquidacion.js` (FR-043)
  - Evidencia parcial: `src/rrhh/views/liquidacion.js` muestra estado/explicación; cumplimiento exacto de congelados/borrador en todos los casos no verificado.
- [ ] T150 [P] [US5] Construir la vista imprimible sin menús, botones de edición ni controles de navegación en `src/rrhh/views/liquidacion-impresion.js` (FR-044)
  - Falta: no existe `src/rrhh/views/liquidacion-impresion.js`; la impresión se maneja en `src/rrhh/views/liquidacion.js` (`createPrintController`/clase de impresión).
- [ ] T151 [US5] Incluir en el comprobante la identificación del Trabajador, período, empresa emisora, líneas con montos, totales, líquido a pagar y marca de borrador en `src/rrhh/views/liquidacion-impresion.js` (FR-045)
  - Falta: ruta distinta (`liquidacion.js`); contenido completo del comprobante no verificado.
- [ ] T152 [US5] Garantizar que los montos del comprobante coincidan exactamente con la liquidación en `src/rrhh/views/liquidacion-impresion.js` (FR-046)
  - Falta: evidencia insuficiente y ruta distinta.
- [ ] T153 [P] [US5] Implementar los estilos de impresión en tamaño carta/A4 vertical y el control de salto para un máximo de dos páginas en `src/rrhh/views/liquidacion-impresion.css` (FR-047, SC-015)
  - Falta: no existe `src/rrhh/views/liquidacion-impresion.css`.
- [ ] T154 [US5] Aplicar los permisos de acceso a la consulta, explicación, impresión y guardado en PDF (analista y administrador/a: cualquier Trabajador; Trabajador: solo sus liquidaciones cerradas; jefatura: sin acceso) en `src/rrhh/views/liquidacion.js` y `src/rrhh/seguridad/permisos.js` (FR-048)
  - Evidencia parcial: `liquidacion.js`/`liquidaciones.js` aplican controles basados en roles/acceso, pero la matriz de roles y rutas (`permisos.js` ausente) no coinciden plenamente con el spec.
- [ ] T155 [US5] Impedir el acceso a liquidaciones ajenas, no cerradas o de equipos ajenos e informar la denegación sin revelar contenido en `src/rrhh/views/liquidacion.js` (FR-049)
  - Evidencia parcial: hay denegaciones; cobertura exacta (propias/no cerradas/equipos ajenos) no verificada.
- [ ] T156 [US5] Registrar en la bitácora la consulta, explicación, impresión o guardado en PDF de liquidaciones en `src/rrhh/views/liquidacion.js` y `src/rrhh/seguridad/auditoria.js` (FR-050)
  - Evidencia parcial: se registra consulta en `loadLiquidacion`/`liquidaciones.js`; no se evidencia registro específico de explicación/impresión/guardado en PDF.
- [ ] T157 [US5] Integrar las acciones de explicar, imprimir y guardar en PDF en el detalle de liquidación en `src/rrhh/views/liquidaciones.js` (FR-040, FR-044)
  - Evidencia parcial: ruta real `src/rrhh/views/liquidaciones.js` integra vista/detalle; acciones completas no verificadas. (Ruta corregida.)
- [ ] T158 [US5] Verificar que consultar, explicar o imprimir una liquidación no modifica su contenido en `src/rrhh/views/liquidacion.js` (FR-044)
  - Falta: no hay evidencia/verificación explícita.
- [ ] T159 [US5] Cargar los datos de identificación de la empresa emisora desde la configuración del módulo para el comprobante en `src/module-config.js` y `src/rrhh/views/liquidacion.js` (FR-045; suposición de datos del emisor)
  - Evidencia parcial: `module-config.js` define `empresa` y `liquidacion.js` resuelve emisor (`getEmpresa`/config), pero ruta/comportamiento exacto no verificado. (Ruta corregida.)
- [ ] T160 [US5] Medir y optimizar la generación de la explicación por línea usando la medición definida en SC-011 (desde la selección de la línea hasta el desglose visible) para cumplir menos de 1 segundo en `src/rrhh/components/linea-explicacion.js` (SC-011)
  - Falta: componente/ruta no existe y no hay evidencia de medición.

**Punto de control**: Las Historias de Usuario 1 a 6 deben funcionar de forma independiente.

---

## Fase 9: Historia de Usuario 7 – Vacaciones: Solicitud, Aprobación y Saldo (Prioridad: P2)

**Objetivo**: Calcular el saldo de vacaciones por devengo proporcional, registrar solicitudes en días hábiles según el calendario de feriados, aprobarlas o rechazarlas con segregación de funciones, impedir excesos de saldo y superposiciones, y alertar del feriado acumulado al máximo, sin descontar días en la liquidación.

**Prueba Independiente**: Con Trabajadores, contratos y feriados precargados como datos semilla, un Trabajador ve su saldo, solicita días, su jefatura los aprueba y el saldo se descuenta; una solicitud que supera el saldo o que se superpone con una licencia es rechazada. No requiere ejecutar el cálculo de planilla.

### Pruebas de la Historia de Usuario 7

- [ ] T170 [P] [US7] Crear pruebas unitarias del devengo de 1,25 días hábiles por mes completo desde la fecha de ingreso, del saldo disponible (devengados menos aprobados) y del máximo acumulado de 30 días hábiles en `tests/unit/rrhh-vacaciones-saldo.test.js` (FR-088, SC-024)
  - Falta: historia nueva; no existe `tests/unit/rrhh-vacaciones-saldo.test.js`.
- [ ] T171 [P] [US7] Crear pruebas unitarias del conteo de días hábiles (excluye sábados, domingos y feriados del calendario) y de la unicidad de feriados por fecha en `tests/unit/rrhh-vacaciones-dias-habiles.test.js` (FR-089)
  - Falta: historia nueva; no existe `tests/unit/rrhh-vacaciones-dias-habiles.test.js`.
- [ ] T172 [P] [US7] Crear pruebas unitarias de estados Pendiente/Aprobada/Rechazada/anulada, quién aprueba (jefatura directa o, sin ella, administrador/a), prohibición de aprobar lo que se registró, motivo obligatorio de rechazo y anulación de Aprobadas solo antes de su inicio en `tests/unit/rrhh-vacaciones-aprobacion.test.js` (FR-090)
  - Falta: historia nueva; no existe `tests/unit/rrhh-vacaciones-aprobacion.test.js`.
- [ ] T173 [P] [US7] Crear pruebas unitarias de rechazo por saldo insuficiente, superposición con otras vacaciones o con licencias/ausencias (US3) y Trabajador sin contrato vigente en las fechas en `tests/unit/rrhh-vacaciones-validaciones.test.js` (FR-091)
  - Falta: historia nueva; no existe `tests/unit/rrhh-vacaciones-validaciones.test.js`.
- [ ] T174 [P] [US7] Crear prueba de integración del flujo completo (consulta de saldo, solicitud, aprobación, rechazo con motivo, anulación con devolución de días, alerta de feriado acumulado al máximo y auditoría) en `tests/integration/rrhh-vacaciones-flow.test.js` (FR-088–FR-091)
  - Falta: historia nueva; no existe `tests/integration/rrhh-vacaciones-flow.test.js`.
- [ ] T175 [P] [US7] Crear prueba de integración que verifique que las vacaciones aprobadas no descuentan días en la liquidación al ejecutar el cálculo de planilla (US4) en `tests/integration/rrhh-vacaciones-liquidacion.test.js` (FR-091)
  - Falta: historia nueva; no existe `tests/integration/rrhh-vacaciones-liquidacion.test.js`.

### Implementación de la Historia de Usuario 7

- [ ] T176 [P] [US7] Definir el esquema y la clave de almacenamiento del calendario de feriados (fecha y nombre, sin fechas repetidas) con su CRUD exclusivo del administrador/a de RR.HH. en `src/rrhh/utils/feriados-service.js` y `src/rrhh/storage-rrhh.js` (FR-089)
  - Falta: historia nueva; no existe `src/rrhh/utils/feriados-service.js`.
- [ ] T177 [P] [US7] Definir el esquema de solicitud de vacaciones (Trabajador, fechas, días hábiles, estado, quién la registró y quién la resolvió, motivo de rechazo) y su clave de almacenamiento en `src/rrhh/utils/vacaciones-service.js` y `src/rrhh/storage-rrhh.js` (FR-090)
  - Falta: historia nueva; no existe `src/rrhh/utils/vacaciones-service.js`.
- [ ] T178 [US7] Implementar el conteo de días hábiles entre dos fechas excluyendo fines de semana y feriados del calendario en `src/rrhh/utils/vacaciones-service.js` (FR-089)
  - Falta: historia nueva; depende de T176.
- [ ] T179 [US7] Implementar el cálculo del saldo: devengo de 1,25 días hábiles por mes completo desde la fecha de ingreso, menos días aprobados, con máximo acumulado de 30 días hábiles, en `src/rrhh/utils/vacaciones-service.js` (FR-088)
  - Falta: historia nueva.
- [ ] T180 [US7] Implementar el registro de solicitudes en estado "Pendiente" (el Trabajador para sí; jefatura y administrador/a en nombre de un Trabajador de su ámbito) y la edición/anulación de Pendientes en `src/rrhh/utils/vacaciones-service.js` (FR-090)
  - Falta: historia nueva; reutilizar el alcance de equipo de `src/rrhh/utils/jefatura.js`.
- [ ] T181 [US7] Implementar las validaciones de saldo suficiente a la fecha de inicio, superposición con vacaciones Aprobadas/Pendientes y con licencias o ausencias de `src/rrhh/utils/novedades-service.js`, y contrato vigente en las fechas en `src/rrhh/utils/vacaciones-service.js` (FR-091)
  - Falta: historia nueva; depende de US2 (contratos) y US3 (novedades).
- [ ] T182 [US7] Implementar la aprobación y el rechazo con segregación de funciones (jefatura directa o, sin ella, administrador/a; nadie resuelve lo que registró), motivo obligatorio de rechazo y anulación de Aprobadas solo antes de su inicio con devolución de días al saldo en `src/rrhh/utils/vacaciones-service.js` (FR-090)
  - Falta: historia nueva.
- [ ] T183 [US7] Agregar los permisos de vacaciones y feriados a la matriz de roles (Trabajador: solo las suyas; jefatura: su equipo; administrador/a: todas y el calendario) en `src/rrhh/seguridad/roles.js` (FR-090; regla transversal de la US6)
  - Falta: historia nueva.
- [ ] T184 [US7] Registrar en la bitácora la creación, edición, aprobación, rechazo y anulación de solicitudes y los cambios del calendario de feriados con valores anterior/nuevo en `src/rrhh/utils/vacaciones-service.js`, `src/rrhh/utils/feriados-service.js` y `src/rrhh/seguridad/auditoria.js` (FR-091)
  - Falta: historia nueva.
- [ ] T185 [US7] Agregar la alerta de feriado acumulado al máximo (30 días hábiles) en el panel principal en `src/rrhh/utils/alertas-service.js` (FR-088)
  - Falta: historia nueva; reutilizar el mecanismo de alertas de contratos de US2.
- [ ] T186 [US7] Garantizar que el cálculo de planilla no descuente días por vacaciones aprobadas (no se tratan como ausencia) en `src/rrhh/calculo/motor.js` y `src/rrhh/utils/liquidacion-service.js` (FR-091)
  - Falta: historia nueva; verificar con T175.
- [ ] T187 [P] [US7] Construir el formulario de solicitud de vacaciones con fechas, días hábiles calculados y saldo disponible en `src/rrhh/components/vacacion-form.js` (FR-088, FR-089)
  - Falta: historia nueva.
- [ ] T188 [P] [US7] Construir la vista de vacaciones con el saldo por Trabajador, el listado de solicitudes con acciones de aprobar/rechazar/anular según rol y la gestión del calendario de feriados en `src/rrhh/views/vacaciones.js` (FR-088–FR-090)
  - Falta: historia nueva.
- [ ] T189 [US7] Integrar la vista de vacaciones en la navegación de RR.HH. en `src/rrhh/views/rrhh-router.js` y `src/rrhh/views/workspace.js`
  - Falta: historia nueva.
- [ ] T190 [US7] Agregar feriados y solicitudes de vacaciones a los datos semilla para la prueba independiente en `src/rrhh/data/seed.js`
  - Falta: historia nueva.

**Punto de control**: Las Historias de Usuario 1 a 7 deben funcionar de forma independiente.

---

## Fase 10: Pulido y Preocupaciones Transversales

**Propósito**: Mejoras que afectan a varias historias y cierre de la entrega.

- [X] T161 [P] Actualizar la documentación del módulo de RR.HH./Planilla en `docs/rrhh.md` (bloqueante de release)
  - Evidencia: `docs/rrhh.md` documenta alcance, configuración, claves de almacenamiento, roles, flujos US1–US6, contratos públicos y criterios de rendimiento.
- [X] T162 Ejecutar la suite completa de Vitest (`tests/unit/` y `tests/integration/`), `npm run lint` y `npm run format:check`, y corregir regresiones y advertencias que afecten corrección o mantenibilidad antes del release (Quality Standards)
  - Evidencia: 2026-11-17; `npm run lint` OK, sin errores ni advertencias; `npm run format:check` OK; `npm run test:run` 46/46 archivos y 338/338 pruebas. Registro en `docs/rrhh.md` §9.
- [ ] T163 [P] Verificar el rendimiento de cálculo de 500 trabajadores en 10 segundos o menos en `src/rrhh/calculo/motor.js` y `tests/integration/rrhh-rendimiento.test.js` (SC-023)
  - Evidencia parcial: existe `tests/integration/rrhh-rendimiento.test.js`; cumplimiento del umbral específico no verificado.
- [ ] T164 [P] Validar el flujo de RR.HH. descrito en `specs/001-erp-base-module/quickstart.md`, incluidas las reglas corregidas de desvinculación, contratos, novedades, elegibilidad y auditoría
  - Falta: no validado en esta revisión.
- [ ] T165 Revisar el endurecimiento de seguridad de datos sensibles, scoping de equipo, permisos de parámetros/respaldo, sanitización XSS en las vistas de RR.HH., y bitácora en `src/utils/sanitize.js`, `src/rrhh/seguridad/permisos.js`, `src/rrhh/seguridad/auditoria.js`, `src/backup.js`, `src/rrhh/calculo/parametros.js` y `src/rrhh/views/`
  - Falta: faltan artefactos clave (`sanitize.js`, `permisos.js`, `backup.js`) y no se evidencia endurecimiento completo.
- [ ] T166 Limpiar y refactorizar ayudantes compartidos en `src/rrhh/utils/common.js`
  - Falta: no existe `src/rrhh/utils/common.js`.
- [ ] T167 [P] Revisar accesibilidad y consistencia visual en `src/rrhh/views/liquidaciones.js`, `src/rrhh/views/novedades.js`, `src/rrhh/views/auditoria.js` y `src/rrhh/components/trabajador-form.js`
  - Falta: no revisado/verificado; rutas reales ajustadas a archivos existentes.
- [ ] T168 [P] Verificar la cobertura FR-040–FR-107 y SC-011/SC-015/SC-022/SC-023/SC-024–SC-029 con la matriz de trazabilidad de este archivo, y registrar brechas restantes en `docs/rrhh.md` (cierre de G18 y K1)
  - Falta: no completado; persisten brechas de trazabilidad. `docs/rrhh.md` ya existe (T161) y T162 está verificado.
- [ ] T169 [P] [US6] Ejecutar una matriz de pruebas de acceso por rol (administrador/a, analista, jefatura, Trabajador activo/desvinculado) contra vistas, búsquedas, impresión y enlaces directos, y verificar que al menos el 95% confirma que los datos ocultos no son recuperables (SC-021, FR-057)
  - Apoyarse en T118–T124, T130, T140 y T145; registrar el resultado en `docs/rrhh.md`.

---

## Trazabilidad FR → Tareas

> Cada requisito funcional tiene al menos una tarea asociada. Las tareas marcadas con [P] pueden ejecutarse en paralelo según las reglas de dependencia. Estado no actualizado automáticamente por requisito; revisar marcas y notas en cada tarea.

| Requisitos | Tareas |
|---|---|
| FR-040–FR-042 | T143, T147, T148 |
| FR-043 | T143, T149 |
| FR-044–FR-047 | T144, T150–T153, T157–T159 |
| FR-048–FR-050 | T145, T154–T156 |
| FR-051–FR-054 | T118, T119, T122, T124–T130, T132, T133, T140 |
| FR-055–FR-059 | T012–T014, T120, T122, T123, T130–T135, T138, T156 |
| FR-060 | T123, T134, T135, T138, T139, T142 |
| FR-061–FR-063 | T041, T042, T044, T045, T047–T049, T052, T054 |
| FR-064 | T042, T046, T053 |
| FR-065–FR-067 | T043, T044, T050, T054, T055, T068 |
| FR-068–FR-072 | T058, T061–T069, T070–T072 |
| FR-073 | T059, T060, T073 |
| FR-074–FR-075 | T075, T076, T078–T083, T086–T089 |
| FR-076–FR-078 | T075, T077–T080, T084, T085, T088, T090–T092 |
| FR-079 | T015–T017, T095, T099, T100, T111–T113 |
| FR-080 | T094, T096–T098, T101, T103–T107, T110, T114, T115 |
| FR-081 | T096, T107 |
| FR-082 | T095, T097, T099, T108, T109, T113 |
| FR-083 | T095, T097, T102, T109 |
| FR-084 | T116 |
| FR-085 | T118, T119, T123–T128, T132, T133, T135, T140–T141, T142 |
| FR-086 | T121, T126, T131, T136, T139 |
| FR-087 | T120, T137, T139 |
| SC-021 | T169 |
| FR-088 | T170, T174, T179, T185, T187, T188 |
| FR-089 | T171, T176, T178, T187, T188 |
| FR-090 | T172, T174, T177, T180, T182, T183, T188 |
| FR-091 | T173–T175, T181, T184, T186 |
| SC-024 | T170, T174 |

---

## Cierre de Brechas de la Auditoría

> Las brechas G1–G18 y K1 requieren evidencia de implementación y pruebas alineadas al spec vigente. Cobertura declarada; verificar con notas por tarea.

| Brecha | Cobertura |
|---|---|
| G1 — Scoping de equipo en Jefatura | T119, T124, T132, T133, T140 |
| G2 — Auditoría de catálogos | T043, T055 |
| G3 — Permisos en parámetros y respaldo | T123, T132, T138, T141, T142 |
| G4 — Parámetros legales disponibles antes de US2 | T015–T017, T067 |
| G5 — Superposición de licencias/ausencias y tope de horas extra | T078, T086, T087 |
| G6 — Sanitización XSS en las vistas de RR.HH. | T165 |
| G7 — Filtros de auditoría y registro de intentos denegados | T120, T131, T137 |
| G8 — Prohibición de reactivar Trabajadores | T043, T050 |
| G9 — Recálculo idempotente sin duplicar liquidaciones | T096, T106 |
| G10 — Comprobante de máximo dos páginas y empresa emisora | T144, T153, T159 |
| G11 — Tiempos de explicación e impresión | T144, T146, T160 |
| G12 — Restricciones del Trabajador desvinculado | T124, T140 |
| G13 — Validaciones de contratos alineadas a US2 | T058, T061–T063, T067, T068 |
| G14 — Motivo obligatorio de rechazo y estados de novedad | T077, T084, T088 |
| G15 — Resumen de cálculo con exclusiones y motivo | T098, T105, T114 |
| G16 — Entidad Catálogo explícita en el modelo | T046, T053 |
| G17 — Árbol de archivos actualizado en el plan | T001 |
| G18 — Trazabilidad completa de tareas en la matriz | T168 |
| K1 — Cobertura de pruebas de las correcciones y criterios de éxito | T041–T098, T118–T146, T163, T168 |

---

## Dependencias y Orden de Ejecución

### Dependencias por Fase

- **Configuración (Fase 1)**: Sin dependencias; puede iniciar de inmediato.
- **Fundacional (Fase 2)**: Depende de la Fase 1 y BLOQUEA todas las historias. Incluye el núcleo append-only de auditoría y los parámetros legales por vigencia.
- **Historias de Usuario (Fases 3–9)**: Dependen de la Fase 2.
- **Pulido (Fase 10)**: Depende de que las historias deseadas estén completas.

### Dependencias entre Historias

- **US1 (P1)**: Sin dependencias tras la Fase 2. La terminación automática de contratos se completa en US2 (T068) sin romper la independencia de la desactivación de US1.
- **US2 (P1)**: Depende de US1 para asociar contratos a trabajadores y de los parámetros legales fundacionales (T015–T017) para validar sueldo mínimo y jornada máxima.
- **US3 (P1)**: Depende de US1 y US2 (trabajador con contrato cuya vigencia incluya la fecha y período activo). Usa los parámetros legales fundacionales para el tope de horas extra.
- **US4 (P1)**: Integra US1, US2, US3 y los parámetros legales fundacionales; es la historia de mayor acoplamiento.
- **US6 (P1)**: El núcleo de auditoría ya existe desde la Fase 2; la implementación de roles, scoping de equipo y permisos se aplica después de US1–US4 para restringir servicios y vistas existentes, y antes de US5 para que la explicación/impresión respete permisos desde el inicio.
- **US5 (P2)**: Depende de las liquidaciones de US4 y de los permisos/auditoría de US6.
- **US7 (P2)**: Depende de US1 (fecha de ingreso y jefatura directa), US2 (contrato vigente en las fechas) y US3 (superposición con licencias y ausencias), y aplica los permisos/auditoría de US6. Solo la verificación de que las vacaciones no descuentan en la liquidación (T175, T186) toca US4.

### Dentro de Cada Historia

- Las pruebas se escriben primero y deben fallar antes de la implementación.
- Esquemas/modelos antes que servicios; servicios antes que vistas; vistas antes de la integración en el enrutador.
- Completar y validar una historia antes de avanzar a la siguiente prioridad.

### Oportunidades de Paralelismo

- Todas las tareas de Configuración marcadas `[P]` pueden ejecutarse en paralelo.
- Las tareas Fundacionales marcadas `[P]` pueden ejecutarse en paralelo dentro de la Fase 2; la implementación de auditoría y parámetros debe completarse antes de las historias.
- Una vez completada la Fase 2, las historias pueden abordarse en paralelo según la capacidad del equipo, respetando las dependencias indicadas.
- Las pruebas de una historia marcadas `[P]` pueden ejecutarse en paralelo.
- Componentes, vistas y servicios de archivos distintos dentro de una historia pueden desarrollarse en paralelo.

---

## Ejemplo Paralelo: Historia de Usuario 1

```bash
Task: "Pruebas unitarias de validación de trabajadores y RUT en tests/unit/rrhh-trabajadores.test.js"
Task: "Pruebas unitarias de unicidad, catálogos y jefatura en tests/unit/rrhh-catalogos-jefatura.test.js"
Task: "Pruebas de desactivación, cascada de jefatura y auditoría de catálogos en tests/unit/rrhh-trabajadores-baja.test.js"
Task: "Prueba de integración del flujo de trabajadores en tests/integration/rrhh-trabajadores-flow.test.js"

Task: "Implementar validación de RUT en src/rrhh/calculo/rut.js"
Task: "Implementar CRUD de catálogos en src/rrhh/utils/catalogos-service.js"
Task: "Construir formulario de trabajador en src/rrhh/components/trabajador-form.js"
Task: "Construir vista de trabajadores en src/rrhh/views/trabajadores-view.js"
```

---

## Ejemplo Paralelo: Historia de Usuario 6

```bash
Task: "Pruebas unitarias de matriz de roles en tests/unit/rrhh-seguridad-roles.test.js"
Task: "Pruebas unitarias de visibilidad y scoping de equipo en tests/unit/rrhh-seguridad-visibilidad.test.js"
Task: "Pruebas unitarias de auditoría, filtros y retención en tests/unit/rrhh-auditoria.test.js"
Task: "Prueba de integración de respaldo que preserva auditoría en tests/integration/backup-flow.test.js"

Task: "Definir roles y permisos en src/rrhh/seguridad/roles.js"
Task: "Aplicar scoping de equipo en src/rrhh/seguridad/permisos.js (o módulo equivalente)"
Task: "Implementar exportación JSON auditada en src/backup.js"
Task: "Construir vista de auditoría exclusiva del administrador en src/rrhh/views/auditoria.js"
```

---

## Estrategia de Implementación

### MVP Primero (Solo Historia de Usuario 1)

1. Completar la Fase 1: Configuración.
2. Completar la Fase 2: Fundacional (CRÍTICO, bloquea todas las historias), incluidos auditoría append-only y parámetros legales.
3. Completar la Fase 3: Historia de Usuario 1.
4. **DETENERSE y VALIDAR**: probar la Historia de Usuario 1 de forma independiente.
5. Desplegar o demostrar si está lista.

### Entrega Incremental

1. Configuración + Fundacional (auditoría y parámetros) → base lista.
2. US1 → probar → desplegar (MVP).
3. US2 → probar → desplegar.
4. US3 → probar → desplegar.
5. US4 → probar → desplegar.
6. US6 → probar → desplegar (seguridad, scoping de equipo, auditoría y respaldo).
7. US5 → probar → desplegar (explicación e impresión con permisos).
8. US7 → probar → desplegar (vacaciones, saldo y calendario de feriados).
9. Cada historia añade valor sin romper las anteriores.

### Estrategia de Equipo en Paralelo

Con varios desarrolladores:

1. El equipo completa Configuración + Fundacional en conjunto, incluidos auditoría y parámetros.
2. Una vez lista la base:
   - Desarrollador A: US1.
   - Desarrollador B: US2 y US3.
   - Desarrollador C: US4.
   - Desarrollador D: US6 y, al estabilizarse las liquidaciones, US5.
3. Las historias se completan e integran de forma independiente.

---

## Notas

- `[P]` indica tareas sobre archivos distintos y sin dependencias pendientes.
- La etiqueta `[USn]` permite la trazabilidad directa con `spec.md`.
- Cada historia debe ser completable y comprobable de forma independiente.
- Verificar que las pruebas fallen antes de implementar.
- Confirmar tras cada tarea o grupo lógico.
- Detenerse en cada punto de control para validar la historia de forma independiente.
- La bitácora es de solo inserción: nunca se sobrescribe ni elimina, tampoco al importar un respaldo; la importación fusiona los registros previos.
- El estado "cancelado" no existe en los contratos: los únicos estados son vigente, vencido y terminado.
- La elegibilidad para el cálculo se determina por cualquier contrato cuya vigencia comprenda al menos un día del período, con cálculo proporcional.
- Evitar tareas vagas, conflictos sobre el mismo archivo y dependencias entre historias que rompan la independencia.
- Rutas reales observadas que difieren de la versión anterior: `src/rrhh/seguridad/session.js` (no `sesion.js`), `src/rrhh/views/liquidacion.js`, `src/rrhh/views/liquidaciones.js`, `src/rrhh/views/planilla.js`, `src/rrhh/views/periodos.js`, `src/rrhh/views/novedades.js`, `src/rrhh/views/auditoria.js`, `src/rrhh/utils/liquidacion-service.js` y `src/rrhh/utils/liquidacion-estados.js`.
- No se evidencian en el código actual: `src/utils/sanitize.js`, `src/backup.js`, `src/rrhh/seguridad/permisos.js`, `src/rrhh/calculo/redondeo.js`, `src/rrhh/components/parametros-form.js`, `src/rrhh/views/parametros-view.js`, `src/rrhh/views/liquidacion-impresion.js`, `src/rrhh/views/liquidacion-impresion.css`, `src/rrhh/components/linea-explicacion.js`, `tests/setup/`, ni varios archivos de prueba nombrados en las tareas.
