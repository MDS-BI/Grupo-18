# Módulo de Recursos Humanos y Planilla

**Funcionalidad**: `001-rrhh-planilla` | **Actualizado**: 2026-11-17
**Fuentes**: `spec.md` (US1–US12, FR-040–FR-107), `plan.md`, `data-model.md`, `quickstart.md`, `tasks.md`.

## 1. Alcance y arquitectura

Módulo de Recursos Humanos y Planilla de un ERP. El código vive en `src/rrhh/` y su configuración en `src/module-config.js`. Persistencia local (`localStorage`) y sesión simulada, sin backend ni credenciales.

- Trabajadores y liquidaciones: almacenamiento común `erp_base_module:entities` / `erp_base_module:documents`; demás tablas: `erp_rrhh:*`.
- Las líneas de liquidación y sus snapshots se guardan en `erp_rrhh:lineas-liquidacion`.

## 2. Configuración

`src/module-config.js` centraliza el nombre del módulo, las etiquetas y el bloque `rrhh`/`empresa` (datos de la empresa emisora). Con `rrhh.only: true` (configuración actual) el navegador abre directamente en el espacio de trabajo de RR.HH. y Planilla.

## 3. Modelo y claves de almacenamiento

| Entidad | Clave | Estados / notas |
|---|---|---|
| Trabajador | `erp_base_module:entities` | Activo / Desvinculado; no se elimina |
| Liquidación | `erp_base_module:documents` | Borrador / Cerrada, según el período |
| Contrato | `erp_rrhh:contratos` | Vigente / Vencido / Terminado; sin “cancelado” |
| Período | `erp_rrhh:periodos` | Abierto / Calculado / Cerrado |
| Novedad | `erp_rrhh:novedades` | Pendiente / Aprobada / Rechazada / Anulada |
| Concepto | `erp_rrhh:conceptos` | Clasifica líneas y novedades |
| Parámetro legal | `erp_rrhh:parametros` | Vigencia; congelado al cerrar período |
| Tramo de impuesto | `erp_rrhh:tramos-impuesto` | Vigencia por período |
| Línea de liquidación | `erp_rrhh:lineas-liquidacion` | Base, tasa/factor, fórmula y snapshot |
| Auditoría | `erp_rrhh:auditoria` | Solo inserción; relación laboral + 6 años |

Detalle completo: `specs/001-rrhh-planilla/data-model.md`.

## 4. Roles y permisos

| Rol | Acceso | Restricciones |
|---|---|---|
| Administrador/a RR.HH. | US1–US5, cierre de períodos, bitácora, respaldo, parámetros | — |
| Analista de remuneraciones | Fichas, catálogos, contratos, registro de novedades, períodos, cálculo, consulta de liquidaciones | No cierra, no aprueba/rechaza, sin bitácora ni respaldo |
| Jefatura | Datos básicos de su equipo y gestión de novedades; aprueba/rechaza lo que no registró | Sin contratos, sueldos, liquidaciones ni Trabajadores ajenos |
| Trabajador (activo o desvinculado) | Solo sus liquidaciones de períodos cerrados, incluidas históricas | Sin otras funciones |

El cambio de rol aplica de inmediato, pide el representado cuando corresponde y se audita. Las denegaciones no revelan contenido protegido.

## 5. Flujos funcionales

- **US1**: fichas con RUT normalizado y código único; catálogos sin eliminación; desactivación irreversible, bloqueada por novedades Pendientes, con término de contrato y cascade de jefatura.
- **US2**: contratos con vigencia, máximo uno vigente y sin solapamientos; sin estado “cancelado”; alertas a 30 días; cambios por nuevo registro; término automático al desvincular.
- **US3**: novedades con split mensual atómico; licencia médica sin diagnóstico; segregación de funciones; solo Pendientes se editan/anulan; rechazo con motivo; auditoría.
- **US4**: período por mes/año con parámetros obligatorios; cálculo proporcional con contratos vigentes al menos un día y novedades aprobadas; resumen de excluidos; recálculo idempotente; cierre que congela parámetros; redondeo por línea y totales por suma.
- **US5**: explicación por línea con base, tasa/factor, fórmula y snapshot; comprobante carta/A4, máximo dos páginas, sin controles y con identificación de la empresa.
- **US6**: auditoría append-only con retención de 6 años, filtros, intentos denegados, exportación/importación JSON; la importación preserva la auditoría previa.

## 6. Contratos públicos

- **Storage**: operaciones `load*`, `save*`, `add*`, `update*`, `delete*`; `getParametroVigente`, `getTramoImpuesto`, `cerrarPeriodo`, `appendAuditoria`.
- **Backup**: `exportBackup()` e `importBackup(json, { confirmar })`; JSON con `schemaVersion`, `exportedAt` y tablas base/RR.HH.
- **Auditoría**: usuario, rol, fecha y hora, acción, registro afectado y valores anterior/nuevo cuando corresponda; rechaza edición/eliminación y aborta la operación si falla la escritura.

## 7. Criterios de rendimiento

- **SC-011**: al seleccionar una línea (foco o clic), el 100% de las líneas muestra base, tasa/factor y fórmula en menos de 1 segundo, medido desde la selección hasta el desglose visible.
- **SC-012**: comprobante impreso/PDF en menos de 30 segundos.
- **SC-015**: montos coincidentes y máximo dos páginas.
- **SC-021**: al menos 95% de pruebas de acceso confirman que datos ocultos no son recuperables por UI o enlaces directos.
- **SC-022**: respaldo y restauración completos en menos de 5 minutos.
- **SC-023**: cálculo de 500 Trabajadores en 10 segundos o menos.

## 8. Estado y brechas

Este documento cierra T161. El estado de implementación y las brechas restantes se rastrean en `specs/001-rrhh-planilla/tasks.md` (T163–T169). No implica que todas las tareas estén completas.

## 9. Verificación de calidad (T162)

Ejecutada el 2026-11-17 desde la raíz del repositorio:

| Comando | Resultado |
|---|---|
| `npm run lint` | OK, sin errores ni advertencias |
| `npm run format:check` | OK, todos los archivos coinciden con Prettier |
| `npm run test:run` | OK, 46/46 archivos y 338/338 pruebas |

No se ejecutó `/speckit.implement` ni se realizó commit.
