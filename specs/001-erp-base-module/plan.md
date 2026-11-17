# Plan de Implementación: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

**Rama**: `001-erp-base-module` | **Fecha**: 2026-07-08 | **Actualizado**: 2026-11-16 | **Especificación**: [spec.md](spec.md)
**Entrada**: Especificación de la funcionalidad desde `/specs/001-erp-base-module/spec.md`

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

La extensión de RR.HH. y Planilla reutiliza la **Entidad** como **Trabajador** y el **Documento** como **Liquidación de Sueldo**, sin modificar el código central; lo específico vive en `src/rrhh/` y en `src/module-config.js`, y las tablas propias usan el prefijo `erp_rrhh:*`. El detalle de atributos y relaciones se documenta en `specs/001-erp-base-module/data-model.md` (documento vigente).

Incluye: fichas y catálogos; contratos con historial, vigencia y alertas; parámetros legales versionados por vigencia y cargados manualmente por administrador/a; períodos con apertura, cálculo y cierre; novedades con segregación de funciones y aprobación; motor de cálculo con líneas explicables y parámetros congelados al cierre; ciclo de vida de liquidaciones y comprobante imprimible; sesión simulada por rol; bitácora de auditoría de solo inserción; y exportación/importación completa en JSON para respaldo y restauración. El motor calcula, para cada trabajador con un contrato cuya vigencia comprenda al menos un día del período (incluidos terminados o vencidos con vigencia en el período), haberes/descuentos/impuestos y costo empleador de forma proporcional a los días de vigencia, usando parámetros vigentes y topes legales, conservando por línea base, tasa/fórmula y snapshot del parámetro aplicado; los totales se obtienen de líneas redondeadas al peso.

## Clarificaciones y Decisiones

**2026-11-08 (clarify inicial)**:
- Entidades RR.HH. definidas en 001 con detalle en `specs/001-erp-base-module/data-model.md`; Trabajador reutiliza Entidad y Liquidación reutiliza Documento.
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
specs/001-erp-base-module/
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
