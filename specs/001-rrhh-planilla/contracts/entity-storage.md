# Contrato de Almacenamiento: Recursos Humanos y Planilla

## Propósito

La aplicación guarda los datos del módulo de Recursos Humanos y Planilla localmente en el navegador usando `localStorage`.

## Ficha del Trabajador — clave `erp_base_module:entities`

Las fichas de los Trabajadores se guardan en el almacenamiento común de la aplicación (`src/storage.js`). Cada ficha incluye:

- `id`: cadena única
- `entity_id`: cadena única, generada automáticamente, usada para vincular contratos, novedades, liquidaciones y demás tablas del módulo
- `name`: nombre legal completo, no vacío
- `code`: número de ficha, no vacío
- `taxId`: RUT con dígito verificador
- `email`: correo con formato válido cuando está presente
- `phone`, `address`, `description`: cadenas opcionales
- `category`: código del departamento
- `targetDate`: fecha de término del contrato vigente (YYYY-MM-DD) cuando corresponde
- `paymentTerms`: forma de pago
- `createdAt` y `updatedAt`: marcas de tiempo ISO
- Campos propios de RR.HH. (`fechaIngreso`, `fechaNacimiento`, `estadoLaboral`, `afp`, `sistemaSalud`, `banco`, `numeroCuenta`, etc.), detallados en `data-model.md`.

Operaciones: `loadEntities()` devuelve todas las fichas y `saveEntities(entities)` persiste la lista completa.

Validación:

- Una ficha sin `name` o `code` debe rechazarse antes de la persistencia.
- Un `email` presente debe tener formato de correo válido.
- El `entity_id` se genera automáticamente y es único.
- Las operaciones preservan el orden de la lista y actualizan las marcas de tiempo.
- Las fichas de Trabajadores no se eliminan: se desactivan según la Historia de Usuario 1.

## Tablas del módulo RR.HH. y Planilla

Las demás tablas del módulo usan las mismas garantías de identidad, marcas de tiempo e integridad referencial, bajo el prefijo `erp_rrhh:*`. El detalle del MER está en `specs/001-rrhh-planilla/data-model.md`.

### Claves y operaciones

- `erp_rrhh:contratos`: `loadContratos()`, `saveContratos()`, `addContrato()`, `updateContrato()`, `deleteContrato()`, `getContratoVigente(entityId, fecha)`.
- `erp_rrhh:periodos`: `loadPeriodos()`, `savePeriodos()`, `addPeriodo()`, `updatePeriodo()`, `cerrarPeriodo(periodoId, usuario)`, `getPeriodo(anio, mes)`.
- `erp_rrhh:novedades`: `loadNovedades()`, `saveNovedades()`, `addNovedad()`, `updateNovedad()`, `deleteNovedad()`, `listNovedadesPorPeriodo(periodoId)`, `listNovedadesAprobadas(periodoId)`.
- `erp_rrhh:conceptos`: `loadConceptos()`, `saveConceptos()`, `addConcepto()`, `updateConcepto()`.
- `erp_rrhh:parametros-mes`, `erp_rrhh:parametros` y `erp_rrhh:tramos-impuesto`: `loadConjuntosParametros()`, `saveConjuntoParametros(conjunto)`, `getConjuntoPorMes(anio, mes)`, `bloquearConjunto(id)`, `getParametrosConjunto(id)`, `getTramoImpuesto(baseUtm, conjuntoId)`.
- `erp_rrhh:solicitudes-vacacion`: `loadSolicitudesVacacion()`, `addSolicitudVacacion()`, `updateSolicitudVacacion()`, `recalcularPorFeriado(feriadoId)`.
- `erp_rrhh:feriados`: `loadFeriados()`, `addFeriado()`, `esFeriado(fecha)`.
- `erp_rrhh:cargas-familiares`: `loadCargasFamiliares()`, `addCargaFamiliar()`, `updateCargaFamiliar()`, `listCargasPorEdad(fechaReferencia)`.
- `erp_rrhh:liquidaciones` y `erp_rrhh:lineas-liquidacion`: `loadLiquidaciones()`, `saveLiquidaciones()`, `addLiquidacion()`, `updateLiquidacion()`, `getLiquidacion(entityId, periodoId)`, `saveLineas()`, `listLineas(liquidacionId)`.
- `erp_rrhh:auditoria`: `appendAuditoria(registro)` de solo inserción; no se actualiza ni elimina. Registra consultas/cambios de datos sensibles, cambios de rol, accesos denegados, exportación CSV y exportación/importación de respaldo. La importación nunca sobrescribe ni elimina registros previos.

### Invariantes

- Toda novedad, contrato y liquidación debe referenciar un `entity_id` existente.
- Una liquidación pertenece a exactamente un trabajador y un período; no puede haber duplicados para el mismo par.
- Solo novedades aprobadas se incluyen en el cálculo; las pendientes o rechazadas se excluyen y se informan.
- Un período cerrado es de solo lectura: no se recalculan liquidaciones ni se modifican novedades.
- Cada línea conserva el snapshot del parámetro legal usado (código, valor aplicado, vigencia y fuente).
- Al calcular se persiste primero la liquidación y luego sus líneas; si falla una escritura, no debe quedar una liquidación sin líneas.
- La eliminación de un trabajador sin liquidaciones cerradas elimina en cascada contratos, novedades y liquidaciones; con liquidaciones aprobadas o pagadas solo se permite baja lógica.
- La auditoría registra cálculo, aprobación, pago, anulación y consultas de datos sensibles, con valores anteriores y nuevos para campos no sensibles y `[REDACTADO]` para datos sensibles.
- Un conjunto de parámetros usado por un Período es inmutable; las correcciones se cargan como otro conjunto completo para un mes distinto (US12).
- Una solicitud de vacaciones recalcula sus días hábiles y saldo al agregar un feriado en el rango, y registra el cambio en auditoría (US7).
- Una carga familiar con RUT duplicado vigente se rechaza; las cargas que alcanzan la edad límite generan aviso con 30 días de anticipación (US8).
- Las exportaciones CSV solo se permiten desde períodos cerrados, no mutan registros y dejan registro en auditoría (US11).

## Contrato de Respaldo y Restauración

La exportación y restauración cubre todo el espacio de trabajo (claves `erp_base_module:*` y `erp_rrhh:*`) en un único documento JSON versionado.

### Forma del respaldo

- `schemaVersion`: cadena de versión del esquema (p. ej., `"1.0"`)
- `exportedAt`: marca de tiempo ISO de la exportación
- `app`: identificador del módulo (`erp-base-module`)
- `data`: objeto con una clave por tabla (`entities`, `documents`, `contratos`, `periodos`, `novedades`, `conceptos`, `parametrosMes`, `parametros`, `tramosImpuesto`, `solicitudesVacacion`, `feriados`, `cargasFamiliares`, `liquidaciones`, `lineasLiquidacion`, `auditoria`)

### Operaciones

- `exportBackup()`: serializa las tablas operativas y devuelve el JSON; registra la exportación en la bitácora sin modificar los datos.
- `validateBackup(json)`: valida `schemaVersion`, forma de las tablas, unicidad de `entity_id`/`id` y referencias; devuelve errores sin escribir.
- `importBackup(json, { confirmar })`: valida y, solo con confirmación explícita, reemplaza los datos operativos; si falla, conserva los datos previos (copia temporal o escritura atómica por tabla). Registra la importación en la bitácora y **no sobrescribe ni elimina** los registros de auditoría previos.

### Invariantes

- La restauración es destructiva y exige confirmación; sin confirmación no se escribe nada.
- Un respaldo inválido no debe dejar el espacio de trabajo parcialmente importado.
- La importación no sobrescribe ni elimina los registros previos de auditoría; la bitácora se mantiene de solo inserción y conserva las marcas de tiempo de los registros existentes.
- El respaldo incluye la auditoría y respeta la retención de 6 años tras el término; no se ofrece purga manual desde la interfaz.

## Contrato de Exportación CSV

### Formato común

- Codificación UTF-8 con BOM.
- Separador de columnas: `;`.
- Encabezados sin acentos, en minúsculas y con guion bajo.
- Solo se genera desde un Período `Cerrado`; el rol ejecutor debe ser `administrador_rrhh`.
- Cada exportación registra en `erp_rrhh:auditoria` la acción `exportar_csv`, el período, el archivo y la marca de tiempo.
- La exportación no crea, edita ni elimina registros operativos.

### `resumen_contable_YYYYMM.csv`

| Columna | Origen |
|---|---|
| `cuenta_contable` | `CONCEPTO.cuentaContable` según mapeo configurable por concepto de liquidación |
| `centro_costo` | `centroCosto` de la ficha del Trabajador |
| `total` | Suma de montos del concepto para cuenta y centro de costo |
| `periodo` | `AAAA-MM` del Período cerrado |

La suma de `total` debe cuadrar con el total de liquidaciones del período (FR-103, SC-028).

### `nomina_pago_YYYYMM.csv`

| Columna | Origen |
|---|---|
| `rut` | `entity.taxId` |
| `trabajador` | Nombre de la Entidad Trabajador |
| `banco` | `customFields.banco` de la ficha |
| `cuenta` | `customFields.numeroCuenta` de la ficha |
| `liquido_a_pagar` | Total líquido de la liquidación del período |
| `fecha_pago` | `PERIODO.fechaPago` |

Si falta `banco`, `cuenta` o `fecha_pago`, la exportación se bloquea, indica el dato ausente y no descarga archivos (FR-104).
