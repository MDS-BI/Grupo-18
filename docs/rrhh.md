# Módulo de Recursos Humanos y Planilla

**Funcionalidad**: `001-rrhh-planilla` | **Actualizado**: 2026-06-19
**Fuentes**: `spec.md` (US1–US12), `plan.md`, `data-model.md`, `quickstart.md`.

## 1. Alcance y arquitectura

Módulo de Recursos Humanos y Planilla. Aplicación web Vite (HTML/CSS/JS). Persistencia local (`localStorage`). **Modo RR.HH.-only**: no se muestran pantallas base genéricas del ERP en el flujo principal. Tras **inicio de sesión con rol y clave demo** se muestra un espacio de trabajo **sin barra lateral**, con **pestañas superiores** (incluye pestaña **Resumen** con alertas de contratos por vencer).

- Código: `src/rrhh/`, configuración `src/module-config.js`.
- Trabajadores y liquidaciones: `erp_base_module:entities` / `erp_base_module:documents`; resto: prefijo `erp_rrhh:*`.
- Líneas de liquidación: `erp_rrhh:lineas-liquidacion`.

## 2. Configuración y acceso

`src/module-config.js` define nombre del módulo, etiquetas y datos de empresa emisora.

**Login demo (sin backend):** el usuario ingresa **rol** y **clave**. Credenciales por defecto (documento de referencia en `spec.md`): `administrador`/`admin123`, `analista`/`analista123`, `jefatura`/`jefatura123`, `trabajador`/`trabajador123`. Tras login válido se crea sesión en el navegador; existe **Cerrar sesión** en el encabezado. Para **cambiar de rol** debe cerrar sesión e iniciar sesión de nuevo.

**Representado:** si el rol es **Jefatura** o **Trabajador**, se solicita elegir el **Trabajador representado** según corresponda (equipo para jefatura; propio histórico/cerrado según reglas) antes de operar con alcance restringido.

## 3. Modelo y claves de almacenamiento

| Entidad | Clave | Estados / notas |
|---|---|---|
| Trabajador | `erp_base_module:entities` | Activo / Desvinculado |
| Liquidación | `erp_base_module:documents` | Borrador / Cerrada |
| Contrato | `erp_rrhh:contratos` | Vigente / Vencido / Terminado |
| Período | `erp_rrhh:periodos` | Abierto / Calculado / Cerrado |
| Novedad | `erp_rrhh:novedades` | Pendiente / Aprobada / Rechazada / Anulada |
| Concepto | `erp_rrhh:conceptos` | — |
| Parámetro legal | `erp_rrhh:parametros` | — |
| Tramo impuesto | `erp_rrhh:tramos-impuesto` | — |
| Líneas liquidación | `erp_rrhh:lineas-liquidacion` | — |
| Auditoría | `erp_rrhh:auditoria` | Solo inserción |

Detalle: `specs/001-rrhh-planilla/data-model.md`.

## 4. Roles y permisos (resumen)

| Rol | Acceso (resumen) |
|---|---|
| Administrador/a RR.HH. | Gestión amplia, cierre, parámetros, respaldo, bitácora |
| Analista remuneraciones | Fichas/catálogos/contratos/novedades/períodos/cálculo y consulta liquidaciones; no cierra; no aprueba/rechaza; sin bitácora ni respaldo |
| Jefatura | Datos básicos del equipo y novedades del equipo (aprueba/rechaza las que no registró); sin contratos, sueldos base ni liquidaciones |
| Trabajador | Solo sus liquidaciones de períodos cerrados |

La interfaz aplica **ocultamiento proactivo** de lo no permitido; accesos directos denegados muestran mensaje sin revelar contenido protegido.

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
