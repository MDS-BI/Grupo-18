# Plan de Implementación: Módulo de Recursos Humanos y Planilla

**Rama**: `001-rrhh-planilla` | **Fecha**: 2026-07-08 | **Actualizado**: 2026-11-17 | **Especificación**: [spec.md](spec.md)
**Entrada**: Especificación de la funcionalidad desde `/specs/001-rrhh-planilla/spec.md`

> **Enfoque de la funcionalidad**: este plan describe el módulo de **Recursos Humanos y Planilla (RR.HH.)**; el dominio funcional, las historias de usuario y los entregables son exclusivamente de RR.HH. El diseño original de RR.HH. se incorporó en el [Apéndice A](#apéndice-a--diseño-original-del-módulo-rrhh) junto con los [diagramas MER](mer.png) y [MER resumido](mer-resumen.png).

## Resumen

Construir una aplicación web ligera con Vite para el módulo de Recursos Humanos y Planilla, con HTML, CSS y JavaScript vanilla y persistencia local en el navegador. La aplicación se presenta en modo **RR.HH.-only** (sin pantallas base genéricas del ERP en el flujo principal): tras **inicio de sesión con rol y clave demo** (ver `spec.md`), se muestra un **espacio de trabajo sin barra lateral**, con **pestañas superiores** (incl. **Resumen** con alertas de contratos por vencer y estado general del módulo) y las secciones de RR.HH. (Trabajadores, catálogos, contratos, novedades, períodos/planilla, liquidaciones, vacaciones, simulador, reportes, exportaciones, parámetros legales, auditoría según permisos); las cargas familiares se gestionan dentro de la ficha del trabajador, sin apartado separado. El nombre del módulo, las etiquetas y los datos de la empresa emisora se declaran en `src/module-config.js`. Ñande

### Cobertura del spec vigente (US1–US12, FR-040 a FR-107, SC-011 a SC-029)

El plan cubre la especificación vigente completa:

- **US1 – Fichas de trabajadores y catálogos (FR-061–FR-067 y reglas relacionadas)**: validación de RUT/correo/fechas, unicidad normalizada de RUT y código, catálogos (cargo, departamento, centro de costo) con crear/editar/ocultar/reactivar sin eliminación, estado laboral Activo/Desvinculado, desactivación irreversible que bloquea si hay novedades Pendientes, termina automáticamente el contrato vigente o vencido y deja al equipo de una jefatura desvinculada como "sin jefatura directa" (novedades pendientes a cargo del administrador/a), jefatura directa opcional (activa, no autoasignada) y auditoría de creación/actualización/desactivación de fichas y catálogos.
- **US2 – Contratos y alertas (FR-068–FR-073)**: contratos con sueldo/jornada/tipo/vigencia, estados (vigente, vencido, terminado) e historial sin superposición, máximo un contrato vigente por Trabajador y vigencias sin solapamiento (puede no tener contratos), validación de sueldo mínimo y jornada máxima con parámetros legales, transiciones y restricciones (término de contratos vigentes o vencidos, sin eliminación lógica/física, cambios y renovaciones mediante nuevo registro), alertas de próximo vencimiento/vencido y obligación de contrato con vigencia en la fecha de la novedad o en el período de cálculo.
- **US3 – Novedades y aprobación (FR-074–FR-078)**: tipos (horas extra, licencia médica, ausencia), asociación a trabajador/período activo, split atómico por meses, estados (pendiente, aprobada, rechazada, anulada), licencia médica sin diagnóstico clínico, bloqueo en períodos cerrados, segregación de funciones (jefatura no aprueba lo que registra; analista registra/ve pero no aprueba ni rechaza; solo Pendientes se editan/anulan y las Aprobadas/Rechazadas no se modifican), validación de superposición de licencias/ausencias, tope de horas extra con justificación escrita, motivo obligatorio de rechazo y auditoría.
- **US4 – Períodos y cálculo (FR-079–FR-084)**: creación de período único con parámetros legales obligatorios (estado inicial abierto), cálculo con cualquier contrato cuya vigencia comprenda al menos un día del período (incluidos terminados/vencidos con vigencia en el período y cálculo proporcional) y novedades aprobadas, resumen de liquidaciones generadas y Trabajadores excluidos con motivo, estados Abierto/Calculado/Cerrado con recálculo idempotente y desactualización por cambios posteriores, cierre con congelamiento de parámetros y registro de quién/cuándo, prohibiciones de cierre/reapertura/modificación según reglas, y redondeo por línea al peso con totales por suma de líneas.
- **US5 – Explicación e impresión de liquidaciones (FR-040–FR-050)**: explicación por línea (base, tasa/factor, fórmula, parámetro legal y vigencia) coherente con borrador/cerrado y valores congelados, indicación de carencia de fórmula/parámetro, comprobante imprimible/guardable en PDF (carta/A4, máximo dos páginas) sin mutar contenido, con datos requeridos (incluida identificación de la empresa emisora) y respeto de permisos.
- **US6 – Seguridad, roles y gobierno de datos (FR-051–FR-060, FR-085–FR-087)**: sesión simulada con selector de rol (administrador/a de RR.HH., analista de remuneraciones, jefatura, Trabajador), permisos y visibilidad por rol (jefatura limitada a los datos básicos de su equipo: nombre, código, cargo, departamento, centro de costo y estado laboral), cambio de rol en sesión activa, denegación sin revelar contenido protegido, restricciones también para parámetros legales y respaldo, bitácora de auditoría de solo inserción con retención, filtros de consulta, registro de intentos denegados y respaldo/restauración JSON que preserva la auditoría previa.
- **US7 – Vacaciones y feriados (FR-088–FR-091)**: solicitudes de vacaciones en días hábiles, descuento de saldo y recálculo cuando se agrega un feriado en el rango, con auditoría.
- **US8 – Cargas familiares y asignación familiar (FR-092–FR-094)**: cargas con RUT vigente único, aviso de edad límite y cálculo por tramos vigentes.
- **US9 – Simulador de sueldo (FR-095–FR-096)**: simulaciones líquido↔bruto referenciales, sin crear ni modificar registros.
- **US10 – Reportes de gestión y equidad salarial (FR-097–FR-100)**: reportes sobre períodos cerrados con ocultamiento de grupos pequeños y permisos por rol.
- **US11 – Exportaciones contables y de pago (FR-101–FR-104)**: dos CSV desde períodos cerrados, con formato definido, validaciones de ficha y registro en bitácora.
- **US12 – Parámetros legales (FR-105–FR-107)**: conjuntos completos por mes y año, bloqueados desde el primer uso y congelados en liquidaciones cerradas.

### Módulo de Recursos Humanos y Planilla

El código del módulo vive en `src/rrhh/` y su configuración en `src/module-config.js`; los Trabajadores se guardan en el almacenamiento común (`src/storage.js`) y las demás tablas usan el prefijo `erp_rrhh:*`. El detalle de atributos y relaciones se documenta en `specs/001-rrhh-planilla/data-model.md` (documento vigente).

Incluye: fichas y catálogos; contratos con historial, vigencia y alertas; conjuntos completos de parámetros legales por mes y año, cargados manualmente y bloqueados desde el primer uso; períodos con apertura, cálculo y cierre; novedades con segregación de funciones y aprobación; motor de cálculo con líneas explicables y parámetros congelados al cierre; ciclo de vida de liquidaciones y comprobante imprimible; sesión simulada por rol; bitácora de auditoría de solo inserción; respaldo/restauración JSON; vacaciones y feriados; cargas familiares y asignación familiar; simulador de sueldo; reportes de gestión y equidad; y exportaciones CSV contable y de pago. El motor calcula, para cada trabajador con un contrato cuya vigencia comprenda al menos un día del período (incluidos terminados o vencidos con vigencia en el período), haberes/descuentos/impuestos y costo empleador de forma proporcional a los días naturales de vigencia, usando el conjunto de parámetros del mes y topes legales, conservando por línea base, tasa/fórmula y snapshot del parámetro aplicado; los totales se obtienen de líneas redondeadas al peso.

## Clarificaciones y Decisiones

**2026-11-08 (clarify inicial)**:
- Entidades RR.HH. definidas en 001 con detalle en `specs/001-rrhh-planilla/data-model.md`.
- Sesión simulada con selector de rol, sin autenticación real ni credenciales.
- Parámetros legales cargados manualmente como conjuntos completos por mes/año; sin integración externa de indicadores.
- Bitácora conservada durante la relación laboral y 6 años después del término (Ley 21.719).
- Respaldo/restauración completa en JSON para mitigar pérdida de datos locales.

**2026-11-16 (alineación con spec vigente, FR-040–FR-107, SC-011–SC-029)**:
- **FR-085–FR-087 (US6)**: el plan incorpora explícitamente permisos detallados por rol (administrador/a de RR.HH., analista de remuneraciones, jefatura, Trabajador), cambio de rol en sesión activa con aplicación inmediata, reselección de representado cuando corresponda y registro en bitácora, y consulta de bitácora exclusiva del administrador/a de RR.HH.
- **Bitácora inmutable y respaldo JSON (FR-056, FR-060)**: exportación e importación de respaldo se registran en la bitácora de auditoría. Al importar un respaldo, el sistema **nunca** sobrescribe ni elimina los registros previos de la bitácora (se preserva la trazabilidad de solo inserción); la restauración de datos operativos se realiza de forma controlada y validada sin comprometer la inmutabilidad histórica de auditoría.
- **Visibilidad transversal por rol (US6, FR-048/FR-049/FR-052/FR-054)** en listados, detalles, búsquedas y vistas imprimibles: la jefatura ve de su equipo únicamente los datos básicos (nombre, código, cargo, departamento, centro de costo y estado laboral) y gestiona sus novedades (incluidas licencias médicas sin diagnóstico clínico), pudiendo aprobar/rechazar las que no haya registrado ella misma, pero tiene ocultos o bloqueados contratos, sueldos base y liquidaciones y no opera sobre Trabajadores ajenos a su equipo; el Trabajador (activo o desvinculado) solo accede a sus propias liquidaciones de períodos cerrados (históricas incluidas), sin operar otras funciones. Las restricciones se aplican en interfaz y capa de datos, también para la carga de parámetros legales y el respaldo, y las denegaciones no revelan contenido protegido.
- **Auditoría y parámetros como núcleo fundacional (I6, FR-055/FR-056/FR-058/FR-079)**: el núcleo append-only de auditoría (`src/rrhh/seguridad/auditoria.js`), el esquema/validación (`src/rrhh/calculo/parametros.js`, T014) y la carga/selección/bloqueo de conjuntos completos por mes/año (`src/rrhh/calculo/parametros-mes.js`, T015) se implementan antes de las historias de usuario, porque US1–US4 y US12 los consumen. La auditoría rechaza edición/eliminación, aborta la operación si no puede escribirse y conserva 6 años; los parámetros permiten validar contratos desde US2 sin esperar a US4.
- **2026-11-17 (alcance ampliado a US7–US12)**: se incorporan vacaciones, cargas familiares, simulador, reportes, exportaciones CSV y bloqueo de conjuntos de parámetros. El modelo de datos y el contrato de almacenamiento deben documentar estas entidades y el formato CSV antes de `/speckit.implement` (T108, T116).

## Contexto Técnico

**Lenguaje/Versión**: JavaScript (ES2022), HTML, CSS  
**Dependencias Principales**: Vite, sin framework de interfaz pesado  
**Almacenamiento**: localStorage del navegador para una instancia de espacio único, con exportación e importación completa en JSON para respaldo y restauración (FR-060)  
**Pruebas**: Vitest con jsdom para pruebas unitarias y de interacción  
**Plataforma Objetivo**: Navegadores modernos de escritorio y móviles  
**Tipo de Proyecto**: Aplicación web  
**Objetivos de Rendimiento**: explicación por línea <1 s (SC-011); comprobante PDF <30 s (SC-012); cálculo de un período de hasta 500 trabajadores en 10 s o menos (SC-023); auditoría reconstruible en <5 min (SC-020); respaldo exportable y restaurable en <5 min (SC-022); y pruebas de acceso con al menos 95% de cumplimiento (SC-021)
**Restricciones**: Huella mínima de librerías, despliegue simple, sin backend requerido; sesión simulada con selector de rol (sin autenticación real ni credenciales); conjuntos completos de parámetros legales cargados manualmente por mes/año; bitácora de solo inserción conservada durante la relación laboral y 6 años después del término; respaldo/restauración JSON sin sobrescribir ni eliminar registros previos de auditoría; configuración del módulo centralizada en `src/module-config.js`
**Escala/Alcance**: módulo de RR.HH. y Planilla (US1–US12) para 1 empresa, hasta 500 trabajadores y 24 períodos de historia en el MVP

## Verificación de la Constitución

*COMPROBACIÓN: Debe pasar antes de la investigación de la Fase 0. Reverificar tras el diseño de la Fase 1.*

- **I. Calidad y Mantenibilidad (PASS)**: estructura modular con separación de almacenamiento, dominio, cálculo, seguridad/auditoría y vistas; configuración centralizada; reglas de negocio y permisos encapsulados.
- **II. Pruebas primero y Verificación (PENDIENTE)**: las tareas T020–T107 siguen el patrón pruebas antes que implementación para US1–US12; las aserciones de SC-011, SC-012, SC-020, SC-021, SC-022 y SC-023 están definidas en T109/T111/T115, y su ejecución queda para Phase 15.
- **III. Consistencia de Experiencia de Usuario (PASS)**: mensajes de validación, estados vacíos, estados de solo lectura/bloqueo, denegaciones sin revelar contenido y marco consistente **barra superior + pestañas superiores** (RR.HH.-only, sin barra lateral) en todas las pantallas, incluida la vista imprimible; los Casos Límite están declarados como comportamientos verificables.
- **IV. Rendimiento y Fiabilidad (PENDIENTE)**: T111 define SC-011/012/023, T109 define SC-021 y T109/T115 definen SC-020/022; la ejecución de estas mediciones está pendiente en Phase 15.
- **Quality Standards (PENDIENTE)**: documentación `docs/rrhh.md` (T108/T116), verificación de `lint`/`format:check` (T110) y checklist de release (T119) aún no ejecutados.

**Resultado**: PENDIENTE; no hay bloqueantes de diseño, pero persisten brechas de ejecución y documentación rastreadas en `tasks.md` (T108, T110, T111, T112, T119).

## Fases de Diseño

### Fase 0: Investigación

`research.md` consolida las decisiones técnicas: Vite con JavaScript vanilla, persistencia local y configuración centralizada del módulo; sesión simulada por rol; conjuntos completos de parámetros legales cargados manualmente por mes/año y bloqueados desde su primer uso; bitácora de solo inserción con retención; respaldo/restauración JSON; y la alineación 2026-11-16 (FR-085–FR-087, registro de export/import en bitácora, preservación de auditoría en importación, visibilidad transversal por rol, auditoría append-only y parámetros como núcleo fundacional). No quedan `NEEDS CLARIFICATION`.

### Fase 1: Modelo de Datos, Contratos e Inicio Rápido

- `data-model.md`: modelo del módulo RR.HH. (Trabajador, Catálogo, Contrato, Novedad, Período, conjuntos de parámetros, tramos, conceptos, líneas, auditoría, vacaciones, feriados, cargas, solicitudes, exportaciones y reportes) alineado a US1–US12 y FR-040–FR-107.
- `contracts/`: contratos de almacenamiento y operaciones (incl. respaldo/restauración, reglas de auditoría/visibilidad y formato de exportación CSV) coherentes con FR-056, FR-060, FR-101–FR-104 y permisos por rol.
- `quickstart.md`: escenarios de validación end-to-end del módulo de RR.HH., incluyendo sesión simulada, conjuntos de parámetros, permisos/visibilidad por rol (jefatura y trabajador activo/desvinculado), bitácora inmutable, respaldo/restauración sin sobrescribir auditoría previa, vacaciones, cargas, simulador, reportes y exportaciones CSV.

### Fase 2: Núcleo Fundacional de Implementación

Antes de las historias de usuario se implementan el núcleo append-only de auditoría (`src/rrhh/seguridad/auditoria.js`), el esquema y validación de parámetros (`src/rrhh/calculo/parametros.js`, T014) y la carga/selección/bloqueo de conjuntos completos por mes y año (`src/rrhh/calculo/parametros-mes.js`, T015). Esto garantiza que US1–US4 y US12 registren auditoría desde su primera operación sensible y que US2 valide sueldo mínimo y jornada máxima sin depender de la implementación de US4.

## Estructura del Proyecto

### Documentación (esta funcionalidad)

```text
specs/001-rrhh-planilla/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── entity-storage.md
└── tasks.md
```

### Código Fuente (raíz del repositorio)

```text
src/
├── main.js
├── styles.css
├── storage.js
├── app.js
├── module-config.js
├── backup.js           (exportación/importación JSON; registra operación en bitácora y preserva auditoría previa)
├── utils/
│   └── sanitize.js     (escape/sanitización de HTML de los textos libres de RR.HH.)
├── components/
│   ├── shell.js        (marco: barra superior y barra lateral de RR.HH.)
│   └── dashboard.js    (panel principal con alertas de RR.HH.)
└── rrhh/               (módulo de RR.HH. y Planilla)
    ├── calculo/        (motor puro, esquema de parámetros, conjuntos por mes/año, RUT y redondeo)
    ├── components/     (trabajador, contrato, novedad, parámetros, línea explicativa, selector de rol)
    ├── seguridad/      (roles, sesión/cambio de rol, permisos/visibilidad y auditoría append-only)
    ├── utils/          (servicios de trabajadores/catálogos, contratos, novedades, períodos, liquidaciones y costo empleador)
    └── views/          (trabajadores, catálogos, contratos, novedades, períodos/planilla, liquidaciones/impresión, parámetros, auditoría y router)

tests/
├── unit/               (cálculo, parámetros, RUT, contratos, novedades, estados, seguridad/auditoría, backup, sanitización)
├── integration/        (flujos US1–US12, permisos/visibilidad, cierre, exportación CSV, respaldo/restauración, rendimiento 500)
└── setup/
```

**Decisión de Estructura**: aplicación Vite con módulos JavaScript y CSS separados, persistencia en localStorage y contrato de almacenamiento aislado. `module-config.js` centraliza la configuración del módulo (nombre, etiquetas y datos de la empresa emisora); el código de RR.HH. vive en `src/rrhh/`. `backup.js` implementa exportación/importación JSON validada; la importación restaura datos operativos de forma controlada pero **no sobrescribe ni elimina** la bitácora previa, y ambas operaciones quedan auditadas (FR-056, FR-060). `exportaciones-service.js` genera los dos CSV con formato definido en FR-101–FR-104 y consume `fechaPago` registrada en la entidad Período de T048 (FR-104). `src/rrhh/seguridad/auditoria.js` se implementa como núcleo fundacional (append-only, retención y aborto si falla la escritura); T014 define el esquema/validación en `src/rrhh/calculo/parametros.js` y T015 la carga/selección/bloqueo de conjuntos completos por mes/año en `src/rrhh/calculo/parametros-mes.js`; `src/rrhh/seguridad/` aplica sesión simulada, permisos/visibilidad por rol (FR-051–FR-054, FR-085–FR-087) y auditoría transversal.

## Seguimiento de Complejidad

No se introdujeron violaciones de diseño. **Deuda explícita** rastreada:

| Violación / Deuda | Por qué es necesaria | Alternativa simple rechazada | Mitigación |
|---|---|---|---|
| Documentación `docs/rrhh.md` pendiente | Quality Standards exige documentar comportamiento, configuración y contratos antes de release | Publicar sin documentación | Completar antes de la release con T108/T116/T119 |
| Aserciones de SC-011, SC-012, SC-020, SC-021, SC-022 y SC-023 pendientes de ejecución | Los umbrales declarados deben verificarse, no solo implementarse | Asumir cumplimiento sin medición | Ejecutar T109/T111/T115 en Phase 15 |

---

## Apéndice A — Diseño original del módulo RR.HH.

Contenido incorporado desde `specs/000-rrhh-planilla/plan.md` al unificar la documentación del módulo en esta carpeta. Es material de referencia histórica del diseño de RR.HH.; en caso de discrepancia prevalecen el cuerpo principal de este plan y [`spec.md`](spec.md). Las rutas se actualizaron a `specs/001-rrhh-planilla/`.

### A.1 Problema y propuesta de valor

**Problema.** En muchas Pymes o Empresas las remuneraciones se calculan en planillas Excel: fórmulas copiadas mes a mes, parámetros legales escritos a mano (que cambian varias veces al año), sin historial de quién modificó qué, y con datos personales y de salud guardados sin control de acceso. Los errores de cálculo generan multas, reclamos de trabajadores y diferencias con la contabilidad.

**Propuesta.** Un módulo que:

1. Centraliza la ficha del trabajador y su contrato vigente.
2. Recoge las novedades del mes con un flujo de aprobación (jefatura → RR.HH.).
3. Calcula las liquidaciones de todo un período con un clic, mostrando cada línea y su fórmula (cálculo explicable).
4. Congela el período al cerrarlo (UF, UTM, ingreso mínimo y parámetros quedan fijos) para que una liquidación pagada no cambie después.
5. Entrega a otros módulos del ERP el costo de la planilla por centro de costo y la nómina de pago.
6. Protege los datos sensibles por diseño (Ley 21.719 de Protección de Datos Personales, vigente desde el 1 de diciembre de 2026).

### A.2 Cliente y usuarios

**Cliente objetivo**: Pyme chilena de 20 a 200 trabajadores (por ejemplo, una empresa de servicios o comercio en el Gran Concepción) que hoy calcula sueldos en Excel o terceriza todo en un contador externo.

| Usuario | Necesidad principal | Qué hace en el módulo |
|---|---|---|
| **Administrador/a de RR.HH.** (usuario principal) | Mantener los datos del personal al día y pagar a tiempo y sin errores | Fichas, contratos, catálogos, parámetros legales, apertura y cierre del período |
| **Analista de remuneraciones** | Calcular la planilla rápido y poder explicar cada monto | Registra novedades, calcula y revisa liquidaciones, corrige líneas manuales con motivo |
| **Jefatura de área** | Que las horas extra y ausencias de su equipo se paguen bien | Ingresa o aprueba las novedades de su equipo (no ve sueldos) |
| **Gerencia / Finanzas** (actor externo, sin sesión) | Controlar el costo de personal | Consume reportes y totales por centro de costo; aprueba el cierre fuera del módulo |
| **Contador/a externo** (actor externo, sin sesión) | Hacer el asiento contable y las declaraciones | Consume los CSV contable y de nómina generados desde períodos cerrados |
| **Trabajador/a** (rol del MVP) | Ver su liquidación y sus datos | Consulta sus liquidaciones de períodos cerrados en modo de solo lectura |

### A.3 Pantallas, menús y herramientas

El formato exigido (página principal, acciones/menús/herramientas, documentación, análisis de escalabilidad) se cubre así:

#### A.3.1 Página principal (Panel de RR.HH.)

- **Tarjetas**: dotación activa · costo de la planilla del último período cerrado · horas extra del mes · contratos por vencer en 30 días · liquidaciones pendientes de aprobar.
- **Acciones rápidas**: Nuevo trabajador · Registrar novedad · Calcular período · Ver liquidaciones · Buscar trabajador.
- **Alertas**: período abierto con novedades sin aprobar · trabajadores sin contrato vigente · parámetro legal sin vigencia para el período.

#### A.3.2 Menú lateral

`Panel` · `Trabajadores` · `Contratos` · `Novedades` · `Planilla` (períodos y liquidaciones) · `Reportes` · `Configuración` (catálogos y parámetros legales) · `Auditoría`.

#### A.3.3 Herramientas clave

| Herramienta | Descripción |
|---|---|
| Asistente de cálculo del período | Valida requisitos (contratos vigentes, novedades aprobadas, parámetros vigentes), calcula todas las liquidaciones y muestra un resumen antes de confirmar |
| Vista "¿de dónde sale este monto?" | Cada línea de la liquidación muestra su base, su tasa o fórmula y el parámetro legal usado |
| Simulador de sueldo | Calcula líquido ↔ bruto para una oferta laboral sin guardar datos |
| Validador de RUT | Comprueba el dígito verificador al ingresar el RUT |
| Selector de rol | Cambia entre roles para mostrar qué datos ve cada uno (MVP simulado) |

### A.4 Método de cálculo (motor de planilla)

Para cada trabajador con contrato vigente en el período, usando días naturales del mes (p. ej., 31 en enero; ver FR-080 y el caso `17/31` de US4):

| Paso | Cálculo | Parámetro / tabla |
|---|---|---|
| 1 | Sueldo proporcional = sueldoBase × díasTrabajados / díasNaturalesDelMes | CONTRATO, NOVEDAD (licencias y ausencias restan días) |
| 2 | Valor hora extra = sueldoBase / díasNaturalesDelMes × 7 / jornadaSemanal × 1,5 | JORNADA, RECARGO_HORA_EXTRA |
| 3 | Gratificación (art. 50) = mín(25 % × haberes imponibles; 4,75 × IMM / 12) | TOPE_GRATIF_ANUAL_IMM, IMM |
| 4 | Total imponible = sueldo + horas extra + gratificación + bonos imponibles | CONCEPTO.imponible |
| 5 | Base de cotización = mín(imponible; 90 UF) — seguro de cesantía: mín(imponible; 135,2 UF) | TOPE_IMPONIBLE_*, valorUF del período |
| 6 | AFP = base × (10 % + comisión de la AFP) | INSTITUCION_PREVISIONAL |
| 7 | Salud = base × 7 % (FONASA) o el mayor entre 7 % y el plan Isapre en UF | TASA_SALUD_LEGAL, planIsapreUF |
| 8 | Seguro de cesantía del trabajador = 0,6 % (indefinido) o 0 % (plazo fijo) | TASA_AFC_* |
| 9 | Base tributable = imponible − AFP − salud (tope 7 %) − cesantía | — |
| 10 | Impuesto único = base × factor − rebaja, según el tramo en UTM | TRAMO_IMPUESTO, valorUTM |
| 11 | Descuentos voluntarios (anticipos, cuota sindical, etc.), con tope del 15 % de la remuneración | TOPE_DESC_VOLUNTARIOS |
| 12 | **Líquido** = haberes − descuentos − impuesto | — |
| 13 | Aportes del empleador = cesantía (2,4 % / 3,0 %) + aporte previsional de la reforma (3,5 % desde agosto 2026) + mutual | APORTE_EMP_*, MUTUAL |
| 14 | Costo empleador = haberes + aportes | — |

**Caso de prueba histórico — recalcular con días naturales antes de usarlo en T044/T049**. Contrato indefinido, sueldo base $1.200.000, jornada de 42 h, 5 horas extra, colación $50.000, movilización $40.000, AFP con comisión de 1,27 % (ejemplo), FONASA, IMM $553.553, UTM $71.649:

| Concepto | Monto |
|---|---|
| Sueldo base | 1.200.000 |
| Horas extra (5 × 10.000) | 50.000 |
| Gratificación (tope 4,75 IMM / 12) | 219.115 |
| **Total imponible** | **1.469.115** |
| Colación + movilización (no imponibles) | 90.000 |
| **Total haberes** (`subtotal`) | **1.559.115** |
| AFP 11,27 % | −165.569 |
| Salud 7 % | −102.838 |
| Seguro de cesantía 0,6 % | −8.815 |
| **Total descuentos** (`discount`) | **−277.222** |
| Base tributable (16,64 UTM → tramo 4 %) | 1.191.893 |
| Impuesto único (`taxAmount`) | −8.985 |
| **Líquido a pagar** (`totalAmount`) | **1.272.908** |
| Aportes del empleador (2,4 % + 3,5 % + 0,93 %) | 100.341 |
| **Costo empleador** | **1.659.456** |

Reglas de redondeo: cada línea se redondea al peso, y los totales se obtienen sumando las líneas ya redondeadas, para que lo impreso siempre cuadre.

### A.5 Integración con otros módulos del ERP

| Módulo | Qué entrega RR.HH. | Llave compartida |
|---|---|---|
| Contabilidad | Asiento de remuneraciones del período: Σ montos por `cuentaContable` × `centroCosto` | `DEPARTAMENTO.centroCosto`, `CONCEPTO.cuentaContable` |
| Finanzas / Tesorería | Nómina de pago (`nomina_pago_YYYYMM.csv`): trabajador, banco, cuenta, líquido, fecha de pago | `entity_id`, `PERIODO.fechaPago`, ficha `banco`/`numeroCuenta` |
| Proyectos / Control de gestión | Costo empleador por centro de costo y por período | `centroCosto` |

El formato exacto se define en FR-101–FR-104 y en `contracts/entity-storage.md` (sección “Contrato de Exportación CSV”), y se coordina con los grupos de esos módulos.

### A.6 Riesgos de datos y sesgos

#### A.6.1 Datos sensibles (Ley 21.719)

| Riesgo | Medida en el diseño |
|---|---|
| Datos de salud (licencias médicas) | Solo se guardan tipo y días; **está prohibido registrar diagnósticos** (validación en el formulario y en la observación) |
| Afiliación sindical revelada por el descuento de cuota sindical | `CONCEPTO.esSensible = true` → solo RR.HH. ve esa línea y cada consulta queda en la auditoría |
| Datos bancarios y RUT | Clasificados como confidenciales; ocultos para jefaturas y gerencia |
| Información en `localStorage` sin cifrar | El MVP usa **solo datos ficticios** (seed). Para producción se documenta la necesidad de servidor, cifrado y autenticación |
| Uso de un dato para otra finalidad | Consentimiento por finalidad; `genero` se usa solo para reportes agregados de equidad |
| Exceso de datos | Minimización: no se piden estado civil, religión, foto ni otros datos que no sirven para remunerar |
| Cambios no autorizados | Bitácora de solo inserción que guarda qué campos cambiaron, sus valores anteriores y nuevos para campos no sensibles (datos sensibles como `[REDACTADO]`), quién y por qué |

#### A.6.2 Sesgos

| Sesgo posible | Medida |
|---|---|
| Brecha salarial de género escondida en los promedios | Reporte por cargo (no global), con medianas; se oculta si un grupo tiene menos de 5 personas para no identificar a nadie |
| Bandas salariales que copian desigualdades históricas | Referencia histórica fuera de alcance; esta versión no define bandas salariales ni alertas asociadas |
| Indicador de ausentismo que castiga maternidad o enfermedad | El ausentismo cuenta solo ausencias injustificadas; licencias y permisos legales se muestran aparte y nunca en rankings |
| Decisiones automáticas sobre personas | El módulo **no** puntúa ni recomienda despidos ni aumentos; solo calcula lo que la ley y el contrato determinan, y cada monto es explicable |
| Formularios que excluyen identidades | Género con "No binario" y "Prefiere no informar" |
| Edad o nacionalidad usadas para discriminar | Se usan solo para validaciones legales (edad mínima, art. 19 CT) y no aparecen en filtros de reportes |

#### A.6.3 Riesgos del proyecto

| Riesgo | Mitigación |
|---|---|
| Errores de cálculo legal | Casos de prueba de referencia validados contra un simulador público de sueldo líquido; parámetros con fuente citada |
| Parámetros que cambian durante el semestre (IMM en enero 2027, aporte del empleador) | Conjuntos completos por mes/año; pantalla para agregar un conjunto nuevo sin tocar código; el conjunto usado se bloquea |
| Alcance demasiado grande | P1 cerrado antes del 20-nov; P2 solo si P1 está probado |

### A.7 Cronograma y organización del grupo

| Fase | Fechas | Entregable |
|---|---|---|
| 0. Diseño | hasta jue 22-oct, 15:00 | **MER (data-model.md + imagen) y plan.md** — revisión intermedia |
| 1. Especificación | 23-oct → 2-nov | `spec.md` con historias de usuario y criterios de aceptación (`/speckit.specify`, `/speckit.clarify`), `research.md`, `contracts/` |
| 2. Tareas y base de datos | 3-nov → 9-nov | `tasks.md` (`/speckit.tasks`), `module-config.js`, `storage-rrhh.js`, datos iniciales |
| 3. Planilla | 10-nov → 20-nov | Motor de cálculo con pruebas, períodos, novedades, liquidaciones e impresión |
| 4. Panel, reportes y gobierno de datos | 21-nov → 26-nov | Panel, reportes, roles, auditoría, P2 si alcanza |
| 5. Cierre | 27-nov → semana del 30-nov | README con instrucciones, MER final, demo con datos ficticios, ensayo de la presentación de 5 minutos |

| Línea de trabajo | Responsable |
|---|---|
| Fichas, contratos y catálogos (F1–F3) | Rodrigo y Benjamín |
| Parámetros legales y motor de cálculo (F4, F7) | Vicente |
| Períodos, novedades, liquidaciones e impresión (F5, F6, F8, F9) | Constanza y Yelena |
| Panel, reportes, roles y auditoría (F10, F11, P2) | Karla |

Las decisiones se registran como *issues* de GitHub (una por decisión de diseño) y cada línea de trabajo usa su propia rama y *pull request* hacia `main`.

### A.8 Criterios de aceptación del MVP

1. Se puede crear un trabajador con contrato y calcular su liquidación de un período con el resultado del caso de referencia (sección A.4), cuadrado al peso.
2. Un período cerrado no permite editar liquidaciones ni novedades.
3. Un conjunto de parámetros legales cargado para otro mes/año afecta solo a los períodos posteriores; el conjunto ya usado permanece bloqueado.
4. Un trabajador con liquidaciones pagadas no se puede eliminar, solo dar de baja.
5. Con el rol "Jefatura" no se ven sueldos, datos bancarios ni conceptos sensibles.
6. Toda edición, anulación o consulta de datos sensibles queda en la auditoría.
7. `npm test` pasa con las pruebas del motor y de los flujos principales.

### A.9 Fuentes de los parámetros legales

Ley 21.830 (ingreso mínimo), Superintendencia de Pensiones (tope imponible, reforma Ley 21.735), Ley 21.561 (jornada de 40 horas), Ley 21.719 (protección de datos personales), Código del Trabajo (arts. 19, 31, 32, 47, 50, 58, 159–161), SII (tramos del impuesto único). Los valores se verifican en Previred y el SII antes de la demo.
