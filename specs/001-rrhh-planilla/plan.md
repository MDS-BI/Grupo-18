# Plan de Implementación: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

**Rama**: `001-rrhh-planilla` | **Fecha**: 2026-07-08 | **Actualizado**: 2026-11-17 | **Especificación**: [spec.md](spec.md)
**Entrada**: Especificación de la funcionalidad desde `/specs/001-rrhh-planilla/spec.md`

> **Enfoque de la funcionalidad**: este plan describe el módulo de **Recursos Humanos y Planilla (RR.HH.)** construido sobre la base ERP reutilizable. El ERP base (Entidad/Documento) se conserva como contexto y capa de soporte; el dominio funcional, las historias de usuario y los entregables son de RR.HH. El diseño original de RR.HH. se incorporó en el [Apéndice A](#apéndice-a--diseño-original-del-módulo-rrhh) junto con los [diagramas MER](mer.png) y [MER resumido](mer-resumen.png).

## Resumen

Construir una aplicación web ligera con Vite que sirva como módulo base de software de planificación de recursos empresariales (ERP). El módulo proporciona la base común: gestión de datos maestros (Entidades), documentos transaccionales vinculados (Documentos), flujos de crear/editar/eliminar/buscar, validación y persistencia local — construida principalmente con HTML, CSS y JavaScript vanilla. La aplicación se presenta como un espacio de trabajo ERP coherente: una barra superior con marca (logotipo derivado + nombre del módulo) y una barra lateral persistente de botones de módulo envuelven cada pantalla, y la pantalla de entrada es un panel estilo ERP con acciones rápidas y estadísticas en vivo. La adaptación a un módulo específico se realiza mediante un único archivo de configuración (`src/module-config.js`) que cubre terminología, campos personalizados, ciclo de vida de documentos y color de acento, de modo que el código central permanece intacto.

### Cobertura del spec vigente (US1–US6, FR-001 a FR-087)

El plan cubre la especificación vigente completa:

- **Módulo base (FR-001–FR-039, XR-001–XR-005)**: CRUD de Entidad/Documento, integridad referencial y eliminación en cascada (con la aclaración de FR-003: la eliminación aplica a la Entidad genérica; los Trabajadores se desactivan según US1), navegación/panel/búsqueda, configuración y extensibilidad, campos personalizados, ciclo de vida de documentos y rendimiento para al menos 500 registros.
- **US1 – Fichas de trabajadores y catálogos (FR-061–FR-067 y reglas relacionadas)**: Trabajador como reutilización de Entidad, validación de RUT/correo/fechas, unicidad normalizada de RUT y código, catálogos (cargo, departamento, centro de costo) con crear/editar/ocultar/reactivar sin eliminación, estado activo/inactivo, desactivación irreversible que bloquea si hay novedades Pendientes, termina automáticamente el contrato vigente o vencido y deja al equipo de una jefatura desvinculada como "sin jefatura directa" (novedades pendientes a cargo del administrador/a), jefatura directa opcional (activa, no autoasignada) y auditoría de creación/actualización/desactivación de fichas y catálogos.
- **US2 – Contratos y alertas (FR-068–FR-073)**: contratos con sueldo/jornada/tipo/vigencia, estados (vigente, vencido, terminado) e historial sin superposición, máximo un contrato vigente por Trabajador y vigencias sin solapamiento (puede no tener contratos), validación de sueldo mínimo y jornada máxima con parámetros legales, transiciones y restricciones (término de contratos vigentes o vencidos, sin eliminación lógica/física, cambios y renovaciones mediante nuevo registro), alertas de próximo vencimiento/vencido y obligación de contrato con vigencia en la fecha de la novedad o en el período de cálculo.
- **US3 – Novedades y aprobación (FR-074–FR-078)**: tipos (horas extra, licencia médica, ausencia), asociación a trabajador/período activo, split atómico por meses, estados (pendiente, aprobada, rechazada, anulada), licencia médica sin diagnóstico clínico, bloqueo en períodos cerrados, segregación de funciones (jefatura no aprueba lo que registra; analista registra/ve pero no aprueba ni rechaza; solo Pendientes se editan/anulan y las Aprobadas/Rechazadas no se modifican), validación de superposición de licencias/ausencias, tope de horas extra con justificación escrita, motivo obligatorio de rechazo y auditoría.
- **US4 – Períodos y cálculo (FR-079–FR-084)**: creación de período único con parámetros legales obligatorios (estado inicial abierto), cálculo con cualquier contrato cuya vigencia comprenda al menos un día del período (incluidos terminados/vencidos con vigencia en el período y cálculo proporcional) y novedades aprobadas, resumen de liquidaciones generadas y Trabajadores excluidos con motivo, estados Abierto/Calculado/Cerrado con recálculo idempotente y desactualización por cambios posteriores, cierre con congelamiento de parámetros y registro de quién/cuándo, prohibiciones de cierre/reapertura/modificación según reglas, y redondeo por línea al peso con totales por suma de líneas.
- **US5 – Explicación e impresión de liquidaciones (FR-040–FR-050)**: explicación por línea (base, tasa/factor, fórmula, parámetro legal y vigencia) coherente con borrador/cerrado y valores congelados, indicación de carencia de fórmula/parámetro, comprobante imprimible/guardable en PDF (carta/A4, máximo dos páginas) sin mutar contenido, con datos requeridos (incluida identificación de la empresa emisora) y respeto de permisos.
- **US6 – Seguridad, roles y gobierno de datos (FR-051–FR-060, FR-085–FR-087)**: sesión simulada con selector de rol (administrador/a de RR.HH., analista de remuneraciones, jefatura, Trabajador), permisos y visibilidad por rol (jefatura limitada a los datos básicos de su equipo: nombre, código, cargo, departamento, centro de costo y estado laboral), cambio de rol en sesión activa, denegación sin revelar contenido protegido, restricciones también para parámetros legales y respaldo, bitácora de auditoría de solo inserción con retención, filtros de consulta, registro de intentos denegados y respaldo/restauración JSON que preserva la auditoría previa.

### Módulo de Recursos Humanos y Planilla

La extensión de RR.HH. y Planilla reutiliza la **Entidad** como **Trabajador** y el **Documento** como **Liquidación de Sueldo**, sin modificar el código central; lo específico vive en `src/rrhh/` y en `src/module-config.js`, y las tablas propias usan el prefijo `erp_rrhh:*`. El detalle de atributos y relaciones se documenta en `specs/001-rrhh-planilla/data-model.md` (documento vigente).

Incluye: fichas y catálogos; contratos con historial, vigencia y alertas; parámetros legales versionados por vigencia y cargados manualmente por administrador/a; períodos con apertura, cálculo y cierre; novedades con segregación de funciones y aprobación; motor de cálculo con líneas explicables y parámetros congelados al cierre; ciclo de vida de liquidaciones y comprobante imprimible; sesión simulada por rol; bitácora de auditoría de solo inserción; y exportación/importación completa en JSON para respaldo y restauración. El motor calcula, para cada trabajador con un contrato cuya vigencia comprenda al menos un día del período (incluidos terminados o vencidos con vigencia en el período), haberes/descuentos/impuestos y costo empleador de forma proporcional a los días de vigencia, usando parámetros vigentes y topes legales, conservando por línea base, tasa/fórmula y snapshot del parámetro aplicado; los totales se obtienen de líneas redondeadas al peso.

## Clarificaciones y Decisiones

**2026-11-08 (clarify inicial)**:
- Entidades RR.HH. definidas en 001 con detalle en `specs/001-rrhh-planilla/data-model.md`; Trabajador reutiliza Entidad y Liquidación reutiliza Documento.
- Sesión simulada con selector de rol, sin autenticación real ni credenciales.
- Parámetros legales cargados y versionados manualmente; sin integración externa de indicadores.
- Bitácora conservada durante la relación laboral y 6 años después del término (Ley 21.719).
- Respaldo/restauración completa en JSON para mitigar pérdida de datos locales.

**2026-11-16 (alineación con spec vigente, FR-001–FR-087)**:
- **FR-085–FR-087 (US6)**: el plan incorpora explícitamente permisos detallados por rol (administrador/a de RR.HH., analista de remuneraciones, jefatura, Trabajador), cambio de rol en sesión activa con aplicación inmediata, reselección de representado cuando corresponda y registro en bitácora, y consulta de bitácora exclusiva del administrador/a de RR.HH.
- **Bitácora inmutable y respaldo JSON (FR-056, FR-060)**: exportación e importación de respaldo se registran en la bitácora de auditoría. Al importar un respaldo, el sistema **nunca** sobrescribe ni elimina los registros previos de la bitácora (se preserva la trazabilidad de solo inserción); la restauración de datos operativos se realiza de forma controlada y validada sin comprometer la inmutabilidad histórica de auditoría.
- **Visibilidad transversal por rol (US6, FR-048/FR-049/FR-052/FR-054)** en listados, detalles, búsquedas y vistas imprimibles: la jefatura ve de su equipo únicamente los datos básicos (nombre, código, cargo, departamento, centro de costo y estado laboral) y gestiona sus novedades (incluidas licencias médicas sin diagnóstico clínico), pudiendo aprobar/rechazar las que no haya registrado ella misma, pero tiene ocultos o bloqueados contratos, sueldos base y liquidaciones y no opera sobre Trabajadores ajenos a su equipo; el Trabajador (activo o desvinculado) solo accede a sus propias liquidaciones de períodos cerrados (históricas incluidas), sin operar otras funciones. Las restricciones se aplican en interfaz y capa de datos, también para la carga de parámetros legales y el respaldo, y las denegaciones no revelan contenido protegido.
- **Auditoría y parámetros como núcleo fundacional (I6, FR-055/FR-056/FR-058/FR-079)**: el núcleo append-only de auditoría (`src/rrhh/seguridad/auditoria.js`) y los esquemas/selección de parámetros legales por vigencia (`src/rrhh/calculo/parametros.js`) se implementan antes de las historias de usuario, porque US1–US4 los consumen. La auditoría rechaza edición/eliminación, aborta la operación si no puede escribirse y conserva 6 años; los parámetros permiten validar contratos desde US2 sin esperar a US4.

## Contexto Técnico

**Lenguaje/Versión**: JavaScript (ES2022), HTML, CSS  
**Dependencias Principales**: Vite, sin framework de interfaz pesado  
**Almacenamiento**: localStorage del navegador para una instancia de espacio único, con exportación e importación completa en JSON para respaldo y restauración (FR-060)  
**Pruebas**: Vitest con jsdom para pruebas unitarias y de interacción  
**Plataforma Objetivo**: Navegadores modernos de escritorio y móviles  
**Tipo de Proyecto**: Aplicación web  
**Objetivos de Rendimiento**: Interacciones responsivas para listas de hasta 500 registros; cálculo de un período de hasta 500 trabajadores en 10 segundos o menos (SC-023); búsqueda y actualizaciones percibidas como instantáneas (SC-004, metas de spec)  
**Restricciones**: Huella mínima de librerías, despliegue simple, sin backend requerido; sesión simulada con selector de rol (sin autenticación real ni credenciales); parámetros legales cargados/versionados manualmente; bitácora de solo inserción conservada durante la relación laboral y 6 años después del término; respaldo/restauración JSON sin sobrescribir ni eliminar registros previos de auditoría; estructura extensible por configuración  
**Escala/Alcance**: Módulo base (Entidad/Documento) + RR.HH. y Planilla (US1–US6) para 1 empresa, hasta 500 trabajadores y 24 períodos de historia en el MVP

## Verificación de la Constitución

*COMPROBACIÓN: Debe pasar antes de la investigación de la Fase 0. Reverificar tras el diseño de la Fase 1.*

- **I. Calidad y Mantenibilidad (PASS)**: estructura modular con separación de almacenamiento, dominio, cálculo, seguridad/auditoría y vistas; configuración centralizada; reglas de negocio y permisos encapsulados.
- **II. Pruebas primero y Verificación (PASS)**: flujos de CRUD, búsqueda, contratos, novedades/aprobación, cálculo/cierre, explicación/impresión, permisos por rol, auditoría inmutable, respaldo/restauración y rendimiento de 500 trabajadores cubiertos por pruebas Vitest + jsdom, incluidos los tiempos de SC-011, SC-012 y SC-022; ninguna historia completa sin pruebas en verde.
- **III. Consistencia de Experiencia de Usuario (PASS)**: mensajes de validación, estados vacíos, estados de solo lectura/bloqueo, denegaciones sin revelar contenido y marco consistente (barra superior + barra lateral) en todas las pantallas, incluida la vista imprimible.
- **IV. Rendimiento y Fiabilidad (PASS)**: 500 entidades y cálculo de 500 trabajadores en 10 segundos o menos (SC-023); persistencia local con respaldo/restauración JSON; si la bitácora no puede escribirse, la operación sensible no se completa (FR-055).
- **Quality Standards (PASS)**: documentación `docs/rrhh.md` entregada (T161) y verificación ejecutada (T162): `npm run lint`, `npm run format:check` y `npm run test:run` en verde.

**Resultado**: PASS; sin bloqueantes de release por documentación o verificación. Las brechas de cobertura no cerradas se rastrean en `tasks.md` (T163–T169).

## Fases de Diseño

### Fase 0: Investigación

`research.md` consolida las decisiones técnicas: Vite con JavaScript vanilla, persistencia local, separación Entidad/Documento y extensibilidad por configuración; sesión simulada por rol; parámetros legales manuales versionados; bitácora de solo inserción con retención; respaldo/restauración JSON; y la alineación 2026-11-16 (FR-085–FR-087, registro de export/import en bitácora, preservación de auditoría en importación, visibilidad transversal por rol, auditoría append-only y parámetros como núcleo fundacional). No quedan `NEEDS CLARIFICATION`.

### Fase 1: Modelo de Datos, Contratos e Inicio Rápido

- `data-model.md`: Entidad, Documento, Catálogo, ModuleConfig y extensión RR.HH. (Trabajador, Contrato, Novedad, Período de Remuneración, parámetros/tramos/conceptos/líneas y Auditoría) alineada a US1–US6 y FR-001–FR-087.
- `contracts/`: contratos de almacenamiento y operaciones (incl. respaldo/restauración y reglas de auditoría/visibilidad) coherentes con FR-056, FR-060 y permisos por rol.
- `quickstart.md`: escenarios de validación end-to-end para módulo base y RR.HH., incluyendo sesión simulada, parámetros manuales, permisos/visibilidad por rol (jefatura y trabajador activo/desvinculado), bitácora inmutable y respaldo/restauración sin sobrescribir auditoría previa.

### Fase 2: Núcleo Fundacional de Implementación

Antes de las historias de usuario se implementan el núcleo append-only de auditoría (`src/rrhh/seguridad/auditoria.js`) y los esquemas/selección de parámetros legales por vigencia (`src/rrhh/calculo/parametros.js`). Esto garantiza que US1–US4 registren auditoría desde su primera operación sensible y que US2 valide sueldo mínimo y jornada máxima sin depender de la implementación de US4.

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
│   └── sanitize.js     (escape/sanitización de HTML para listas, formularios, búsqueda y detalle)
├── components/
│   ├── shell.js        (marco: barra superior, logotipo, barra lateral, módulo activo)
│   ├── dashboard.js    (acciones rápidas + estadísticas en vivo)
│   ├── entity-form.js  (formulario entidad con campos personalizados)
│   ├── entity-list.js  (listado/eliminación de entidades genéricas)
│   ├── document-form.js (formulario documento con campos personalizados y ciclo de vida)
│   ├── document-list.js (listado de documentos y cascada)
│   └── search-bar.js   (búsqueda base por nombre, código, categoría, descripción y fecha)
└── rrhh/               (extensión RR.HH. y Planilla; no modifica el código central)
    ├── calculo/        (motor puro, parámetros por vigencia, RUT y redondeo)
    ├── components/     (trabajador, contrato, novedad, parámetros, línea explicativa, selector de rol)
    ├── seguridad/      (roles, sesión/cambio de rol, permisos/visibilidad y auditoría append-only)
    ├── utils/          (servicios de trabajadores/catálogos, contratos, novedades, períodos, liquidaciones y costo empleador)
    └── views/          (trabajadores, catálogos, contratos, novedades, períodos/planilla, liquidaciones/impresión, parámetros, auditoría y router)

tests/
├── unit/               (cálculo, parámetros, RUT, contratos, novedades, estados, seguridad/auditoría, backup, sanitización)
├── integration/        (flujos US1–US6, permisos/visibilidad, cierre, respaldo/restauración, rendimiento 500)
└── setup/
```

**Decisión de Estructura**: aplicación Vite con módulos JavaScript y CSS separados, persistencia en localStorage y contrato de almacenamiento aislado. `module-config.js` centraliza adaptación (nombre, etiquetas, campos personalizados, ciclo de vida y acento) mediante tokens CSS. La extensión `src/rrhh/` reutiliza Entidad→Trabajador y Documento→Liquidación. `backup.js` implementa exportación/importación JSON validada; la importación restaura datos operativos de forma controlada pero **no sobrescribe ni elimina** la bitácora previa, y ambas operaciones quedan auditadas (FR-056, FR-060). `src/rrhh/seguridad/auditoria.js` se implementa como núcleo fundacional (append-only, retención y aborto si falla la escritura) y `src/rrhh/calculo/parametros.js` como esquema/selección por vigencia antes de las historias; `src/rrhh/seguridad/` aplica sesión simulada, permisos/visibilidad por rol (FR-051–FR-054, FR-085–FR-087) y auditoría transversal.

## Seguimiento de Complejidad

No se introdujeron violaciones de diseño. **Deuda explícita** rastreada:

| Violación / Deuda | Por qué es necesaria | Alternativa simple rechazada | Mitigación |
|---|---|---|---|
| Documentación `docs/rrhh.md` pendiente | Quality Standards exige documentar comportamiento, configuración y contratos antes de release | Publicar sin documentación | Completar antes de la release; seguimiento en `tasks.md` |

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
| **Gerencia / Finanzas** | Controlar el costo de personal | Revisa los totales por centro de costo y aprueba el cierre |
| **Contador/a externo** | Hacer el asiento contable y las declaraciones | Exporta el resumen contable y el libro de remuneraciones |
| **Trabajador/a** (fase futura) | Ver su liquidación y sus datos | Portal de autoservicio de solo lectura |

### A.3 Pantallas, menús y herramientas

El formato exigido (página principal, acciones/menús/herramientas, documentación, análisis de escalabilidad) se cubre así:

#### A.3.1 Página principal (Panel de RR.HH.)

- **Tarjetas**: dotación activa · costo de la planilla del último período cerrado · horas extra del mes · contratos por vencer en 30 días · liquidaciones pendientes de aprobar.
- **Acciones rápidas**: Nuevo trabajador · Registrar novedad · Calcular período · Ver liquidaciones · Buscar trabajador.
- **Alertas**: período abierto con novedades sin aprobar · trabajadores sin contrato vigente · sueldo base fuera de la banda del cargo · parámetro legal sin vigencia para el período.

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

Para cada trabajador con contrato vigente en el período (mes comercial de 30 días):

| Paso | Cálculo | Parámetro / tabla |
|---|---|---|
| 1 | Sueldo proporcional = sueldoBase × díasTrabajados / 30 | CONTRATO, NOVEDAD (licencias y ausencias restan días) |
| 2 | Valor hora extra = sueldoBase / 30 × 7 / jornadaSemanal × 1,5 | JORNADA, RECARGO_HORA_EXTRA |
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

**Caso de prueba de referencia**. Contrato indefinido, sueldo base $1.200.000, jornada de 42 h, 5 horas extra, colación $50.000, movilización $40.000, AFP con comisión de 1,27 % (ejemplo), FONASA, IMM $553.553, UTM $71.649:

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
| Finanzas / Tesorería | Nómina de pago: trabajador, banco, cuenta, líquido, fecha de pago | `entity_id`, `PERIODO.fechaPago` |
| Proyectos / Control de gestión | Costo empleador por centro de costo y por período | `centroCosto` |

El formato exacto se define en la documentación de contratos y se coordina con los grupos de esos módulos.

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
| Cambios no autorizados | Bitácora de solo inserción que guarda qué campos cambiaron (no sus valores), quién y por qué |

#### A.6.2 Sesgos

| Sesgo posible | Medida |
|---|---|
| Brecha salarial de género escondida en los promedios | Reporte por cargo (no global), con medianas; se oculta si un grupo tiene menos de 5 personas para no identificar a nadie |
| Bandas salariales que copian desigualdades históricas | Las bandas se definen explícitamente por cargo y no se calculan a partir de los sueldos actuales |
| Indicador de ausentismo que castiga maternidad o enfermedad | El ausentismo cuenta solo ausencias injustificadas; licencias y permisos legales se muestran aparte y nunca en rankings |
| Decisiones automáticas sobre personas | El módulo **no** puntúa ni recomienda despidos ni aumentos; solo calcula lo que la ley y el contrato determinan, y cada monto es explicable |
| Formularios que excluyen identidades | Género con "No binario" y "Prefiere no informar"; nombre social visible en pantalla (Ley 21.120) |
| Edad o nacionalidad usadas para discriminar | Se usan solo para validaciones legales (edad mínima, art. 19 CT) y no aparecen en filtros de reportes |

#### A.6.3 Riesgos del proyecto

| Riesgo | Mitigación |
|---|---|
| Errores de cálculo legal | Casos de prueba de referencia validados contra un simulador público de sueldo líquido; parámetros con fuente citada |
| Parámetros que cambian durante el semestre (IMM en enero 2027, aporte del empleador) | Tabla versionada por vigencia; pantalla para agregar un valor nuevo sin tocar código |
| Alcance demasiado grande | P1 cerrado antes del 20-nov; P2 solo si P1 está probado |
| Choques con la base al actualizar el template | No se edita el código central; todo lo propio vive en `src/rrhh/` y `module-config.js` |

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
3. Cambiar un parámetro legal con una nueva vigencia afecta solo a los períodos posteriores.
4. Un trabajador con liquidaciones pagadas no se puede eliminar, solo dar de baja.
5. Con el rol "Jefatura" no se ven sueldos, datos bancarios ni conceptos sensibles.
6. Toda edición, anulación o consulta de datos sensibles queda en la auditoría.
7. `npm test` pasa con las pruebas del motor y de los flujos principales.

### A.9 Fuentes de los parámetros legales

Ley 21.830 (ingreso mínimo), Superintendencia de Pensiones (tope imponible, reforma Ley 21.735), Ley 21.561 (jornada de 40 horas), Ley 21.719 (protección de datos personales), Código del Trabajo (arts. 19, 31, 32, 47, 50, 58, 159–161), SII (tramos del impuesto único). Los valores se verifican en Previred y el SII antes de la demo.
