# Contrato de Almacenamiento de Entidades

## Propósito

La aplicación almacena los registros de entidad localmente en el navegador usando `localStorage`.

## Forma de los Datos

Cada registro de entidad debe incluir:

- `id`: cadena única
- `entity_id`: cadena única, generada automáticamente, usada para vincular documentos
- `name`: cadena no vacía
- `code`: cadena no vacía
- `taxId`: cadena opcional (identificación fiscal)
- `email`: cadena opcional con formato de correo válido cuando está presente
- `phone`: cadena opcional
- `address`: cadena opcional
- `category`: cadena opcional
- `description`: cadena opcional
- `targetDate`: cadena de fecha opcional (YYYY-MM-DD) válida cuando está presente
- `creditLimit`: número opcional no negativo
- `paymentTerms`: cadena opcional
- `createdAt`: cadena de marca de tiempo ISO
- `updatedAt`: cadena de marca de tiempo ISO

## Operaciones

- `loadEntities()`: devuelve todas las entidades almacenadas.
- `saveEntities(entities)`: persiste la lista completa.
- `addEntity(entity)`: añade una nueva entidad.
- `updateEntity(id, updates)`: actualiza una entidad existente.
- `deleteEntity(id)`: elimina una entidad por id.

## Almacenamiento de Documentos

Cada registro de documento debe incluir:

- `id`: cadena única
- `entity_id`: el entity_id autogenerado de la entidad vinculada
- `series`: cadena opcional que agrupa folios consecutivos
- `folio`: entero positivo obligatorio; junto con la serie forma el número oficial del documento
- `startDate`: cadena de fecha de calendario válida
- `endDate`: cadena de fecha de calendario válida, igual o posterior a startDate
- `quantity`: entero positivo opcional
- `subtotal`: número no negativo opcional
- `discount`: número no negativo opcional; no puede superar el subtotal
- `taxAmount`: número no negativo opcional
- `totalAmount`: número no negativo opcional
- `currency`: cadena opcional
- `paymentTerms`: cadena opcional
- `notes`: cadena opcional
- `status`: cadena opcional
- `createdAt`: cadena de marca de tiempo ISO
- `updatedAt`: cadena de marca de tiempo ISO

Operaciones:

- `loadDocuments()`: devuelve todos los documentos almacenados.
- `saveDocuments(documents)`: persiste la lista completa.
- `addDocument(document)`: añade un nuevo documento.
- `updateDocument(id, updates)`: actualiza un documento existente.
- `deleteDocument(id)`: elimina un documento por id.
- `deleteDocumentsForEntity(entityId)`: elimina todos los documentos vinculados a una entidad eliminada.

## Expectativas de Validación

- Un `name` o `code` faltante debe rechazarse antes de la persistencia.
- Un `email` presente debe tener formato de correo válido y un `creditLimit` presente debe ser un número no negativo.
- Un documento sin `folio` entero positivo debe rechazarse; un `discount` mayor que el `subtotal` debe rechazarse.
- Un entity_id debe generarse automáticamente y debe ser único.
- Un documento sin un `entity_id` que coincida con una entidad existente debe rechazarse.
- Eliminar una entidad también debe eliminar todos los documentos vinculados a su entity_id.
- Las operaciones de almacenamiento deben preservar el orden actual de la lista y actualizar las marcas de tiempo.

## Expectativas de Extensibilidad

- Los campos adicionales añadidos por módulos personalizados deben persistirse junto a los campos base sin manejo especial en la capa de almacenamiento.
- Las operaciones base anteriores permanecen estables para que los módulos personalizados puedan construir sobre ellas sin modificación.

## Contrato de Almacenamiento RR.HH. y Planilla

La extensión de Recursos Humanos usa las mismas garantías de identidad, marcas de tiempo e integridad referencial de la base, con tablas propias bajo el prefijo `erp_rrhh:*`. El detalle del MER está en `specs/001-rrhh-planilla/data-model.md`.

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
